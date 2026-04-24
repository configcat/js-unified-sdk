import type { OptionsBase } from "../ConfigCatClientOptions";
import { isCdnUrl } from "../ConfigCatClientOptions";
import type { LoggerWrapper } from "../ConfigCatLogger";
import { FormattableLogMessage, logMethodDebug } from "../ConfigCatLogger";
import type { FetchErrorCtorInternal, FetchInternalAsyncMethod, FetchRequest, IConfigCatConfigFetcher } from "../ConfigFetcher";
import { FetchError, fetchInternalAsyncMethodName, FetchResponse, fetchRetryDelayMs, fetchRetryLimit, requestIdArgName } from "../ConfigFetcher";
import { delay, randomUUID } from "../Utils";

export abstract class FetchApiConfigFetcherBase implements IConfigCatConfigFetcher {
  private isDisposed = false;

  dispose(): void {
    this.isDisposed = true;
  }

  protected constructor(private readonly runsOnServerSide?: boolean) {
  }

  fetchAsync(request: FetchRequest): Promise<FetchResponse> {
    return this[fetchInternalAsyncMethodName](request);
  }

  // Defined directly on the prototype, see below.
  private [fetchInternalAsyncMethodName]!: FetchInternalAsyncMethod<FetchApiConfigFetcherBase>;

  private async fetchWithRetryAsync(request: FetchRequest, logger: LoggerWrapper | undefined): Promise<FetchResponse> {
    const debugLogger = logger?.ifDebug;
    let requestId: string | undefined;

    if (debugLogger) {
      requestId = randomUUID();

      debugLogger.debug(FormattableLogMessage.from(requestIdArgName)`[${requestId}] Preparing request...`);
    }

    const isCustomUrl = !isCdnUrl(request.url);

    for (let retryNumber = 0; ; retryNumber++) {
      if (this.isDisposed) {
        throw retryNumber > 0 ? new FetchError("abort") : Error(`${this.constructor.name} object has been disposed.`);
      }

      let { url } = request;
      const { lastETag, timeoutMs } = request;

      const requestInit = Object.create(null) as RequestInit & { headers?: [string, string][] };
      requestInit.method = "GET";

      if (isCustomUrl) {
        this.setRequestHeaders(requestInit, request.headers);
      } else if (this.runsOnServerSide) {
        setRequestHeadersDefault(requestInit, request.headers);
      }

      if (lastETag) {
        if (!this.runsOnServerSide) {
        // We are sending the etag as a query parameter so if the browser doesn't automatically adds the If-None-Match header,
        // we can transform this query param to the header in our CDN provider.
        // (Explicitly specifying the If-None-Match header would cause an unnecessary CORS OPTIONS request.)
          url += "&ccetag=" + encodeURIComponent(lastETag);
        } else {
          (requestInit.headers ??= []).push(["If-None-Match", lastETag]);
        }
      }

      let rayId: string | undefined;

      let cleanup: (() => void) | undefined;

      // NOTE: Older Chromium versions (e.g. the one used in our tests) may not support AbortController.
      if (typeof AbortController === "function") {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        requestInit.signal = controller.signal;
        cleanup = () => clearTimeout(timeoutId);
      }

      try {
        if (debugLogger) {
          if (this.runsOnServerSide) {
            debugLogger.debug(FormattableLogMessage.from(
              requestIdArgName, "URL", "IF_NONE_MATCH"
            )`[${requestId}] Sending request... (Url: '${url}', If-None-Match: '${lastETag ?? ""}')`);
          } else {
            debugLogger.debug(FormattableLogMessage.from(
              requestIdArgName, "URL"
            )`[${requestId}] Sending request... (Url: '${url}')`);
          }
        }

        const response = await fetch(url, requestInit);

        const { status: statusCode, statusText: reasonPhrase } = response;

        if (debugLogger) {
          const eTagHeaderValue = response.headers.get("ETag");
          debugLogger.debug(FormattableLogMessage.from(
            requestIdArgName, "STATUS_CODE", "REASON_PHRASE", "ETAG"
          )`[${requestId}] Received headers. (StatusCode: ${statusCode}, ReasonPhrase: '${reasonPhrase}', ETag: '${eTagHeaderValue ?? ""}')`);
        }

        const headers = getResponseHeadersDefault(response);
        const fetchResponse = new FetchResponse(statusCode, reasonPhrase, headers);
        rayId = fetchResponse["rayId"];

        let body: string | undefined;
        if (statusCode === 200) {
          body = (fetchResponse as { body: string }).body = await response.text();

          debugLogger?.debug(FormattableLogMessage.from(
            requestIdArgName, "LENGTH"
          )`[${requestId}] Received body. (Length: ${body.length})`);
        }

        if (FetchResponse.prototype.isExpected.call(fetchResponse)) {
          return fetchResponse;
        }

        debugLogger?.debug(FormattableLogMessage.from(requestIdArgName)`[${requestId}] Received unexpected status code.`);

        if (retryNumber >= fetchRetryLimit) {
          return fetchResponse;
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          if (!requestInit.signal?.aborted) {
            debugLogger?.debug(FormattableLogMessage.from(requestIdArgName)`[${requestId}] Request aborted.`);

            throw new (FetchError as FetchErrorCtorInternal)("abort", rayId);
          }

          debugLogger?.debug(FormattableLogMessage.from(requestIdArgName)`[${requestId}] Request timed out.`);

          if (retryNumber >= fetchRetryLimit) {
            throw new (FetchError as FetchErrorCtorInternal)("timeout", timeoutMs, rayId);
          }
        } else {
          debugLogger?.debug(FormattableLogMessage.from(requestIdArgName)`[${requestId}] Request failed.`);

          if (retryNumber >= fetchRetryLimit) {
            throw new (FetchError as FetchErrorCtorInternal)("failure", err, rayId);
          }
        }
      } finally {
        cleanup?.();
      }

      // Wait a little before trying again.
      await delay(fetchRetryDelayMs);

      debugLogger?.debug(FormattableLogMessage.from(requestIdArgName)`[${requestId}] Trying request again...`);
    }
  }

  protected setRequestHeaders(requestInit: { headers?: [string, string][] }, headers: ReadonlyArray<readonly [string, string]>): void {
    if (this.runsOnServerSide) {
      setRequestHeadersDefault(requestInit, headers);
    }
  }
}

FetchApiConfigFetcherBase.prototype[fetchInternalAsyncMethodName] = function(request: FetchRequest, logger?: LoggerWrapper) {
  logMethodDebug(logger, "FetchApiConfigFetcherBase.fetchAsync");
  return this["fetchWithRetryAsync"](request, logger);
};

function setRequestHeadersDefault(requestInit: { headers?: [string, string][] }, headers: ReadonlyArray<readonly [string, string]>): void {
  for (const [name, value] of headers) {
    (requestInit.headers ??= []).push([name, value]);
  }
}

function getResponseHeadersDefault(httpResponse: Response): [string, string][] {
  const headers: [string, string][] = [];
  extractHeader("ETag", httpResponse, headers);
  extractHeader("CF-RAY", httpResponse, headers);
  return headers;

  function extractHeader(name: string, httpResponse: Response, headers: [string, string][]) {
    const value = httpResponse.headers.get(name);
    if (value != null) {
      headers.push([name, value]);
    }
  }
}

export class ClientSideFetchApiConfigFetcher extends FetchApiConfigFetcherBase {
  private static getFactory(): (options: OptionsBase) => IConfigCatConfigFetcher {
    return options => new ClientSideFetchApiConfigFetcher();
  }
}

export class ServerSideFetchApiConfigFetcher extends FetchApiConfigFetcherBase {
  private static getFactory(): (options: OptionsBase) => IConfigCatConfigFetcher {
    return options => new ServerSideFetchApiConfigFetcher();
  }

  constructor() {
    super(true);
  }
}

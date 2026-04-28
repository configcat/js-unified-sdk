import type { OptionsBase } from "../ConfigCatClientOptions";
import { isCdnUrl } from "../ConfigCatClientOptions";
import type { LoggerWrapper } from "../ConfigCatLogger";
import { FormattableLogMessage, logMethodDebug } from "../ConfigCatLogger";
import type { FetchErrorCtorInternal, FetchInternalAsyncMethod, FetchRequest, IConfigCatConfigFetcher } from "../ConfigFetcher";
import { adjustUrlForBrowser, FETCH_RETRY_DELAY_MS, FETCH_RETRY_LIMIT, FetchError, fetchInternalAsyncMethodName, FetchResponse, REQUEST_ID_ARG_NAME } from "../ConfigFetcher";
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

      debugLogger.debug(FormattableLogMessage.from(REQUEST_ID_ARG_NAME)`[${requestId}] Preparing request...`);
    }

    const isCustomUrl = !isCdnUrl(request.url);

    for (let retryNumber = 0; ; retryNumber++) {
      if (this.isDisposed) {
        throw new FetchError("abort");
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
          url = adjustUrlForBrowser(url, request);
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
              REQUEST_ID_ARG_NAME, "URL", "IF_NONE_MATCH"
            )`[${requestId}] Sending request... (Url: '${url}', If-None-Match: '${lastETag ?? ""}')`);
          } else {
            debugLogger.debug(FormattableLogMessage.from(
              REQUEST_ID_ARG_NAME, "URL"
            )`[${requestId}] Sending request... (Url: '${url}')`);
          }
        }

        const response = await fetch(url, requestInit);

        const { status: statusCode, statusText: reasonPhrase } = response;

        if (debugLogger) {
          const eTagHeaderValue = response.headers.get("ETag");
          debugLogger.debug(FormattableLogMessage.from(
            REQUEST_ID_ARG_NAME, "STATUS_CODE", "REASON_PHRASE", "ETAG"
          )`[${requestId}] Received headers. (StatusCode: ${statusCode}, ReasonPhrase: '${reasonPhrase}', ETag: '${eTagHeaderValue ?? ""}')`);
        }

        const headers = getResponseHeadersDefault(response);
        const fetchResponse = new FetchResponse(statusCode, reasonPhrase, headers);
        rayId = fetchResponse["rayId"];

        let body: string | undefined;
        if (statusCode === 200) {
          body = (fetchResponse as { body: string }).body = await response.text();

          debugLogger?.debug(FormattableLogMessage.from(
            REQUEST_ID_ARG_NAME, "LENGTH"
          )`[${requestId}] Received body. (Length: ${body.length})`);
        }

        if (FetchResponse.prototype.isExpected.call(fetchResponse)) {
          return fetchResponse;
        }

        debugLogger?.debug(FormattableLogMessage.from(REQUEST_ID_ARG_NAME)`[${requestId}] Received unexpected status code.`);

        if (retryNumber >= FETCH_RETRY_LIMIT) {
          return fetchResponse;
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          if (!requestInit.signal?.aborted) {
            debugLogger?.debug(FormattableLogMessage.from(REQUEST_ID_ARG_NAME)`[${requestId}] Request aborted.`);

            throw new (FetchError as FetchErrorCtorInternal)("abort", rayId);
          }

          debugLogger?.debug(FormattableLogMessage.from(REQUEST_ID_ARG_NAME)`[${requestId}] Request timed out.`);

          if (retryNumber >= FETCH_RETRY_LIMIT) {
            throw new (FetchError as FetchErrorCtorInternal)("timeout", timeoutMs, rayId);
          }
        } else {
          debugLogger?.debug(FormattableLogMessage.from(REQUEST_ID_ARG_NAME)`[${requestId}] Request failed.`);

          if (retryNumber >= FETCH_RETRY_LIMIT) {
            throw new (FetchError as FetchErrorCtorInternal)("failure", err, rayId);
          }
        }
      } finally {
        cleanup?.();
      }

      // Wait a little before trying again.
      await delay(FETCH_RETRY_DELAY_MS);

      debugLogger?.debug(FormattableLogMessage.from(REQUEST_ID_ARG_NAME)`[${requestId}] Trying request again...`);
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

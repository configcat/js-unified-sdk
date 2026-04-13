import type { OptionsBase } from "../ConfigCatClientOptions";
import { isCdnUrl } from "../ConfigCatClientOptions";
import type { LoggerWrapper } from "../ConfigCatLogger";
import type { FetchInternalAsyncMethodType, FetchRequest, IConfigCatConfigFetcher } from "../ConfigFetcher";
import { FetchError, fetchInternalAsyncMethodName, FetchResponse, fetchRetryDelayMs, fetchRetryLimit } from "../ConfigFetcher";
import { delay } from "../Utils";

export abstract class FetchApiConfigFetcherBase implements IConfigCatConfigFetcher {
  protected constructor(private readonly runsOnServerSide?: boolean) {
  }

  fetchAsync(request: FetchRequest): Promise<FetchResponse> {
    return this[fetchInternalAsyncMethodName](request);
  }

  // Defined directly on the prototype, see below.
  private [fetchInternalAsyncMethodName]!: FetchInternalAsyncMethodType<FetchApiConfigFetcherBase>;

  private async fetchCoreAsync(request: FetchRequest, logger?: LoggerWrapper): Promise<FetchResponse> {
    for (let retryNumber = 0; ; retryNumber++) {
      let { url } = request;
      const isCustomUrl = !isCdnUrl(url);
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

      let cleanup: (() => void) | undefined;

      // NOTE: Older Chromium versions (e.g. the one used in our tests) may not support AbortController.
      if (typeof AbortController === "function") {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        requestInit.signal = controller.signal;
        cleanup = () => clearTimeout(timeoutId);
      }

      try {
        const response = await fetch(url, requestInit);

        const { status: statusCode, statusText: reasonPhrase } = response;
        const headers = getResponseHeadersDefault(response);
        const body = statusCode === 200 ? await response.text() : void 0;
        const fetchResponse = new FetchResponse(statusCode, reasonPhrase, headers, body);
        if (FetchResponse.prototype.isExpected.call(fetchResponse) || retryNumber >= fetchRetryLimit) {
          return fetchResponse;
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          if (!requestInit.signal?.aborted) {
            throw new FetchError("abort");
          }

          if (retryNumber >= fetchRetryLimit) {
            throw new FetchError("timeout", timeoutMs);
          }
        } else {
          if (retryNumber >= fetchRetryLimit) {
            throw new FetchError("failure", err);
          }
        }
      } finally {
        cleanup?.();
      }

      await delay(fetchRetryDelayMs);
    }
  }

  protected setRequestHeaders(requestInit: { headers?: [string, string][] }, headers: ReadonlyArray<readonly [string, string]>): void {
    if (this.runsOnServerSide) {
      setRequestHeadersDefault(requestInit, headers);
    }
  }
}

FetchApiConfigFetcherBase.prototype[fetchInternalAsyncMethodName] = function(request: FetchRequest, logger?: LoggerWrapper) {
  logger?.debug("FetchApiConfigFetcher.fetchAsync() called.");

  return this["fetchCoreAsync"](request, logger);
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

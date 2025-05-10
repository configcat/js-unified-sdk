import type { OptionsBase } from "../ConfigCatClientOptions";
import type { LoggerWrapper } from "../ConfigCatLogger";
import type { FetchRequest, IConfigCatConfigFetcher } from "../ConfigFetcher";
import { FetchError, FetchResponse } from "../ConfigFetcher";

export class FetchApiConfigFetcher implements IConfigCatConfigFetcher {
  private static getFactory(): (options: OptionsBase) => IConfigCatConfigFetcher {
    return options => {
      const configFetcher = new FetchApiConfigFetcher();
      configFetcher.logger = options.logger;
      return configFetcher;
    };
  }

  private logger?: LoggerWrapper;

  async fetchAsync(request: FetchRequest): Promise<FetchResponse> {
    this.logger?.debug("FetchApiConfigFetcher.fetchAsync() called.");

    let { url } = request;
    const { lastETag, timeoutMs } = request;

    if (lastETag) {
      // We are sending the etag as a query parameter so if the browser doesn't automatically adds the If-None-Match header,
      // we can transform this query param to the header in our CDN provider.
      url += "&ccetag=" + encodeURIComponent(lastETag);
    }

    const requestInit: RequestInit = { method: "GET" };
    // NOTE: It's intentional that we don't specify the If-None-Match header.
    // The browser automatically handles it, adding it manually would cause an unnecessary CORS OPTIONS request.
    // In case the browser doesn't handle it, we are transforming the ccetag query parameter to the If-None-Match header
    this.setRequestHeaders(requestInit as { headers?: [string, string][] }, request.headers);

    let cleanup: (() => void) | undefined;

    // NOTE: Older Chromium versions (e.g. the one used in our tests) may not support AbortController.
    if (typeof AbortController !== "undefined") {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      requestInit.signal = controller.signal;
      cleanup = () => clearTimeout(timeoutId);
    }

    try {
      const response = await fetch(url, requestInit);

      const { status: statusCode, statusText: reasonPhrase } = response;
      const headers = this.getResponseHeaders(response);
      const body = statusCode === 200 ? await response.text() : void 0;
      return new FetchResponse(statusCode, reasonPhrase, headers, body);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        if (requestInit.signal?.aborted) {
          throw new FetchError("timeout", timeoutMs);
        } else {
          throw new FetchError("abort");
        }
      }

      throw new FetchError("failure", err);
    } finally {
      cleanup?.();
    }
  }

  protected setRequestHeaders(requestInit: { headers?: [string, string][] }, headers: ReadonlyArray<[string, string]>): void {
    if (headers.length) {
      (requestInit.headers ??= []).push(...headers);
    }
  }

  protected getResponseHeaders(httpResponse: Response): [string, string][] {
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
}

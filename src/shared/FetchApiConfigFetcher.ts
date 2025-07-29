import type { OptionsBase } from "../ConfigCatClientOptions";
import { isCdnUrl } from "../ConfigCatClientOptions";
import type { LoggerWrapper } from "../ConfigCatLogger";
import type { FetchRequest, IConfigCatConfigFetcher } from "../ConfigFetcher";
import { FetchError, FetchResponse } from "../ConfigFetcher";

export abstract class FetchApiConfigFetcherBase implements IConfigCatConfigFetcher {
  // eslint-disable-next-line @typescript-eslint/prefer-readonly
  private logger: LoggerWrapper | null = null;

  protected constructor(private readonly runsOnServerSide?: boolean) {
  }

  async fetchAsync(request: FetchRequest): Promise<FetchResponse> {
    this.logger?.debug("FetchApiConfigFetcher.fetchAsync() called.");

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

  protected setRequestHeaders(requestInit: { headers?: [string, string][] }, headers: ReadonlyArray<readonly [string, string]>): void {
    if (this.runsOnServerSide) {
      setRequestHeadersDefault(requestInit, headers);
    }
  }
}

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
    return options => {
      const configFetcher = new ClientSideFetchApiConfigFetcher();
      configFetcher["logger"] = options.logger;
      return configFetcher;
    };
  }
}

export class ServerSideFetchApiConfigFetcher extends FetchApiConfigFetcherBase {
  private static getFactory(): (options: OptionsBase) => IConfigCatConfigFetcher {
    return options => {
      const configFetcher = new ServerSideFetchApiConfigFetcher();
      configFetcher["logger"] = options.logger;
      return configFetcher;
    };
  }

  constructor() {
    super(true);
  }
}

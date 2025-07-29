import type { OptionsBase } from "../ConfigCatClientOptions";
import { isCdnUrl } from "../ConfigCatClientOptions";
import type { LoggerWrapper } from "../ConfigCatLogger";
import type { FetchRequest, IConfigCatConfigFetcher } from "../ConfigFetcher";
import { FetchError, FetchResponse } from "../ConfigFetcher";

interface IHttpRequest {
  setRequestHeader(name: string, value: string): void;
}

export class XmlHttpRequestConfigFetcher implements IConfigCatConfigFetcher {
  private static getFactory(): (options: OptionsBase) => IConfigCatConfigFetcher {
    return options => {
      const configFetcher = new XmlHttpRequestConfigFetcher();
      configFetcher.logger = options.logger;
      return configFetcher;
    };
  }

  private logger: LoggerWrapper | null = null;

  private handleStateChange(httpRequest: XMLHttpRequest, resolve: (value: FetchResponse) => void, reject: (reason?: any) => void) {
    try {
      if (httpRequest.readyState === 4) {
        const { status: statusCode, statusText: reasonPhrase } = httpRequest;

        // The readystatechange event is emitted even in the case of abort or error.
        // We can detect this by checking for zero status code (see https://stackoverflow.com/a/19247992/8656352).
        if (statusCode) {
          const headers = getResponseHeadersDefault(httpRequest);
          const body = statusCode === 200 ? httpRequest.responseText : void 0;
          resolve(new FetchResponse(statusCode, reasonPhrase, headers, body));
        }
      }
    } catch (err) {
      reject(err);
    }
  }

  fetchAsync(request: FetchRequest): Promise<FetchResponse> {
    return new Promise<FetchResponse>((resolve, reject) => {
      try {
        this.logger?.debug("XmlHttpRequestConfigFetcher.fetchAsync() called.");

        let { url } = request;
        const isCustomUrl = !isCdnUrl(url);
        const { lastETag, timeoutMs } = request;

        if (lastETag) {
          // We are sending the etag as a query parameter so if the browser doesn't automatically adds the If-None-Match header,
          // we can transform this query param to the header in our CDN provider.
          // (Explicitly specifying the If-None-Match header would cause an unnecessary CORS OPTIONS request.)
          url += "&ccetag=" + encodeURIComponent(lastETag);
        }

        const httpRequest: XMLHttpRequest = new XMLHttpRequest();

        httpRequest.onreadystatechange = () => this.handleStateChange(httpRequest, resolve, reject);
        httpRequest.ontimeout = () => reject(new FetchError("timeout", timeoutMs));
        httpRequest.onabort = () => reject(new FetchError("abort"));
        httpRequest.onerror = () => reject(new FetchError("failure"));

        httpRequest.open("GET", url, true);
        httpRequest.timeout = timeoutMs;
        if (isCustomUrl) {
          this.setRequestHeaders(httpRequest, request.headers);
        }
        httpRequest.send(null);
      } catch (err) {
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        reject(err);
      }
    });
  }

  protected setRequestHeaders(httpRequest: IHttpRequest, headers: ReadonlyArray<readonly [string, string]>): void {
  }
}

function getResponseHeadersDefault(httpRequest: XMLHttpRequest): [string, string][] {
  const headers: [string, string][] = [];
  extractHeader("ETag", httpRequest, headers);
  extractHeader("CF-RAY", httpRequest, headers);
  return headers;

  function extractHeader(name: string, httpRequest: XMLHttpRequest, headers: [string, string][]) {
    const value = httpRequest.getResponseHeader(name);
    if (value != null) {
      headers.push([name, value]);
    }
  }
}

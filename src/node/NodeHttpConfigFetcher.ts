import * as http from "http";
import * as https from "https";
import type { OptionsBase } from "../ConfigCatClientOptions";
import { isCdnUrl } from "../ConfigCatClientOptions";
import type { LoggerWrapper } from "../ConfigCatLogger";
import { FormattableLogMessage, LogLevel } from "../ConfigCatLogger";
import type { FetchRequest, IConfigCatConfigFetcher } from "../ConfigFetcher";
import { FetchError, FetchResponse } from "../ConfigFetcher";
import { hasOwnProperty } from "../Utils";

export interface INodeHttpConfigFetcherOptions {
  /**
   * The {@link https://nodejs.org/api/http.html#class-httpagent | http.Agent} instance to use for non-secure HTTP communication.
   * For example, this option allows you to configure the SDK to route `http://...` requests through an HTTP, HTTPS or SOCKS proxy.
   *
   * If not set, the default agent, {@link https://nodejs.org/api/http.html#httpglobalagent | http.globalAgent} will be used.
   *
   * This option applies when the SDK connects to a custom `http://...` URL you specified via `baseUrl`.
   */
  httpAgent?: http.Agent;

  /**
   * The {@link https://nodejs.org/api/https.html#class-httpsagent | https.Agent} instance to use for secure HTTP communication.
   * For example, this option allows you to configure the SDK to route `https://...` requests through an HTTP, HTTPS or SOCKS proxy.
   *
   * If not set, the default agent, {@link https://nodejs.org/api/https.html#httpsglobalagent | https.globalAgent} will be used.
   *
   * This option applies when the SDK connects to the ConfigCat CDN or a custom `https://...` URL you specified via `baseUrl`.
   */
  httpsAgent?: https.Agent;
}

export class NodeHttpConfigFetcher implements IConfigCatConfigFetcher {
  private static getFactory(fetcherOptions?: INodeHttpConfigFetcherOptions): (options: OptionsBase) => IConfigCatConfigFetcher {
    return options => {
      const configFetcher = new NodeHttpConfigFetcher(fetcherOptions);
      configFetcher.logger = options.logger;
      return configFetcher;
    };
  }

  private logger?: LoggerWrapper;

  private readonly httpAgent?: http.Agent;
  private readonly httpsAgent?: https.Agent;

  constructor(options?: INodeHttpConfigFetcherOptions) {
    this.httpAgent = options?.httpAgent;
    this.httpsAgent = options?.httpsAgent;
  }

  private handleResponse(response: http.IncomingMessage, resolve: (value: FetchResponse) => void, reject: (reason?: any) => void) {
    try {
      const { statusCode, statusMessage: reasonPhrase } = response as { statusCode: number; statusMessage: string };
      const headers = getResponseHeadersDefault(response);

      if (statusCode === 200) {
        const chunks: any[] = [];
        response
          .on("data", chunk => chunks.push(chunk))
          .on("end", () => {
            try {
              const body = Buffer.concat(chunks).toString();
              resolve(new FetchResponse(statusCode, reasonPhrase, headers, body));
            } catch (err) {
              reject(err);
            }
          })
          .on("error", err => reject(new FetchError("failure", err)));
      } else {
        // Consume response data to free up memory
        response.resume();

        resolve(new FetchResponse(statusCode, reasonPhrase, headers));
      }
    } catch (err) {
      reject(err);
    }
  }

  fetchAsync(request: FetchRequest): Promise<FetchResponse> {
    return new Promise<FetchResponse>((resolve, reject) => {
      try {
        this.logger?.debug("NodeHttpConfigFetcher.fetchAsync() called.");

        const { url } = request;
        const isCustomUrl = !isCdnUrl(url);
        const isHttpsUrl = url.startsWith("https:");

        const { lastETag, timeoutMs } = request;

        const requestOptions: (http.RequestOptions | https.RequestOptions) & { headers?: Record<string, http.OutgoingHttpHeader> } = {
          agent: isHttpsUrl ? this.httpsAgent : this.httpAgent,
          timeout: timeoutMs,
        };

        if (isCustomUrl) {
          this.setRequestHeaders(requestOptions, request.headers);
        } else {
          setRequestHeadersDefault(requestOptions, request.headers);
        }

        if (lastETag) {
          (requestOptions.headers ??= {})["If-None-Match"] = lastETag;
        }

        if (this.logger?.isEnabled(LogLevel.Debug)) {
          // eslint-disable-next-line @typescript-eslint/no-base-to-string
          const requestOptionsSafe = JSON.stringify({ ...requestOptions, agent: requestOptions.agent?.toString() });
          this.logger.debug(FormattableLogMessage.from("OPTIONS")`NodeHttpConfigFetcher.fetchAsync() requestOptions: ${requestOptionsSafe}`);
        }

        const clientRequest = (isHttpsUrl ? https : http).get(url, requestOptions, response => this.handleResponse(response, resolve, reject))
          .on("timeout", () => {
            try {
              clientRequest.destroy();
            } finally {
              reject(new FetchError("timeout", timeoutMs));
            }
          })
          .on("error", err => {
            reject(new FetchError("failure", err));
          })
          .end();
      } catch (err) {
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        reject(err);
      }
    });
  }

  protected setRequestHeaders(requestOptions: { headers?: Record<string, number | string | string[]> }, headers: ReadonlyArray<[string, string]>): void {
    setRequestHeadersDefault(requestOptions, headers);
  }
}

function setRequestHeadersDefault(requestOptions: { headers?: Record<string, http.OutgoingHttpHeader> }, headers: ReadonlyArray<[string, string]>): void {
  if (headers.length) {
    const currentHeaders = requestOptions.headers ??= {};
    for (const [name, value] of headers) {
      let currentValue: http.OutgoingHttpHeader;
      if (!hasOwnProperty(currentHeaders, name)) {
        currentHeaders[name] = value;
      } else if (!Array.isArray(currentValue = currentHeaders[name])) {
        currentHeaders[name] = [currentValue + "", value];
      } else {
        currentValue.push(value);
      }
    }
  }
}

function getResponseHeadersDefault(httpResponse: http.IncomingMessage): [string, string][] {
  const headers: [string, string][] = [];
  extractHeader("etag", httpResponse, headers);
  extractHeader("cf-ray", httpResponse, headers);
  return headers;

  function extractHeader(name: string, httpResponse: http.IncomingMessage, headers: [string, string][]) {
    let value: string | string[] | undefined;
    if (hasOwnProperty(httpResponse.headers, name) && (value = httpResponse.headers[name]) != null) {
      headers.push([name, !Array.isArray(value) ? value : value[0]]);
    }
  }
}

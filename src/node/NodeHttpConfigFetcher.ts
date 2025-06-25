import * as http from "http";
import * as https from "https";
import * as tunnel from "tunnel";
import { URL } from "url";
import type { OptionsBase } from "../ConfigCatClientOptions";
import { isCdnUrl } from "../ConfigCatClientOptions";
import type { LoggerWrapper } from "../ConfigCatLogger";
import { FormattableLogMessage, LogLevel } from "../ConfigCatLogger";
import type { FetchRequest, IConfigCatConfigFetcher } from "../ConfigFetcher";
import { FetchError, FetchResponse } from "../ConfigFetcher";

export interface INodeHttpConfigFetcherOptions {
  /** Proxy settings. */
  proxy?: string | null;
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

  private readonly proxy?: string | null;

  constructor(options?: INodeHttpConfigFetcherOptions) {
    this.proxy = options?.proxy;
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
        const isHttpsUrl = url.startsWith("https");

        let agent: http.Agent | undefined;
        if (this.proxy) {
          try {
            const proxy: URL = new URL(this.proxy);
            let agentFactory: any;
            if (proxy.protocol === "https:") {
              agentFactory = isHttpsUrl ? tunnel.httpsOverHttps : tunnel.httpOverHttps;
            } else {
              agentFactory = isHttpsUrl ? tunnel.httpsOverHttp : tunnel.httpOverHttp;
            }
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
            agent = agentFactory({
              proxy: {
                host: proxy.hostname,
                port: proxy.port,
                proxyAuth: (proxy.username && proxy.password) ? `${proxy.username}:${proxy.password}` : null,
              },
            });
          } catch (err) {
            this.logger?.log(LogLevel.Error, 0, FormattableLogMessage.from("PROXY")`Failed to parse \`options.proxy\`: '${this.proxy}'.`, err);
          }
        }

        const { lastETag, timeoutMs } = request;

        const requestOptions: (http.RequestOptions | https.RequestOptions) & { headers?: Record<string, http.OutgoingHttpHeader> } = {
          agent,
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
          this.logger.debug("NodeHttpConfigFetcher.fetchAsync() requestOptions: " + JSON.stringify({ ...requestOptions, agent: agent?.toString() }));
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

  protected setRequestHeaders(requestOptions: { headers?: Record<string, http.OutgoingHttpHeader> }, headers: ReadonlyArray<[string, string]>): void {
    setRequestHeadersDefault(requestOptions, headers);
  }
}

function setRequestHeadersDefault(requestOptions: { headers?: Record<string, http.OutgoingHttpHeader> }, headers: ReadonlyArray<[string, string]>): void {
  if (headers.length) {
    const currentHeaders = requestOptions.headers ??= {};
    for (const [name, value] of headers) {
      const currentValue = currentHeaders[name];
      if (currentValue == null) {
        currentHeaders[name] = value;
      } else if (!Array.isArray(currentValue)) {
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
    const value = httpResponse.headers[name];
    if (value != null) {
      headers.push([name, !Array.isArray(value) ? value : value[0]]);
    }
  }
}

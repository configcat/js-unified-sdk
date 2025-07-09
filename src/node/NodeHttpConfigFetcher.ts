import * as http from "http";
import * as https from "https";
import type { OptionsBase } from "../ConfigCatClientOptions";
import { isCdnUrl } from "../ConfigCatClientOptions";
import type { LoggerWrapper, LogMessage } from "../ConfigCatLogger";
import { FormattableLogMessage, LogLevel } from "../ConfigCatLogger";
import type { FetchRequest, IConfigCatConfigFetcher } from "../ConfigFetcher";
import { FetchError, FetchResponse } from "../ConfigFetcher";
import { HttpProxyAgent } from "./HttpProxyAgent";
import { HttpsProxyAgent } from "./HttpsProxyAgent";

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
          const debug = this.logger?.isEnabled(LogLevel.Debug)
            ? (message: LogMessage, ex: any) => this.logger!.debug(message, ex)
            : void 0;

          try {
            agent = isHttpsUrl
              ? new HttpsProxyAgent(this.proxy, void 0, debug)
              : new HttpProxyAgent(this.proxy, void 0, debug);
          } catch (err) {
            this.logger?.log(LogLevel.Error, 0, FormattableLogMessage.from("PROXY_URL")`Failed to create proxy agent for \`options.proxy\`: '${this.proxy}'.`, err);
            throw err;
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
          const requestOptionsSafe = JSON.stringify({ ...requestOptions, agent: agent?.toString() });
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

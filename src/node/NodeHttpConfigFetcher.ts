import * as http from "http";
import * as https from "https";
import * as tunnel from "tunnel";
import { URL } from "url";
import type { OptionsBase } from "../ConfigCatClientOptions";
import { FormattableLogMessage, LogLevel } from "../ConfigCatLogger";
import type { IConfigFetcher, IFetchResponse } from "../ConfigFetcher";
import { FetchError } from "../ConfigFetcher";

export interface INodeHttpConfigFetcherOptions {
  /** Proxy settings. */
  proxy?: string | null;
}

export class NodeHttpConfigFetcher implements IConfigFetcher {
  private readonly proxy?: string | null;

  constructor(options?: INodeHttpConfigFetcherOptions) {
    this.proxy = options?.proxy;
  }

  private handleResponse(response: http.IncomingMessage, resolve: (value: IFetchResponse) => void, reject: (reason?: any) => void) {
    try {
      const { statusCode, statusMessage: reasonPhrase } = response as { statusCode: number; statusMessage: string };

      if (statusCode === 200) {
        const eTag = response.headers["etag"];
        const chunks: any[] = [];
        response
          .on("data", chunk => chunks.push(chunk))
          .on("end", () => {
            try {
              resolve({ statusCode, reasonPhrase, eTag, body: Buffer.concat(chunks).toString() });
            }
            catch (err) {
              reject(err);
            }
          })
          .on("error", err => reject(new FetchError("failure", err)));
      }
      else {
        // Consume response data to free up memory
        response.resume();

        resolve({ statusCode, reasonPhrase });
      }
    }
    catch (err) {
      reject(err);
    }
  }

  fetchLogic(options: OptionsBase, lastEtag: string | null): Promise<IFetchResponse> {
    return new Promise<IFetchResponse>((resolve, reject) => {
      try {
        options.logger.debug("HttpConfigFetcher.fetchLogic() called.");
        const baseUrl = options.getUrl();
        const isBaseUrlSecure = baseUrl.startsWith("https");
        let agent: http.Agent | undefined;
        if (this.proxy) {
          try {
            const proxy: URL = new URL(this.proxy);
            let agentFactory: any;
            if (proxy.protocol === "https:") {
              agentFactory = isBaseUrlSecure ? tunnel.httpsOverHttps : tunnel.httpOverHttps;
            }
            else {
              agentFactory = isBaseUrlSecure ? tunnel.httpsOverHttp : tunnel.httpOverHttp;
            }
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
            agent = agentFactory({
              proxy: {
                host: proxy.hostname,
                port: proxy.port,
                proxyAuth: (proxy.username && proxy.password) ? `${proxy.username}:${proxy.password}` : null
              }
            });
          }
          catch (err) {
            options.logger.log(LogLevel.Error, 0, FormattableLogMessage.from("PROXY")`Failed to parse \`options.proxy\`: '${this.proxy}'.`, err);
          }
        }

        const headers: http.OutgoingHttpHeaders = {
          "User-Agent": options.clientVersion
        };
        if (lastEtag) {
          headers["If-None-Match"] = lastEtag;
        }

        const requestOptions: http.RequestOptions | https.RequestOptions = {
          agent,
          headers,
          timeout: options.requestTimeoutMs,
        };
        options.logger.debug(JSON.stringify(requestOptions));

        const request = (isBaseUrlSecure ? https : http).get(baseUrl, requestOptions, response => this.handleResponse(response, resolve, reject))
          .on("timeout", () => {
            try {
              request.destroy();
            }
            finally {
              reject(new FetchError("timeout", options.requestTimeoutMs));
            }
          })
          .on("error", err => {
            reject(new FetchError("failure", err));
          })
          .end();
      }
      catch (err) {
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        reject(err);
      }
    });
  }
}

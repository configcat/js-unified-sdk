import * as http from "http";
import * as https from "https";
import type { OptionsBase } from "../ConfigCatClientOptions";
import { isCdnUrl } from "../ConfigCatClientOptions";
import type { LoggerWrapper } from "../ConfigCatLogger";
import { FormattableLogMessage, LogLevel } from "../ConfigCatLogger";
import type { FetchInternalAsyncMethod, FetchRequest, IConfigCatConfigFetcher } from "../ConfigFetcher";
import { FetchError, fetchInternalAsyncMethodName, FetchResponse, fetchRetryDelayMs, fetchRetryLimit } from "../ConfigFetcher";
import { delay, ensureFunctionArg, ensureObjectArg, hasOwnProperty, isArray, toStringSafe } from "../Utils";

export interface INodeHttpConfigFetcherOptions {
  /**
   * The {@link https://nodejs.org/api/http.html#class-httpagent | http.Agent} instance to use for non-secure HTTP communication.
   * For example, this option allows you to configure the SDK to route `http://...` requests through an HTTP, HTTPS or SOCKS proxy.
   *
   * If not set, an internally managed agent with the same options as {@link https://nodejs.org/api/http.html#httpglobalagent | http.globalAgent}
   * will be used.
   *
   * This option applies when the SDK connects to a custom `http://...` URL you specified via `baseUrl`.
   *
   * @deprecated This option is kept for backward compatibility but will be removed in a future major version.
   * Please use the `httpAgentProvider` option instead.
   */
  httpAgent?: http.Agent | null;

  /**
   * An optional callback that can be used to provide an {@link https://nodejs.org/api/http.html#class-httpagent | http.Agent}
   * instance to use for non-secure HTTP communication. For example, this option allows you to configure the SDK to
   * route `http://...` requests through an HTTP, HTTPS or SOCKS proxy.
   *
   * If not set, an internally managed agent with the same options as {@link https://nodejs.org/api/http.html#httpglobalagent | http.globalAgent}
   * will be used.
   *
   * This option applies when the SDK connects to a custom `http://...` URL you specified via `baseUrl`.
   *
   * @param recommendedOptions Default options (the same options that {@link https://nodejs.org/api/http.html#httpglobalagent | http.globalAgent}
   * uses) for the provided agent. This object can be modified as needed.
   * @param isRetry Indicates whether to provide an agent for a retried request.
   * @returns The `http.Agent` instance to use for making requests.
   */
  httpAgentProvider?: ((recommendedOptions: http.AgentOptions, isRetry: boolean) => http.Agent) | null;

  /**
   * The {@link https://nodejs.org/api/https.html#class-httpsagent | https.Agent} instance to use for secure HTTP communication.
   * For example, this option allows you to configure the SDK to route `https://...` requests through an HTTP, HTTPS or SOCKS proxy.
   *
   * If not set, an internally managed agent with the same options as {@link https://nodejs.org/api/https.html#httpsglobalagent | https.globalAgent}
   * will be used.
   *
   * This option applies when the SDK connects to the ConfigCat CDN or a custom `https://...` URL you specified via `baseUrl`.
   *
   * @deprecated This option is kept for backward compatibility but will be removed in a future major version.
   * Please use the `httpsAgentProvider` option instead.
  */
  httpsAgent?: https.Agent | null;

  /**
   * An optional callback that can be used to provide an {@link https://nodejs.org/api/https.html#class-httpsagent | https.Agent}
   * instance to use for secure HTTP communication. For example, this option allows you to configure the SDK to
   * route `https://...` requests through an HTTP, HTTPS or SOCKS proxy.
   *
   * If not set, an internally managed agent with the same options as {@link https://nodejs.org/api/https.html#httpsglobalagent | https.globalAgent}
   * will be used.
   *
   * This option applies when the SDK connects to the ConfigCat CDN or a custom `https://...` URL you specified via `baseUrl`.
   *
   * @param recommendedOptions Default options (the same options that {@link https://nodejs.org/api/https.html#class-httpsagent | https.Agent}
   * uses) for the provided agent. This object can be modified as needed.
   * @param isRetry Indicates whether to provide an agent for a retried request.
   * @returns The `https.Agent` instance to use for making requests.
   */
  httpsAgentProvider?: ((recommendedOptions: https.AgentOptions, isRetry: boolean) => https.Agent) | null;
}

export class NodeHttpConfigFetcher implements IConfigCatConfigFetcher {
  private static getFactory(fetcherOptions?: INodeHttpConfigFetcherOptions): (options: OptionsBase) => IConfigCatConfigFetcher {
    return () => new NodeHttpConfigFetcher(fetcherOptions);
  }

  private httpAgentState: AgentState<http.Agent>;
  private httpsAgentState: AgentState<https.Agent>;

  private isDisposed = false;

  constructor(options?: INodeHttpConfigFetcherOptions) {
    let httpAgentProvider: ((options: http.AgentOptions, isRetry: boolean) => http.Agent) | undefined;
    let httpsAgentProvider: ((options: https.AgentOptions, isRetry: boolean) => https.Agent) | undefined;

    if (options != null) {
      const optionsArgName = "options";

      ensureObjectArg(options, optionsArgName);

      /* eslint-disable @typescript-eslint/no-deprecated */
      if (options.httpAgent != null) {
        const httpAgent = ensureObjectArg(options.httpAgent, optionsArgName, void 0, ".httpAgent");
        httpAgentProvider = () => httpAgent;
      }

      if (options.httpsAgent != null) {
        const httpsAgent = ensureObjectArg(options.httpsAgent, optionsArgName, void 0, ".httpsAgent");
        httpsAgentProvider = () => httpsAgent;
      }
      /* eslint-enable @typescript-eslint/no-deprecated */

      if (options.httpAgentProvider != null) {
        httpAgentProvider = ensureFunctionArg(options.httpAgentProvider, optionsArgName, ".httpAgentProvider");
      }

      if (options.httpsAgentProvider != null) {
        httpsAgentProvider = ensureFunctionArg(options.httpsAgentProvider, optionsArgName, ".httpsAgentProvider");
      }
    }

    this.httpAgentState = new AgentState(httpAgentProvider ?? (options => new http.Agent(options)), !httpAgentProvider);
    this.httpsAgentState = new AgentState(httpsAgentProvider ?? (options => new https.Agent(options)), !httpsAgentProvider);
  }

  dispose(): void {
    if (!this.isDisposed) {
      this.isDisposed = true;

      const { httpAgentState, httpsAgentState } = this;
      // release agent objects and provider callbacks so GC can collect them
      this.httpAgentState = (void 0)!;
      this.httpsAgentState = (void 0)!;

      if (httpAgentState.ownsAgent) {
        httpAgentState.agent?.destroy();
      }

      if (httpsAgentState.ownsAgent) {
        httpsAgentState.agent?.destroy();
      }
    }
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
    return this[fetchInternalAsyncMethodName](request);
  }

  // Defined directly on the prototype, see below.
  private [fetchInternalAsyncMethodName]!: FetchInternalAsyncMethod<NodeHttpConfigFetcher>;

  private fetchCoreAsync(request: FetchRequest, logger?: LoggerWrapper): Promise<FetchResponse> {
    return new Promise<FetchResponse>((resolve, reject) => {
      const { url } = request;
      const isCustomUrl = !isCdnUrl(url);
      const isHttpsUrl = url.startsWith("https:");

      const { lastETag, timeoutMs } = request;

      const requestOptions = Object.create(null) as (http.RequestOptions | https.RequestOptions) & { headers?: Record<string, http.OutgoingHttpHeader> };
      requestOptions.agent = (isHttpsUrl ? this.httpsAgentState : this.httpAgentState).getOrCreateAgent();
      requestOptions.timeout = timeoutMs;

      if (isCustomUrl) {
        this.setRequestHeaders(requestOptions, request.headers);
      } else {
        setRequestHeadersDefault(requestOptions, request.headers);
      }

      if (lastETag) {
        (requestOptions.headers ??= {})["If-None-Match"] = lastETag;
      }

      if (logger?.isEnabled(LogLevel.Debug)) {
        const requestOptionsSafe = JSON.stringify({ ...requestOptions, agent: toStringSafe(requestOptions.agent) });
        logger.debug(FormattableLogMessage.from("OPTIONS")`NodeHttpConfigFetcher.fetchAsync() requestOptions: ${requestOptionsSafe}`);
      }

      const clientRequest = (isHttpsUrl ? https : http).get(url, requestOptions, response => this.handleResponse(response, resolve, reject))
        .on("timeout", () => {
          try {
            clientRequest.destroy();
          } finally {
            reject(new FetchError("timeout", timeoutMs));
          }
        })
        .on("close", () => {
          // eslint-disable-next-line @typescript-eslint/no-deprecated
          if (clientRequest.aborted || clientRequest.destroyed) {
            reject(new FetchError("abort"));
          }
        })
        .on("error", err => {
          reject(new FetchError("failure", err));
        })
        .end();
    });
  }

  protected setRequestHeaders(requestOptions: { headers?: Record<string, number | string | string[]> }, headers: ReadonlyArray<readonly [string, string]>): void {
    setRequestHeadersDefault(requestOptions, headers);
  }
}

NodeHttpConfigFetcher.prototype[fetchInternalAsyncMethodName] = async function(request: FetchRequest, logger?: LoggerWrapper) {
  logger?.debug("NodeHttpConfigFetcher.fetchAsync() called.");

  for (let retryNumber = 0; ; retryNumber++) {
    try {
      if (this["isDisposed"]) {
        throw new FetchError("abort");
      }

      const fetchResponse = await this["fetchCoreAsync"](request, logger);
      if (FetchResponse.prototype.isExpected.call(fetchResponse) || retryNumber >= fetchRetryLimit) {
        return fetchResponse;
      }
    } catch (err) {
      if (retryNumber >= fetchRetryLimit
        || !(err instanceof FetchError)
        || (err as FetchError).cause !== "timeout" && (err as FetchError).cause !== "failure") {
        throw err;
      }
    }

    await delay(fetchRetryDelayMs);
  }
};

function setRequestHeadersDefault(requestOptions: { headers?: Record<string, http.OutgoingHttpHeader> }, headers: ReadonlyArray<readonly [string, string]>): void {
  if (headers.length) {
    const currentHeaders = requestOptions.headers ??= {};
    for (const [name, value] of headers) {
      let currentValue: http.OutgoingHttpHeader;
      if (!hasOwnProperty(currentHeaders, name)) {
        currentHeaders[name] = value;
      } else if (!isArray(currentValue = currentHeaders[name])) {
        currentHeaders[name] = [String(currentValue), value];
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
      headers.push([name, !isArray(value) ? value : value[0]]);
    }
  }
}

class AgentState<TAgent extends http.Agent | https.Agent> {
  agent: TAgent | undefined = void 0;

  constructor(
    private readonly agentProvider: (options: http.AgentOptions | https.AgentOptions, isRetry: boolean) => TAgent,
    readonly ownsAgent: boolean) {
  }

  getOrCreateAgent() {
    // Use the same defaults as http.globalAgent (see https://nodejs.org/api/http.html#httpglobalagent) and
    // https.globalAgent (see https://nodejs.org/api/https.html#httpsglobalagent).
    return this.agent ??= this.agentProvider(
      {
        keepAlive: true,
        timeout: 5000,
      },
      false);
  }
}

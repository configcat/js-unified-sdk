import * as http from "http";
import * as https from "https";
import type { OptionsBase } from "../ConfigCatClientOptions";
import { isCdnUrl } from "../ConfigCatClientOptions";
import type { LoggerWrapper } from "../ConfigCatLogger";
import { FormattableLogMessage, LogLevel } from "../ConfigCatLogger";
import type { FetchInternalAsyncMethod, FetchRequest, IConfigCatConfigFetcher } from "../ConfigFetcher";
import { connectionPoolResetThresholdMs, FetchError, fetchInternalAsyncMethodName, FetchResponse, fetchRetryDelayMs, fetchRetryLimit } from "../ConfigFetcher";
import { delay, ensureFunctionArg, ensureObjectArg, getMonotonicTimeMs, hasOwnProperty, isArray, toStringSafe } from "../Utils";

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
   * @remarks If this and `httpAgentFactory` options are both specified, this option is ignored.
   *
   * @deprecated This option is kept for backward compatibility but will be removed in a future major version.
   * Please use the `httpAgentFactory` option instead.
   */
  httpAgent?: http.Agent | null;

  /**
   * An optional callback to override the creation of {@link https://nodejs.org/api/http.html#class-httpagent | http.Agent}
   * instances for non-secure HTTP communication. For example, this option allows you to configure the SDK to route
   * `http://...` requests through an HTTP, HTTPS or SOCKS proxy.
   *
   * If not set, an internally managed agent with the same options as {@link https://nodejs.org/api/http.html#httpglobalagent | http.globalAgent}
   * will be used.
   *
   * This option applies when the SDK connects to a custom `http://...` URL you specified via `baseUrl`.
   *
   * @remarks The callback must always return a new `http.Agent` instance and leave lifetime management of that instance to the SDK.
   *
   * @param recommendedOptions Default options for the agent to create. This object can be modified as needed.
   * @returns The `http.Agent` instance to use for making requests.
   */
  httpAgentFactory?: ((recommendedOptions: http.AgentOptions) => http.Agent) | null;

  /**
   * The {@link https://nodejs.org/api/https.html#class-httpsagent | https.Agent} instance to use for secure HTTP communication.
   * For example, this option allows you to configure the SDK to route `https://...` requests through an HTTP, HTTPS or SOCKS proxy.
   *
   * If not set, an internally managed agent with the same options as {@link https://nodejs.org/api/https.html#httpsglobalagent | https.globalAgent}
   * will be used.
   *
   * This option applies when the SDK connects to the ConfigCat CDN or a custom `https://...` URL you specified via `baseUrl`.
   *
   * @remarks If this and `httpsAgentFactory` options are both specified, this option is ignored.
   *
   * @deprecated This option is kept for backward compatibility but will be removed in a future major version.
   * Please use the `httpsAgentFactory` option instead.
  */
  httpsAgent?: https.Agent | null;

  /**
   * An optional callback to override the creation of {@link https://nodejs.org/api/https.html#class-httpsagent | https.Agent}
   * instances for secure HTTP communication. For example, this option allows you to configure the SDK to route
   * `https://...` requests through an HTTP, HTTPS or SOCKS proxy.
   *
   * If not set, an internally managed agent with the same options as {@link https://nodejs.org/api/https.html#httpsglobalagent | https.globalAgent}
   * will be used.
   *
   * This option applies when the SDK connects to the ConfigCat CDN or a custom `https://...` URL you specified via `baseUrl`.
   *
   * @remarks The callback must always return a new `https.Agent` instance and leave lifetime management of that instance to the SDK.
   *
   * @param recommendedOptions Default options for the agent to create. This object can be modified as needed.
   * @returns The `https.Agent` instance to use for making requests.
   */
  httpsAgentFactory?: ((recommendedOptions: https.AgentOptions) => https.Agent) | null;
}

export class NodeHttpConfigFetcher implements IConfigCatConfigFetcher {
  private static getFactory(fetcherOptions?: INodeHttpConfigFetcherOptions): (options: OptionsBase) => IConfigCatConfigFetcher {
    return () => new NodeHttpConfigFetcher(fetcherOptions);
  }

  private httpAgentState: AgentState<http.Agent> | http.Agent | undefined; // undefined indicates disposed state
  private httpsAgentState: AgentState<https.Agent> | https.Agent | undefined; // undefined indicates disposed state

  constructor(options?: INodeHttpConfigFetcherOptions) {
    let httpAgent: http.Agent | undefined, httpAgentFactory: INodeHttpConfigFetcherOptions["httpAgentFactory"] | undefined;
    let httpsAgent: https.Agent | undefined, httpsAgentFactory: INodeHttpConfigFetcherOptions["httpsAgentFactory"] | undefined;

    if (options != null) {
      const optionsArgName = "options";

      ensureObjectArg(options, optionsArgName);

      /* eslint-disable @typescript-eslint/no-deprecated */

      if (options.httpAgentFactory != null) {
        httpAgentFactory = ensureFunctionArg(options.httpAgentFactory, optionsArgName, ".httpAgentFactory");
      } else if (options.httpAgent != null) {
        httpAgent = ensureObjectArg(options.httpAgent, optionsArgName, void 0, ".httpAgent");
      }

      if (options.httpsAgentFactory != null) {
        httpsAgentFactory = ensureFunctionArg(options.httpsAgentFactory, optionsArgName, ".httpsAgentFactory");
      } else if (options.httpsAgent != null) {
        httpsAgent = ensureObjectArg(options.httpsAgent, optionsArgName, void 0, ".httpsAgent");
      }

      /* eslint-enable @typescript-eslint/no-deprecated */
    }

    this.httpAgentState = httpAgent ?? new AgentState(httpAgentFactory ?? (options => new http.Agent(options)));
    this.httpsAgentState = httpsAgent ?? new AgentState(httpsAgentFactory ?? (options => new https.Agent(options)));
  }

  dispose(): void {
    const { httpAgentState, httpsAgentState } = this;
    // Release agent objects and factory callbacks so GC can collect them.
    this.httpAgentState = this.httpsAgentState = void 0;
    if (httpAgentState instanceof AgentState) {
      httpAgentState.agent?.destroy();
    }
    if (httpsAgentState instanceof AgentState) {
      httpsAgentState.agent?.destroy();
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

  private async fetchWithRetryAsync(request: FetchRequest, logger?: LoggerWrapper) {
    const { url } = request;
    const isCustomUrl = !isCdnUrl(url);
    const isHttpsUrl = /^https:/i.test(url);

    for (let retryNumber = 0; ; retryNumber++) {
      const agentStateOrExternalAgent = isHttpsUrl ? this.httpsAgentState : this.httpAgentState;
      if (!agentStateOrExternalAgent) { // has config fetcher been disposed?
        throw retryNumber > 0 ? new FetchError("abort") : Error(`${this.constructor.name} object has been disposed.`);
      }

      const [agentState, agent] = agentStateOrExternalAgent instanceof AgentState
        ? [agentStateOrExternalAgent as AgentState<http.Agent | https.Agent>, agentStateOrExternalAgent.getOrCreateAgent()]
        // eslint-disable-next-line no-sparse-arrays
        : [, agentStateOrExternalAgent];

      let shouldRenewAgent = false;

      if (agentState) {
        if (agentState.numRequestsInProgress < 0) {
          // Execution should never get here. If it does, there's a bug in the agent renewal and/or usage counter logic.
          // Just to be sure, throw an exception in this case.
          throw Error(`${this.constructor.name} object got into an invalid state.`);
        }

        agentState.numRequestsInProgress++;
      }

      try {
        const fetchResponse = await this.fetchCoreAsync(request, isCustomUrl, isHttpsUrl, agent, logger);
        shouldRenewAgent = !FetchResponse.prototype.isExpected.call(fetchResponse);
        if (!shouldRenewAgent || retryNumber >= fetchRetryLimit) {
          return fetchResponse;
        }
      } catch (err) {
        shouldRenewAgent = err instanceof FetchError
          && ((err as FetchError).cause === "timeout" || (err as FetchError).cause === "failure");
        if (!shouldRenewAgent || retryNumber >= fetchRetryLimit) {
          throw err;
        }
      } finally {
        if (agentState) {
          let numRequestsToSubtract = 1;
          try {
            if (shouldRenewAgent && agentState.canRenew(connectionPoolResetThresholdMs)) {
              const currentAgentState = isHttpsUrl ? this.httpsAgentState : this.httpAgentState;
              if (agentState === currentAgentState) {
                isHttpsUrl
                  ? this.httpsAgentState = (agentState as AgentState<https.Agent>).renew()
                  : this.httpAgentState = (agentState as AgentState<http.Agent>).renew();

                // This will cause the `numRequestsInProgress` counter to go below zero eventually, indicating that a new
                // agent has been created and the original one is not to be used anymore as it will be destroyed (see below).
                numRequestsToSubtract = 2;
              }
            }
          } finally {
            if ((agentState.numRequestsInProgress -= numRequestsToSubtract) < 0) {
              agent.destroy();
            }
          }
        }
      }

      // Wait a little before trying again.
      await delay(fetchRetryDelayMs);
    }
  }

  private fetchCoreAsync(
    request: FetchRequest, isCustomUrl: boolean, isHttpsUrl: boolean, agent: http.Agent | https.Agent, logger?: LoggerWrapper
  ): Promise<FetchResponse> {
    return new Promise<FetchResponse>((resolve, reject) => {
      const { url, lastETag, timeoutMs } = request;

      const requestOptions = Object.create(null) as (http.RequestOptions | https.RequestOptions) & { headers?: Record<string, http.OutgoingHttpHeader> };
      requestOptions.agent = agent;
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
          if (typeof clientRequest.aborted !== "undefined" ? clientRequest.aborted : clientRequest.destroyed) {
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

NodeHttpConfigFetcher.prototype[fetchInternalAsyncMethodName] = function(request: FetchRequest, logger?: LoggerWrapper) {
  logger?.debug("NodeHttpConfigFetcher.fetchAsync() called.");

  return this["fetchWithRetryAsync"](request, logger);
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
  numRequestsInProgress = 0; // a negative value indicates that the agent shouldn't be used anymore

  constructor(
    private readonly agentFactory: (options: http.AgentOptions | https.AgentOptions) => TAgent,
    private readonly renewalTimeMs = -Infinity
  ) {
  }

  getOrCreateAgent() {
    // Use the same defaults as http.globalAgent (see https://nodejs.org/api/http.html#httpglobalagent) and
    // https.globalAgent (see https://nodejs.org/api/https.html#httpsglobalagent).
    return this.agent ??= this.agentFactory({
      keepAlive: true,
      timeout: 5000,
    });
  }

  canRenew(thresholdMs: number) {
    return getMonotonicTimeMs() - this.renewalTimeMs > thresholdMs;
  }

  renew() {
    return new AgentState(this.agentFactory, getMonotonicTimeMs());
  }
}

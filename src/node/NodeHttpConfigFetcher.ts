import * as http from "http";
import * as https from "https";
import type { OptionsBase } from "../ConfigCatClientOptions";
import { isCdnUrl } from "../ConfigCatClientOptions";
import type { LoggerWrapper } from "../ConfigCatLogger";
import { FormattableLogMessage, logMethodDebug } from "../ConfigCatLogger";
import type { FetchErrorCtorInternal, FetchInternalAsyncMethod, FetchRequest, IConfigCatConfigFetcher } from "../ConfigFetcher";
import { CONNECTIONPOOL_RESET_THRESHOLD_MS, FETCH_RETRY_DELAY_MS, FETCH_RETRY_LIMIT, FetchError, fetchInternalAsyncMethodName, FetchResponse, REQUEST_ID_ARG_NAME } from "../ConfigFetcher";
import { AbortToken, delay, ensureFunctionArg, ensureObjectArg, getMonotonicTimeMs, hasOwnProperty, isArray, randomUUID } from "../Utils";

type FetchContext = {
  readonly debugLogger: LoggerWrapper | undefined;
  readonly requestId: string | undefined;
  rayId: string | undefined;
};

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

  // eslint-disable-next-line @typescript-eslint/prefer-readonly
  private agentRenewalThresholdMs = CONNECTIONPOOL_RESET_THRESHOLD_MS;
  // eslint-disable-next-line @typescript-eslint/prefer-readonly
  private requestRetryDelayMs = FETCH_RETRY_DELAY_MS;

  private readonly disposeToken: AbortToken;

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
    this.disposeToken = new AbortToken();
  }

  dispose(): void {
    this.disposeToken.abort();

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

  private handleResponse(
    response: http.IncomingMessage, resolve: (value: FetchResponse) => void, reject: (reason?: any) => void, context: FetchContext
  ) {
    try {
      const { debugLogger, requestId } = context;
      const { statusCode, statusMessage: reasonPhrase } = response as { statusCode: number; statusMessage: string };

      if (debugLogger) {
        const { headers } = response;
        const eTagHeaderValue = hasOwnProperty(headers, "etag") ? headers["etag"] : void 0;
        debugLogger.debug(FormattableLogMessage.from(
          REQUEST_ID_ARG_NAME, "STATUS_CODE", "REASON_PHRASE", "ETAG"
        )`[${requestId}] Received headers. (StatusCode: ${statusCode}, ReasonPhrase: '${reasonPhrase}', ETag: '${eTagHeaderValue ?? ""}')`);
      }

      const headers = getResponseHeadersDefault(response);
      const fetchResponse = new FetchResponse(statusCode, reasonPhrase, headers);
      const rayId = context.rayId = fetchResponse["rayId"];

      if (statusCode === 200) {
        const chunks: any[] = [];
        response
          .on("data", chunk => chunks.push(chunk))
          .on("end", () => {
            try {
              const body = (fetchResponse as { body: string }).body = Buffer.concat(chunks).toString();

              debugLogger?.debug(FormattableLogMessage.from(
                REQUEST_ID_ARG_NAME, "LENGTH"
              )`[${requestId}] Received body. (Length: ${body.length})`);

              resolve(fetchResponse);
            } catch (err) {
              reject(err);
            }
          })
          .on("error", err => reject(new (FetchError as FetchErrorCtorInternal)("failure", err, rayId)));
      } else {
        // Consume response data to free up memory
        response.resume();

        resolve(fetchResponse);
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

  private async fetchWithRetryAsync(request: FetchRequest, logger: LoggerWrapper | undefined) {
    const debugLogger = logger?.ifDebug;
    let requestId: string | undefined;

    if (debugLogger) {
      requestId = randomUUID();
      debugLogger.debug(FormattableLogMessage.from(REQUEST_ID_ARG_NAME)`[${requestId}] Preparing request...`);
    }

    const { url, lastETag, timeoutMs } = request;
    const isCustomUrl = !isCdnUrl(url);
    const isHttpsUrl = /^https:/i.test(url);

    for (let retryNumber = 0; ; retryNumber++) {
      if (this.disposeToken.aborted) {
        throw new FetchError("abort");
      }

      const agentStateOrExternalAgent = (isHttpsUrl ? this.httpsAgentState : this.httpAgentState)!;
      const [agentState, agent] = agentStateOrExternalAgent instanceof AgentState
        ? [agentStateOrExternalAgent as AgentState<http.Agent | https.Agent>, agentStateOrExternalAgent.getOrCreateAgent()]
        // eslint-disable-next-line no-sparse-arrays
        : [, agentStateOrExternalAgent];

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
        const fetchResponse = await this.fetchCoreAsync(isHttpsUrl ? https : http, url, requestOptions,
          { debugLogger, requestId, rayId: void 0 });

        if (FetchResponse.prototype.isExpected.call(fetchResponse)) {
          return fetchResponse;
        }

        shouldRenewAgent = true;
        debugLogger?.debug(FormattableLogMessage.from(REQUEST_ID_ARG_NAME)`[${requestId}] Received unexpected status code.`);

        if (retryNumber >= FETCH_RETRY_LIMIT) {
          return fetchResponse;
        }
      } catch (err) {
        if (err instanceof FetchError) {
          switch ((err as FetchError).cause) {
            case "abort":
              debugLogger?.debug(FormattableLogMessage.from(REQUEST_ID_ARG_NAME)`[${requestId}] Request aborted.`);
              throw err;
            case "timeout":
              shouldRenewAgent = true;
              debugLogger?.debug(FormattableLogMessage.from(REQUEST_ID_ARG_NAME)`[${requestId}] Request timed out.`);
              break;
            case "failure":
              shouldRenewAgent = true;
              debugLogger?.debug(FormattableLogMessage.from(REQUEST_ID_ARG_NAME)`[${requestId}] Request failed.`);
              break;
          }
        } else {
          throw err;
        }

        if (retryNumber >= FETCH_RETRY_LIMIT) {
          throw err;
        }
      } finally {
        if (agentState) {
          let numRequestsToSubtract = 1;
          try {
            if (shouldRenewAgent && agentState.canRenew(this.agentRenewalThresholdMs)) {
              const currentAgentState = isHttpsUrl ? this.httpsAgentState : this.httpAgentState;
              if (agentState === currentAgentState) {
                isHttpsUrl
                  ? this.httpsAgentState = (agentState as AgentState<https.Agent>).renew()
                  : this.httpAgentState = (agentState as AgentState<http.Agent>).renew();

                // This will cause the `numRequestsInProgress` counter to go below zero eventually, indicating that a new
                // agent has been created and the original one is not to be used anymore as it will be destroyed (see below).
                numRequestsToSubtract = 2;

                debugLogger?.debug(isHttpsUrl
                  ? FormattableLogMessage.from(REQUEST_ID_ARG_NAME)`[${requestId}] Renewed https.Agent.`
                  : FormattableLogMessage.from(REQUEST_ID_ARG_NAME)`[${requestId}] Renewed http.Agent.`);
              }
            }
          } finally {
            if ((agentState.numRequestsInProgress -= numRequestsToSubtract) < 0) {
              agent.destroy();

              debugLogger?.debug(isHttpsUrl
                ? FormattableLogMessage.from(REQUEST_ID_ARG_NAME)`[${requestId}] Disposed out-of-use https.Agent.`
                : FormattableLogMessage.from(REQUEST_ID_ARG_NAME)`[${requestId}] Disposed out-of-use http.Agent.`);
            }
          }
        }
      }

      // Wait a little before trying again.
      await delay(this.requestRetryDelayMs);

      debugLogger?.debug(FormattableLogMessage.from(REQUEST_ID_ARG_NAME)`[${requestId}] Trying request again...`);
    }
  }

  private fetchCoreAsync(
    httpModule: typeof http | typeof https,
    url: string,
    requestOptions: (http.RequestOptions | https.RequestOptions) & { headers?: Record<string, http.OutgoingHttpHeader> },
    context: FetchContext
  ): Promise<FetchResponse> {
    let unregisterFromDisposeToken: (() => void) | undefined;
    return new Promise<FetchResponse>((resolve, reject) => {
      const { debugLogger, requestId } = context;
      const timeoutMs = requestOptions.timeout;

      if (debugLogger) {
        let ifNoneMatchHeaderValue: string | number | undefined;
        const requestHeaders = requestOptions.headers;
        if (requestHeaders) {
          for (const key in requestHeaders) {
            if (hasOwnProperty(requestHeaders, key) && key.toLowerCase() === "if-none-match") {
              const value = requestHeaders[key];
              ifNoneMatchHeaderValue = isArray(value) ? value[0] : value;
              break;
            }
          }
        }
        debugLogger.debug(FormattableLogMessage.from(
          REQUEST_ID_ARG_NAME, "URL", "IF_NONE_MATCH"
        )`[${requestId}] Sending request... (Url: '${url}', If-None-Match: '${ifNoneMatchHeaderValue ?? ""}')`);
      }

      const clientRequest = httpModule.get(url, requestOptions, response => this.handleResponse(response, resolve, reject, context));

      unregisterFromDisposeToken = this.disposeToken.registerCallback(
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        typeof clientRequest.abort !== "undefined" ? () => clientRequest.abort() : () => clientRequest.destroy());

      clientRequest
        .on("timeout", () => {
          try {
            clientRequest.destroy();
          } finally {
            reject(new (FetchError as FetchErrorCtorInternal)("timeout", timeoutMs, context.rayId));
          }
        })
        .on("close", () => {
          // eslint-disable-next-line @typescript-eslint/no-deprecated
          if (typeof clientRequest.abort !== "undefined" ? clientRequest.aborted : clientRequest.destroyed) {
            reject(new (FetchError as FetchErrorCtorInternal)("abort", context.rayId));
          }
        })
        .on("error", err => {
          reject(new (FetchError as FetchErrorCtorInternal)("failure", err, context.rayId));
        })
        .end();
    }).finally(() => unregisterFromDisposeToken?.());
  }

  protected setRequestHeaders(requestOptions: { headers?: Record<string, number | string | string[]> }, headers: ReadonlyArray<readonly [string, string]>): void {
    setRequestHeadersDefault(requestOptions, headers);
  }
}

NodeHttpConfigFetcher.prototype[fetchInternalAsyncMethodName] = function(request: FetchRequest, logger?: LoggerWrapper) {
  logMethodDebug(logger, "NodeHttpConfigFetcher.fetchAsync");
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

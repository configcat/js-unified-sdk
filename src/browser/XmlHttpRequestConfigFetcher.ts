import type { OptionsBase } from "../ConfigCatClientOptions";
import { isCdnUrl } from "../ConfigCatClientOptions";
import type { LoggerWrapper } from "../ConfigCatLogger";
import { FormattableLogMessage, logMethodDebug } from "../ConfigCatLogger";
import type { FetchErrorCtorInternal, FetchInternalAsyncMethod, FetchRequest, IConfigCatConfigFetcher } from "../ConfigFetcher";
import { adjustUrlForBrowser, FETCH_RETRY_DELAY_MS, FETCH_RETRY_LIMIT, FetchError, fetchInternalAsyncMethodName, FetchResponse, REQUEST_ID_ARG_NAME } from "../ConfigFetcher";
import { AbortToken, delay, randomUUID } from "../Utils";

interface IHttpRequest {
  setRequestHeader(name: string, value: string): void;
}

type FetchContext = {
  readonly debugLogger: LoggerWrapper | undefined;
  readonly requestId: string | undefined;
  fetchResponse: FetchResponse | undefined;
};

export class XmlHttpRequestConfigFetcher implements IConfigCatConfigFetcher {
  private static getFactory(): (options: OptionsBase) => IConfigCatConfigFetcher {
    return () => new XmlHttpRequestConfigFetcher();
  }

  // eslint-disable-next-line @typescript-eslint/prefer-readonly
  private requestRetryDelayMs = FETCH_RETRY_DELAY_MS;

  private readonly disposeToken = new AbortToken();

  dispose(): void {
    this.disposeToken.abort();
  }

  fetchAsync(request: FetchRequest): Promise<FetchResponse> {
    return this[fetchInternalAsyncMethodName](request);
  }

  // Defined directly on the prototype, see below.
  private [fetchInternalAsyncMethodName]!: FetchInternalAsyncMethod<XmlHttpRequestConfigFetcher>;

  private async fetchWithRetryAsync(request: FetchRequest, logger: LoggerWrapper | undefined) {
    const debugLogger = logger?.ifDebug;
    let requestId: string | undefined;

    if (debugLogger) {
      requestId = randomUUID();
      debugLogger.debug(FormattableLogMessage.from(REQUEST_ID_ARG_NAME)`[${requestId}] Preparing request...`);
    }

    let { url } = request;
    const isCustomUrl = !isCdnUrl(request.url);
    const { headers, timeoutMs } = request;

    url = adjustUrlForBrowser(url, request);

    for (let retryNumber = 0; ; retryNumber++) {
      if (this.disposeToken.aborted) {
        throw new FetchError("abort");
      }

      try {
        const fetchResponse = await this.fetchCoreAsync(url, isCustomUrl ? headers : void 0, timeoutMs,
          { debugLogger, requestId, fetchResponse: void 0 });

        if (FetchResponse.prototype.isExpected.call(fetchResponse)) {
          return fetchResponse;
        }

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
              debugLogger?.debug(FormattableLogMessage.from(REQUEST_ID_ARG_NAME)`[${requestId}] Request timed out.`);
              break;
            case "failure":
              debugLogger?.debug(FormattableLogMessage.from(REQUEST_ID_ARG_NAME)`[${requestId}] Request failed.`);
              break;
          }
        } else {
          throw err;
        }

        if (retryNumber >= FETCH_RETRY_LIMIT) {
          throw err;
        }
      }

      // Wait a little before trying again.
      await delay(this.requestRetryDelayMs);

      debugLogger?.debug(FormattableLogMessage.from(REQUEST_ID_ARG_NAME)`[${requestId}] Trying request again...`);
    }
  }

  private fetchCoreAsync(
    url: string, headers: ReadonlyArray<readonly [name: string, value: string]> | undefined, timeoutMs: number, context: FetchContext
  ): Promise<FetchResponse> {
    let unregisterFromDisposeToken: (() => void) | undefined;
    return new Promise<FetchResponse>((resolve, reject) => {
      const { debugLogger, requestId } = context;

      const httpRequest: XMLHttpRequest = new XMLHttpRequest();

      unregisterFromDisposeToken = this.disposeToken.registerCallback(() => httpRequest.abort());

      httpRequest.onreadystatechange = () => this.handleStateChange(httpRequest, resolve, reject, context);
      httpRequest.ontimeout = () => reject(new (FetchError as FetchErrorCtorInternal)("timeout", httpRequest.timeout, context.fetchResponse?.["rayId"]));
      httpRequest.onabort = () => reject(new (FetchError as FetchErrorCtorInternal)("abort", context.fetchResponse?.["rayId"]));
      httpRequest.onerror = () => reject(new (FetchError as FetchErrorCtorInternal)("failure", void 0, context.fetchResponse?.["rayId"]));

      httpRequest.open("GET", url, true);
      httpRequest.timeout = timeoutMs;
      if (headers) {
        this.setRequestHeaders(httpRequest, headers);
      }

      debugLogger?.debug(FormattableLogMessage.from(
        REQUEST_ID_ARG_NAME, "URL"
      )`[${requestId}] Sending request... (Url: '${url}')`);

      httpRequest.send(null);
    }).finally(() => unregisterFromDisposeToken?.());
  }

  private handleStateChange(
    httpRequest: XMLHttpRequest, resolve: (value: FetchResponse) => void, reject: (reason?: any) => void, context: FetchContext
  ) {
    try {
      const { debugLogger, requestId } = context;

      if (httpRequest.readyState === 2) {
        const { status: statusCode, statusText: reasonPhrase } = httpRequest;

        if (debugLogger) {
          const eTagHeaderValue = httpRequest.getResponseHeader("ETag");
          debugLogger.debug(FormattableLogMessage.from(
            REQUEST_ID_ARG_NAME, "STATUS_CODE", "REASON_PHRASE", "ETAG"
          )`[${requestId}] Received headers. (StatusCode: ${statusCode}, ReasonPhrase: '${reasonPhrase}', ETag: '${eTagHeaderValue ?? ""}')`);
        }

        const headers = getResponseHeadersDefault(httpRequest);
        context.fetchResponse = new FetchResponse(statusCode, reasonPhrase, headers);
      } else if (httpRequest.readyState === 4) {
        const { status: statusCode, statusText: reasonPhrase } = httpRequest;

        // The readystatechange event is emitted even in the case of abort or error.
        // We can detect this by checking for zero status code (see https://stackoverflow.com/a/19247992/8656352).
        if (statusCode) {
          const fetchResponse = context.fetchResponse
            ?? new FetchResponse(statusCode, reasonPhrase, getResponseHeadersDefault(httpRequest)); // just in case

          if (statusCode === 200) {
            const body = (fetchResponse as { body: string }).body = httpRequest.responseText;

            debugLogger?.debug(FormattableLogMessage.from(
              REQUEST_ID_ARG_NAME, "LENGTH"
            )`[${requestId}] Received body. (Length: ${body.length})`);
          }

          resolve(fetchResponse);
        }
      }
    } catch (err) {
      reject(err);
    }
  }

  protected setRequestHeaders(httpRequest: IHttpRequest, headers: ReadonlyArray<readonly [string, string]>): void {
  }
}

XmlHttpRequestConfigFetcher.prototype[fetchInternalAsyncMethodName] = function(request: FetchRequest, logger?: LoggerWrapper) {
  logMethodDebug(logger, "XmlHttpRequestConfigFetcher.fetchAsync");
  return this["fetchWithRetryAsync"](request, logger);
};

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

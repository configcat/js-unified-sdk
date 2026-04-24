import type { OptionsBase } from "../ConfigCatClientOptions";
import { isCdnUrl } from "../ConfigCatClientOptions";
import type { LoggerWrapper } from "../ConfigCatLogger";
import { FormattableLogMessage, logMethodDebug } from "../ConfigCatLogger";
import type { FetchErrorCtorInternal, FetchInternalAsyncMethod, FetchRequest, IConfigCatConfigFetcher } from "../ConfigFetcher";
import { FetchError, fetchInternalAsyncMethodName, FetchResponse, fetchRetryDelayMs, fetchRetryLimit, requestIdArgName } from "../ConfigFetcher";
import { delay, randomUUID } from "../Utils";

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

  private isDisposed = false;

  dispose(): void {
    this.isDisposed = true;
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
            requestIdArgName, "STATUS_CODE", "REASON_PHRASE", "ETAG"
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
              requestIdArgName, "LENGTH"
            )`[${requestId}] Received body. (Length: ${body.length})`);
          }

          resolve(fetchResponse);
        }
      }
    } catch (err) {
      reject(err);
    }
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

      debugLogger.debug(FormattableLogMessage.from(requestIdArgName)`[${requestId}] Preparing request...`);
    }

    const isCustomUrl = !isCdnUrl(request.url);

    for (let retryNumber = 0; ; retryNumber++) {
      if (this.isDisposed) {
        throw new FetchError("abort");
      }

      try {
        const fetchResponse = await this.fetchCoreAsync(request, isCustomUrl,
          { debugLogger, requestId, fetchResponse: void 0 });

        if (FetchResponse.prototype.isExpected.call(fetchResponse)) {
          return fetchResponse;
        }

        debugLogger?.debug(FormattableLogMessage.from(requestIdArgName)`[${requestId}] Received unexpected status code.`);

        if (retryNumber >= fetchRetryLimit) {
          return fetchResponse;
        }
      } catch (err) {
        if (err instanceof FetchError) {
          switch ((err as FetchError).cause) {
            case "abort":
              debugLogger?.debug(FormattableLogMessage.from(requestIdArgName)`[${requestId}] Request aborted.`);
              throw err;
            case "timeout":
              debugLogger?.debug(FormattableLogMessage.from(requestIdArgName)`[${requestId}] Request timed out.`);
              break;
            case "failure":
              debugLogger?.debug(FormattableLogMessage.from(requestIdArgName)`[${requestId}] Request failed.`);
              break;
          }
        } else {
          throw err;
        }

        if (retryNumber >= fetchRetryLimit) {
          throw err;
        }
      }

      // Wait a little before trying again.
      await delay(fetchRetryDelayMs);

      debugLogger?.debug(FormattableLogMessage.from(requestIdArgName)`[${requestId}] Trying request again...`);
    }
  }

  private fetchCoreAsync(request: FetchRequest, isCustomUrl: boolean, context: FetchContext): Promise<FetchResponse> {
    return new Promise<FetchResponse>((resolve, reject) => {
      const { debugLogger, requestId } = context;
      let { url } = request;
      const { lastETag, timeoutMs } = request;

      if (lastETag) {
        // We are sending the etag as a query parameter so if the browser doesn't automatically adds the If-None-Match header,
        // we can transform this query param to the header in our CDN provider.
        // (Explicitly specifying the If-None-Match header would cause an unnecessary CORS OPTIONS request.)
        url += "&ccetag=" + encodeURIComponent(lastETag);
      }

      const httpRequest: XMLHttpRequest = new XMLHttpRequest();

      httpRequest.onreadystatechange = () => this.handleStateChange(httpRequest, resolve, reject, context);
      httpRequest.ontimeout = () => reject(new (FetchError as FetchErrorCtorInternal)("timeout", timeoutMs, context.fetchResponse?.["rayId"]));
      httpRequest.onabort = () => reject(new (FetchError as FetchErrorCtorInternal)("abort", context.fetchResponse?.["rayId"]));
      httpRequest.onerror = () => reject(new (FetchError as FetchErrorCtorInternal)("failure", void 0, context.fetchResponse?.["rayId"]));

      httpRequest.open("GET", url, true);
      httpRequest.timeout = timeoutMs;
      if (isCustomUrl) {
        this.setRequestHeaders(httpRequest, request.headers);
      }

      debugLogger?.debug(FormattableLogMessage.from(
        requestIdArgName, "URL"
      )`[${requestId}] Sending request... (Url: '${url}')`);

      httpRequest.send(null);
    });
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

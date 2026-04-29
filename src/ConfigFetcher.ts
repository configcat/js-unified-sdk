import type { LoggerWrapper } from "./ConfigCatLogger";
import type { RefreshErrorCode } from "./ConfigServiceBase";
import type { ProjectConfig } from "./ProjectConfig";
import type { Message } from "./Utils";
import { ensurePrototype, indexOfAny, toStringSafe } from "./Utils";

export const USER_AGENT_HEADER_NAME = "User-Agent";
export const CONFIGCAT_USER_AGENT_HEADER_NAME = "X-ConfigCat-UserAgent";

export const SDK_QUERYPARAM_NAME = "sdk";
export const ETAG_QUERYPARAM_NAME = "ccetag";

export const enum FetchStatus {
  Fetched = 0,
  NotModified = 1,
  Errored = 2,
}

export type FetchResult =
  { readonly config: ProjectConfig }
  & ({
    readonly status: FetchStatus.Fetched | FetchStatus.NotModified;
    readonly errorCode: RefreshErrorCode.None;
    readonly errorMessage?: undefined;
    readonly errorException?: undefined;
  }
  | {
    readonly status: FetchStatus.Errored;
    readonly errorCode: Exclude<RefreshErrorCode, RefreshErrorCode.None>;
    readonly errorMessage: Message;
    readonly errorException?: any;
  });

export function fetchResultFromSuccess(config: ProjectConfig): FetchResult {
  return { status: FetchStatus.Fetched, config, errorCode: 0 satisfies RefreshErrorCode.None };
}

export function fetchResultFromNotModified(config: ProjectConfig): FetchResult {
  return { status: FetchStatus.NotModified, config, errorCode: 0 satisfies RefreshErrorCode.None };
}

export function fetchResultFromError(config: ProjectConfig,
  errorCode: Exclude<RefreshErrorCode, RefreshErrorCode.None>, errorMessage: Message, errorException?: any
): FetchResult {

  return { status: FetchStatus.Errored, config, errorCode, errorMessage, errorException };
}

/** The request parameters for a ConfigCat config fetch operation. */
export class FetchRequest {
  private readonly _guard: unknown; // prevents structural compatibility with arbitrary objects

  constructor(
    /** The URL of the config. */
    readonly url: string,
    /**
     * The value of the `ETag` HTTP response header received during the last successful request (if any).
     * If available, should be included in the HTTP request, either in the `If-None-Match` header or in the `ccetag` query string parameter.
     *
     * @remarks In browser runtime environments the `If-None-Match` header should be avoided because that may cause unnecessary CORS preflight requests.
     */
    readonly lastETag: string | undefined,
    /** Additional HTTP request headers. Should be included in every HTTP request. */
    readonly headers: ReadonlyArray<readonly [name: string, value: string]>,
    /** The request timeout to apply, configured via `IOptions.requestTimeoutMs`. */
    readonly timeoutMs: number
  ) {
  }
}

/** The response data of a ConfigCat config fetch operation. */
export class FetchResponse {
  /** The value of the `ETag` HTTP response header. */
  readonly eTag?: string = void 0;

  private readonly rayId?: string = void 0;

  constructor(
    /** The HTTP status code. */
    readonly statusCode: number,
    /** The HTTP reason phrase. */
    readonly reasonPhrase: string,
    /** The HTTP response headers. */
    headers: ReadonlyArray<readonly [name: string, value: string]>,
    /** The response body. */
    readonly body?: string
  ) {
    let eTag: string | undefined, rayId: string | undefined;

    for (const [name, value] of headers) {
      const normalizedName = name.toLowerCase();
      if (eTag == null && normalizedName === "etag") {
        this.eTag = eTag = value;
        if (rayId != null) break;
      } else if (rayId == null && normalizedName === "cf-ray") {
        this.rayId = rayId = value;
        if (eTag != null) break;
      }
    }
  }

  isExpected(): boolean {
    switch (this.statusCode) {
      case 200: // OK
      case 304: // Not Modified
      case 403: // Forbidden
      case 404: // Not Found
        return true;
    }

    return false;
  }
}

export type FetchErrorCauses = {
  abort: [];
  timeout: [timeoutMs: number];
  failure: [err?: any];
};

type FetchErrorArgsInternal<TCause extends keyof FetchErrorCauses> = [...FetchErrorCauses[TCause], rayId?: string];

export type FetchErrorCtorInternal<TCause extends keyof FetchErrorCauses = keyof FetchErrorCauses> =
  new(cause: TCause, ...args: FetchErrorArgsInternal<TCause>) => FetchError<TCause>;

export class FetchError<TCause extends keyof FetchErrorCauses = keyof FetchErrorCauses> extends Error {
  override readonly name = FetchError.name;
  readonly args: FetchErrorCauses[TCause];
  private readonly rayId: string | undefined;

  constructor(public cause: TCause, ...args: FetchErrorCauses[TCause]) {
    let message: string, rayId: string | undefined;
    switch (cause) {
      case "abort":
        [rayId] = args as FetchErrorArgsInternal<"abort">;
        message = "Request was aborted.";
        break;
      case "timeout":
        let timeoutMs: number;
        [timeoutMs, rayId] = args as FetchErrorArgsInternal<"timeout">;
        message = `Request timed out. Timeout value: ${timeoutMs}ms`;
        break;
      case "failure":
        let err: any;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        [err, rayId] = args as FetchErrorArgsInternal<"failure">;
        message = "Request failed due to a network or protocol error.";
        message = err
          ? message + " " + (err instanceof Error ? err.message : toStringSafe(err))
          : message;
        break;
    }
    super(message);

    ensurePrototype(this, FetchError);
    this.args = args;
    this.rayId = rayId;
  }
}

/** Defines the interface used by the ConfigCat SDK to perform ConfigCat config fetch operations. */
export interface IConfigCatConfigFetcher {
  /**
   * Fetches the JSON content of the requested config asynchronously.
   * @param request The fetch request.
   * @returns A promise that fulfills with the fetch response.
   * @throws {FetchErrorException} The fetch operation failed.
   */
  fetchAsync(request: FetchRequest): Promise<FetchResponse>;

  dispose?(): void;
}

export function getRequestHeaders(clientVersion: string): [string, string][] {
  return [
    [USER_AGENT_HEADER_NAME, clientVersion],
    [CONFIGCAT_USER_AGENT_HEADER_NAME, clientVersion],
  ];
}

let normalizedUserAgentHeaderName: string | undefined;
let normalizedConfigCatUserAgentHeaderName: string | undefined;

export function adjustUrlForBrowser(url: string, request: FetchRequest): string {
  const { lastETag, headers } = request;

  normalizedUserAgentHeaderName ??= USER_AGENT_HEADER_NAME.toLowerCase();
  normalizedConfigCatUserAgentHeaderName ??= CONFIGCAT_USER_AGENT_HEADER_NAME.toLowerCase();

  let userAgentHeaderValue: string | undefined;
  for (const [key, value] of headers) {
    const normalizedKey = key.toLowerCase();
    if (normalizedKey === normalizedUserAgentHeaderName || normalizedKey === normalizedConfigCatUserAgentHeaderName) {
      userAgentHeaderValue = value;
      break;
    }
  }

  const sdkQueryParamValue = encodeURIComponent(userAgentHeaderValue ?? "");

  // NOTE: We are sending the etag as a query parameter so if the browser doesn't automatically adds
  // the If-None-Match header, we can transform this query param to the header in our CDN provider.
  // (Explicitly specifying the If-None-Match header would cause an unnecessary CORS OPTIONS request.)

  let endIndex: number;
  const index = indexOfAny(url, "?#");
  const query = index < 0 || url.charCodeAt(index) !== 0x3F /*'?'*/
    ? ""
    : (endIndex = url.indexOf("#", index + 1), url.substring(index + 1, endIndex < 0 ? url.length : endIndex));
  url = index < 0 ? url : url.substring(0, index);

  return query ? `${url}?${SDK_QUERYPARAM_NAME}=${sdkQueryParamValue}&${ETAG_QUERYPARAM_NAME}=${encodeURIComponent(lastETag ?? "")}&${query}`
    : lastETag ? `${url}?${SDK_QUERYPARAM_NAME}=${sdkQueryParamValue}&${ETAG_QUERYPARAM_NAME}=${encodeURIComponent(lastETag)}`
    : `${url}?${SDK_QUERYPARAM_NAME}=${sdkQueryParamValue}`;
}

export const fetchInternalAsyncMethodName = "fetchInternalAsync";
export type FetchInternalAsyncMethod<TFetcher extends IConfigCatConfigFetcher> =
  (this: TFetcher, request: FetchRequest, logger?: LoggerWrapper) => Promise<FetchResponse>;

export const FETCH_RETRY_LIMIT = 1;
export const FETCH_RETRY_DELAY_MS = 50;
export const CONNECTIONPOOL_RESET_THRESHOLD_MS = 30_000;

export const REQUEST_ID_ARG_NAME = "REQUEST_ID";

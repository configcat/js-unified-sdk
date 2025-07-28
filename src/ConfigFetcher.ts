import type { RefreshErrorCode } from "./ConfigServiceBase";
import type { ProjectConfig } from "./ProjectConfig";
import type { Message } from "./Utils";
import { ensurePrototype, toStringSafe } from "./Utils";

export const enum FetchStatus {
  Fetched = 0,
  NotModified = 1,
  Errored = 2,
}

export class FetchResult {
  private constructor(
    readonly status: FetchStatus,
    readonly config: ProjectConfig,
    readonly errorCode: RefreshErrorCode,
    readonly errorMessage?: Message,
    readonly errorException?: any) {
  }

  static success(config: ProjectConfig, errorCode: RefreshErrorCode.None): FetchResult {
    return new FetchResult(FetchStatus.Fetched, config, errorCode);
  }

  static notModified(config: ProjectConfig, errorCode: RefreshErrorCode.None): FetchResult {
    return new FetchResult(FetchStatus.NotModified, config, errorCode);
  }

  static error(config: ProjectConfig, errorCode: RefreshErrorCode, errorMessage?: Message, errorException?: any): FetchResult {
    return new FetchResult(FetchStatus.Errored, config, errorCode, errorMessage ?? "Unknown error.", errorException);
  }
}

/** The request parameters for a ConfigCat config fetch operation. */
export class FetchRequest {
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
    readonly headers: ReadonlyArray<[name: string, value: string]>,
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
    headers: ReadonlyArray<[name: string, value: string]>,
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
}

export type FetchErrorCauses = {
  abort: [];
  timeout: [timeoutMs: number];
  failure: [err?: any];
};

export class FetchError<TCause extends keyof FetchErrorCauses = keyof FetchErrorCauses> extends Error {
  readonly name = FetchError.name;
  readonly args: FetchErrorCauses[TCause];

  constructor(public cause: TCause, ...args: FetchErrorCauses[TCause]) {
    super(((cause: TCause, args: FetchErrorCauses[TCause]): string | undefined => {
      switch (cause) {
        case "abort":
          return "Request was aborted.";
        case "timeout":
          const [timeoutMs] = args as FetchErrorCauses["timeout"];
          return `Request timed out. Timeout value: ${timeoutMs}ms`;
        case "failure":
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const [err] = args as FetchErrorCauses["failure"];
          const message = "Request failed due to a network or protocol error.";
          return err
            ? message + " " + (err instanceof Error ? err.message : toStringSafe(err))
            : message;
      }
    })(cause, args));

    ensurePrototype(this, FetchError);
    this.args = args;
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
}

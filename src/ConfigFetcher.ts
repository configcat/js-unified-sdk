import type { OptionsBase } from "./ConfigCatClientOptions";
import { RefreshErrorCode } from "./ConfigServiceBase";
import type { ProjectConfig } from "./ProjectConfig";
import { ensurePrototype } from "./Utils";

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
    readonly errorMessage?: string,
    readonly errorException?: any) {
  }

  static success(config: ProjectConfig): FetchResult {
    return new FetchResult(FetchStatus.Fetched, config, RefreshErrorCode.None);
  }

  static notModified(config: ProjectConfig): FetchResult {
    return new FetchResult(FetchStatus.NotModified, config, RefreshErrorCode.None);
  }

  static error(config: ProjectConfig, errorCode: RefreshErrorCode, errorMessage?: string, errorException?: any): FetchResult {
    return new FetchResult(FetchStatus.Errored, config, errorCode, errorMessage ?? "Unknown error.", errorException);
  }
}

export interface IFetchResponse {
  statusCode: number;
  reasonPhrase: string;
  eTag?: string;
  body?: string;
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
            ? message + " " + (err instanceof Error ? err.message : err + "")
            : message;
      }
    })(cause, args));

    ensurePrototype(this, FetchError);
    this.args = args;
  }
}

export interface IConfigFetcher {
  fetchLogic(options: OptionsBase, lastEtag: string | null): Promise<IFetchResponse>;
}

import type { CacheSyncResult } from "./ConfigCatCache";
import { ExternalConfigCache, InMemoryConfigCache } from "./ConfigCatCache";
import type { OptionsBase } from "./ConfigCatClientOptions";
import type { LogMessage } from "./ConfigCatLogger";
import { toMessage } from "./ConfigCatLogger";
import type { FetchErrorCauses, FetchResponse, IConfigCatConfigFetcher } from "./ConfigFetcher";
import { FetchError, FetchRequest, FetchResult, FetchStatus } from "./ConfigFetcher";
import { RedirectMode } from "./ConfigJson";
import { Config, ProjectConfig } from "./ProjectConfig";
import type { Message } from "./Utils";
import { isPromiseLike } from "./Utils";

/** Specifies the possible config data refresh error codes. */
export const enum RefreshErrorCode {
  /** An unexpected error occurred during the refresh operation. */
  UnexpectedError = -1,
  /** No error occurred (the refresh operation was successful). */
  None = 0,
  /**
   * The refresh operation failed because the client is configured to use the `OverrideBehaviour.LocalOnly` override behavior,
   * which prevents synchronization with the external cache and making HTTP requests.
   */
  LocalOnlyClient = 1,
  /** The refresh operation failed because the client is in offline mode, it cannot initiate HTTP requests. */
  OfflineClient = 3200,
  /** The refresh operation failed because a HTTP response indicating an invalid SDK Key was received (403 Forbidden or 404 Not Found). */
  InvalidSdkKey = 1100,
  /** The refresh operation failed because an invalid HTTP response was received (unexpected HTTP status code). */
  UnexpectedHttpResponse = 1101,
  /** The refresh operation failed because the HTTP request timed out. */
  HttpRequestTimeout = 1102,
  /** The refresh operation failed because the HTTP request failed (most likely, due to a local network issue). */
  HttpRequestFailure = 1103,
  /** The refresh operation failed because an invalid HTTP response was received (200 OK with an invalid content). */
  InvalidHttpResponseContent = 1105,
  /** The refresh operation failed because an invalid HTTP response was received (304 Not Modified when no config JSON was cached locally). */
  InvalidHttpResponseWhenLocalCacheIsEmpty = 1106,
}

/** Contains the result of an `IConfigCatClient.forceRefreshAsync` operation. */
export class RefreshResult {
  private readonly $errorMessage?: Message;
  get errorMessage(): string | undefined { return this.$errorMessage?.toString(); }

  constructor(
    readonly errorCode: RefreshErrorCode,
    /** Error message in case the operation failed, otherwise `undefined`. */
    errorMessage?: Message,
    /** The exception object related to the error in case the operation failed (if any). */
    readonly errorException?: any
  ) {
    if ((errorMessage == null) !== (errorCode === RefreshErrorCode.None)) {
      throw Error("Invalid 'errorCode' value");
    }

    if (errorMessage != null) {
      this.$errorMessage = errorMessage;
    }
  }

  /** Indicates whether the operation was successful or not. */
  get isSuccess(): boolean { return this.$errorMessage == null; }

  static from(fetchResult: FetchResult): RefreshResult {
    return fetchResult.status !== FetchStatus.Errored
      ? RefreshResult.success()
      : RefreshResult.failure(fetchResult.errorCode, fetchResult.errorMessage!, fetchResult.errorException);
  }

  /** Creates an instance of the `RefreshResult` class which indicates that the operation was successful. */
  static success(): RefreshResult {
    return new RefreshResult(RefreshErrorCode.None);
  }

  /** Creates an instance of the `RefreshResult` class which indicates that the operation failed. */
  static failure(errorCode: RefreshErrorCode, errorMessage: Message, errorException?: any): RefreshResult {
    return new RefreshResult(errorCode, errorMessage, errorException);
  }
}

/** Specifies the possible states of the internal cache. */
export const enum ClientCacheState {
  /** No config data is available in the internal cache. */
  NoFlagData,
  /** Only config data provided by local flag override is available in the internal cache. */
  HasLocalOverrideFlagDataOnly,
  /** Only expired config data obtained from the external cache or the ConfigCat CDN is available in the internal cache. */
  HasCachedFlagDataOnly,
  /** Up-to-date config data obtained from the external cache or the ConfigCat CDN is available in the internal cache. */
  HasUpToDateFlagData,
}

export interface IConfigService {
  readonly readyPromise: Promise<ClientCacheState>;

  getConfig(): Promise<ProjectConfig>;

  refreshConfigAsync(): Promise<[RefreshResult, ProjectConfig]>;

  readonly isOffline: boolean;

  setOnline(): void;

  setOffline(): void;

  getCacheState(cachedConfig: ProjectConfig): ClientCacheState;

  dispose(): void;
}

const enum ConfigServiceStatus {
  Online,
  Offline,
  Disposed,
}

function nameOfConfigServiceStatus(value: ConfigServiceStatus): string {
  /// @ts-expect-error Reverse mapping does work because of `preserveConstEnums`.
  return ConfigServiceStatus[value] as string;
}

export abstract class ConfigServiceBase<TOptions extends OptionsBase> {
  private status: ConfigServiceStatus;

  private pendingCacheSyncUp: Promise<ProjectConfig> | null = null;
  private pendingConfigRefresh: Promise<[FetchResult, ProjectConfig]> | null = null;

  protected readonly cacheKey: string;

  protected readonly configFetcher: IConfigCatConfigFetcher;
  private requestUrl: string;
  private readonly requestHeaders: ReadonlyArray<[string, string]>;

  abstract readonly readyPromise: Promise<ClientCacheState>;

  constructor(
    protected readonly options: TOptions) {

    this.cacheKey = options.getCacheKey();

    this.configFetcher = options.configFetcher;
    this.requestUrl = options.getUrl();
    // TODO: send user agent header?
    this.requestHeaders = [];

    this.status = options.offline ? ConfigServiceStatus.Offline : ConfigServiceStatus.Online;
  }

  dispose(): void {
    this.status = ConfigServiceStatus.Disposed;
  }

  protected get disposed(): boolean {
    return this.status === ConfigServiceStatus.Disposed;
  }

  abstract getConfig(): Promise<ProjectConfig>;

  async refreshConfigAsync(): Promise<[RefreshResult, ProjectConfig]> {
    const latestConfig = await this.syncUpWithCache();
    if (!this.isOffline) {
      const [fetchResult, config] = await this.refreshConfigCoreAsync(latestConfig, true);
      return [RefreshResult.from(fetchResult), config];
    } else if (this.options.cache instanceof ExternalConfigCache) {
      return [RefreshResult.success(), latestConfig];
    } else {
      const errorMessage = this.options.logger.configServiceCannotInitiateHttpCalls();
      return [RefreshResult.failure(RefreshErrorCode.OfflineClient, toMessage(errorMessage)), latestConfig];
    }
  }

  protected refreshConfigCoreAsync(latestConfig: ProjectConfig, isInitiatedByUser: boolean): Promise<[FetchResult, ProjectConfig]> {
    if (this.pendingConfigRefresh) {
      // NOTE: Joiners may obtain more up-to-date config data from the external cache than the `latestConfig`
      // that was used to initiate the fetch operation. However, we ignore this possibility because we consider
      // the fetch operation result a more authentic source of truth. Although this may lead to overwriting
      // the cache with stale data, we expect this to be a temporary effect, which corrects itself eventually.

      return this.pendingConfigRefresh;
    }

    const configRefreshPromise = (async (latestConfig: ProjectConfig): Promise<[FetchResult, ProjectConfig]> => {
      const fetchResult = await this.fetchAsync(latestConfig);

      const shouldUpdateCache =
        fetchResult.status === FetchStatus.Fetched
        || fetchResult.status === FetchStatus.NotModified
        || fetchResult.config.timestamp > latestConfig.timestamp // is not transient error?
          && (!fetchResult.config.isEmpty || this.options.cache.getInMemory().isEmpty);

      if (shouldUpdateCache) {
        // NOTE: `ExternalConfigCache.set` makes sure that the external cache is not overwritten with empty
        // config data under any circumstances.
        await this.options.cache.set(this.cacheKey, fetchResult.config);

        latestConfig = fetchResult.config;
      }

      this.onConfigFetched(fetchResult, isInitiatedByUser);

      if (fetchResult.status === FetchStatus.Fetched) {
        this.onConfigChanged(fetchResult.config);
      }

      return [fetchResult, latestConfig];
    })(latestConfig);

    this.pendingConfigRefresh = configRefreshPromise;
    try {
      configRefreshPromise.finally(() => this.pendingConfigRefresh = null);
    } catch (err) {
      this.pendingConfigRefresh = null;
      throw err;
    }
    return configRefreshPromise;
  }

  protected onConfigFetched(fetchResult: FetchResult, isInitiatedByUser: boolean): void {
    this.options.logger.debug("config fetched");
    this.options.hooks.emit("configFetched", RefreshResult.from(fetchResult), isInitiatedByUser);
  }

  protected onConfigChanged(newConfig: ProjectConfig): void {
    this.options.logger.debug("config changed");
    this.options.hooks.emit("configChanged", newConfig.config ?? new Config({}));
  }

  private async fetchAsync(lastConfig: ProjectConfig): Promise<FetchResult> {
    const options = this.options;
    options.logger.debug("ConfigServiceBase.fetchAsync() called.");

    let errorMessage: LogMessage;
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const [response, configOrError] = await this.fetchRequestAsync(lastConfig.httpETag);

      switch (response.statusCode) {
        case 200: // OK
          if (!(configOrError instanceof Config)) {
            errorMessage = options.logger.fetchReceived200WithInvalidBody(configOrError);
            options.logger.debug(`ConfigServiceBase.fetchAsync(): ${response.statusCode} ${response.reasonPhrase} was received but the HTTP response content was invalid. Returning null.`);
            return FetchResult.error(lastConfig, RefreshErrorCode.InvalidHttpResponseContent, toMessage(errorMessage), configOrError);
          }

          options.logger.debug("ConfigServiceBase.fetchAsync(): fetch was successful. Returning new config.");
          return FetchResult.success(new ProjectConfig(response.body, configOrError, ProjectConfig.generateTimestamp(), response.eTag));

        case 304: // Not Modified
          if (lastConfig.isEmpty) {
            errorMessage = options.logger.fetchReceived304WhenLocalCacheIsEmpty(response.statusCode, response.reasonPhrase);
            options.logger.debug(`ConfigServiceBase.fetchAsync(): ${response.statusCode} ${response.reasonPhrase} was received when no config is cached locally. Returning null.`);
            return FetchResult.error(lastConfig, RefreshErrorCode.InvalidHttpResponseWhenLocalCacheIsEmpty, toMessage(errorMessage));
          }

          options.logger.debug("ConfigServiceBase.fetchAsync(): content was not modified. Returning last config with updated timestamp.");
          return FetchResult.notModified(lastConfig.with(ProjectConfig.generateTimestamp()));

        case 403: // Forbidden
        case 404: // Not Found
          errorMessage = options.logger.fetchFailedDueToInvalidSdkKey();
          options.logger.debug("ConfigServiceBase.fetchAsync(): fetch was unsuccessful. Returning last config (if any) with updated timestamp.");
          return FetchResult.error(lastConfig.with(ProjectConfig.generateTimestamp()), RefreshErrorCode.InvalidSdkKey, toMessage(errorMessage));

        default:
          errorMessage = options.logger.fetchFailedDueToUnexpectedHttpResponse(response.statusCode, response.reasonPhrase);
          options.logger.debug("ConfigServiceBase.fetchAsync(): fetch was unsuccessful. Returning null.");
          return FetchResult.error(lastConfig, RefreshErrorCode.UnexpectedHttpResponse, toMessage(errorMessage));
      }
    } catch (err) {
      let errorCode: RefreshErrorCode;
      [errorCode, errorMessage] = err instanceof FetchError && (err as FetchError).cause === "timeout"
        ? [RefreshErrorCode.HttpRequestTimeout, options.logger.fetchFailedDueToRequestTimeout((err.args as FetchErrorCauses["timeout"])[0], err)]
        : [RefreshErrorCode.HttpRequestFailure, options.logger.fetchFailedDueToUnexpectedError(err)];

      options.logger.debug("ConfigServiceBase.fetchAsync(): fetch was unsuccessful. Returning null.");
      return FetchResult.error(lastConfig, errorCode, toMessage(errorMessage), err);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  private async fetchRequestAsync(lastETag: string | undefined, maxRetryCount = 2): Promise<[FetchResponse, (Config | any)?]> {
    const options = this.options;
    options.logger.debug("ConfigServiceBase.fetchRequestAsync() called.");

    for (let retryNumber = 0; ; retryNumber++) {
      options.logger.debug(`ConfigServiceBase.fetchRequestAsync(): calling fetchLogic()${retryNumber > 0 ? `, retry ${retryNumber}/${maxRetryCount}` : ""}`);

      const request = new FetchRequest(this.requestUrl, lastETag, this.requestHeaders, options.requestTimeoutMs);
      const response = await this.configFetcher.fetchAsync(request);

      if (response.statusCode !== 200) {
        return [response];
      }

      if (!response.body) {
        options.logger.debug("ConfigServiceBase.fetchRequestAsync(): no response body.");
        return [response, new Error("No response body.")];
      }

      let config: Config;
      try {
        config = Config.deserialize(response.body);
      } catch (err) {
        options.logger.debug("ConfigServiceBase.fetchRequestAsync(): invalid response body.");
        return [response, err];
      }

      const preferences = config.preferences;
      if (!preferences) {
        options.logger.debug("ConfigServiceBase.fetchRequestAsync(): preferences is empty.");
        return [response, config];
      }

      const baseUrl = preferences.baseUrl;

      // If the base_url is the same as the last called one, just return the response.
      if (!baseUrl || baseUrl === options.baseUrl) {
        options.logger.debug("ConfigServiceBase.fetchRequestAsync(): baseUrl OK.");
        return [response, config];
      }

      const redirect = preferences.redirectMode;

      // If the base_url is overridden, and the redirect parameter is not 2 (force),
      // the SDK should not redirect the calls and it just have to return the response.
      if (options.baseUrlOverriden && redirect !== RedirectMode.Force) {
        options.logger.debug("ConfigServiceBase.fetchRequestAsync(): options.baseUrlOverriden && redirect !== 2.");
        return [response, config];
      }

      options.baseUrl = baseUrl;
      this.requestUrl = options.getUrl();

      if (redirect === RedirectMode.No) {
        return [response, config];
      }

      if (redirect === RedirectMode.Should) {
        options.logger.dataGovernanceIsOutOfSync();
      }

      if (retryNumber >= maxRetryCount) {
        options.logger.fetchFailedDueToRedirectLoop();
        return [response, config];
      }
    }
  }

  protected get isOfflineExactly(): boolean {
    return this.status === ConfigServiceStatus.Offline;
  }

  get isOffline(): boolean {
    return this.status !== ConfigServiceStatus.Online;
  }

  protected goOnline(): void { /* Intentionally empty. */ }

  setOnline(): void {
    if (this.status === ConfigServiceStatus.Offline) {
      this.goOnline();
      this.status = ConfigServiceStatus.Online;
      this.options.logger.configServiceStatusChanged(nameOfConfigServiceStatus(this.status));
    } else if (this.disposed) {
      this.options.logger.configServiceMethodHasNoEffectDueToDisposedClient("setOnline");
    }
  }

  setOffline(): void {
    if (this.status === ConfigServiceStatus.Online) {
      this.status = ConfigServiceStatus.Offline;
      this.options.logger.configServiceStatusChanged(nameOfConfigServiceStatus(this.status));
    } else if (this.disposed) {
      this.options.logger.configServiceMethodHasNoEffectDueToDisposedClient("setOffline");
    }
  }

  abstract getCacheState(cachedConfig: ProjectConfig): ClientCacheState;

  protected syncUpWithCache(): ProjectConfig | Promise<ProjectConfig> {
    const { cache } = this.options;
    if (cache instanceof InMemoryConfigCache) {
      return cache.get(this.cacheKey);
    }

    if (this.pendingCacheSyncUp) {
      return this.pendingCacheSyncUp;
    }

    const syncResult = cache.get(this.cacheKey);
    if (!isPromiseLike(syncResult)) {
      return this.onCacheSynced(syncResult);
    }

    const cacheSyncUpPromise = syncResult.then(syncResult => this.onCacheSynced(syncResult));

    this.pendingCacheSyncUp = cacheSyncUpPromise;
    try {
      cacheSyncUpPromise.finally(() => this.pendingCacheSyncUp = null);
    } catch (err) {
      this.pendingCacheSyncUp = null;
      throw err;
    }
    return cacheSyncUpPromise;
  }

  private onCacheSynced(syncResult: CacheSyncResult): ProjectConfig {
    if (!Array.isArray(syncResult)) {
      return syncResult;
    }

    const [newConfig] = syncResult;
    if (!newConfig.isEmpty) {
      this.onConfigChanged(newConfig);
    }
    return newConfig;
  }

  protected async waitForReadyAsync(initialCacheSyncUp: ProjectConfig | Promise<ProjectConfig>): Promise<ClientCacheState> {
    return this.getCacheState(await initialCacheSyncUp);
  }

  protected getReadyPromise(initialCacheSyncUp: ProjectConfig | Promise<ProjectConfig>): Promise<ClientCacheState> {
    return this.waitForReadyAsync(initialCacheSyncUp).then(cacheState => {
      this.options.hooks.emit("clientReady", cacheState);
      return cacheState;
    });
  }
}


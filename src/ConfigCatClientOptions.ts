import type { IConfigCache, IConfigCatCache } from "./ConfigCatCache";
import { ExternalConfigCache, InMemoryConfigCache } from "./ConfigCatCache";
import type { IConfigCatLogger, LogFilterCallback } from "./ConfigCatLogger";
import { ConfigCatConsoleLogger, LoggerWrapper } from "./ConfigCatLogger";
import type { IConfigCatConfigFetcher } from "./ConfigFetcher";
import type { IEventEmitter } from "./EventEmitter";
import { NullEventEmitter } from "./EventEmitter";
import type { FlagOverrides } from "./FlagOverrides";
import { sha1 } from "./Hash";
import type { HookEvents, IProvidesHooks, SafeHooksWrapper } from "./Hooks";
import { Hooks } from "./Hooks";
import { getWeakRefStub, isWeakRefAvailable } from "./Polyfills";
import { ProjectConfig } from "./ProjectConfig";
import type { IUser } from "./User";

const CDN_BASE_URLS: [global: string, eu: string] = [
  "https://cdn-global.configcat.com",
  "https://cdn-eu.configcat.com",
] as const;

/** Specifies the supported polling modes. */
export const enum PollingMode {
  /** The ConfigCat SDK downloads the latest config data automatically and stores it in the cache. */
  AutoPoll = 0,
  /** The ConfigCat SDK downloads the latest config data only if it is not present in the cache, or if it is but has expired. */
  LazyLoad = 1,
  /** The ConfigCat SDK will not download the config data automatically. You need to update the cache manually, by calling `forceRefreshAsync()`. */
  ManualPoll = 2,
}

/** Controls the location of the config JSON files containing your feature flags and settings within the ConfigCat CDN. */
export const enum DataGovernance {
  /** Choose this option if your config JSON files are published to all global CDN nodes. */
  Global = 0,
  /** Choose this option if your config JSON files are published to CDN nodes only in the EU. */
  EuOnly = 1,
}

/** Options used to configure the ConfigCat SDK. */
export interface IOptions {
  /**
   * An optional callback that can be used to filter log events beyond the minimum log level setting
   * (see `IConfigCatLogger.level` and `createConsoleLogger`).
   */
  logFilter?: LogFilterCallback | null;

  /**
   * The logger implementation to use for performing logging.
   *
   * If not set, `ConfigCatConsoleLogger` with `LogLevel.Warn` will be used by default.
   * If you want to use custom logging instead, you can provide an implementation of `IConfigCatLogger`.
   */
  logger?: IConfigCatLogger | null;

  /** Timeout (in milliseconds) for underlying HTTP calls. Defaults to 30 seconds. */
  requestTimeoutMs?: number | null;

  /**
   * The base URL of the remote server providing the latest version of the config.
   * Defaults to the URL of the ConfigCat CDN.
   *
   * If you want to use a proxy server between your application and ConfigCat, you need to set this property to the proxy URL.
   */
  baseUrl?: string | null;

  /**
   * Set this property to be in sync with the Data Governance preference on the Dashboard:
   * https://app.configcat.com/organization/data-governance (only Organization Admins have access).
   * Defaults to `DataGovernance.Global`.
   */
  dataGovernance?: DataGovernance | null;

  /**
   * The cache implementation to use for storing and retrieving downloaded config data.
   *
   * If not set, a default implementation will be used (depending on the platform).
   * If you want to use custom caching instead, you can provide an implementation of `IConfigCatCache`.
   */
  cache?: IConfigCatCache | null;

  /**
   * The config fetcher implementation to use for performing ConfigCat config fetch operations.
   *
   * If not set, a default implementation will be used depending on the current platform.
   * If you want to use custom a config fetcher, you can provide an implementation of `IConfigCatConfigFetcher`.
   */
  configFetcher?: IConfigCatConfigFetcher | null;

  /** The flag override to use. If not set, no flag override will be used. */
  flagOverrides?: FlagOverrides | null;

  /**
   * The default user, used as fallback when there's no user parameter is passed to the setting evaluation methods like
   * `IConfigCatClient.getValueAsync`, `ConfigCatClient.getValueAsync`, etc.
   */
  defaultUser?: IUser | null;

  /**
   * Indicates whether the client should be initialized to offline mode or not. Defaults to `false`.
   */
  offline?: boolean | null;

  /** Provides an opportunity to add listeners to client hooks (events) at client initalization time. */
  setupHooks?: (hooks: IProvidesHooks) => void;
}

/** Options used to configure the ConfigCat SDK in the case of Auto Polling mode. */
export interface IAutoPollOptions extends IOptions {
  /**
   * Config refresh interval.
   * Specifies how frequently the internally cached config will be updated by synchronizing with
   * the external cache and/or by fetching the latest version from the ConfigCat CDN.
   *
   * Default value is 60 seconds. Minimum value is 1 second. Maximum value is 2147483 seconds.
   */
  pollIntervalSeconds?: number;

  /**
   * Maximum waiting time before reporting the ready state, i.e. emitting the `clientReady` event.
   *
   * Default value is 5 seconds. Maximum value is 2147483 seconds. Negative values mean infinite waiting.
   */
  maxInitWaitTimeSeconds?: number;
}

/** Options used to configure the ConfigCat SDK in the case of Manual Polling mode. */
export interface IManualPollOptions extends IOptions {
}

/** Options used to configure the ConfigCat SDK in the case of Lazy Loading mode. */
export interface ILazyLoadingOptions extends IOptions {
  /**
   * Cache time to live value.
   * Specifies how long the cached config can be used before updating it again
   * by fetching the latest version from the ConfigCat CDN.
   *
   * Default value is 60 seconds. Minimum value is 1 second. Maximum value is 2147483647 seconds.
   */
  cacheTimeToLiveSeconds?: number;
}

export type OptionsForPollingMode<TMode extends PollingMode | undefined> =
  TMode extends PollingMode.AutoPoll ? IAutoPollOptions :
  TMode extends PollingMode.ManualPoll ? IManualPollOptions :
  TMode extends PollingMode.LazyLoad ? ILazyLoadingOptions :
  TMode extends undefined ? IAutoPollOptions :
  never;

export interface IConfigCatKernel {
  sdkType: string;
  sdkVersion: string;
  eventEmitterFactory?: () => IEventEmitter;
  defaultCacheFactory?: (options: OptionsBase) => IConfigCache;
  configFetcherFactory: (options: OptionsBase) => IConfigCatConfigFetcher;
}

/* eslint-disable @typescript-eslint/no-inferrable-types */

export abstract class OptionsBase {

  private static readonly configFileName = "config_v6.json";

  logger: LoggerWrapper;

  sdkKey: string;

  clientVersion: string;

  requestTimeoutMs: number = 30000;

  baseUrl: string;

  baseUrlOverriden: boolean = false;

  dataGovernance: DataGovernance;

  cache: IConfigCache;

  configFetcher: IConfigCatConfigFetcher;

  flagOverrides?: FlagOverrides;

  defaultUser?: IUser;

  offline: boolean = false;

  hooks: SafeHooksWrapper;

  constructor(sdkKey: string, kernel: IConfigCatKernel, clientVersion: string, options?: IOptions | null) {

    if (!sdkKey) {
      throw new Error("Invalid 'sdkKey' value");
    }

    this.sdkKey = sdkKey;
    this.clientVersion = clientVersion;
    this.dataGovernance = options?.dataGovernance ?? DataGovernance.Global;

    const [globalCdnBaseUrl, euCdnBaseUrl] = CDN_BASE_URLS;
    // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
    switch (this.dataGovernance) {
      case DataGovernance.EuOnly:
        this.baseUrl = euCdnBaseUrl;
        break;
      default:
        this.baseUrl = globalCdnBaseUrl;
        break;
    }

    const eventEmitter = kernel.eventEmitterFactory?.() ?? new NullEventEmitter();
    const hooks = new Hooks(eventEmitter);
    const hooksWeakRef = new (isWeakRefAvailable() ? WeakRef : getWeakRefStub())(hooks);
    this.hooks = <SafeHooksWrapper & { hooksWeakRef: WeakRef<Hooks> }>{
      hooks, // stored only temporarily, will be deleted by `yieldHooks()`
      hooksWeakRef,
      emit<TEventName extends keyof HookEvents>(eventName: TEventName, ...args: HookEvents[TEventName]): boolean {
        return this.hooksWeakRef.deref()?.emit(eventName, ...args) ?? false;
      },
    };

    let logFilter: LogFilterCallback | undefined;
    let logger: IConfigCatLogger | null | undefined;
    let cache: IConfigCatCache | null | undefined;
    let configFetcher: IConfigCatConfigFetcher | null | undefined;

    if (options) {
      if (options.logFilter) {
        logFilter = options.logFilter;
      }

      logger = options.logger;
      cache = options.cache;
      configFetcher = options.configFetcher;

      if (options.requestTimeoutMs) {
        if (options.requestTimeoutMs < 0) {
          throw new Error("Invalid 'requestTimeoutMs' value");
        }

        this.requestTimeoutMs = options.requestTimeoutMs;
      }

      if (options.baseUrl && !isCdnUrl(options.baseUrl)) {
        this.baseUrl = options.baseUrl;
        this.baseUrlOverriden = true;
      }

      if (options.flagOverrides) {
        this.flagOverrides = options.flagOverrides;
      }

      if (options.defaultUser) {
        this.defaultUser = options.defaultUser;
      }

      if (options.offline) {
        this.offline = options.offline;
      }

      options.setupHooks?.(hooks);
    }

    this.logger = new LoggerWrapper(logger ?? new ConfigCatConsoleLogger(), logFilter, this.hooks);

    this.cache = cache
      ? new ExternalConfigCache(cache, this.logger)
      : (kernel.defaultCacheFactory ? kernel.defaultCacheFactory(this) : new InMemoryConfigCache());

    this.configFetcher = configFetcher ?? kernel.configFetcherFactory(this);
  }

  yieldHooks(): Hooks {
    const hooksWrapper = this.hooks as unknown as { hooks?: Hooks };
    const hooks = hooksWrapper.hooks;
    delete hooksWrapper.hooks;
    return hooks ?? new Hooks(new NullEventEmitter());
  }

  getUrl(): string {
    return this.baseUrl + "/configuration-files/" + this.sdkKey + "/" + OptionsBase.configFileName + "?sdk=" + this.clientVersion;
  }

  getCacheKey(): string {
    return sha1(`${this.sdkKey}_${OptionsBase.configFileName}_${ProjectConfig.serializationFormatVersion}`);
  }
}

export function isCdnUrl(url: string): boolean {
  for (const baseUrl of CDN_BASE_URLS) {
    let ch: number;
    const maybeMatch = url.length === baseUrl.length
      || (ch = url.charCodeAt(baseUrl.length)) === 0x2F /* '/' */
      // NOTE: FQDNs with trailing dot are also valid (see also http://www.dns-sd.org/trailingdotsindomainnames.html).
      || ch === 0x2E /* '.' */ && url.charCodeAt(baseUrl.length + 1) === 0x2F;
    if (maybeMatch
      // NOTE: Domain names are case insensitive.
      && url.slice(0, baseUrl.length).toLowerCase() === baseUrl
    ) {
      return true;
    }
  }
  return false;
}

export class AutoPollOptions extends OptionsBase {

  pollIntervalSeconds: number = 60;

  maxInitWaitTimeSeconds: number = 5;

  constructor(sdkKey: string, kernel: IConfigCatKernel, options?: IAutoPollOptions | null) {

    super(sdkKey, kernel, kernel.sdkType + "/a-" + kernel.sdkVersion, options);

    if (options) {

      if (options.pollIntervalSeconds != null) {
        this.pollIntervalSeconds = options.pollIntervalSeconds;
      }

      if (options.maxInitWaitTimeSeconds != null) {
        this.maxInitWaitTimeSeconds = options.maxInitWaitTimeSeconds;
      }
    }

    // https://developer.mozilla.org/en-US/docs/Web/API/setTimeout#maximum_delay_value
    // https://stackoverflow.com/a/3468650/8656352
    const maxSetTimeoutIntervalSecs = 2147483;

    if (!(typeof this.pollIntervalSeconds === "number" && 1 <= this.pollIntervalSeconds && this.pollIntervalSeconds <= maxSetTimeoutIntervalSecs)) {
      throw new Error("Invalid 'pollIntervalSeconds' value");
    }

    if (!(typeof this.maxInitWaitTimeSeconds === "number" && this.maxInitWaitTimeSeconds <= maxSetTimeoutIntervalSecs)) {
      throw new Error("Invalid 'maxInitWaitTimeSeconds' value");
    }
  }
}

export class ManualPollOptions extends OptionsBase {
  constructor(sdkKey: string, kernel: IConfigCatKernel, options?: IManualPollOptions | null) {

    super(sdkKey, kernel, kernel.sdkType + "/m-" + kernel.sdkVersion, options);
  }
}

export class LazyLoadOptions extends OptionsBase {

  cacheTimeToLiveSeconds: number = 60;

  constructor(sdkKey: string, kernel: IConfigCatKernel, options?: ILazyLoadingOptions | null) {

    super(sdkKey, kernel, kernel.sdkType + "/l-" + kernel.sdkVersion, options);

    if (options) {
      if (options.cacheTimeToLiveSeconds != null) {
        this.cacheTimeToLiveSeconds = options.cacheTimeToLiveSeconds;
      }
    }

    if (!(typeof this.cacheTimeToLiveSeconds === "number" && 1 <= this.cacheTimeToLiveSeconds && this.cacheTimeToLiveSeconds <= 2147483647)) {
      throw new Error("Invalid 'cacheTimeToLiveSeconds' value");
    }
  }
}

export type ConfigCatClientOptions = AutoPollOptions | ManualPollOptions | LazyLoadOptions;

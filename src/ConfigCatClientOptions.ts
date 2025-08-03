import { AutoPollConfigService } from "./AutoPollConfigService";
import type { IConfigCache, IConfigCatCache } from "./ConfigCatCache";
import { ExternalConfigCache, InMemoryConfigCache } from "./ConfigCatCache";
import type { IConfigCatLogger, LogFilterCallback } from "./ConfigCatLogger";
import { ConfigCatConsoleLogger, LoggerWrapper } from "./ConfigCatLogger";
import type { IConfigCatConfigFetcher } from "./ConfigFetcher";
import type { IConfigService } from "./ConfigServiceBase";
import type { IEventEmitter } from "./EventEmitter";
import { NullEventEmitter } from "./EventEmitter";
import type { FlagOverrides, IOverrideDataSource } from "./FlagOverrides";
import { nameOfOverrideBehaviour } from "./FlagOverrides";
import { sha1 } from "./Hash";
import type { HookEvents, IProvidesHooks, SafeHooksWrapper } from "./Hooks";
import { Hooks } from "./Hooks";
import { LazyLoadConfigService } from "./LazyLoadConfigService";
import { ManualPollConfigService } from "./ManualPollConfigService";
import { ProjectConfig } from "./ProjectConfig";
import type { IUser } from "./User";
import { createMap, createWeakRef, ensureBooleanArg, ensureEnumArg, ensureFunctionArg, ensureNumberArgInRange, ensureObjectArg, ensureStringArg, isNumberInRange } from "./Utils";

export const PROXY_SDKKEY_PREFIX = "configcat-proxy/";

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

function nameOfDataGovernance(value: DataGovernance): string {
  /// @ts-expect-error Reverse mapping does work because of `preserveConstEnums`.
  return DataGovernance[value] as string;
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
   *
   * @remarks Implementing a config fetcher that makes HTTP requests to the ConfigCat CDN is tricky, especially when the
   * SDK runs in a browser. Therefore, please **avoid writing actual config fetcher implementations from scratch**
   * unless absolutely necessary and you know exactly what you are doing. (Writing mock implementations for testing
   * purposes is fine, of course.)
   *
   * If you use the SDK with a [proxy](https://configcat.com/docs/advanced/proxy/proxy-overview/) and need to set
   * custom HTTP request headers, you can subclass the built-in config fetcher implementations (e.g. FetchApiConfigFetcher)
   * and override the `setRequestHeaders` method.
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
  eventEmitterFactory: (() => IEventEmitter) | null | undefined;
  defaultCacheFactory: ((options: OptionsBase) => IConfigCache) | null | undefined;
  configFetcherFactory: (options: OptionsBase) => IConfigCatConfigFetcher;
}

export abstract class OptionsBase {

  private static readonly configFileName = "config_v6.json";

  logger: LoggerWrapper;

  sdkKey: string;

  clientVersion: string;

  requestTimeoutMs = 30000;

  baseUrl: string;

  baseUrlOverriden;

  dataGovernance = DataGovernance.Global;

  cache: IConfigCache;

  configFetcher: IConfigCatConfigFetcher;

  flagOverrides: FlagOverrides | null = null;

  defaultUser: IUser | undefined = void 0;

  offline = false;

  hooks: SafeHooksWrapper;

  constructor(sdkKey: string, kernel: IConfigCatKernel, clientVersion: string, options?: IOptions | null) {
    this.sdkKey = sdkKey;
    this.clientVersion = clientVersion;

    const eventEmitter = kernel.eventEmitterFactory?.() ?? new NullEventEmitter();
    const hooks = new Hooks(eventEmitter);
    this.hooks = {
      hooks, // stored only temporarily to keep alive the object, will be unreferenced by `yieldHooks()`
      unwrap() { return this.hooks; },
      emit<TEventName extends keyof HookEvents>(eventName: TEventName, ...args: HookEvents[TEventName]): boolean {
        return this.unwrap()?.emit(eventName, ...args) ?? false;
      },
    } as SafeHooksWrapper & { hooks: Hooks };

    let logFilter: LogFilterCallback | undefined;
    let logger: IConfigCatLogger | undefined;
    let cache: IConfigCatCache | undefined;
    let configFetcher: IConfigCatConfigFetcher | undefined;
    let baseUrl: string | undefined;

    if (options) {
      const optionsArgName = "options";

      if (options.logFilter != null) {
        logFilter = ensureFunctionArg(options.logFilter, optionsArgName, ".logFilter");
      }

      if (options.logger != null) {
        const requiredProps = createMap<keyof IConfigCatLogger, boolean>();
        requiredProps.log = true;
        logger = ensureObjectArg(options.logger, optionsArgName, requiredProps, ".logger");
      }

      if (options.cache != null) {
        const requiredProps = createMap<keyof IConfigCatCache, boolean>();
        requiredProps.get = requiredProps.set = true;
        cache = ensureObjectArg(options.cache, optionsArgName, requiredProps, ".cache");
      }

      if (options.configFetcher != null) {
        const requiredProps = createMap<keyof IConfigCatConfigFetcher, boolean>();
        requiredProps.fetchAsync = true;
        configFetcher = ensureObjectArg(options.configFetcher, optionsArgName, requiredProps, ".configFetcher");
      }

      if (options.requestTimeoutMs != null) {
        this.requestTimeoutMs = ensureNumberArgInRange(options.requestTimeoutMs, optionsArgName,
          "greater than 0", value => value > 0, ".requestTimeoutMs");
      }

      if (options.dataGovernance != null) {
        this.dataGovernance = ensureEnumArg(options.dataGovernance, optionsArgName, "DataGovernance",
          value => nameOfDataGovernance(value) !== void 0, ".dataGovernance");
      }

      if (options.baseUrl != null) {
        baseUrl = ensureStringArg(options.baseUrl, optionsArgName, true, ".baseUrl");
      }

      if (options.flagOverrides != null) {
        const requiredProps = createMap<keyof FlagOverrides, boolean>();
        requiredProps.behaviour = requiredProps.dataSource = false;
        const flagOverrides = ensureObjectArg(options.flagOverrides, optionsArgName, requiredProps, ".flagOverrides");

        ensureEnumArg(flagOverrides.behaviour, optionsArgName, "OverrideBehaviour",
          value => nameOfOverrideBehaviour(value) !== void 0, ".flagOverrides.behaviour");

        const dataSourceRequiredProps = createMap<keyof IOverrideDataSource, boolean>();
        dataSourceRequiredProps.getOverrides = true;
        ensureObjectArg(flagOverrides.dataSource, optionsArgName, dataSourceRequiredProps, ".flagOverrides.dataSource");

        this.flagOverrides = flagOverrides;
      }

      if (options.defaultUser != null) {
        this.defaultUser = ensureObjectArg(options.defaultUser, optionsArgName, void 0, ".defaultUser");
      }

      if (options.offline != null) {
        this.offline = ensureBooleanArg(options.offline, optionsArgName, ".offline");
      }

      if (options.setupHooks != null) {
        const setupHooks = ensureFunctionArg(options.setupHooks, optionsArgName, ".setupHooks");
        setupHooks(hooks);
      }
    }

    if ((this.baseUrlOverriden = baseUrl != null)) {
      this.baseUrl = baseUrl!;
    } else {
      this.baseUrl = this.dataGovernance === DataGovernance.EuOnly
        ? "https://cdn-eu.configcat.com"
        : "https://cdn-global.configcat.com";
    }

    this.logger = new LoggerWrapper(logger ?? new ConfigCatConsoleLogger(), logFilter, this.hooks);

    this.cache = cache
      ? new ExternalConfigCache(cache, this.logger)
      : (kernel.defaultCacheFactory?.(this) ?? new InMemoryConfigCache());

    this.configFetcher = configFetcher ?? kernel.configFetcherFactory(this);
  }

  yieldHooks(): Hooks {
    const hooksWrapper = this.hooks as SafeHooksWrapper & { hooks: WeakRef<Hooks> };
    const hooks = hooksWrapper.unwrap() ?? new Hooks(new NullEventEmitter());
    hooksWrapper.hooks = createWeakRef(hooks) as WeakRef<Hooks>;
    hooksWrapper.unwrap = function() { return this.hooks.deref(); };
    return hooks;
  }

  getUrl(): string {
    const { baseUrl } = this;
    return baseUrl
      + (baseUrl.charCodeAt(baseUrl.length - 1) !== 0x2F /*'/'*/ ? "/" : "")
      + "configuration-files/" + this.sdkKey + "/" + OptionsBase.configFileName + "?sdk=" + this.clientVersion;
  }

  getCacheKey(): string {
    return sha1(`${this.sdkKey}_${OptionsBase.configFileName}_${ProjectConfig.serializationFormatVersion}`);
  }

  abstract createConfigService(): IConfigService;
}

const PROXY_PATH_SEGMENT = "/" + PROXY_SDKKEY_PREFIX;
const CDN_BASEURL_REGEXP = /^https?:\/\/(?:[a-z0-9-]+\.)+configcat\.com\.?(?:[:/]|$)/i;

export function isCdnUrl(url: string): boolean {
  if (!CDN_BASEURL_REGEXP.test(url)) {
    return false;
  }
  let index = url.indexOf("?");
  index = url.lastIndexOf(PROXY_PATH_SEGMENT, (index >= 0 ? index : url.length) - PROXY_PATH_SEGMENT.length);
  return index < 0;
}

export class AutoPollOptions extends OptionsBase {

  pollIntervalSeconds = 60;

  maxInitWaitTimeSeconds = 5;

  constructor(sdkKey: string, kernel: IConfigCatKernel, options?: IAutoPollOptions | null) {

    super(sdkKey, kernel, kernel.sdkType + "/a-" + kernel.sdkVersion, options);

    if (options) {
      const optionsArgName = "options";

      // https://developer.mozilla.org/en-US/docs/Web/API/setTimeout#maximum_delay_value
      // https://stackoverflow.com/a/3468650/8656352
      const maxSetTimeoutIntervalSecs = 2147483;

      if (options.pollIntervalSeconds != null) {
        const minValue = 1, maxValue = maxSetTimeoutIntervalSecs;
        this.pollIntervalSeconds = ensureNumberArgInRange(options.pollIntervalSeconds, optionsArgName,
          `between ${minValue} and ${maxValue}`, value => isNumberInRange(value, minValue, maxValue), ".pollIntervalSeconds");
      }

      if (options.maxInitWaitTimeSeconds != null) {
        const maxValue = maxSetTimeoutIntervalSecs;
        this.maxInitWaitTimeSeconds = ensureNumberArgInRange(options.maxInitWaitTimeSeconds, optionsArgName,
          `less than or equal to ${maxValue}`, value => value <= maxValue, ".maxInitWaitTimeSeconds");
      }
    }
  }

  override createConfigService(): IConfigService {
    return new AutoPollConfigService(this);
  }
}

export class ManualPollOptions extends OptionsBase {
  constructor(sdkKey: string, kernel: IConfigCatKernel, options?: IManualPollOptions | null) {

    super(sdkKey, kernel, kernel.sdkType + "/m-" + kernel.sdkVersion, options);
  }

  override createConfigService(): IConfigService {
    return new ManualPollConfigService(this);
  }
}

export class LazyLoadOptions extends OptionsBase {

  cacheTimeToLiveSeconds = 60;

  constructor(sdkKey: string, kernel: IConfigCatKernel, options?: ILazyLoadingOptions | null) {

    super(sdkKey, kernel, kernel.sdkType + "/l-" + kernel.sdkVersion, options);

    if (options) {
      const optionsArgName = "options";

      if (options.cacheTimeToLiveSeconds != null) {
        const minValue = 1, maxValue = 2147483647;
        this.cacheTimeToLiveSeconds = ensureNumberArgInRange(options.cacheTimeToLiveSeconds, optionsArgName,
          `between ${minValue} and ${maxValue}`, value => isNumberInRange(value, minValue, maxValue), ".cacheTimeToLiveSeconds");
      }

      if (options.cacheTimeToLiveSeconds != null) {
        this.cacheTimeToLiveSeconds = options.cacheTimeToLiveSeconds;
      }
    }
  }

  override createConfigService(): IConfigService {
    return new LazyLoadConfigService(this);
  }
}

export type ConfigCatClientOptions = AutoPollOptions | ManualPollOptions | LazyLoadOptions;

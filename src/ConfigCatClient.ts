import { AutoPollConfigService } from "./AutoPollConfigService";
import type { ConfigCatClientOptions, IConfigCatKernel, OptionsBase, OptionsForPollingMode } from "./ConfigCatClientOptions";
import { AutoPollOptions, LazyLoadOptions, ManualPollOptions, PollingMode, PROXY_SDKKEY_PREFIX } from "./ConfigCatClientOptions";
import type { LoggerWrapper } from "./ConfigCatLogger";
import { LogLevel } from "./ConfigCatLogger";
import type { IConfigService } from "./ConfigServiceBase";
import { ClientCacheState, RefreshErrorCode, RefreshResult } from "./ConfigServiceBase";
import type { FlagOverrides } from "./FlagOverrides";
import { nameOfOverrideBehaviour, OverrideBehaviour } from "./FlagOverrides";
import type { HookEvents, Hooks, IProvidesHooks } from "./Hooks";
import { LazyLoadConfigService } from "./LazyLoadConfigService";
import { ManualPollConfigService } from "./ManualPollConfigService";
import type { IConfig, ProjectConfig, Setting, SettingValue } from "./ProjectConfig";
import type { IEvaluationDetails, IRolloutEvaluator, SettingKeyValue, SettingTypeOf } from "./RolloutEvaluator";
import { checkSettingsAvailable, evaluate, evaluateAll, evaluationDetailsFromDefaultValue, findKeyAndValue, getEvaluationErrorCode, getTimestampAsDate, isAllowedValue, RolloutEvaluator } from "./RolloutEvaluator";
import type { IUser } from "./User";
import { getUserAttributes } from "./User";
import { createWeakRef, errorToString, isObject, shallowClone, throwError } from "./Utils";

/** ConfigCat SDK client. */
export interface IConfigCatClient extends IProvidesHooks {

  /**
   * Returns the value of a feature flag or setting identified by `key`.
   * @remarks
   * It is important to provide an argument for the `defaultValue` parameter that matches the type of the feature flag or setting you are evaluating.
   * Please refer to {@link https://configcat.com/docs/sdk-reference/js/#setting-type-mapping | this table} for the corresponding types.
   * @param key Key of the feature flag or setting.
   * @param defaultValue In case of failure, this value will be returned. Only the following types are allowed: `string`, `boolean`, `number`, `null` and `undefined`.
   * @param user The User Object to use for evaluating targeting rules and percentage options.
   * @returns A promise that fulfills with the value of the feature flag or setting.
   * @throws {Error} `key` is empty.
   * @throws {TypeError} `defaultValue` is not of an allowed type.
   */
  getValueAsync<T extends SettingValue>(key: string, defaultValue: T, user?: IUser): Promise<SettingTypeOf<T>>;

  /**
   * Returns the value along with evaluation details of a feature flag or setting identified by `key`.
   * @remarks
   * It is important to provide an argument for the `defaultValue` parameter that matches the type of the feature flag or setting you are evaluating.
   * Please refer to {@link https://configcat.com/docs/sdk-reference/js/#setting-type-mapping | this table} for the corresponding types.
   * @param key Key of the feature flag or setting.
   * @param defaultValue In case of failure, this value will be returned. Only the following types are allowed: `string`, `boolean`, `number`, `null` and `undefined`.
   * @param user The User Object to use for evaluating targeting rules and percentage options.
   * @returns A promise that fulfills with the value along with the details of evaluation of the feature flag or setting.
   * @throws {Error} `key` is empty.
   * @throws {TypeError} `defaultValue` is not of an allowed type.
   */
  getValueDetailsAsync<T extends SettingValue>(key: string, defaultValue: T, user?: IUser): Promise<IEvaluationDetails<SettingTypeOf<T>>>;

  /**
   * Returns all setting keys.
   * @returns A promise that fulfills with the array of keys.
   */
  getAllKeysAsync(): Promise<string[]>;

  /**
   * Returns the keys and values of all feature flags and settings.
   * @param user The User Object to use for evaluating targeting rules and percentage options.
   * @returns A promise that fulfills with the array of key-value pairs.
   */
  getAllValuesAsync(user?: IUser): Promise<SettingKeyValue[]>;

  /**
   * Returns the values along with evaluation details of all feature flags and settings.
   * @param user The User Object to use for evaluating targeting rules and percentage options.
   * @returns A promise that fulfills with the array of values along with evaluation details.
   */
  getAllValueDetailsAsync(user?: IUser): Promise<IEvaluationDetails[]>;

  /** Returns the key of a setting and it's value identified by the given Variation ID (analytics) */

  /**
   * Returns the key of a setting and its value identified by the specified `variationId`.
   * @param variationId Variation ID (analytics).
   * @returns A promise that fulfills with the key-value pair.
   */
  getKeyAndValueAsync(variationId: string): Promise<SettingKeyValue | null>;

  /**
   * Updates the internally cached config by synchronizing with the external cache (if any),
   * then by fetching the latest version from the ConfigCat CDN (provided that the client is online).
   * @returns A promise that fulfills with the refresh result.
   */
  forceRefreshAsync(): Promise<RefreshResult>;

  /**
   * Waits for the client to reach the ready state, i.e. to complete initialization.
   *
   * @remarks Ready state is reached as soon as the initial sync with the external cache (if any) completes.
   * If this does not produce up-to-date config data, and the client is online (i.e. HTTP requests are allowed),
   * the first config fetch operation is also awaited in Auto Polling mode before ready state is reported.
   *
   * That is, reaching the ready state usually means the client is ready to evaluate feature flags and settings.
   * However, please note that this is not guaranteed. In case of initialization failure or timeout, the internal cache
   * may be empty or expired even after the ready state is reported. You can verify this by checking the return value.
   *
   * @returns A promise that fulfills with the state of the internal cache at the time initialization was completed.
   */
  waitForReady(): Promise<ClientCacheState>;

  /**
   * Captures the current state of the client.
   * The resulting snapshot can be used to synchronously evaluate feature flags and settings based on the captured state.
   *
   * @remarks The operation captures the internally cached config data. It does not attempt to update it by synchronizing with
   * the external cache or by fetching the latest version from the ConfigCat CDN.
   *
   * Therefore, it is recommended to use snapshots in conjunction with the Auto Polling mode, where the SDK automatically
   * updates the internal cache in the background.
   *
   * For other polling modes, you will need to manually initiate a cache update by invoking `forceRefreshAsync`.
   */
  snapshot(): IConfigCatClientSnapshot;

  /**
   * Sets the default user.
   * @param defaultUser The default User Object to use for evaluating targeting rules and percentage options.
   */
  setDefaultUser(defaultUser: IUser): void;

  /**
   * Clears the default user.
   */
  clearDefaultUser(): void;

  /**
   * Returns `true` when the client is configured not to initiate HTTP requests, otherwise `false`.
   */
  readonly isOffline: boolean;

  /**
   * Configures the client to allow HTTP requests.
   */
  setOnline(): void;

  /**
   * Configures the client to not initiate HTTP requests but work using the cache only.
   */
  setOffline(): void;

  /**
   * Releases all resources used by the client.
   */
  dispose(): void;
}

/** Represents the state of `IConfigCatClient` captured at a specific point in time. */
export interface IConfigCatClientSnapshot {
  /** The state of the internal cache at the time the snapshot was created. */
  readonly cacheState: ClientCacheState;

  /** The internally cached config at the time the snapshot was created. */
  readonly fetchedConfig: IConfig | null;

  /**
   * Returns the available setting keys.
   * (In case the client is configured to use flag override, this will also include the keys provided by the flag override).
   */
  getAllKeys(): ReadonlyArray<string>;

  /**
   * Returns the value of a feature flag or setting identified by `key` synchronously, based on the snapshot.
   * @remarks
   * It is important to provide an argument for the `defaultValue` parameter that matches the type of the feature flag or setting you are evaluating.
   * Please refer to {@link https://configcat.com/docs/sdk-reference/js/#setting-type-mapping | this table} for the corresponding types.
   * @param key Key of the feature flag or setting.
   * @param defaultValue In case of failure, this value will be returned. Only the following types are allowed: `string`, `boolean`, `number`, `null` and `undefined`.
   * @param user The User Object to use for evaluating targeting rules and percentage options.
   * @returns The cached value of the feature flag or setting.
   * @throws {Error} `key` is empty.
   * @throws {TypeError} `defaultValue` is not of an allowed type.
   */
  getValue<T extends SettingValue>(key: string, defaultValue: T, user?: IUser): SettingTypeOf<T>;

  /**
 * Returns the value along with evaluation details of a feature flag or setting identified by `key` synchronously, based on the snapshot.
 * @remarks
 * It is important to provide an argument for the `defaultValue` parameter that matches the type of the feature flag or setting you are evaluating.
 * Please refer to {@link https://configcat.com/docs/sdk-reference/js/#setting-type-mapping | this table} for the corresponding types.
 * @param key Key of the feature flag or setting.
 * @param defaultValue In case of failure, this value will be returned. Only the following types are allowed: `string`, `boolean`, `number`, `null` and `undefined`.
 * @param user The User Object to use for evaluating targeting rules and percentage options.
 * @returns The cached value along with the details of evaluation of the feature flag or setting.
 * @throws {Error} `key` is empty.
 * @throws {TypeError} `defaultValue` is not of an allowed type.
 */
  getValueDetails<T extends SettingValue>(key: string, defaultValue: T, user?: IUser): IEvaluationDetails<SettingTypeOf<T>>;

  /**
   * Returns the key of a setting and its value identified by the specified `variationId`.
   * @param variationId Variation ID (analytics).
   * @returns The key-value pair.
   */
  getKeyAndValue(variationId: string): SettingKeyValue | null;
}

export class ConfigCatClientCache {
  private readonly instances: Record<string, [WeakRef<ConfigCatClient>, object]> = {};

  getOrCreate(options: ConfigCatClientOptions): [ConfigCatClient, boolean] {
    let instance: ConfigCatClient | undefined;

    const cachedInstance = this.instances[options.sdkKey];
    if (cachedInstance) {
      const [weakRef] = cachedInstance;
      instance = weakRef.deref();
      if (instance) {
        return [instance, true];
      }
    }

    const token = {};
    instance = new ConfigCatClient(options, token);
    this.instances[options.sdkKey] = [createWeakRef(instance) as WeakRef<ConfigCatClient>, token];
    return [instance, false];
  }

  remove(sdkKey: string, cacheToken: object): boolean {
    const cachedInstance = this.instances[sdkKey];

    if (cachedInstance) {
      const [weakRef, token] = cachedInstance;
      const instanceIsAvailable = !!weakRef.deref();
      if (!instanceIsAvailable || token === cacheToken) {
        delete this.instances[sdkKey];
        return instanceIsAvailable;
      }
    }

    return false;
  }

  clear(): ConfigCatClient[] {
    const removedInstances: ConfigCatClient[] = [];
    for (const [sdkKey, [weakRef]] of Object.entries(this.instances)) {
      const instance = weakRef.deref();
      if (instance) {
        removedInstances.push(instance);
      }
      delete this.instances[sdkKey];
    }
    return removedInstances;
  }
}

const clientInstanceCache = new ConfigCatClientCache();

type SettingsWithRemoteConfig = [{ [key: string]: Setting } | null, ProjectConfig | null];

export class ConfigCatClient implements IConfigCatClient {
  protected configService?: IConfigService;
  protected evaluator: IRolloutEvaluator;
  private readonly options: OptionsBase;
  private readonly hooks: Hooks;
  private defaultUser?: IUser;
  private readonly suppressFinalize: () => void;

  private static get instanceCache() { return clientInstanceCache; }

  static get<TMode extends PollingMode>(sdkKey: string, pollingMode: TMode,
    options: OptionsForPollingMode<TMode> | undefined | null, configCatKernel: IConfigCatKernel
  ): IConfigCatClient {
    const invalidSdkKeyError = "Invalid 'sdkKey' value";
    if (!sdkKey) {
      throw Error(invalidSdkKeyError);
    }

    const internalOptions =
      pollingMode === PollingMode.AutoPoll ? new AutoPollOptions(sdkKey, configCatKernel, options)
      : pollingMode === PollingMode.ManualPoll ? new ManualPollOptions(sdkKey, configCatKernel, options)
      : pollingMode === PollingMode.LazyLoad ? new LazyLoadOptions(sdkKey, configCatKernel, options)
      : throwError(Error("Invalid 'pollingMode' value"));

    if (internalOptions.flagOverrides?.behaviour !== OverrideBehaviour.LocalOnly && !isValidSdkKey(sdkKey, internalOptions.baseUrlOverriden)) {
      throw Error(invalidSdkKeyError);
    }

    const [instance, instanceAlreadyCreated] = clientInstanceCache.getOrCreate(internalOptions);

    if (instanceAlreadyCreated && options) {
      internalOptions.logger.clientIsAlreadyCreated(sdkKey);
    }

    return instance;
  }

  constructor(
    options: ConfigCatClientOptions,
    private readonly cacheToken?: object) {

    if (!options) {
      throw Error("Invalid 'options' value");
    }

    this.options = options;

    if (options.logger.isEnabled(LogLevel.Debug)) {
      options.logger.debug("Initializing ConfigCatClient. Options: " + JSON.stringify(getSerializableOptions(options)));
    }

    // To avoid possible memory leaks, the components of the client should not hold a strong reference to the hooks object (see also SafeHooksWrapper).
    this.hooks = options.yieldHooks();

    if (options.defaultUser) {
      this.setDefaultUser(options.defaultUser);
    }

    this.evaluator = new RolloutEvaluator(options.logger);

    if (options.flagOverrides?.behaviour !== OverrideBehaviour.LocalOnly) {
      this.configService =
        options instanceof AutoPollOptions ? new AutoPollConfigService(options)
        : options instanceof ManualPollOptions ? new ManualPollConfigService(options)
        : options instanceof LazyLoadOptions ? new LazyLoadConfigService(options)
        : throwError(Error("Invalid 'options' value"));
    } else {
      this.hooks.emit("clientReady", ClientCacheState.HasLocalOverrideFlagDataOnly);
    }

    this.suppressFinalize = registerForFinalization(this, { sdkKey: options.sdkKey, cacheToken, configService: this.configService, logger: options.logger });
  }

  private static finalize(data: IFinalizationData) {
    // Safeguard against situations where user forgets to dispose of the client instance.

    data.logger?.debug("finalize() called.");

    if (data.cacheToken) {
      clientInstanceCache.remove(data.sdkKey, data.cacheToken);
    }

    ConfigCatClient.close(data.configService, data.logger);
  }

  private static close(configService?: IConfigService, logger?: LoggerWrapper, hooks?: Hooks) {
    logger?.debug("close() called.");

    hooks?.tryDisconnect();
    configService?.dispose();
  }

  dispose(): void {
    const options = this.options;
    options.logger.debug("dispose() called.");

    if (this.cacheToken) {
      clientInstanceCache.remove(options.sdkKey, this.cacheToken);
    }

    ConfigCatClient.close(this.configService, options.logger, this.hooks);
    this.suppressFinalize();
  }

  static disposeAll(): void {
    const removedInstances = clientInstanceCache.clear();

    let errors: any[] | undefined;
    for (const instance of removedInstances) {
      try {
        ConfigCatClient.close(instance.configService, instance.options.logger, instance.hooks);
        instance.suppressFinalize();
      } catch (err) {
        errors ??= [];
        errors.push(err);
      }
    }

    if (errors) {
      throw typeof AggregateError !== "undefined" ? AggregateError(errors) : errors.pop();
    }
  }

  async getValueAsync<T extends SettingValue>(key: string, defaultValue: T, user?: IUser): Promise<SettingTypeOf<T>> {
    this.options.logger.debug("getValueAsync() called.");

    validateKey(key);
    ensureAllowedDefaultValue(defaultValue);

    let value: SettingTypeOf<T>, evaluationDetails: IEvaluationDetails<SettingTypeOf<T>>;
    let remoteConfig: ProjectConfig | null = null;
    user ??= this.defaultUser;
    try {
      let settings: { [key: string]: Setting } | null;
      [settings, remoteConfig] = await this.getSettingsAsync();
      evaluationDetails = evaluate(this.evaluator, settings, key, defaultValue, user, remoteConfig, this.options.logger);
      value = evaluationDetails.value;
    } catch (err) {
      this.options.logger.settingEvaluationErrorSingle("getValueAsync", key, "defaultValue", defaultValue, err);
      evaluationDetails = evaluationDetailsFromDefaultValue(key, defaultValue, getTimestampAsDate(remoteConfig), user,
        errorToString(err), err, getEvaluationErrorCode(err));
      value = defaultValue as SettingTypeOf<T>;
    }

    this.hooks.emit("flagEvaluated", evaluationDetails);
    return value;
  }

  async getValueDetailsAsync<T extends SettingValue>(key: string, defaultValue: T, user?: IUser): Promise<IEvaluationDetails<SettingTypeOf<T>>> {
    this.options.logger.debug("getValueDetailsAsync() called.");

    validateKey(key);
    ensureAllowedDefaultValue(defaultValue);

    let evaluationDetails: IEvaluationDetails<SettingTypeOf<T>>;
    let remoteConfig: ProjectConfig | null = null;
    user ??= this.defaultUser;
    try {
      let settings: { [key: string]: Setting } | null;
      [settings, remoteConfig] = await this.getSettingsAsync();
      evaluationDetails = evaluate(this.evaluator, settings, key, defaultValue, user, remoteConfig, this.options.logger);
    } catch (err) {
      this.options.logger.settingEvaluationErrorSingle("getValueDetailsAsync", key, "defaultValue", defaultValue, err);
      evaluationDetails = evaluationDetailsFromDefaultValue(key, defaultValue, getTimestampAsDate(remoteConfig), user,
        errorToString(err), err, getEvaluationErrorCode(err));
    }

    this.hooks.emit("flagEvaluated", evaluationDetails);
    return evaluationDetails;
  }

  async getAllKeysAsync(): Promise<string[]> {
    this.options.logger.debug("getAllKeysAsync() called.");

    const defaultReturnValue = "empty array";
    try {
      const [settings] = await this.getSettingsAsync();
      if (!checkSettingsAvailable(settings, this.options.logger, defaultReturnValue)) {
        return [];
      }
      return Object.keys(settings);
    } catch (err) {
      this.options.logger.settingEvaluationError("getAllKeysAsync", defaultReturnValue, err);
      return [];
    }
  }

  async getAllValuesAsync(user?: IUser): Promise<SettingKeyValue[]> {
    this.options.logger.debug("getAllValuesAsync() called.");

    const defaultReturnValue = "empty array";
    let result: SettingKeyValue[], evaluationDetailsArray: IEvaluationDetails[], evaluationErrors: any[] | undefined;
    user ??= this.defaultUser;
    try {
      const [settings, remoteConfig] = await this.getSettingsAsync();
      [evaluationDetailsArray, evaluationErrors] = evaluateAll(this.evaluator, settings, user, remoteConfig, this.options.logger, defaultReturnValue);
      result = evaluationDetailsArray.map(details => ({ settingKey: details.key, settingValue: details.value }));
    } catch (err) {
      this.options.logger.settingEvaluationError("getAllValuesAsync", defaultReturnValue, err);
      return [];
    }

    if (evaluationErrors?.length) {
      this.options.logger.settingEvaluationError("getAllValuesAsync", "evaluation result",
        typeof AggregateError !== "undefined" ? AggregateError(evaluationErrors) : evaluationErrors.pop());
    }

    for (const evaluationDetail of evaluationDetailsArray) {
      this.hooks.emit("flagEvaluated", evaluationDetail);
    }

    return result;
  }

  async getAllValueDetailsAsync(user?: IUser): Promise<IEvaluationDetails[]> {
    this.options.logger.debug("getAllValueDetailsAsync() called.");

    const defaultReturnValue = "empty array";
    let evaluationDetailsArray: IEvaluationDetails[], evaluationErrors: any[] | undefined;
    user ??= this.defaultUser;
    try {
      const [settings, remoteConfig] = await this.getSettingsAsync();
      [evaluationDetailsArray, evaluationErrors] = evaluateAll(this.evaluator, settings, user, remoteConfig, this.options.logger, defaultReturnValue);
    } catch (err) {
      this.options.logger.settingEvaluationError("getAllValueDetailsAsync", defaultReturnValue, err);
      return [];
    }

    if (evaluationErrors?.length) {
      this.options.logger.settingEvaluationError("getAllValueDetailsAsync", "evaluation result",
        typeof AggregateError !== "undefined" ? AggregateError(evaluationErrors) : evaluationErrors.pop());
    }

    for (const evaluationDetail of evaluationDetailsArray) {
      this.hooks.emit("flagEvaluated", evaluationDetail);
    }

    return evaluationDetailsArray;
  }

  async getKeyAndValueAsync(variationId: string): Promise<SettingKeyValue | null> {
    this.options.logger.debug("getKeyAndValueAsync() called.");

    const defaultReturnValue = "null";
    try {
      const [settings] = await this.getSettingsAsync();
      return findKeyAndValue(settings, variationId, this.options.logger, defaultReturnValue);
    } catch (err) {
      this.options.logger.settingEvaluationError("getKeyAndValueAsync", defaultReturnValue, err);
      return null;
    }
  }

  async forceRefreshAsync(): Promise<RefreshResult> {
    this.options.logger.debug("forceRefreshAsync() called.");

    if (this.configService) {
      try {
        const [result] = await this.configService.refreshConfigAsync();
        return result;
      } catch (err) {
        this.options.logger.forceRefreshError("forceRefreshAsync", err);
        return RefreshResult.failure(RefreshErrorCode.UnexpectedError, errorToString(err), err);
      }
    } else {
      return RefreshResult.failure(RefreshErrorCode.LocalOnlyClient,
        "Client is configured to use the LocalOnly override behavior, which prevents synchronization with external cache and making HTTP requests.");
    }
  }

  setDefaultUser(defaultUser: IUser): void {
    this.defaultUser = defaultUser;
  }

  clearDefaultUser(): void {
    this.defaultUser = void 0;
  }

  get isOffline(): boolean {
    return this.configService?.isOffline ?? true;
  }

  setOnline(): void {
    if (this.configService) {
      this.configService.setOnline();
    } else {
      this.options.logger.configServiceMethodHasNoEffectDueToOverrideBehavior(nameOfOverrideBehaviour(OverrideBehaviour.LocalOnly), "setOnline");
    }
  }

  setOffline(): void {
    this.configService?.setOffline();
  }

  waitForReady(): Promise<ClientCacheState> {
    const configService = this.configService;
    return configService ? configService.readyPromise : Promise.resolve(ClientCacheState.HasLocalOverrideFlagDataOnly);
  }

  snapshot(): IConfigCatClientSnapshot {
    const getRemoteConfig: () => SettingsWithRemoteConfig = () => {
      const config = this.options.cache.getInMemory();
      const settings = !config.isEmpty ? config.config!.settings : null;
      return [settings, config];
    };

    let remoteSettings: { [key: string]: Setting } | null;
    let remoteConfig: ProjectConfig | null;
    const { flagOverrides } = this.options;
    if (flagOverrides) {
      const localSettings = flagOverrides.dataSource.getOverridesSync();
      switch (flagOverrides.behaviour) {
        case OverrideBehaviour.LocalOnly:
          return new Snapshot(localSettings, null, this);
        case OverrideBehaviour.LocalOverRemote:
          [remoteSettings, remoteConfig] = getRemoteConfig();
          return new Snapshot({ ...(remoteSettings ?? {}), ...localSettings }, remoteConfig, this);
        case OverrideBehaviour.RemoteOverLocal:
          [remoteSettings, remoteConfig] = getRemoteConfig();
          return new Snapshot({ ...localSettings, ...(remoteSettings ?? {}) }, remoteConfig, this);
      }
    }

    [remoteSettings, remoteConfig] = getRemoteConfig();
    return new Snapshot(remoteSettings, remoteConfig, this);
  }

  private async getSettingsAsync(): Promise<SettingsWithRemoteConfig> {
    this.options.logger.debug("getSettingsAsync() called.");

    const getRemoteConfigAsync: () => Promise<SettingsWithRemoteConfig> = async () => {
      const config = await this.configService!.getConfigAsync();
      const settings = !config.isEmpty ? config.config!.settings : null;
      return [settings, config];
    };

    const { flagOverrides } = this.options;
    if (flagOverrides) {
      let remoteSettings: { [key: string]: Setting } | null;
      let remoteConfig: ProjectConfig | null;
      const localSettings = await flagOverrides.dataSource.getOverrides();
      switch (flagOverrides.behaviour) {
        case OverrideBehaviour.LocalOnly:
          return [localSettings, null];
        case OverrideBehaviour.LocalOverRemote:
          [remoteSettings, remoteConfig] = await getRemoteConfigAsync();
          return [{ ...(remoteSettings ?? {}), ...localSettings }, remoteConfig];
        case OverrideBehaviour.RemoteOverLocal:
          [remoteSettings, remoteConfig] = await getRemoteConfigAsync();
          return [{ ...localSettings, ...(remoteSettings ?? {}) }, remoteConfig];
      }
    }

    return await getRemoteConfigAsync();
  }

  /** @inheritdoc */
  addListener: <TEventName extends keyof HookEvents>(eventName: TEventName, listener: (...args: HookEvents[TEventName]) => void) => this =
    // eslint-disable-next-line @typescript-eslint/unbound-method
    this.on;

  /** @inheritdoc */
  on<TEventName extends keyof HookEvents>(eventName: TEventName, listener: (...args: HookEvents[TEventName]) => void): this {
    this.hooks.on(eventName, listener as (...args: any[]) => void);
    return this;
  }

  /** @inheritdoc */
  once<TEventName extends keyof HookEvents>(eventName: TEventName, listener: (...args: HookEvents[TEventName]) => void): this {
    this.hooks.once(eventName, listener as (...args: any[]) => void);
    return this;
  }

  /** @inheritdoc */
  removeListener<TEventName extends keyof HookEvents>(eventName: TEventName, listener: (...args: HookEvents[TEventName]) => void): this {
    this.hooks.removeListener(eventName, listener as (...args: any[]) => void);
    return this;
  }

  /** @inheritdoc */
  off: <TEventName extends keyof HookEvents>(eventName: TEventName, listener: (...args: HookEvents[TEventName]) => void) => this =
    // eslint-disable-next-line @typescript-eslint/unbound-method
    this.removeListener;

  /** @inheritdoc */
  removeAllListeners(eventName?: keyof HookEvents): this {
    this.hooks.removeAllListeners(eventName);
    return this;
  }

  /** @inheritdoc */
  listeners(eventName: keyof HookEvents): Function[] {
    return this.hooks.listeners(eventName);
  }

  /** @inheritdoc */
  listenerCount(eventName: keyof HookEvents): number {
    return this.hooks.listenerCount(eventName);
  }

  /** @inheritdoc */
  eventNames(): (keyof HookEvents)[] {
    return this.hooks.eventNames();
  }
}

class Snapshot implements IConfigCatClientSnapshot {
  private readonly defaultUser: IUser | undefined;
  private readonly evaluator: IRolloutEvaluator;
  private readonly options: ConfigCatClientOptions;

  constructor(
    private readonly mergedSettings: { [key: string]: Setting } | null,
    private readonly remoteConfig: ProjectConfig | null,
    client: ConfigCatClient) {

    this.defaultUser = client["defaultUser"];
    this.evaluator = client["evaluator"];
    this.options = client["options"];
    this.cacheState = remoteConfig
      ? client["configService"]!.getCacheState(remoteConfig)
      : ClientCacheState.HasLocalOverrideFlagDataOnly;
  }

  readonly cacheState: ClientCacheState;

  get fetchedConfig() {
    const config = this.remoteConfig;
    return config && !config.isEmpty ? config.config! : null;
  }

  getAllKeys() { return this.mergedSettings ? Object.keys(this.mergedSettings) : []; }

  getValue<T extends SettingValue>(key: string, defaultValue: T, user?: IUser): SettingTypeOf<T> {
    this.options.logger.debug("Snapshot.getValue() called.");

    validateKey(key);
    ensureAllowedDefaultValue(defaultValue);

    let value: SettingTypeOf<T>, evaluationDetails: IEvaluationDetails<SettingTypeOf<T>>;
    user ??= this.defaultUser;
    try {
      evaluationDetails = evaluate(this.evaluator, this.mergedSettings, key, defaultValue, user, this.remoteConfig, this.options.logger);
      value = evaluationDetails.value;
    } catch (err) {
      this.options.logger.settingEvaluationErrorSingle("Snapshot.getValue", key, "defaultValue", defaultValue, err);
      evaluationDetails = evaluationDetailsFromDefaultValue(key, defaultValue, getTimestampAsDate(this.remoteConfig), user,
        errorToString(err), err, getEvaluationErrorCode(err));
      value = defaultValue as SettingTypeOf<T>;
    }

    this.options.hooks.emit("flagEvaluated", evaluationDetails);
    return value;
  }

  getValueDetails<T extends SettingValue>(key: string, defaultValue: T, user?: IUser): IEvaluationDetails<SettingTypeOf<T>> {
    this.options.logger.debug("Snapshot.getValueDetails() called.");

    validateKey(key);
    ensureAllowedDefaultValue(defaultValue);

    let evaluationDetails: IEvaluationDetails<SettingTypeOf<T>>;
    user ??= this.defaultUser;
    try {
      evaluationDetails = evaluate(this.evaluator, this.mergedSettings, key, defaultValue, user, this.remoteConfig, this.options.logger);
    } catch (err) {
      this.options.logger.settingEvaluationErrorSingle("Snapshot.getValueDetails", key, "defaultValue", defaultValue, err);
      evaluationDetails = evaluationDetailsFromDefaultValue(key, defaultValue, getTimestampAsDate(this.remoteConfig), user,
        errorToString(err), err, getEvaluationErrorCode(err));
    }

    this.options.hooks.emit("flagEvaluated", evaluationDetails);
    return evaluationDetails;
  }

  getKeyAndValue(variationId: string): SettingKeyValue | null {
    this.options.logger.debug("Snapshot.getKeyAndValue() called.");

    const defaultReturnValue = "null";
    try {
      return findKeyAndValue(this.mergedSettings, variationId, this.options.logger, defaultReturnValue);
    } catch (err) {
      this.options.logger.settingEvaluationError("Snapshot.getKeyAndValue", defaultReturnValue, err);
      return null;
    }
  }
}

function isValidSdkKey(sdkKey: string, customBaseUrl: boolean) {
  // NOTE: String.prototype.startsWith was introduced after ES5. We'd rather work around it instead of polyfilling it.
  if (customBaseUrl && sdkKey.length > PROXY_SDKKEY_PREFIX.length && sdkKey.lastIndexOf(PROXY_SDKKEY_PREFIX, 0) === 0) {
    return true;
  }

  const components = sdkKey.split("/");
  const keyLength = 22;
  switch (components.length) {
    case 2: return components[0].length === keyLength && components[1].length === keyLength;
    case 3: return components[0] === "configcat-sdk-1" && components[1].length === keyLength && components[2].length === keyLength;
    default: return false;
  }
}

function validateKey(key: string): void {
  if (!key) {
    throw Error("Invalid 'key' value");
  }
}

function ensureAllowedDefaultValue(value: SettingValue): void {
  if (value != null && !isAllowedValue(value)) {
    throw TypeError("The default value must be boolean, number, string, null or undefined.");
  }
}

export function getSerializableOptions(options: ConfigCatClientOptions): Record<string, unknown> {
  // NOTE: We need to prevent internals from leaking into logs and avoid errors because of circular references in
  // user-provided objects. See also: https://github.com/configcat/common-js/pull/111

  return shallowClone(options, (key, value) => {
    if (key === "defaultUser") {
      return getUserAttributes(value as IUser);
    }
    if (key === "flagOverrides") {
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      return shallowClone(value as FlagOverrides, (_, value) => isObject(value) ? value.toString() : value);
    }
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    return isObject(value) ? value.toString() : value;
  });
}

/* GC finalization support */

// Defines the interface of the held value which is passed to ConfigCatClient.finalize by FinalizationRegistry.
// Since a strong reference is stored to the held value (see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/FinalizationRegistry),
// objects implementing this interface MUST NOT contain a strong reference (either directly or transitively) to the ConfigCatClient object because
// that would prevent the client object from being GC'd, which would defeat the whole purpose of the finalization logic.
interface IFinalizationData { sdkKey: string; cacheToken?: object; configService?: IConfigService; logger?: LoggerWrapper }

let registerForFinalization = function(client: ConfigCatClient, data: IFinalizationData): () => void {
  // Use FinalizationRegistry (finalization callbacks) if the runtime provides that feature.
  if (typeof FinalizationRegistry !== "undefined") {
    const finalizationRegistry = new FinalizationRegistry<IFinalizationData>(data => ConfigCatClient["finalize"](data));

    registerForFinalization = (client, data) => {
      const unregisterToken = {};
      finalizationRegistry.register(client, data, unregisterToken);
      return () => finalizationRegistry.unregister(unregisterToken);
    };
  } else {
    // If FinalizationRegistry is unavailable, we can't really track finalization.
    // (Although we could implement something which resembles finalization callbacks using a weak map + a timer,
    // since ConfigCatClientCache also needs to keep (weak) references to the created client instances,
    // this hypothetical approach wouldn't work without a complete WeakRef polyfill, which is kind of impossible.
    registerForFinalization = () => () => { /* Intentional no-op */ };
  }

  return registerForFinalization(client, data);
};

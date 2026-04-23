import type { LazyLoadOptions } from "./ConfigCatClientOptions";
import { logMethodDebug } from "./ConfigCatLogger";
import type { IConfigService, RefreshResult } from "./ConfigServiceBase";
import { ClientCacheState, ConfigServiceBase } from "./ConfigServiceBase";
import type { ProjectConfig } from "./ProjectConfig";

export class LazyLoadConfigService extends ConfigServiceBase<LazyLoadOptions> implements IConfigService {

  private readonly cacheTimeToLiveMs: number;
  readonly readyPromise: Promise<ClientCacheState>;

  constructor(options: LazyLoadOptions) {

    super(options);

    this.cacheTimeToLiveMs = options.cacheTimeToLiveSeconds * 1000;

    this.prepareClientForEvents();

    const initialCacheSyncUp = this.syncUpWithCache();
    this.readyPromise = this.getReadyPromise(initialCacheSyncUp);
  }

  async getConfigAsync(): Promise<ProjectConfig> {
    const methodName = "LazyLoadConfigService.getConfigAsync";
    const debugLogger = this.options.logger.ifDebug;
    logMethodDebug(debugLogger, methodName);

    let cachedConfig = await this.syncUpWithCache();

    if (cachedConfig.isExpired(this.cacheTimeToLiveMs)) {
      if (!this.isOffline) {
        logMethodDebug(debugLogger, methodName, "cache is empty or expired, calling refreshConfigCoreAsync().");
        [, cachedConfig] = await this.refreshConfigCoreAsync(cachedConfig, false);
      } else {
        logMethodDebug(debugLogger, methodName, "cache is empty or expired.");
      }
      return cachedConfig;
    }

    logMethodDebug(debugLogger, methodName, "cache is valid, returning from cache.");
    return cachedConfig;
  }

  override refreshConfigAsync(): Promise<[RefreshResult, ProjectConfig]> {
    logMethodDebug(this.options.logger, "LazyLoadConfigService.refreshConfigAsync");
    return super.refreshConfigAsync();
  }

  getCacheState(cachedConfig: ProjectConfig): ClientCacheState {
    if (cachedConfig.isEmpty) {
      return ClientCacheState.NoFlagData;
    }

    if (cachedConfig.isExpired(this.cacheTimeToLiveMs)) {
      return ClientCacheState.HasCachedFlagDataOnly;
    }

    return ClientCacheState.HasUpToDateFlagData;
  }
}

import type { LazyLoadOptions } from "./ConfigCatClientOptions";
import type { LoggerWrapper } from "./ConfigCatLogger";
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
    this.options.logger.debug("LazyLoadConfigService.getConfigAsync() called.");

    function logExpired(logger: LoggerWrapper, appendix = "") {
      logger.debug(`LazyLoadConfigService.getConfigAsync(): cache is empty or expired${appendix}.`);
    }

    let cachedConfig = await this.syncUpWithCache();

    if (cachedConfig.isExpired(this.cacheTimeToLiveMs)) {
      if (!this.isOffline) {
        logExpired(this.options.logger, ", calling refreshConfigCoreAsync()");
        [, cachedConfig] = await this.refreshConfigCoreAsync(cachedConfig, false);
      } else {
        logExpired(this.options.logger);
      }
      return cachedConfig;
    }

    this.options.logger.debug("LazyLoadConfigService.getConfigAsync(): cache is valid, returning from cache.");
    return cachedConfig;
  }

  override refreshConfigAsync(): Promise<[RefreshResult, ProjectConfig]> {
    this.options.logger.debug("LazyLoadConfigService.refreshConfigAsync() called.");
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

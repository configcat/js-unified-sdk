import type { ManualPollOptions } from "./ConfigCatClientOptions";
import type { IConfigService, RefreshResult } from "./ConfigServiceBase";
import { ClientCacheState, ConfigServiceBase } from "./ConfigServiceBase";
import type { ProjectConfig } from "./ProjectConfig";

export class ManualPollConfigService extends ConfigServiceBase<ManualPollOptions> implements IConfigService {

  readonly readyPromise: Promise<ClientCacheState>;

  constructor(options: ManualPollOptions) {

    super(options);

    const initialCacheSyncUp = this.syncUpWithCache();
    this.readyPromise = this.getReadyPromise(initialCacheSyncUp);
  }

  getCacheState(cachedConfig: ProjectConfig): ClientCacheState {
    if (cachedConfig.isEmpty) {
      return ClientCacheState.NoFlagData;
    }

    return ClientCacheState.HasCachedFlagDataOnly;
  }

  async getConfig(): Promise<ProjectConfig> {
    this.options.logger.debug("ManualPollService.getConfig() called.");
    return await this.syncUpWithCache();
  }

  refreshConfigAsync(): Promise<[RefreshResult, ProjectConfig]> {
    this.options.logger.debug("ManualPollService.refreshConfigAsync() called.");
    return super.refreshConfigAsync();
  }
}

import type { ManualPollOptions } from "./ConfigCatClientOptions";
import { logMethodDebug } from "./ConfigCatLogger";
import type { IConfigService, RefreshResult } from "./ConfigServiceBase";
import { ClientCacheState, ConfigServiceBase } from "./ConfigServiceBase";
import type { ProjectConfig } from "./ProjectConfig";

export class ManualPollConfigService extends ConfigServiceBase<ManualPollOptions> implements IConfigService {

  readonly readyPromise: Promise<ClientCacheState>;

  constructor(options: ManualPollOptions) {

    super(options);

    this.prepareClientForEvents();

    const initialCacheSyncUp = this.syncUpWithCache();
    this.readyPromise = this.getReadyPromise(initialCacheSyncUp);
  }

  getCacheState(cachedConfig: ProjectConfig): ClientCacheState {
    if (cachedConfig.isEmpty) {
      return ClientCacheState.NoFlagData;
    }

    return ClientCacheState.HasCachedFlagDataOnly;
  }

  async getConfigAsync(): Promise<ProjectConfig> {
    logMethodDebug(this.options.logger, "ManualPollService.getConfigAsync");
    return await this.syncUpWithCache();
  }

  override refreshConfigAsync(): Promise<[RefreshResult, ProjectConfig]> {
    logMethodDebug(this.options.logger, "ManualPollService.refreshConfigAsync");
    return super.refreshConfigAsync();
  }
}

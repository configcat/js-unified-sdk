import type { IAutoPollOptions, IConfigCatClient, ILazyLoadingOptions, IManualPollOptions, IOptions, PollingMode } from "#lib";
import { ConfigCatClient } from "#lib/ConfigCatClient";
import { AutoPollOptions, LazyLoadOptions, ManualPollOptions, OptionsForPollingMode } from "#lib/ConfigCatClientOptions";
import type { IConfigCatKernel, IConfigFetcher, OptionsBase } from "#lib/index.pubternals";

export type AugmentedOptions<TOptions extends OptionsBase> = TOptions & {
  getRealUrl(): string;
}

export abstract class PlatformAbstractions<
  TAutoPollOptions extends IAutoPollOptions = IAutoPollOptions,
  TManualPollOptions extends IManualPollOptions = IManualPollOptions,
  TLazyLoadingOptions extends ILazyLoadingOptions = ILazyLoadingOptions,
> {
  gc?(): Promise<void>;

  abstract pathJoin(...segments: string[]): string;

  abstract readFileUtf8(path: string): string | Promise<string>;

  abstract createConfigFetcher(): IConfigFetcher;

  abstract createKernel(setupKernel?: (kernel: IConfigCatKernel) => IConfigCatKernel): IConfigCatKernel;

  createAutoPollOptions(sdkKey: string, options?: TAutoPollOptions, kernel?: IConfigCatKernel): AugmentedOptions<AutoPollOptions> {
    kernel ??= this.createKernel();
    return this.augmentOptions(
      new AutoPollOptions(sdkKey, kernel.sdkType, kernel.sdkVersion, this.adjustOptions(options), kernel.defaultCacheFactory, kernel.eventEmitterFactory)
    );
  }

  createManualPollOptions(sdkKey: string, options?: TManualPollOptions, kernel?: IConfigCatKernel): AugmentedOptions<ManualPollOptions> {
    kernel ??= this.createKernel();
    return this.augmentOptions(
      new ManualPollOptions(sdkKey, kernel.sdkType, kernel.sdkVersion, this.adjustOptions(options), kernel.defaultCacheFactory, kernel.eventEmitterFactory)
    );
  }

  createLazyLoadOptions(sdkKey: string, options?: TLazyLoadingOptions, kernel?: IConfigCatKernel): AugmentedOptions<LazyLoadOptions> {
    kernel ??= this.createKernel();
    return this.augmentOptions(
      new LazyLoadOptions(sdkKey, kernel.sdkType, kernel.sdkVersion, this.adjustOptions(options), kernel.defaultCacheFactory, kernel.eventEmitterFactory)
    );
  }

  createClientWithAutoPoll = (sdkKey: string, options?: TAutoPollOptions, setupKernel?: (kernel: IConfigCatKernel) => IConfigCatKernel): IConfigCatClient => {
    const configCatKernel = this.createKernel(setupKernel);
    return new ConfigCatClient(this.createAutoPollOptions(sdkKey, options, configCatKernel), configCatKernel);
  };

  createClientWithManualPoll = (sdkKey: string, options?: TManualPollOptions, setupKernel?: (kernel: IConfigCatKernel) => IConfigCatKernel): IConfigCatClient => {
    const configCatKernel = this.createKernel(setupKernel);
    return new ConfigCatClient(this.createManualPollOptions(sdkKey, options, configCatKernel), configCatKernel);
  };

  createClientWithLazyLoad = (sdkKey: string, options?: TLazyLoadingOptions, setupKernel?: (kernel: IConfigCatKernel) => IConfigCatKernel): IConfigCatClient => {
    const configCatKernel = this.createKernel(setupKernel);
    return new ConfigCatClient(this.createLazyLoadOptions(sdkKey, options, configCatKernel), configCatKernel);
  };

  getClient<TMode extends PollingMode | undefined>(sdkKey: string, pollingMode?: TMode, options?: OptionsForPollingMode<TMode>): IConfigCatClient {
    return this.getClientImpl(sdkKey, pollingMode, this.adjustOptions(options));
  }

  protected abstract getClientImpl<TMode extends PollingMode | undefined>(sdkKey: string, pollingMode?: TMode, options?: OptionsForPollingMode<TMode>): IConfigCatClient;

  protected adjustOptions<TOptions extends IOptions>(options?: TOptions): TOptions | undefined { return options; }

  protected augmentOptions<TOptions extends OptionsBase>(options: TOptions): AugmentedOptions<TOptions> {
    const augmentedOptions = options as AugmentedOptions<TOptions>;
    augmentedOptions.getRealUrl = function() { return this.getUrl(); };
    return augmentedOptions;
  }
}

let currentPlatform: PlatformAbstractions | undefined;

export function initPlatform(platform: PlatformAbstractions): void {
  if (currentPlatform != null) {
    throw new Error("Platform abstractions have already been initialized.");
  }
  currentPlatform = platform;
}

export function platform(): PlatformAbstractions {
  if (currentPlatform == null) {
    throw new Error("Platform abstractions have not been initialized yet.");
  }
  return currentPlatform;
}

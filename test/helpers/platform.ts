import type { IAutoPollOptions, IConfigCatClient, IConfigCatConfigFetcher as IConfigFetcher, ILazyLoadingOptions, IManualPollOptions, IOptions, PollingMode } from "#lib";
import { ConfigCatClient } from "#lib/ConfigCatClient";
import { AutoPollOptions, LazyLoadOptions, ManualPollOptions } from "#lib/ConfigCatClientOptions";
import type { IConfigCatKernel, OptionsBase } from "#lib/index.pubternals";

type OptionsForPollingMode<
  TMode extends PollingMode | unknown,
  TAutoPollOptions extends IAutoPollOptions,
  TManualPollOptions extends IManualPollOptions,
  TLazyLoadingOptions extends ILazyLoadingOptions
> =
  TMode extends PollingMode.AutoPoll ? TAutoPollOptions :
  TMode extends PollingMode.ManualPoll ? TManualPollOptions :
  TMode extends PollingMode.LazyLoad ? TLazyLoadingOptions :
  TMode extends undefined ? TAutoPollOptions :
  never;

export abstract class PlatformAbstractions<
  TAutoPollOptions extends IAutoPollOptions = IAutoPollOptions,
  TManualPollOptions extends IManualPollOptions = IManualPollOptions,
  TLazyLoadingOptions extends ILazyLoadingOptions = ILazyLoadingOptions
> {
  gc?(): Promise<void>;

  abstract pathJoin(...segments: string[]): string;

  abstract readFileUtf8(path: string): string | Promise<string>;

  abstract createConfigFetcher(options: OptionsBase, platformOptions?: TAutoPollOptions | TManualPollOptions | TLazyLoadingOptions): IConfigFetcher;

  abstract createKernel(setupKernel?: (kernel: IConfigCatKernel) => IConfigCatKernel, options?: TAutoPollOptions | TManualPollOptions | TLazyLoadingOptions): IConfigCatKernel;

  createAutoPollOptions(sdkKey: string, options?: TAutoPollOptions, kernel?: IConfigCatKernel): AutoPollOptions {
    kernel ??= this.createKernel(void 0, options);
    return new AutoPollOptions(sdkKey, kernel, options);
  }

  createManualPollOptions(sdkKey: string, options?: TManualPollOptions, kernel?: IConfigCatKernel): ManualPollOptions {
    kernel ??= this.createKernel(void 0, options);
    return new ManualPollOptions(sdkKey, kernel, options);
  }

  createLazyLoadOptions(sdkKey: string, options?: TLazyLoadingOptions, kernel?: IConfigCatKernel): LazyLoadOptions {
    kernel ??= this.createKernel(void 0, options);
    return new LazyLoadOptions(sdkKey, kernel, options);
  }

  createClientWithAutoPoll = (sdkKey: string, options?: TAutoPollOptions, setupKernel?: (kernel: IConfigCatKernel) => IConfigCatKernel): IConfigCatClient => {
    const configCatKernel = this.createKernel(setupKernel, options);
    return new ConfigCatClient(this.createAutoPollOptions(sdkKey, options, configCatKernel));
  };

  createClientWithManualPoll = (sdkKey: string, options?: TManualPollOptions, setupKernel?: (kernel: IConfigCatKernel) => IConfigCatKernel): IConfigCatClient => {
    const configCatKernel = this.createKernel(setupKernel, options);
    return new ConfigCatClient(this.createManualPollOptions(sdkKey, options, configCatKernel));
  };

  createClientWithLazyLoad = (sdkKey: string, options?: TLazyLoadingOptions, setupKernel?: (kernel: IConfigCatKernel) => IConfigCatKernel): IConfigCatClient => {
    const configCatKernel = this.createKernel(setupKernel, options);
    return new ConfigCatClient(this.createLazyLoadOptions(sdkKey, options, configCatKernel));
  };

  getClient<TMode extends PollingMode | undefined>(sdkKey: string, pollingMode?: TMode,
    options?: OptionsForPollingMode<TMode, TAutoPollOptions, TManualPollOptions, TLazyLoadingOptions>
  ): IConfigCatClient {
    return this.getClientImpl(sdkKey, pollingMode, options);
  }

  protected abstract getClientImpl<TMode extends PollingMode | undefined>(sdkKey: string, pollingMode?: TMode,
    options?: OptionsForPollingMode<TMode, TAutoPollOptions, TManualPollOptions, TLazyLoadingOptions>
  ): IConfigCatClient;
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

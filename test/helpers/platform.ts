import type { IAutoPollOptions, IConfigCatClient, ILazyLoadingOptions, IManualPollOptions, PollingMode } from "#lib";
import { OptionsForPollingMode } from "#lib/ConfigCatClientOptions";
import type { IConfigCatKernel, IConfigFetcher } from "#lib/index.pubternals";

interface IPlatformAbstractions {
  pathJoin(...segments: string[]): string;
  readFileUtf8(path: string): string | Promise<string>;
  createConfigFetcher(): IConfigFetcher;
  createKernel(setupKernel?: (kernel: IConfigCatKernel) => IConfigCatKernel): IConfigCatKernel;
  createClientWithAutoPoll(sdkKey: string, options?: IAutoPollOptions, setupKernel?: (kernel: IConfigCatKernel) => IConfigCatKernel): IConfigCatClient;
  createClientWithManualPoll(sdkKey: string, options?: IManualPollOptions, setupKernel?: (kernel: IConfigCatKernel) => IConfigCatKernel): IConfigCatClient;
  createClientWithLazyLoad(sdkKey: string, options?: ILazyLoadingOptions, setupKernel?: (kernel: IConfigCatKernel) => IConfigCatKernel): IConfigCatClient;
  getClient<TMode extends PollingMode | undefined>(sdkKey: string, pollingMode?: TMode, options?: OptionsForPollingMode<TMode>): IConfigCatClient;
}

let platformAbstractions: IPlatformAbstractions | undefined;

export function initPlatform(pa: IPlatformAbstractions): void {
  if (platformAbstractions != null) {
    throw new Error("Platform abstractions have already been initialized.");
  }
  platformAbstractions = pa;
}

export function platform(): IPlatformAbstractions {
  if (platformAbstractions == null) {
    throw new Error("Platform abstractions have not been initialized yet.");
  }
  return platformAbstractions;
}

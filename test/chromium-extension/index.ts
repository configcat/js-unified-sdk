import { isTestSpec } from "..";
import { initPlatform } from "../helpers/platform";
import { getClient } from "#lib/chromium-extension";
import type { IConfigCatClient, IJSAutoPollOptions, IJSLazyLoadingOptions, IJSManualPollOptions } from "#lib/chromium-extension";
import { ChromeLocalStorageCache } from "#lib/chromium-extension/ChromeLocalStorageCache";
import { ConfigCatClient } from "#lib/ConfigCatClient";
import { AutoPollOptions, LazyLoadOptions, ManualPollOptions } from "#lib/ConfigCatClientOptions";
import { DefaultEventEmitter } from "#lib/DefaultEventEmitter";
import type { IConfigCatKernel, IConfigFetcher } from "#lib/index.pubternals";
import { FetchApiConfigFetcher } from "#lib/shared/FetchApiConfigFetcher";

const sdkVersion = "0.0.0-test";
const sdkType = "ConfigCat-JS-Chromium";

export const createConfigFetcher = (): IConfigFetcher => new FetchApiConfigFetcher();

export const createKernel = (setupKernel?: (kernel: IConfigCatKernel) => IConfigCatKernel): IConfigCatKernel => {
  const kernel: IConfigCatKernel = { configFetcher: createConfigFetcher(), sdkType, sdkVersion, eventEmitterFactory: () => new DefaultEventEmitter() };
  return (setupKernel ?? ChromeLocalStorageCache.setup)(kernel);
};

export const createClientWithAutoPoll = (sdkKey: string, options?: IJSAutoPollOptions, setupKernel?: (kernel: IConfigCatKernel) => IConfigCatKernel): IConfigCatClient => {
  const configCatKernel = createKernel(setupKernel);
  return new ConfigCatClient(new AutoPollOptions(sdkKey, configCatKernel.sdkType, configCatKernel.sdkVersion, options, configCatKernel.defaultCacheFactory, configCatKernel.eventEmitterFactory), configCatKernel);
};

export const createClientWithManualPoll = (sdkKey: string, options?: IJSLazyLoadingOptions, setupKernel?: (kernel: IConfigCatKernel) => IConfigCatKernel): IConfigCatClient => {
  const configCatKernel = createKernel(setupKernel);
  return new ConfigCatClient(new ManualPollOptions(sdkKey, configCatKernel.sdkType, configCatKernel.sdkVersion, options, configCatKernel.defaultCacheFactory, configCatKernel.eventEmitterFactory), configCatKernel);
};

export const createClientWithLazyLoad = (sdkKey: string, options?: IJSManualPollOptions, setupKernel?: (kernel: IConfigCatKernel) => IConfigCatKernel): IConfigCatClient => {
  const configCatKernel = createKernel(setupKernel);
  return new ConfigCatClient(new LazyLoadOptions(sdkKey, configCatKernel.sdkType, configCatKernel.sdkVersion, options, configCatKernel.defaultCacheFactory, configCatKernel.eventEmitterFactory), configCatKernel);
};

export const pathJoin = (...segments: string[]): string => segments.join("/");

export const readFileUtf8 = async (path: string): Promise<string> => {
  const response = await fetch("base/" + path, { method: "GET" });
  if (response.status === 200) {
    return await response.text();
  }
  else {
    throw Error(`unexpected response: ${response.status} ${response.statusText}`);
  }
};

initPlatform({
  pathJoin,
  readFileUtf8,
  createConfigFetcher,
  createKernel,
  createClientWithAutoPoll,
  createClientWithManualPoll,
  createClientWithLazyLoad,
  getClient
});

/* Discover and load tests */

declare const require: any;

// With karma-webpack, importing test modules by `import("...");` does not work, we need to import them using some webpack magic (require.context).
// This way we need to specify the set of modules via a single regex expression, which is pretty limited. We can't let any node-specific module
// be matched by the regex because that would break webpack. So, as a workaround, we use the `.nb.ts` extension to ignore node-specific modules.
const testsContext: Record<string, any> = require.context("..", true, /(?<!\/index|\.nb)\.ts$/);

for (const key of testsContext.keys()) {
  const [isTest, segments] = isTestSpec(key, "chromium-extension");
  if (isTest || (segments.length < 2 || segments[0] === "helpers")) {
    (testsContext as any)(key);
  }
}

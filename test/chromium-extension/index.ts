import { initPlatform } from "../helpers/platform";
import { getClient } from "#lib/chromium-extension";
import type { IConfigCatClient, IJSAutoPollOptions, IJSLazyLoadingOptions, IJSManualPollOptions } from "#lib/chromium-extension";
import { ChromeLocalStorageCache } from "#lib/chromium-extension/ChromeLocalStorageCache";
import { ConfigCatClient } from "#lib/ConfigCatClient";
import { AutoPollOptions, LazyLoadOptions, ManualPollOptions } from "#lib/ConfigCatClientOptions";
import { DefaultEventEmitter } from "#lib/DefaultEventEmitter";
import type { IConfigCatKernel, IConfigFetcher } from "#lib/index.pubternals";
import { FetchApiConfigFetcher } from "#lib/shared/FetchApiConfigFetcher";
import sdkVersion from "#lib/Version";

const sdkType = "ConfigCat-UnifiedJS-ChromiumExtension";

export const createConfigFetcher = (): IConfigFetcher => new FetchApiConfigFetcher();

export const createKernel = (setupKernel?: (kernel: IConfigCatKernel) => IConfigCatKernel): IConfigCatKernel => {
  const kernel: IConfigCatKernel = { configFetcher: createConfigFetcher(), sdkType, sdkVersion, eventEmitterFactory: () => new DefaultEventEmitter() };
  setupKernel ??= kernel => {
    kernel.defaultCacheFactory = ChromeLocalStorageCache.tryGetFactory();
    return kernel;
  };
  return setupKernel(kernel);
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
// Keep this in sync with the includes listed in tsconfig.karma.chromium-extension.json!

let testsContext: Record<string, any> = require.context("..", false, /\.ts$/);
includeTestModules(testsContext);

testsContext = require.context(".", true, /\.ts$/);
includeTestModules(testsContext);

testsContext = require.context("../helpers", true, /\.ts$/);
includeTestModules(testsContext);

testsContext = require.context("../shared", false, /IndexedDBCacheTests\.ts$/);
includeTestModules(testsContext);

function includeTestModules(testsContext: Record<string, any>) {
  for (const key of testsContext.keys()) {
    (testsContext as any)(key);
  }
}

import { isTestSpec } from "..";
import { initPlatform } from "../helpers/platform";
import { getClient } from "#lib/browser";
import type { IConfigCatClient, IJSAutoPollOptions, IJSLazyLoadingOptions, IJSManualPollOptions } from "#lib/browser";
import { LocalStorageCache } from "#lib/browser/LocalStorageCache";
import { XmlHttpRequestConfigFetcher } from "#lib/browser/XmlHttpRequestConfigFetcher";
import { ConfigCatClient } from "#lib/ConfigCatClient";
import { AutoPollOptions, LazyLoadOptions, ManualPollOptions } from "#lib/ConfigCatClientOptions";
import { DefaultEventEmitter } from "#lib/DefaultEventEmitter";
import type { IConfigCatKernel, IConfigFetcher } from "#lib/index.pubternals";

const sdkVersion = "0.0.0-test";
const sdkType = "ConfigCat-JS";

export const createConfigFetcher = (): IConfigFetcher => new XmlHttpRequestConfigFetcher();

export const createKernel = (setupKernel?: (kernel: IConfigCatKernel) => IConfigCatKernel): IConfigCatKernel => {
  const kernel: IConfigCatKernel = { configFetcher: createConfigFetcher(), sdkType, sdkVersion, eventEmitterFactory: () => new DefaultEventEmitter() };
  return (setupKernel ?? LocalStorageCache.setup)(kernel);
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

export const readFileUtf8 = (path: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.onreadystatechange = () => {
      if (request.readyState === 4) {
        if (request.status === 200) {
          resolve(request.responseText);
        }
        else if (request.status) {
          reject(Error(`unexpected response: ${request.status} ${request.statusText}`));
        }
      }
    },
    request.ontimeout = () => reject(Error("timeout"));
    request.onabort = () => reject(Error("abort"));
    request.onerror = () => reject(Error("error"));
    request.open("GET", "base/" + path, true);
    request.responseType = "text";
    request.send(null);
  });
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
  const [isTest, segments] = isTestSpec(key, "browser");
  if (isTest || (segments.length < 2 || segments[0] === "helpers")) {
    (testsContext as any)(key);
  }
}

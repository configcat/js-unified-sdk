import { PlatformAbstractions, initPlatform } from "../helpers/platform";
import type { IJSAutoPollOptions, IJSLazyLoadingOptions, IJSManualPollOptions } from "#lib/browser";
import { getClient } from "#lib/browser";
import { LocalStorageConfigCache } from "#lib/browser/LocalStorageConfigCache";
import { XmlHttpRequestConfigFetcher } from "#lib/browser/XmlHttpRequestConfigFetcher";
import { DefaultEventEmitter } from "#lib/DefaultEventEmitter";
import type { IConfigCatKernel } from "#lib/index.pubternals";
import sdkVersion from "#lib/Version";

const sdkType = "ConfigCat-UnifiedJS-Browser";

type IJSOptions = IJSAutoPollOptions | IJSManualPollOptions | IJSLazyLoadingOptions;

class BrowserPlatform extends PlatformAbstractions<IJSAutoPollOptions, IJSManualPollOptions, IJSLazyLoadingOptions> {
  pathJoin(...segments: string[]) { return segments.join("/"); }

  readFileUtf8(path: string) {
    return new Promise<string>((resolve, reject) => {
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
      };
      request.ontimeout = () => reject(Error("timeout"));
      request.onabort = () => reject(Error("abort"));
      request.onerror = () => reject(Error("error"));
      request.open("GET", "base/" + path, true);
      request.responseType = "text";
      request.send(null);
    });
  }

  createConfigFetcher(options?: IJSOptions) { return new XmlHttpRequestConfigFetcher(); }

  createKernel(setupKernel?: (kernel: IConfigCatKernel) => IConfigCatKernel, options?: IJSOptions) {
    const kernel: IConfigCatKernel = { configFetcher: this.createConfigFetcher(options), sdkType, sdkVersion, eventEmitterFactory: () => new DefaultEventEmitter() };
    setupKernel ??= kernel => {
      kernel.defaultCacheFactory = LocalStorageConfigCache.tryGetFactory();
      return kernel;
    };
    return setupKernel(kernel);
  }

  protected getClientImpl = getClient;
}

export const platform = new BrowserPlatform();

initPlatform(platform);

/* Discover and load tests */

declare const require: any;

// With karma-webpack, importing test modules by `import("...");` does not work, we need to import them using some webpack magic (require.context).
// Keep this in sync with the includes listed in tsconfig.karma.browser.json!

let testsContext: Record<string, any> = require.context("..", false, /\.ts$/);
includeTestModules(testsContext);

testsContext = require.context(".", true, /\.ts$/);
includeTestModules(testsContext);

testsContext = require.context("../helpers", true, /\.ts$/);
includeTestModules(testsContext);

testsContext = require.context("../shared", false, /IndexedDBConfigCacheTests\.ts$/);
includeTestModules(testsContext);

function includeTestModules(testsContext: Record<string, any>) {
  for (const key of testsContext.keys()) {
    (testsContext as any)(key);
  }
}

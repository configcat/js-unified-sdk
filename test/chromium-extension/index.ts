import { initPlatform, PlatformAbstractions } from "../helpers/platform";
import type { IJSAutoPollOptions, IJSLazyLoadingOptions, IJSManualPollOptions } from "#lib/chromium-extension";
import { getClient } from "#lib/chromium-extension";
import { ChromeLocalStorageConfigCache } from "#lib/chromium-extension/ChromeLocalStorageConfigCache";
import { DefaultEventEmitter } from "#lib/DefaultEventEmitter";
import type { IConfigCatKernel, OptionsBase } from "#lib/index.pubternals";
import { ClientSideFetchApiConfigFetcher } from "#lib/shared/FetchApiConfigFetcher";
import sdkVersion from "#lib/Version";

const sdkType = "ConfigCat-UnifiedJS-ChromiumExtension";

type IJSOptions = IJSAutoPollOptions | IJSManualPollOptions | IJSLazyLoadingOptions;

class ChromiumExtensionPlatform extends PlatformAbstractions<IJSAutoPollOptions, IJSManualPollOptions, IJSLazyLoadingOptions> {
  pathJoin(...segments: string[]) { return segments.join("/"); }

  async readFileUtf8(path: string) {
    const response = await fetch("base/" + path, { method: "GET" });
    if (response.status === 200) {
      return await response.text();
    } else {
      throw Error(`unexpected response: ${response.status} ${response.statusText}`);
    }
  }

  createConfigFetcher(options: OptionsBase, platformOptions?: IJSOptions) { return ClientSideFetchApiConfigFetcher["getFactory"]()(options); }

  createKernel(setupKernel?: (kernel: IConfigCatKernel) => IConfigCatKernel, options?: IJSOptions) {
    const kernel: IConfigCatKernel = {
      sdkType,
      sdkVersion,
      eventEmitterFactory: () => new DefaultEventEmitter(),
      defaultCacheFactory: null,
      configFetcherFactory: o => this.createConfigFetcher(o, options),
    };
    setupKernel ??= kernel => {
      kernel.defaultCacheFactory = ChromeLocalStorageConfigCache["tryGetFactory"]();
      return kernel;
    };
    return setupKernel(kernel);
  }

  protected getClientImpl = getClient;
}

export const platform = new ChromiumExtensionPlatform();

initPlatform(platform);

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

testsContext = require.context("../shared", false, /IndexedDBConfigCacheTests\.ts$/);
includeTestModules(testsContext);

function includeTestModules(testsContext: Record<string, any>) {
  for (const key of testsContext.keys()) {
    (testsContext as any)(key);
  }
}

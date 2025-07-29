import "mocha/mocha.js";
import * as cloudflare from "@cloudflare/workers-types/2023-03-01";
import { CdnConfigLocation } from "../helpers/ConfigLocation";
import { AugmentedOptions, initPlatform, PlatformAbstractions } from "../helpers/platform";
import type { IJSAutoPollOptions, IJSLazyLoadingOptions, IJSManualPollOptions, IOptions } from "#lib/cloudflare-worker";
import { getClient } from "#lib/cloudflare-worker";
import { CloudflareConfigCache } from "#lib/cloudflare-worker/CloudflareConfigCache";
import { DefaultEventEmitter } from "#lib/DefaultEventEmitter";
import type { IConfigCatKernel, OptionsBase } from "#lib/index.pubternals";
import { ServerSideFetchApiConfigFetcher } from "#lib/shared/FetchApiConfigFetcher";
import sdkVersion from "#lib/Version";

const sdkType = "ConfigCat-UnifiedJS-CloudflareWorker";

// Browser-based Mocha requires `window.location` to exist.
const location = "http://localhost:0";
if (typeof window === "undefined") {
  // window global is not available in Deno 2
  (globalThis as any).window = globalThis;
}
(window as any).location = new URL(location);

const options: Mocha.MochaOptions = { timeout: 30000 };

// In order to use `describe` etc. we need to set Mocha to `bdd` mode.
// We also need to set the reporter to `spec` (though other options
// are available) to prevent Mocha using the default browser reporter
// which requires access to a DOM.
mocha.setup({ ...options, ui: "bdd", reporter: "spec" });

// Ensure there are no leaks in our tests.
mocha.checkLeaks();

type IJSOptions = IJSAutoPollOptions | IJSManualPollOptions | IJSLazyLoadingOptions;

class CloudflareWorkerPlatform extends PlatformAbstractions<IJSAutoPollOptions, IJSManualPollOptions, IJSLazyLoadingOptions> {
  pathJoin(...segments: string[]) { return segments.join("/"); }

  async readFileUtf8(path: string) {
    if (!path.startsWith("/")) path = "/" + path;

    const basePath = "/test/data";
    if (path.startsWith(basePath)) path = path.substring(basePath.length);

    const workerEnv = await workerEnvPromise;
    const response = await workerEnv.data.fetch("http://dummy" + path, { method: "GET" });
    if (response.status === 200) {
      return await response.text();
    } else {
      throw Error(`unexpected response: ${response.status} ${response.statusText}`);
    }
  }

  createConfigFetcher(options: OptionsBase, platformOptions?: IJSOptions) { return ServerSideFetchApiConfigFetcher["getFactory"]()(options); }

  createKernel(setupKernel?: (kernel: IConfigCatKernel) => IConfigCatKernel, options?: IJSOptions) {
    const kernel: IConfigCatKernel = {
      sdkType,
      sdkVersion,
      eventEmitterFactory: () => new DefaultEventEmitter(),
      defaultCacheFactory: null,
      configFetcherFactory: o => this.createConfigFetcher(o, options),
    };
    setupKernel ??= kernel => {
      kernel.defaultCacheFactory = CloudflareConfigCache["tryGetFactory"]();
      return kernel;
    };
    return setupKernel(kernel);
  }

  protected getClientImpl = getClient;

  protected override adjustOptions<TOptions extends IOptions>(options?: TOptions) {
    options = { ...options } as TOptions;
    options.baseUrl ??= CdnConfigLocation.getDefaultCdnUrl(options);
    // HACK: There are issues with HTTPS in workerd (see e.g. https://github.com/cloudflare/workers-sdk/issues/4257),
    // so, as a workaround, we make requests to the ConfigCat CDN through a Node.js proxy server for now.
    // See also: see also: test-run-helper/server.mjs
    options.baseUrl = "http://localhost:9060/" + encodeURIComponent(options.baseUrl);
    return options;
  }

  protected override augmentOptions<TOptions extends OptionsBase>(options: TOptions) {
    const augmentedOptions = options as AugmentedOptions<TOptions>;
    augmentedOptions.getRealUrl = function() {
      const url = new URL(this.getUrl());
      const path = url.pathname + url.search;
      let index = path.indexOf("/", 1);
      if (index < 0) index = path.length;
      return decodeURIComponent(path.substring(1, index)) + path.substring(index);
    };
    return augmentedOptions;
  }
}

export const platform = new CloudflareWorkerPlatform();

initPlatform(platform);

// For service bindings, see workerd.config.capnp
type WorkerEnv = { data: cloudflare.Fetcher };

let resolveWorkerEnv: (value: WorkerEnv) => void;
const workerEnvPromise = new Promise<WorkerEnv>(resolve => resolveWorkerEnv = resolve);

/* Discover and load tests */

declare const require: any;

// Keep this in sync with the includes listed in tsconfig.karma.chromium-extension.json!

let testsContext: Record<string, any> = require.context("..", false, /\.ts$/);
includeTestModules(testsContext);

testsContext = require.context(".", true, /\.ts$/);
includeTestModules(testsContext);

testsContext = require.context("../helpers", true, /\.ts$/);
includeTestModules(testsContext);

function includeTestModules(testsContext: Record<string, any>) {
  for (const key of testsContext.keys()) {
    (testsContext as any)(key);
  }
}

export default {
  test: (ctrl, env, ctx) => {
    resolveWorkerEnv(env);

    return new Promise((resolve, reject) => {
      mocha.run(failures => {
        if (failures > 0) {
          reject(Error("Test run failed."));
        }
        resolve();
      }).globals(["onerror"]);
    });
  },
} as cloudflare.ExportedHandler<WorkerEnv>;

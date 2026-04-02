import "mocha/mocha.js";
import * as cloudflare from "@cloudflare/workers-types";
import { initPlatform, PlatformAbstractions } from "../helpers/platform";
import type { IJSAutoPollOptions, IJSLazyLoadingOptions, IJSManualPollOptions } from "#lib/cloudflare-worker";
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
      const blob = await response.blob();
      return await blob.text();
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

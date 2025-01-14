import * as path from "https://deno.land/std@0.224.0/path/mod.ts";
// @deno-types="npm:@types/mocha"
import "npm:mocha/browser-entry.js";
import { initPlatform, PlatformAbstractions } from "../helpers/platform";
import { isTestSpec } from "../index";
import { IConfigCatKernel } from "#lib/ConfigCatClient";
import { DefaultEventEmitter } from "#lib/DefaultEventEmitter";
import type { IDenoAutoPollOptions, IDenoLazyLoadingOptions, IDenoManualPollOptions } from "#lib/deno";
import { getClient } from "#lib/deno";
import { FetchApiConfigFetcher } from "#lib/shared/FetchApiConfigFetcher";
import sdkVersion from "#lib/Version";

const sdkType = "ConfigCat-UnifiedJS-Deno";

// Based on: https://dev.to/craigmorten/testing-your-deno-apps-with-mocha-4f35

const options: Mocha.MochaOptions = {};

for (let i = 0; i < Deno.args.length; i++) {
  const arg = Deno.args[i++];
  if (!arg.startsWith("--") || i >= Deno.args.length) break;
  const value = Deno.args[i];

  const key = arg.substring(2) as keyof Mocha.MochaOptions;
  // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
  switch (key) {
    case "grep":
    case "fgrep":
    case "timeout":
      options[key] = value;
      break;
    default:
      console.warn(`Command line option '${key}' is not recognized.`);
  }
}

// Browser-based Mocha requires `window.location` to exist.
const location = "http://localhost:0";
if (typeof window === "undefined") {
  // window global is not available in Deno 2
  (globalThis as any).window = globalThis;
}
(window as any).location = new URL(location);

// In order to use `describe` etc. we need to set Mocha to `bdd` mode.
// We also need to set the reporter to `spec` (though other options
// are available) to prevent Mocha using the default browser reporter
// which requires access to a DOM.
mocha.setup({ ...options, ui: "bdd", reporter: "spec" });

// Ensure there are no leaks in our tests.
mocha.checkLeaks();

type IDenoOptions = IDenoAutoPollOptions | IDenoManualPollOptions | IDenoLazyLoadingOptions;

class DenoPlatform extends PlatformAbstractions<IDenoAutoPollOptions, IDenoManualPollOptions, IDenoLazyLoadingOptions> {
  pathJoin(...segments: string[]) { return path.join(...segments); }

  readFileUtf8(path: string) { return Deno.readTextFileSync(path); }

  createConfigFetcher(options?: IDenoOptions) { return new FetchApiConfigFetcher(); }

  createKernel(setupKernel?: (kernel: IConfigCatKernel) => IConfigCatKernel, options?: IDenoOptions) {
    const kernel: IConfigCatKernel = { configFetcher: this.createConfigFetcher(options), sdkType, sdkVersion, eventEmitterFactory: () => new DefaultEventEmitter() };
    return (setupKernel ?? (k => k))(kernel);
  }

  protected getClientImpl = getClient;
}

export const platform = new DenoPlatform();

initPlatform(platform);

/* Discover and load tests */

const testDir = path.resolve(path.dirname(path.fromFileUrl(import.meta.url)), "..");

async function* enumerateFiles(dir: string): AsyncIterableIterator<string> {
  for await (const entry of Deno.readDir(dir)) {
    if (entry.isDirectory) {
      yield* enumerateFiles(path.join(dir, entry.name));
    } else if (entry.isFile) {
      yield path.join(dir, entry.name);
    }
  }
}

for await (const file of enumerateFiles(testDir)) {
  const [isTest, segments] = isTestSpec(file, "deno");
  if (isTest) {
    await import("../" + segments.join("/"));
  }
}

// And finally we run our tests, passing the onCompleted hook and setting some globals.
mocha.run(failures => failures > 0 ? Deno.exit(1) : Deno.exit(0))
  .globals(["onerror"]);

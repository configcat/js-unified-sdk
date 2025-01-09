import "mocha";
import { EventEmitter } from "events";
import * as fs from "fs";
import * as glob from "glob";
import * as path from "path";
import { PlatformAbstractions, initPlatform } from "../helpers/platform";
import { normalizePathSeparator } from "../helpers/utils";
import { isTestSpec } from "../index";
import type { IBunAutoPollOptions, IBunLazyLoadingOptions, IBunManualPollOptions } from "#lib/bun";
import { getClient } from "#lib/bun";
import type { IConfigCatKernel } from "#lib/index.pubternals";
import { NodeHttpConfigFetcher } from "#lib/node/NodeHttpConfigFetcher";
import sdkVersion from "#lib/Version";

const sdkType = "ConfigCat-UnifiedJS-Bun";

type IBunOptions = IBunAutoPollOptions | IBunManualPollOptions | IBunLazyLoadingOptions;

class BunPlatform extends PlatformAbstractions<IBunAutoPollOptions, IBunManualPollOptions, IBunLazyLoadingOptions> {
  constructor() {
    super();
    this.gc = () => {
      Bun.gc(true);
      return Promise.resolve();
    };
  }

  pathJoin(...segments: string[]) { return path.join(...segments); }

  readFileUtf8(path: string) { return fs.readFileSync(path, "utf8"); }

  createConfigFetcher(options?: IBunOptions) { return new NodeHttpConfigFetcher(options); }

  createKernel(setupKernel?: (kernel: IConfigCatKernel) => IConfigCatKernel, options?: IBunOptions) {
    const kernel: IConfigCatKernel = { configFetcher: this.createConfigFetcher(options), sdkType, sdkVersion, eventEmitterFactory: () => new EventEmitter() };
    return (setupKernel ?? (k => k))(kernel);
  }

  protected getClientImpl = getClient;
}

export const platform = new BunPlatform();

initPlatform(platform);

/* Discover and load tests */

const testDir = path.resolve(__dirname, "..");

for (const file of glob.globIterateSync(normalizePathSeparator(testDir) + "/**/*.ts", { absolute: false })) {
  const [isTest, segments] = isTestSpec(file, "bun");
  if (isTest) {
    const fileName = segments[segments.length - 1];
    segments[segments.length - 1] = path.basename(fileName, path.extname(fileName));

    await import("../" + segments.join("/"));
  }
}

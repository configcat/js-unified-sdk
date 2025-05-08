import "mocha";
import { EventEmitter } from "events";
import * as fs from "fs";
import * as glob from "glob";
import * as path from "path";
import { initPlatform, PlatformAbstractions } from "../helpers/platform";
import { normalizePathSeparator } from "../helpers/utils";
import { isTestSpec } from "../index";
import type { IConfigCatKernel, OptionsBase } from "#lib/index.pubternals";
import type { INodeAutoPollOptions, INodeLazyLoadingOptions, INodeManualPollOptions } from "#lib/node";
import { getClient } from "#lib/node";
import { NodeHttpConfigFetcher } from "#lib/node/NodeHttpConfigFetcher";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const sdkVersion = require("#lib/Version").default;

const sdkType = "ConfigCat-UnifiedJS-Node";

type INodeOptions = INodeAutoPollOptions | INodeManualPollOptions | INodeLazyLoadingOptions;

class NodePlatform extends PlatformAbstractions<INodeAutoPollOptions, INodeManualPollOptions, INodeLazyLoadingOptions> {
  constructor() {
    super();

    if (typeof gc !== "undefined") {
      this.gc = () => gc!({ execution: "async", type: "major" });
    }
  }

  pathJoin(...segments: string[]) { return path.join(...segments); }

  readFileUtf8(path: string) { return fs.readFileSync(path, "utf8"); }

  createConfigFetcher(options: OptionsBase, platformOptions?: INodeOptions) { return NodeHttpConfigFetcher.getFactory(platformOptions)(options); }

  createKernel(setupKernel?: (kernel: IConfigCatKernel) => IConfigCatKernel, options?: INodeOptions) {
    const kernel: IConfigCatKernel = {
      sdkType,
      sdkVersion,
      eventEmitterFactory: () => new EventEmitter(),
      configFetcherFactory: o => this.createConfigFetcher(o, options),
    };
    return (setupKernel ?? (k => k))(kernel);
  }

  protected getClientImpl = getClient;
}

export const platform = new NodePlatform();

initPlatform(platform);

/* Discover and load tests */

const testDir = path.resolve(__dirname, "..");

for (const file of glob.globIterateSync(normalizePathSeparator(testDir) + "/**/*.ts", { absolute: false })) {
  const [isTest, segments] = isTestSpec(file, "node");
  if (isTest) {
    const fileName = segments[segments.length - 1];
    segments[segments.length - 1] = path.basename(fileName, path.extname(fileName));

    /* eslint-disable @typescript-eslint/no-require-imports */
    require("../" + segments.join("/"));
  }
}

import "mocha";
import { EventEmitter } from "events";
import * as fs from "fs";
import * as glob from "glob";
import * as path from "path";
import { initPlatform } from "../helpers/platform";
import { normalizePathSeparator } from "../helpers/utils";
import { isTestSpec } from "../index";
import { ConfigCatClient } from "#lib/ConfigCatClient";
import { AutoPollOptions, LazyLoadOptions, ManualPollOptions } from "#lib/ConfigCatClientOptions";
import type { IConfigCatKernel, IConfigFetcher } from "#lib/index.pubternals";
import type { IConfigCatClient, INodeAutoPollOptions, INodeLazyLoadingOptions, INodeManualPollOptions } from "#lib/node";
import { getClient } from "#lib/node";
import { NodeHttpConfigFetcher } from "#lib/node/NodeHttpConfigFetcher";

const sdkVersion = "0.0.0-test";
const sdkType = "ConfigCat-Node";

export const createConfigFetcher = (): IConfigFetcher => new NodeHttpConfigFetcher();

export const createKernel = (setupKernel?: (kernel: IConfigCatKernel) => IConfigCatKernel): IConfigCatKernel => {
  const kernel: IConfigCatKernel = { configFetcher: createConfigFetcher(), sdkType, sdkVersion, eventEmitterFactory: () => new EventEmitter() };
  return (setupKernel ?? (k => k))(kernel);
};

export const createClientWithAutoPoll = (sdkKey: string, options?: INodeAutoPollOptions, setupKernel?: (kernel: IConfigCatKernel) => IConfigCatKernel): IConfigCatClient => {
  const configCatKernel = createKernel(setupKernel);
  return new ConfigCatClient(new AutoPollOptions(sdkKey, configCatKernel.sdkType, configCatKernel.sdkVersion, options, configCatKernel.defaultCacheFactory, configCatKernel.eventEmitterFactory), configCatKernel);
};

export const createClientWithManualPoll = (sdkKey: string, options?: INodeManualPollOptions, setupKernel?: (kernel: IConfigCatKernel) => IConfigCatKernel): IConfigCatClient => {
  const configCatKernel = createKernel(setupKernel);
  return new ConfigCatClient(new ManualPollOptions(sdkKey, configCatKernel.sdkType, configCatKernel.sdkVersion, options, configCatKernel.defaultCacheFactory, configCatKernel.eventEmitterFactory), configCatKernel);
};

export const createClientWithLazyLoad = (sdkKey: string, options?: INodeLazyLoadingOptions, setupKernel?: (kernel: IConfigCatKernel) => IConfigCatKernel): IConfigCatClient => {
  const configCatKernel = createKernel(setupKernel);
  return new ConfigCatClient(new LazyLoadOptions(sdkKey, configCatKernel.sdkType, configCatKernel.sdkVersion, options, configCatKernel.defaultCacheFactory, configCatKernel.eventEmitterFactory), configCatKernel);
};

export const pathJoin = (...segments: string[]): string => path.join(...segments);

export const readFileUtf8 = (path: string): string => fs.readFileSync(path, "utf8");

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

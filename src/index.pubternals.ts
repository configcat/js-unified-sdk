/* Package "pubternal" API */

// List types and functionality here which are considered internal but need to be
// exposed to separate packages that implement a ConfigCat SDK (e.g. for React SDK).
// Backward compatibility is not guaranteed for these APIs.

export * from "./index.pubternals.core";

export type { IConfigCache } from "./ConfigCatCache";

export { ExternalConfigCache, InMemoryConfigCache } from "./ConfigCatCache";

export type { IConfigCatKernel, OptionsBase } from "./ConfigCatClientOptions";

export { FetchResult, FetchStatus } from "./ConfigFetcher";

export { DefaultEventEmitter } from "./DefaultEventEmitter";

export type { IEventEmitter, IEventProvider } from "./EventEmitter";

export type { IOverrideDataSource } from "./FlagOverrides";

export * as Utils from "./Utils";

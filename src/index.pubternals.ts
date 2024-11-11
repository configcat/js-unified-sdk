import { Setting } from "./ProjectConfig";

/* Package "pubternal" API */

// List types and functionality here which are considered internal but need to be
// exposed to separate packages that implement a ConfigCat SDK (e.g. for React).
// Backward compatibility is not guaranteed for these APIs.

export * from "./index.pubternals.core";

export type { IConfigCatKernel } from "./ConfigCatClient";

export type { OptionsBase } from "./ConfigCatClientOptions";

export type { IOverrideDataSource } from "./FlagOverrides";

export const settingFromValue = Setting.fromValue;

export type { IConfigCache } from "./ConfigCatCache";

export { ExternalConfigCache, InMemoryConfigCache } from "./ConfigCatCache";

export type { FetchErrorCauses, IConfigFetcher, IFetchResponse } from "./ConfigFetcher";

export { FetchError, FetchResult, FetchStatus } from "./ConfigFetcher";

export type { IEventEmitter, IEventProvider } from "./EventEmitter";

export { DefaultEventEmitter } from "./DefaultEventEmitter";

export { LocalStorageCache } from "./browser/LocalStorageCache";

export { XmlHttpRequestConfigFetcher } from "./browser/XmlHttpRequestConfigFetcher";

export { FetchApiConfigFetcher } from "./shared/FetchApiConfigFetcher";

// The exports in this module are also exposed on the public API surface but not intended for end users.
// Backward compatibility is not guaranteed.

/* Platform-agnostic functionality */

export * from "./index.pubternals.core";

/* Platform-specific functionality */

export { DefaultEventEmitter } from "./DefaultEventEmitter";

export { LocalStorageCache } from "./browser/LocalStorageCache";

export { XmlHttpRequestConfigFetcher } from "./browser/XmlHttpRequestConfigFetcher";

export { FetchApiConfigFetcher } from "./shared/FetchApiConfigFetcher";

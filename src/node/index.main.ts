import type { IConfigCatClient } from "../ConfigCatClient";
import type { OptionsForPollingMode, PollingMode } from "../ConfigCatClientOptions";
import { getClient as getClientImpl } from ".";

/* Package public API for Node.js or separate packages that implement a ConfigCat SDK. */

/**
 * Returns an instance of `ConfigCatClient` for the specified SDK Key.
 * @remarks This method returns a single, shared instance per each distinct SDK Key.
 * That is, a new client object is created only when there is none available for the specified SDK Key.
 * Otherwise, the already created instance is returned (in which case the `pollingMode` and `options` arguments are ignored).
 * So, please keep in mind that when you make multiple calls to this method using the same SDK Key, you may end up with multiple references to the same client object.
 * @param sdkKey SDK Key to access the ConfigCat config.
 * @param pollingMode The polling mode to use.
 * @param options Options for the specified polling mode.
 */
export const getClient: <TMode extends PollingMode | undefined>(
  sdkKey: string, pollingMode?: TMode, options?: OptionsForPollingMode<TMode>
) => IConfigCatClient = getClientImpl;

export { createConsoleLogger, createFlagOverridesFromMap, createFlagOverridesFromQueryParams, disposeAllClients } from "../index.pubternals.core";

export type { INodeAutoPollOptions, INodeLazyLoadingOptions, INodeManualPollOptions } from ".";

export type { IJSAutoPollOptions, IJSLazyLoadingOptions, IJSManualPollOptions } from "../browser";

export type { OptionsForPollingMode };

export { LocalStorageConfigCache } from "../browser/LocalStorageConfigCache";

export { IndexedDBConfigCache } from "../shared/IndexedDBConfigCache";

export { XmlHttpRequestConfigFetcher } from "../browser/XmlHttpRequestConfigFetcher";

export { ClientSideFetchApiConfigFetcher as FetchApiConfigFetcher } from "../shared/FetchApiConfigFetcher";

export { NodeHttpConfigFetcher } from "./NodeHttpConfigFetcher";

export * as Internals from "../index.pubternals";

export * from "..";

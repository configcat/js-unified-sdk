import { EventEmitter } from "events";
import type { IConfigCatClient } from "../ConfigCatClient";
import type { IAutoPollOptions, ILazyLoadingOptions, IManualPollOptions } from "../ConfigCatClientOptions";
import { PollingMode } from "../ConfigCatClientOptions";
import { getClient as getClientInternal } from "../index.pubternals.core";
import CONFIGCAT_SDK_VERSION from "../Version";
import type { INodeHttpConfigFetcherOptions } from "./NodeHttpConfigFetcher";
import { NodeHttpConfigFetcher } from "./NodeHttpConfigFetcher";

/* Package public API for Node.js */

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
export function getClient<TMode extends PollingMode | undefined>(sdkKey: string, pollingMode?: TMode, options?: OptionsForPollingMode<TMode>): IConfigCatClient {
  return getClientInternal(sdkKey, pollingMode ?? PollingMode.AutoPoll, options,
    {
      sdkType: "ConfigCat-UnifiedJS-Node",
      sdkVersion: CONFIGCAT_SDK_VERSION,
      eventEmitterFactory: () => new EventEmitter(),
      defaultCacheFactory: null,
      configFetcherFactory: NodeHttpConfigFetcher["getFactory"](options),
    });
}

export { createConsoleLogger, createFlagOverridesFromMap, disposeAllClients } from "../index.pubternals.core";

/** Options used to configure the ConfigCat SDK in the case of Auto Polling mode. */
export interface INodeAutoPollOptions extends IAutoPollOptions, INodeHttpConfigFetcherOptions {
}

/** Options used to configure the ConfigCat SDK in the case of Lazy Loading mode. */
export interface INodeLazyLoadingOptions extends ILazyLoadingOptions, INodeHttpConfigFetcherOptions {
}

/** Options used to configure the ConfigCat SDK in the case of Manual Polling mode. */
export interface INodeManualPollOptions extends IManualPollOptions, INodeHttpConfigFetcherOptions {
}

export type OptionsForPollingMode<TMode extends PollingMode | undefined> =
  TMode extends PollingMode.AutoPoll ? INodeAutoPollOptions :
  TMode extends PollingMode.ManualPoll ? INodeManualPollOptions :
  TMode extends PollingMode.LazyLoad ? INodeLazyLoadingOptions :
  TMode extends undefined ? INodeAutoPollOptions :
  never;

export { NodeHttpConfigFetcher };

export { ServerSideFetchApiConfigFetcher } from "../shared/FetchApiConfigFetcher";

export * from "..";

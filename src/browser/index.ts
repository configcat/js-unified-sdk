import type { IConfigCatClient } from "../ConfigCatClient.js";
import type { IAutoPollOptions, ILazyLoadingOptions, IManualPollOptions } from "../ConfigCatClientOptions.js";
import { PollingMode } from "../ConfigCatClientOptions.js";
import { getClient as getClientCommon } from "../index.pubternals.js";
import { setupPolyfills } from "../Polyfills.js";
import CONFIGCAT_SDK_VERSION from "../Version.js";
import { LocalStorageCache } from "./LocalStorageCache.js";
import { XmlHttpRequestConfigFetcher } from "./XmlHttpRequestConfigFetcher.js";

setupPolyfills();

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
  return getClientCommon(sdkKey, pollingMode ?? PollingMode.AutoPoll, options,
    LocalStorageCache.setup({
      configFetcher: new XmlHttpRequestConfigFetcher(),
      sdkType: "ConfigCat-JS",
      sdkVersion: CONFIGCAT_SDK_VERSION,
    }));
}

export { createConsoleLogger, createFlagOverridesFromMap, disposeAllClients } from "../index.pubternals.js";

/** Options used to configure the ConfigCat SDK in the case of Auto Polling mode. */
export interface IJSAutoPollOptions extends IAutoPollOptions {
}

/** Options used to configure the ConfigCat SDK in the case of Lazy Loading mode. */
export interface IJSLazyLoadingOptions extends ILazyLoadingOptions {
}

/** Options used to configure the ConfigCat SDK in the case of Manual Polling mode. */
export interface IJSManualPollOptions extends IManualPollOptions {
}

export type OptionsForPollingMode<TMode extends PollingMode | undefined> =
    TMode extends PollingMode.AutoPoll ? IJSAutoPollOptions :
    TMode extends PollingMode.ManualPoll ? IJSManualPollOptions :
    TMode extends PollingMode.LazyLoad ? IJSLazyLoadingOptions :
    TMode extends undefined ? IJSAutoPollOptions :
    never;

export * from "../index.js";


import type * as cloudflare from "@cloudflare/workers-types";
import type { IConfigCatClient } from "../ConfigCatClient";
import type { IAutoPollOptions, ILazyLoadingOptions, IManualPollOptions } from "../ConfigCatClientOptions";
import { PollingMode } from "../ConfigCatClientOptions";
import { DefaultEventEmitter } from "../DefaultEventEmitter";
import type { FlagOverrides, IQueryStringProvider, OverrideBehaviour } from "../FlagOverrides";
import { createFlagOverridesFromQueryParams as createFlagOverridesFromQueryParamsCommon, getClient as getClientCommon } from "../index.pubternals.core";
import { setupPolyfills } from "../Polyfills";
import { FetchApiConfigFetcher } from "../shared/FetchApiConfigFetcher";
import CONFIGCAT_SDK_VERSION from "../Version";
import { CloudflareConfigCache } from "./CloudflareConfigCache";

/* Package public API for Cloudflare Workers */

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
  return getClientCommon(sdkKey, pollingMode ?? PollingMode.AutoPoll, options, {
    configFetcher: new FetchApiConfigFetcher(),
    sdkType: "ConfigCat-UnifiedJS-CloudflareWorker",
    sdkVersion: CONFIGCAT_SDK_VERSION,
    eventEmitterFactory: () => new DefaultEventEmitter(),
    defaultCacheFactory: CloudflareConfigCache.tryGetFactory()
  });
}

export { createConsoleLogger, createFlagOverridesFromMap, disposeAllClients } from "../index.pubternals.core";

declare const URL: typeof cloudflare.URL;

/**
 * Creates an instance of `FlagOverrides` that uses the query string parameters
 * of the specified request as data source.
 * @param behaviour The override behaviour.
 * Specifies whether the local values should override the remote values
 * or local values should only be used when a remote value doesn't exist
 * or the local values should be used only.
 * @param request The request.
 * @param paramPrefix The parameter name prefix used to indicate which query string parameters
 * specify feature flag override values. Parameters whose name doesn't start with the
 * prefix will be ignored. Defaults to `cc-`.
 */
export function createFlagOverridesFromQueryParams(behaviour: OverrideBehaviour,
  request: cloudflare.Request, paramPrefix?: string
): FlagOverrides;
/**
 * Creates an instance of `FlagOverrides` that uses query string parameters as data source.
 * @param behaviour The override behaviour.
 * Specifies whether the local values should override the remote values
 * or local values should only be used when a remote value doesn't exist
 * or the local values should be used only.
 * @param watchChanges If set to `true`, the query string will be tracked for changes.
 * @param paramPrefix The parameter name prefix used to indicate which query string parameters
 * specify feature flag override values. Parameters whose name doesn't start with the
 * prefix will be ignored. Defaults to `cc-`.
 * @param queryStringProvider The provider object used to obtain the query string.
 * Defaults to a provider that returns the value of `globalThis.location.search`.
 */
export function createFlagOverridesFromQueryParams(behaviour: OverrideBehaviour,
  watchChanges?: boolean, paramPrefix?: string, queryStringProvider?: IQueryStringProvider
): FlagOverrides;
export function createFlagOverridesFromQueryParams(behaviour: OverrideBehaviour,
  requestOrWatchChanges?: boolean | cloudflare.Request, paramPrefix?: string, queryStringProvider?: IQueryStringProvider
): FlagOverrides {
  if (!requestOrWatchChanges || typeof requestOrWatchChanges === "boolean") {
    return createFlagOverridesFromQueryParamsCommon(behaviour, requestOrWatchChanges, paramPrefix, queryStringProvider);
  }

  return createFlagOverridesFromQueryParamsCommon(behaviour, false, paramPrefix, {
    get currentValue() {
      try { return new URL(requestOrWatchChanges.url).search; }
      catch { /* intentional no-op */ }
    }
  });
}

export type { IQueryStringProvider } from "../index.pubternals.core";

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

export * from "..";

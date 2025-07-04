import { ConfigCatClient } from "./ConfigCatClient";
import type { IConfigCatClient } from "./ConfigCatClient";
import type { IConfigCatKernel, OptionsForPollingMode, PollingMode } from "./ConfigCatClientOptions";
import type { IConfigCatLogger, LogLevel } from "./ConfigCatLogger";
import { ConfigCatConsoleLogger } from "./ConfigCatLogger";
import type { FlagOverrides, IOverrideDataSource, IQueryStringProvider, OverrideBehaviour } from "./FlagOverrides";
import { MapOverrideDataSource, QueryParamsOverrideDataSource } from "./FlagOverrides";
import type { SettingValue } from "./ProjectConfig";

/* Package "pubternal" API (core part) */

// List types and functionality here which are considered internal but may be
// used or exposed to end users on some of the platforms.

/**
 * Returns an instance of `ConfigCatClient` for the specified SDK Key.
 * @remarks This method returns a single, shared instance per each distinct SDK Key.
 * That is, a new client object is created only when there is none available for the specified SDK Key.
 * Otherwise, the already created instance is returned (in which case the `pollingMode`, `options` and `configCatKernel` arguments are ignored).
 * So, please keep in mind that when you make multiple calls to this method using the same SDK Key, you may end up with multiple references to the same client object.
 * @param sdkKey SDK Key to access the ConfigCat config.
 * @param pollingMode The polling mode to use.
 * @param options Options for the specified polling mode.
 */
export function getClient<TMode extends PollingMode>(sdkKey: string, pollingMode: TMode,
  options: OptionsForPollingMode<TMode> | undefined | null, configCatKernel: IConfigCatKernel
): IConfigCatClient {
  return ConfigCatClient.get(sdkKey, pollingMode, options, configCatKernel);
}

/**
 * Disposes all existing `ConfigCatClient` instances.
 */
export function disposeAllClients(): void {
  ConfigCatClient.disposeAll();
}

/**
 * Creates an instance of `ConfigCatConsoleLogger`.
 * @param logLevel Log level (the minimum level to use for filtering log events).
 * @param eol The character sequence to use for line breaks in log messages. Defaults to "\n".
 */
export function createConsoleLogger(logLevel: LogLevel, eol?: string): IConfigCatLogger {
  return new ConfigCatConsoleLogger(logLevel, eol);
}

/**
 * Creates an instance of `FlagOverrides` that uses a map data source.
 * @param map The map that contains the overrides.
 * @param behaviour The override behaviour.
 * Specifies whether the local values should override the remote values,
 * or local values should only be used when a remote value doesn't exist,
 * or the local values should be used only.
 * @param watchChanges If set to `true`, the input map will be tracked for changes.
 */
export function createFlagOverridesFromMap(map: Record<string, NonNullable<SettingValue>>, behaviour: OverrideBehaviour, watchChanges?: boolean): FlagOverrides {
  return { dataSource: new MapOverrideDataSource(map, watchChanges), behaviour };
}

/**
 * Creates an instance of `FlagOverrides` that uses query string parameters as data source.
 * @param behaviour The override behaviour.
 * Specifies whether the local values should override the remote values,
 * or local values should only be used when a remote value doesn't exist,
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
): FlagOverrides {
  return { dataSource: new QueryParamsOverrideDataSource(watchChanges, paramPrefix, queryStringProvider), behaviour };
}

export type { IQueryStringProvider };

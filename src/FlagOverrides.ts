import type { Setting, SettingValue } from "./ProjectConfig";
import { createSettingFromValue } from "./ProjectConfig";
import { isArray, parseFloatStrict } from "./Utils";

export type FlagOverrides = {
  dataSource: IOverrideDataSource;
  behaviour: OverrideBehaviour;
};

/**
 * Specifies the behaviours for flag overrides.
 */
export const enum OverrideBehaviour {
  /**
   * When evaluating values, the SDK will not use feature flags and settings from the ConfigCat CDN, but it will use
   * all feature flags and settings that are loaded from local-override sources.
   */
  LocalOnly = 0,
  /**
   * When evaluating values, the SDK will use all feature flags and settings that are downloaded from the ConfigCat CDN,
   * plus all feature flags and settings that are loaded from local-override sources. If a feature flag or a setting is
   * defined both in the fetched and the local-override source then the local-override version will take precedence.
   */
  LocalOverRemote = 1,
  /**
   * When evaluating values, the SDK will use all feature flags and settings that are downloaded from the ConfigCat CDN,
   * plus all feature flags and settings that are loaded from local-override sources. If a feature flag or a setting is
   * defined both in the fetched and the local-override source then the fetched version will take precedence.
   */
  RemoteOverLocal = 2,
}

export function nameOfOverrideBehaviour(value: OverrideBehaviour): string {
  /// @ts-expect-error Reverse mapping does work because of `preserveConstEnums`.
  return OverrideBehaviour[value] as string;
}

export interface IOverrideDataSource {
  getOverrides(): Promise<Record<string, Setting>>;

  getOverridesSync(): Record<string, Setting>;
}

/* Map */

export class MapOverrideDataSource implements IOverrideDataSource {
  private readonly initialSettings: Record<string, Setting>;
  private readonly map?: Record<string, NonNullable<SettingValue>>;

  constructor(map: Record<string, NonNullable<SettingValue>>, watchChanges?: boolean) {
    this.initialSettings = getSettingsFromMap(map);
    if (watchChanges) {
      this.map = map;
    }
  }

  getOverrides(): Promise<Record<string, Setting>> {
    return Promise.resolve(this.getOverridesSync());
  }

  getOverridesSync(): Record<string, Setting> {
    return this.map
      ? getSettingsFromMap(this.map)
      : this.initialSettings;
  }
}

function getSettingsFromMap(map: Record<string, NonNullable<SettingValue>>) {
  const settings: Record<string, Setting> = {};

  for (const key in map) {
    if (Object.prototype.hasOwnProperty.call(map, key)) {
      settings[key] = createSettingFromValue(map[key]);
    }
  }

  return settings;
}

/* Query string */

const DEFAULT_PARAM_PREFIX = "cc-";
const FORCE_STRING_VALUE_SUFFIX = ";str";

export interface IQueryStringProvider {
  readonly currentValue?: string | Record<string, string | ReadonlyArray<string>>;
}

class DefaultQueryStringProvider implements IQueryStringProvider {
  get currentValue() {
    if (typeof location === "undefined") return;
    return location.search;
  }
}

let defaultQueryStringProvider: DefaultQueryStringProvider | undefined;

export class QueryParamsOverrideDataSource implements IOverrideDataSource {
  private readonly watchChanges?: boolean;
  private readonly paramPrefix: string;
  private readonly queryStringProvider: IQueryStringProvider;
  private queryString: string | undefined;
  private settings: Record<string, Setting>;

  constructor(watchChanges?: boolean, paramPrefix?: string, queryStringProvider?: IQueryStringProvider) {
    this.watchChanges = watchChanges;
    this.paramPrefix = paramPrefix ?? DEFAULT_PARAM_PREFIX;

    queryStringProvider ??= defaultQueryStringProvider ??= new DefaultQueryStringProvider();
    this.queryStringProvider = queryStringProvider;

    const currentQueryStringOrParams = queryStringProvider.currentValue;
    this.settings = getSettingsFromQueryString(currentQueryStringOrParams, this.paramPrefix);
    this.queryString = getQueryString(currentQueryStringOrParams);
  }

  getOverrides(): Promise<Record<string, Setting>> {
    return Promise.resolve(this.getOverridesSync());
  }

  getOverridesSync(): Record<string, Setting> {
    if (this.watchChanges) {
      const currentQueryStringOrParams = this.queryStringProvider.currentValue;
      const currentQueryString = getQueryString(currentQueryStringOrParams);
      if (this.queryString !== currentQueryString) {
        this.settings = getSettingsFromQueryString(currentQueryStringOrParams, this.paramPrefix);
        this.queryString = currentQueryString;
      }
    }

    return this.settings;
  }
}

function getQueryString(queryStringOrParams: string | Record<string, string | ReadonlyArray<string>> | undefined) {
  if (queryStringOrParams == null) {
    return "";
  }

  if (typeof queryStringOrParams === "string") {
    return queryStringOrParams;
  }

  let queryString = "", separator = "?";

  for (const key in queryStringOrParams) {
    if (!Object.prototype.hasOwnProperty.call(queryStringOrParams, key)) continue;

    const values = queryStringOrParams[key];
    let value: string, length: number;

    if (!isArray(values)) value = values, length = 1;
    else if (values.length) value = values[0], length = values.length;
    else continue;

    for (let i = 0; ;) {
      queryString += separator + encodeURIComponent(key) + "=" + encodeURIComponent(value);
      if (++i >= length) break;
      separator = "&";
      value = values[i];
    }
  }

  return queryString;
}

function getSettingsFromQueryString(queryStringOrParams: string | Record<string, string | ReadonlyArray<string>> | undefined, paramPrefix: string) {
  const settings: Record<string, Setting> = {};

  if (typeof queryStringOrParams === "string") {
    extractSettingFromQueryString(queryStringOrParams, paramPrefix, settings);
  } else if (queryStringOrParams != null) {
    extractSettingsFromQueryParams(queryStringOrParams, paramPrefix, settings);
  }

  return settings;
}

function extractSettingsFromQueryParams(queryParams: Record<string, string | ReadonlyArray<string>> | undefined, paramPrefix: string, settings: Record<string, Setting>) {
  for (const key in queryParams) {
    if (!Object.prototype.hasOwnProperty.call(queryParams, key)) continue;

    const values = queryParams[key];
    let value: string, length: number;

    if (!isArray(values)) value = values, length = 1;
    else if (values.length) value = values[0], length = values.length;
    else continue;

    for (let i = 0; ;) {
      extractSettingFromQueryParam(key, value, paramPrefix, settings);
      if (++i >= length) break;
      value = values[i];
    }
  }
}

function extractSettingFromQueryString(queryString: string, paramPrefix: string, settings: Record<string, Setting>) {
  if (!queryString
    || queryString.lastIndexOf("?", 0) < 0) { // identical to `!queryString.startsWith("?")`
    return;
  }

  const parts = queryString.substring(1).split("&");
  for (let part of parts) {
    part = part.replace(/\+/g, " ");
    const index = part.indexOf("=");

    const key = decodeURIComponent(index >= 0 ? part.substring(0, index) : part);
    const value = index >= 0 ? decodeURIComponent(part.substring(index + 1)) : "";

    extractSettingFromQueryParam(key, value, paramPrefix, settings);
  }
}

function extractSettingFromQueryParam(key: string, value: string, paramPrefix: string, settings: Record<string, Setting>) {
  if (!key
    || key.length <= paramPrefix.length
    || key.lastIndexOf(paramPrefix, 0) < 0) { // identical to `!key.startsWith(paramPrefix)`
    return;
  }

  key = key.substring(paramPrefix.length);

  const interpretValueAsString = key.length > FORCE_STRING_VALUE_SUFFIX.length
    && key.indexOf(FORCE_STRING_VALUE_SUFFIX, key.length - FORCE_STRING_VALUE_SUFFIX.length) >= 0; // identical to `key.endsWith(strSuffix)`

  if (interpretValueAsString) {
    key = key.substring(0, key.length - FORCE_STRING_VALUE_SUFFIX.length);
  } else {
    value = parseSettingValue(value) as unknown as string;
  }

  settings[key] = createSettingFromValue(value);
}

function parseSettingValue(value: string): NonNullable<SettingValue> {
  switch (value.toLowerCase()) {
    case "false":
      return false;
    case "true":
      return true;
    default:
      const number = parseFloatStrict(value);
      return !isNaN(number) ? number : value;
  }
}

import type { PrerequisiteFlagComparator, SegmentComparator, SettingType, UserComparator } from "./ConfigJson";
import * as ConfigJson from "./ConfigJson";
import { ensurePrototype, isArray, isObject } from "./Utils";

// NOTE: This is a hack which prevents the TS compiler from eliding the namespace import above.
// TS wants to do this because it figures that the ConfigJson module contains types only.
// However, since we enabled `preserveConstEnums`, this is not true. (TS provides the
// `preserveValueImports` and `verbatimModuleSyntax` tsconfig options to handle such situations
// but the former is deprecated and removed, and the latter doesn't work with CommonJS...)
export { ConfigJson };

export class ProjectConfig {
  static readonly serializationFormatVersion = "v2";

  static readonly empty = new ProjectConfig(void 0, void 0, 0, void 0);

  static contentEquals(projectConfig1: ProjectConfig, projectConfig2: ProjectConfig): boolean {
    // When both ETags are available, we don't need to check the JSON content.
    return projectConfig1.httpETag && projectConfig2.httpETag
      ? projectConfig1.httpETag === projectConfig2.httpETag
      : projectConfig1.configJson === projectConfig2.configJson;
  }

  constructor(
    readonly configJson: string | undefined,
    readonly config: Config | undefined,
    readonly timestamp: number,
    readonly httpETag: string | undefined) {
  }

  with(timestamp: number): ProjectConfig { return new ProjectConfig(this.configJson, this.config, timestamp, this.httpETag); }

  get isEmpty(): boolean { return !this.config; }

  isExpired(expirationMs: number): boolean {
    return this === ProjectConfig.empty || this.timestamp + expirationMs < ProjectConfig.generateTimestamp();
  }

  static generateTimestamp(): number {
    return new Date().getTime();
  }

  static serialize(config: ProjectConfig): string {
    return config.timestamp + "\n"
      + (config.httpETag ?? "") + "\n"
      + (config.configJson ?? "");
  }

  static deserialize(value: string): ProjectConfig {
    const separatorIndices = Array<number>(2);
    let index = 0;
    for (let i = 0; i < separatorIndices.length; i++) {
      index = value.indexOf("\n", index);
      if (index < 0) {
        throw Error("Number of values is fewer than expected.");
      }

      separatorIndices[i] = index++;
    }

    let endIndex = separatorIndices[0];
    let slice = value.substring(0, endIndex);

    const fetchTime = parseInt(slice);
    if (isNaN(fetchTime)) {
      throw Error("Invalid fetch time: " + slice);
    }

    index = endIndex + 1;
    endIndex = separatorIndices[1];
    slice = value.substring(index, endIndex);

    const httpETag = slice.length > 0 ? slice : void 0;

    index = endIndex + 1;
    slice = value.substring(index);

    let config: Config | undefined;
    let configJson: string | undefined;
    if (slice.length > 0) {
      config = deserializeConfig(slice);
      configJson = slice;
    }

    return new ProjectConfig(configJson, config, fetchTime, httpETag);
  }
}

/* Config model type definition */

export type UnknownSettingType = -1;

export type SettingMap = { readonly [key: string]: Setting };

export type SettingValue = boolean | string | number | null | undefined;

export type VariationIdValue = string | null | undefined;

// NOTE: Although the ConfigJson.ts module already describes the config JSON schema, we need to define a separate
// config model for the following reasons:
// * We want feature flag evaluation to be more tolerant than what the config JSON schema requires (e.g. allow missing
//   values in some cases, consider explicit null values as missing values, etc.) to make flag overrides more convenient
//   to use.
// * We need to do some post-processing to prepare the data structure for feature flag evaluation, i.e. to store a few
//   references into Setting (see also prepareConfig).
// * We need a model that can safely be exposed to consumers, i.e. we want an immutable model to prevent consumers from
//   accidentally changing and messing it up, and a model that is guaranteed to be prepared for feature flag evaluation,
//   so it can be used e.g. to implement a custom flag override data source. (This is why we use class declarations
//   instead of plain interfaces: required private/protected properties prevent assignments like `const x: Config = {}`,
//   which in turn points consumers towards obtaining a config model using deserializeConfig.)
// By means of some helper types like Immutable, we can derive the config model from the config JSON schema definition,
// which, by leveraging TS type checking, prevents the two model from getting out of sync, plus automatically inherits
// JSDoc comments for properties from the config JSON schema definition.

type AdjustedConfigJsonConfig = PartialWithNull<ChangePropType<
  ConfigJson.Config,
  { "p": PartialWithNull<ConfigJson.Preferences> }
>>;

/** Describes a ConfigCat config's data model used for feature flag evaluation. */
export declare abstract class Config implements Immutable<AdjustedConfigJsonConfig> {
  // NOTE: Prevents structural compatibility with arbitrary objects (see the explanation above).
  declare private readonly _guard: unknown;

  declare readonly p?: Immutable<PartialWithNull<ConfigJson.Preferences>> | null;
  declare readonly s?: ReadonlyArray<Segment & ConfigJson.Segment> | null;
  declare readonly f?: { readonly [key: string]: Setting & ConfigJson.SettingUnion } | null;
}

type AdjustedConfigJsonSegment = OptionalWithNull<ConfigJson.Segment, "r">;

/** Describes a segment. */
export declare abstract class Segment implements Immutable<AdjustedConfigJsonSegment> {
  declare readonly n: string;
  declare readonly r?: ReadonlyArray<UserCondition & ConfigJson.UserConditionUnion> | null;
}

type FlattenedConfigJsonSettingValue = PartialWithNull<UnionToIntersection<OmitNeverProps<ConfigJson.SettingValue>>>;

/** Contains a value of one of the possible types. */
export declare abstract class SettingValueModel implements Immutable<FlattenedConfigJsonSettingValue> {
  declare readonly b?: boolean | null;
  declare readonly s?: string | null;
  declare readonly i?: number | null;
  declare readonly d?: number | null;
}

type AdjustedConfigJsonServedValue = ChangePropType<
  OptionalWithNull<ConfigJson.ServedValue, "i">,
  { "v": ConfigJson.SettingValue | NonNullable<SettingValue> }
>;

/** Contains a setting value along with related data. */
export declare abstract class SettingValueContainer<
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
  TValue extends ConfigJson.SettingValue | NonNullable<SettingValue> = SettingValueModel & ConfigJson.SettingValue
> implements Immutable<AdjustedConfigJsonServedValue> {

  declare readonly v: TValue;
  /** @remarks May be missing in the case of flag overrides. */
  declare readonly i?: string | null;
}

type AdjustedConfigJsonSetting = ChangePropType<
  OptionalWithNull<ConfigJson.Setting, "i" | "a" | "r" | "p">,
  { "t": SettingType | UnknownSettingType; "v": ConfigJson.SettingValue | NonNullable<SettingValue> }
>;

/** Describes a feature flag or setting. */
export declare abstract class Setting extends SettingValueContainer<
  ConfigJson.SettingValue & SettingValueModel | NonNullable<SettingValue>
> implements Immutable<AdjustedConfigJsonSetting> {

  /** @remarks Can also be `-1` when the setting comes from a simple flag override. */
  declare readonly t: SettingType | UnknownSettingType;
  declare readonly a?: string | null;
  declare readonly r?: ReadonlyArray<TargetingRule & ConfigJson.TargetingRule> | null;
  declare readonly p?: ReadonlyArray<PercentageOption & ConfigJson.PercentageOption> | null;
  /** @remarks Can be a plain `boolean`, `string` or `number` value in the case of a a simple flag override. */
  declare readonly v: ConfigJson.SettingValue & SettingValueModel | NonNullable<SettingValue>;

  /* eslint-disable @typescript-eslint/naming-convention */
  declare protected _configJsonSalt: string | undefined;
  declare protected _configSegments: ReadonlyArray<Segment> | undefined;
  /* eslint-enable @typescript-eslint/naming-convention */
}

type FlattenedConfigJsonTargetingRule = OptionalWithNull<UnionToIntersection<OmitNeverProps<ConfigJson.TargetingRule>>, "c" | "s" | "p">;

/** Describes a targeting rule. */
export declare abstract class TargetingRule implements Immutable<FlattenedConfigJsonTargetingRule> {
  declare readonly c?: ReadonlyArray<ConditionContainer & ConfigJson.ConditionUnion>;
  declare readonly s?: SettingValueContainer & ConfigJson.ServedValue;
  declare readonly p?: ReadonlyArray<PercentageOption & ConfigJson.PercentageOption>;
}

type AdjustedConfigJsonPercentageOption = OptionalWithNull<ConfigJson.PercentageOption, "i">;

/** Describes a percentage option. */
export declare abstract class PercentageOption extends SettingValueContainer implements Immutable<AdjustedConfigJsonPercentageOption> {
  declare readonly p: number;
}

type FlattenedConfigJsonCondition = PartialWithNull<UnionToIntersection<OmitNeverProps<ConfigJson.ConditionUnion>>>;

/** Contains one of the possible conditions. */
export declare abstract class ConditionContainer implements Immutable<FlattenedConfigJsonCondition> {
  declare readonly u?: UserCondition & ConfigJson.UserConditionUnion | null;
  declare readonly p?: PrerequisiteFlagCondition | null;
  declare readonly s?: SegmentCondition | null;
}

export type Condition = UserCondition | PrerequisiteFlagCondition | SegmentCondition;

type FlattenedConfigJsonUserCondition = OptionalWithNull<UnionToIntersection<OmitNeverProps<ConfigJson.UserCondition>>, "s" | "d" | "l">;

/** Describes a condition that is based on a User Object attribute. */
export declare abstract class UserCondition implements Immutable<FlattenedConfigJsonUserCondition> {
  declare readonly a: string;
  declare readonly c: UserComparator;
  declare readonly s?: string | null;
  declare readonly d?: number | null;
  declare readonly l?: ReadonlyArray<string> | null;
}

/** Describes a condition that is based on a prerequisite flag. */
export declare abstract class PrerequisiteFlagCondition implements Immutable<ConfigJson.PrerequisiteFlagCondition> {
  declare readonly f: string;
  declare readonly c: PrerequisiteFlagComparator;
  declare readonly v: SettingValueModel & ConfigJson.SettingValue;
}

/** Describes a condition that is based on a segment. */
export declare abstract class SegmentCondition implements Immutable<ConfigJson.SegmentCondition> {
  declare readonly s: number;
  declare readonly c: SegmentComparator;
}

/* Config model helper functions & types */

/**
 * Deserializes the specified config JSON to a `Config` model that can be used for feature flag evaluation.
 *
 * @remarks Does superficial model validation only, meaning that the method makes sure that the specified config JSON
 * matches the type definition of the `Config` model, but doesn't check for semantic issues. E.g. doesn't validate
 * whether referenced segments and feature flags actually exist. (Such issues are checked during feature flag evaluation.)
 */
export function deserializeConfig(configJson: string): Config {
  const configJsonParsed: unknown = JSON.parse(configJson);
  return prepareConfig(configJsonParsed as ConfigJson.Config);
}

/**
 * Prepares the specified preparsed config JSON so it can be used for feature flag evaluation. Makes direct
 * modifications to the specified object and returns the same reference cast as type `Config`.
 *
 * @remarks Does superficial model validation only, meaning that the method makes sure that the specified config JSON
 * matches the type definition of the `Config` model, but doesn't check for semantic issues. E.g. doesn't validate
 * whether referenced segments and feature flags actually exist. (Such issues are checked during feature flag evaluation.)
 */
export function prepareConfig(config: Partial<ConfigJson.Config>): Config {
  checkConfig(config, ["$"]);

  const settings = config.f;
  if (settings) {
    const salt = config.p?.s;
    const segments = config.s;

    for (const key in settings) {
      if (Object.prototype.hasOwnProperty.call(settings, key)) {
        const setting = settings[key];
        setting["_configJsonSalt"] = salt;
        setting["_configSegments"] = segments;
      }
    }
  }

  return config;
}

/**
 * Creates a setting that can be used for feature flag evaluation from the specified value.
 */
export function createSettingFromValue(value: NonNullable<SettingValue>): Setting {
  return {
    t: -1 satisfies UnknownSettingType,
    v: value,
  } satisfies Partial<Setting> as Setting;
}

function checkConfig(config: Partial<ConfigJson.Config>, path: string[]): asserts config is Config & Partial<ConfigJson.Config> {
  if (config == null) {
    throwConfigJsonMissingRequiredValue(path);
  }
  ensureObject(config, path);

  checkObjectProperty(config, "p", path, checkPreferences);
  checkObjectProperty(config, "s", path, checkSegments);
  checkObjectProperty(config, "f", path, checkSettings);
}

function checkPreferences(preferences: ConfigJson.Preferences, path: string[]) {
  ensureObject(preferences, path);

  checkObjectProperty(preferences, "r", path, ensureInteger);
  checkObjectProperty(preferences, "u", path, ensureString);
  checkObjectProperty(preferences, "s", path, ensureString);
}

function checkSegments(segments: ConfigJson.Segment[], path: string[]) {
  ensureArray(segments, path);

  for (let i = 0; i < segments.length; i++) {
    checkArrayElement(segments, i, path, checkSegment);
  }
}

function checkSegment(segment: ConfigJson.Segment, path: string[]) {
  ensureObject(segment, path);

  checkObjectProperty(segment, "n", path, ensureString, true);
  checkObjectProperty(segment, "r", path, checkSegmentConditions);
}

function checkSettings(settings: { [key: string]: ConfigJson.SettingUnion }, path: string[]) {
  ensureObject(settings, path);

  for (const key in settings) {
    if (Object.prototype.hasOwnProperty.call(settings, key)) {
      checkObjectProperty(settings, key, path, checkSetting, true);
    }
  }
}

function checkSetting(setting: ConfigJson.SettingUnion, path: string[]) {
  ensureObject(setting, path);

  checkObjectProperty(setting, "t", path, ensureInteger, true);
  checkObjectProperty(setting, "a", path, ensureString);
  checkObjectProperty(setting, "r", path, checkTargetingRules);
  checkObjectProperty(setting, "p", path, checkPercentageOptions);
  checkServedValue(setting, path);
}

function checkTargetingRules(targetingRules: ConfigJson.TargetingRule[], path: string[]) {
  ensureArray(targetingRules, path);

  for (let i = 0; i < targetingRules.length; i++) {
    checkArrayElement(targetingRules, i, path, checkTargetingRule);
  }
}

function checkTargetingRule(targetingRule: ConfigJson.TargetingRule, path: string[]) {
  ensureObject(targetingRule, path);

  checkObjectProperty(targetingRule, "c", path, checkConditions);
  checkObjectProperty(targetingRule, "s", path, checkServedValue);
  checkObjectProperty(targetingRule, "p", path, checkPercentageOptions);
}

function checkConditions(conditions: ConfigJson.ConditionUnion[], path: string[]) {
  ensureArray(conditions, path);

  for (let i = 0; i < conditions.length; i++) {
    checkArrayElement(conditions, i, path, checkCondition);
  }
}

function checkSegmentConditions(conditions: ConfigJson.UserCondition[], path: string[]) {
  ensureArray(conditions, path);

  for (let i = 0; i < conditions.length; i++) {
    checkArrayElement(conditions, i, path, checkUserCondition);
  }
}

function checkCondition(condition: ConfigJson.ConditionUnion, path: string[]) {
  ensureObject(condition, path);

  checkObjectProperty(condition, "u", path, checkUserCondition);
  checkObjectProperty(condition, "p", path, checkPrerequisiteFlagCondition);
  checkObjectProperty(condition, "s", path, checkSegmentCondition);
}

function checkUserCondition(condition: ConfigJson.UserCondition, path: string[]) {
  ensureObject(condition, path);

  checkObjectProperty(condition, "a", path, ensureString, true);
  checkObjectProperty(condition, "c", path, ensureInteger, true);
  checkObjectProperty(condition, "s", path, ensureString);
  checkObjectProperty(condition, "d", path, ensureNumber);
  checkObjectProperty(condition, "l", path, checkComparisonValues);
}

function checkComparisonValues(comparisonValues: string[], path: string[]) {
  ensureArray(comparisonValues, path);

  for (let i = 0; i < comparisonValues.length; i++) {
    checkArrayElement(comparisonValues, i, path, ensureString);
  }
}

function checkPrerequisiteFlagCondition(condition: ConfigJson.PrerequisiteFlagCondition, path: string[]) {
  ensureObject(condition, path);

  checkObjectProperty(condition, "f", path, ensureString, true);
  checkObjectProperty(condition, "c", path, ensureInteger, true);
  checkObjectProperty(condition, "v", path, checkSettingValue, true);
}

function checkSegmentCondition(condition: ConfigJson.SegmentCondition, path: string[]) {
  ensureObject(condition, path);

  checkObjectProperty(condition, "s", path, ensureInteger, true);
  checkObjectProperty(condition, "c", path, ensureInteger, true);
}

function checkPercentageOptions(percentageOptions: ConfigJson.PercentageOption[], path: string[]) {
  ensureArray(percentageOptions, path);

  for (let i = 0; i < percentageOptions.length; i++) {
    checkArrayElement(percentageOptions, i, path, checkPercentageOption);
  }
}

function checkPercentageOption(percentageOption: ConfigJson.PercentageOption, path: string[]) {
  ensureObject(percentageOption, path);

  checkObjectProperty(percentageOption, "p", path, ensureInteger, true);
  checkServedValue(percentageOption, path);
}

function checkServedValue(servedValue: ConfigJson.ServedValue, path: string[]) {
  ensureObject(servedValue, path);

  checkObjectProperty(servedValue, "v", path, checkSettingValue, true);
  checkObjectProperty(servedValue, "i", path, ensureString);
}

function checkSettingValue(settingValue: ConfigJson.SettingValue, path: string[]) {
  ensureObject(settingValue, path);

  checkObjectProperty(settingValue, "b", path, ensureBoolean);
  checkObjectProperty(settingValue, "s", path, ensureString);
  checkObjectProperty(settingValue, "i", path, ensureInteger);
  checkObjectProperty(settingValue, "d", path, ensureNumber);
}

function checkArrayElement<T>(obj: T[], index: number, path: string[],
  callback: (item: T, path: string[]) => void
): void {
  const item = obj[index];
  path.push(`[${index}]`);
  if (item == null) {
    throwConfigJsonMissingRequiredValue(path);
  }
  callback(item, path);
  path.pop();
}

function checkObjectProperty<T, K extends string & keyof T>(obj: T, property: K, path: string[],
  callback: (propertyValue: NonNullable<T[K]>, path: string[]) => void, isRequired?: boolean
): void {
  const propertyValue = obj[property];
  path.push(`.${property}`);
  if (propertyValue == null) {
    if (isRequired) {
      throwConfigJsonMissingRequiredValue(path);
    }
  } else {
    callback(propertyValue, path);
  }
  path.pop();
}

function ensureArray(value: unknown[], path: string[]) {
  isArray(value) || throwConfigJsonTypeMismatchError(path);
}

function ensureObject(value: object, path: string[]) {
  isObject(value) || throwConfigJsonTypeMismatchError(path);
}

function ensureBoolean(value: boolean, path: string[]) {
  typeof value === "boolean" || throwConfigJsonTypeMismatchError(path);
}

function ensureString(value: string, path: string[]) {
  typeof value === "string" || throwConfigJsonTypeMismatchError(path);
}

function ensureInteger(value: number, path: string[]) {
  typeof value === "number" && Number.isSafeInteger(value) || throwConfigJsonTypeMismatchError(path);
}

function ensureNumber(value: number, path: string[]) {
  typeof value === "number" || throwConfigJsonTypeMismatchError(path);
}

function throwConfigJsonMissingRequiredValue(path: string[]): never {
  throw TypeError(`Invalid config JSON content. Missing required value at ${path.join("")}`);
}

function throwConfigJsonTypeMismatchError(path: string[]): never {
  throw TypeError(`Invalid config JSON content. Type mismatch at ${path.join("")}`);
}

export function nameOfSettingType(value: SettingType): string {
  /// @ts-expect-error Reverse mapping does work because of `preserveConstEnums`.
  return ConfigJson.SettingType[value] as string;
}

export class InvalidConfigModelError extends Error {
  readonly name = InvalidConfigModelError.name;

  constructor(
    readonly message: string
  ) {
    super(message);
    ensurePrototype(this, InvalidConfigModelError);
  }
}

/* Utility types */

/** Recursively makes object `T` immutable by making arrays and object properties read-only. */
type Immutable<T> = { readonly [K in keyof T]:
  NonNullable<T[K]> extends ReadonlyArray<infer U> ? ReadonlyArray<Immutable<U>> | (T[K] & (null | undefined))
  : NonNullable<T[K]> extends object ? Immutable<T[K]>
  : T[K]
};

/** Makes all properties optional in object `T` while also allowing `null`. */
type PartialWithNull<T> = { [P in keyof T]?: T[P] | null };

/** Makes properties specified by `K` optional in object `T` while also allowing `null`. */
// https://stackoverflow.com/a/61108377/8656352
type OptionalWithNull<T, K extends keyof T> = Pick<PartialWithNull<T>, K> & Omit<T, K>;

/** Changes the type of properties specified by `TPropMap` in object `T`. */
type ChangePropType<T, TPropMap extends { [K in keyof T]?: unknown }> = {
  [K in keyof T]: K extends keyof TPropMap ? TPropMap[K] : T[K];
};

/** Removes properties of type `never` from object `T`. */
type OmitNeverProps<T> = Pick<T, { [K in keyof T]: T[K] extends never ? never : K }[keyof T]>;

/** Converts union type `U` to an intersection type. */
// See also: https://stackoverflow.com/a/50375286/8656352
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never;

import type { PrerequisiteFlagComparator, SegmentComparator, SettingType, UserComparator } from "./ConfigJson";
import * as ConfigJson from "./ConfigJson";
import { ensurePrototype, isObject } from "./Utils";

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

export type SettingValue = boolean | string | number | null | undefined;
export type VariationIdValue = string | null | undefined;

// NOTE: Although the ConfigJson.ts module already describes the config JSON schema, we need to define a separate
// config model for the following reasons:
// * We need to do some post-processing to prepare the data structure for feature flag evaluation, i.e. to add a few
//   references to Setting (see also fixupSaltAndSegments).
// * We need a model that can safely be exposed to consumers, i.e. we want an immutable model to prevent consumers from
//   accidentally changing and messing it up, and a model that is guaranteed to be prepared for feature flag evaluation,
//   so it can be used e.g. to implement a custom flag override data source. (This is why we use class declarations
//   instead of plain interfaces: required private/protected properties prevent assignments like `const c: Config = {}`,
//   which in turn points consumers towards obtaining a config model using deserializeConfig.)
// By means of some helper types like Immutable, we can derive the config model from the config JSON schema definition,
// which, by leveraging TS type checking, prevents the two model from getting out of sync. (Plus, automatically inherits
// JSDoc comments for properties from the config JSON schema definition.)

/**
 * Describes a ConfigCat config's data model used for feature flag evaluation.
 */
export declare abstract class Config implements Immutable<Partial<ConfigJson.Config>> {
  // NOTE: Prevents structural compatibility with arbitrary objects (see the explanation above).
  declare private readonly _guard: unknown;

  declare readonly p?: Immutable<ConfigJson.Preferences>;
  declare readonly s?: ReadonlyArray<Segment>;
  declare readonly f?: { readonly [key: string]: Setting & ConfigJson.SettingUnion };
}

/** Describes a segment. */
export declare abstract class Segment implements Immutable<ConfigJson.Segment> {
  declare readonly n: string;
  declare readonly r: ReadonlyArray<UserCondition & ConfigJson.UserConditionUnion>;
}

type FlattenedConfigJsonSettingValue = Partial<UnionToIntersection<OmitNeverProps<ConfigJson.SettingValue>>>;

/** Contains a value of one of the possible types. */
export declare abstract class SettingValueModel implements Immutable<FlattenedConfigJsonSettingValue> {
  declare readonly b?: boolean;
  declare readonly s?: string;
  declare readonly i?: number;
  declare readonly d?: number;
}

type ModifiedConfigJsonServedValue = Optional<ConfigJson.ServedValue, "i">;

/** Contains a setting value along with related data. */
export declare abstract class SettingValueContainer implements Immutable<ModifiedConfigJsonServedValue> {
  declare readonly v: SettingValueModel & ConfigJson.SettingValue;
  /** @remarks May be missing in the case of flag overrides. */
  declare readonly i?: string;
}

type ModifiedConfigJsonSetting = ChangePropType<Optional<ConfigJson.Setting, "i">, { "t": SettingType | UnknownSettingType }>;

/** Describes a feature flag or setting. */
export declare abstract class Setting extends SettingValueContainer implements Immutable<ModifiedConfigJsonSetting> {
  /** @remarks Can also be `-1` when the setting comes from a simple flag override. */
  declare readonly t: SettingType | UnknownSettingType;
  declare readonly a?: string;
  declare readonly r?: ReadonlyArray<TargetingRule & ConfigJson.TargetingRule>;
  declare readonly p?: ReadonlyArray<PercentageOption & ConfigJson.PercentageOption>;

  /* eslint-disable @typescript-eslint/naming-convention */
  declare protected _configJsonSalt: string | undefined;
  declare protected _configSegments: ReadonlyArray<Segment> | undefined;
  /* eslint-enable @typescript-eslint/naming-convention */
}

type FlattenedConfigJsonTargetingRule = Optional<UnionToIntersection<OmitNeverProps<ConfigJson.TargetingRule>>, "s" | "p">;

/** Describes a targeting rule. */
export declare abstract class TargetingRule implements Immutable<FlattenedConfigJsonTargetingRule> {
  declare readonly c: ReadonlyArray<ConditionContainer & ConfigJson.ConditionUnion>;
  declare readonly s?: SettingValueContainer & ConfigJson.ServedValue;
  declare readonly p?: ReadonlyArray<PercentageOption & ConfigJson.PercentageOption>;
}

type ModifiedConfigJsonPercentageOption = Optional<ConfigJson.PercentageOption, "i">;

/** Describes a percentage option. */
export declare abstract class PercentageOption extends SettingValueContainer implements Immutable<ModifiedConfigJsonPercentageOption> {
  declare readonly p: number;
}

type FlattenedConfigJsonCondition = Partial<UnionToIntersection<OmitNeverProps<ConfigJson.ConditionUnion>>>;

/** Contains one of the possible conditions. */
export declare abstract class ConditionContainer implements Immutable<FlattenedConfigJsonCondition> {
  declare readonly u?: UserCondition & ConfigJson.UserConditionUnion;
  declare readonly p?: PrerequisiteFlagCondition;
  declare readonly s?: SegmentCondition;
}

export type Condition = UserCondition | PrerequisiteFlagCondition | SegmentCondition;

type FlattenedConfigJsonUserCondition = Optional<UnionToIntersection<OmitNeverProps<ConfigJson.UserCondition>>, "s" | "d" | "l">;

/** Describes a condition that is based on a User Object attribute. */
export declare abstract class UserCondition implements Immutable<FlattenedConfigJsonUserCondition> {
  declare readonly a: string;
  declare readonly c: UserComparator;
  declare readonly s?: string;
  declare readonly d?: number;
  declare readonly l?: ReadonlyArray<string>;
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
 * Deserializes a config JSON into a config model that can be passed to feature flag evaluation.
 *
 * @remarks The SDK doesn't do preliminary model validation on deserialization, meaning that if you create a model from
 * a config JSON not conforming to the expected schema, the returned config model object won't match the data model
 * described by the `Config` type either.
 */
export function deserializeConfig(configJson: string): Config {
  const configJsonParsed: unknown = JSON.parse(configJson);
  if (!isObject(configJsonParsed)) {
    throw Error("Invalid config JSON content:" + configJson);
  }

  return fixupSaltAndSegments(configJsonParsed as ConfigJson.Config);
}

/**
 * Prepares a parsed config JSON so it can be passed to feature flag evaluation.
 * @remarks Makes direct modifications to the `config` object and returns the same reference reinterpreted as `Config`.
 */
function fixupSaltAndSegments(config: Partial<ConfigJson.Config>): Config {
  const settingMap = config.f;
  let settings: ReadonlyArray<ConfigJson.SettingUnion>;
  if (isObject(settingMap) && (settings = Object.values(settingMap)).length) {
    const salt = config.p?.s;
    const segments = config.s;
    for (const setting of settings as ReadonlyArray<Setting>) {
      setting["_configJsonSalt"] = salt;
      setting["_configSegments"] = segments;
    }
  }

  return config as Config;
}

export { fixupSaltAndSegments as prepareConfig };

/**
 * Creates a setting that can be passed to feature flag evaluation from the specified `value`.
 */
export function createSettingFromValue(value: NonNullable<SettingValue>): Setting {
  return {
    t: -1 satisfies UnknownSettingType,
    v: value,
  } as unknown as Setting;
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
  NonNullable<T[K]> extends ReadonlyArray<infer U> ? ReadonlyArray<Immutable<U>>
  : NonNullable<T[K]> extends object ? Immutable<T[K]>
  : T[K]
};

/** Makes properties specified by `K` optional in object `T`. */
// https://stackoverflow.com/a/61108377/8656352
type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;

/** Changes the type of properties specified by `TPropMap` in object `T`. */
type ChangePropType<T, TPropMap extends { [K in keyof T]?: unknown }> = {
  [K in keyof T]: K extends keyof TPropMap ? TPropMap[K] : T[K];
};

/** Removes properties of type `never` from object `T`. */
type OmitNeverProps<T> = Pick<T, { [K in keyof T]: T[K] extends never ? never : K }[keyof T]>;

/** Converts union type `U` to an intersection type. */
// See also: https://stackoverflow.com/a/50375286/8656352
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never;

// NOTE: Config models may come from unreliable sources (flag overrides, custom config fetcher, etc.). Since, by design,
// we don't do preliminary model validation, the feature flag evaluation logic is implemented so that it doesn't
// make any assumptions about the validity of the config model. The following types allows us to encode assumptions that
// are safe to be made, while also preserving hints about the expected types at the source code level.

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type Maybe<T> = unknown;
export type ArrayOfMaybe<T> = ReadonlyArray<Maybe<T>>;
export type MapOfMaybe<T extends object> = { readonly [key: string]: Maybe<T> };
export type ObjectMaybe<T extends object> = { readonly [K in keyof T]?: Maybe<T[K]> };

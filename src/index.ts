/* Package public API (common part) */

// List types and functionality here which should be exposed to end users on EVERY platform.
// These exports should be re-exported in the entry module of each platform-specific SDK!

export type { IConfigCatCache } from "./ConfigCatCache";

export type { IConfigCatClient, IConfigCatClientSnapshot } from "./ConfigCatClient";

export type { IAutoPollOptions, ILazyLoadingOptions, IManualPollOptions, IOptions } from "./ConfigCatClientOptions";

export { DataGovernance, PollingMode } from "./ConfigCatClientOptions";

export type { IConfigCatLogger, LogEventId, LogFilterCallback, LogMessage } from "./ConfigCatLogger";

export { FormattableLogMessage, LogLevel } from "./ConfigCatLogger";

export type { FetchErrorCauses, IConfigCatConfigFetcher } from "./ConfigFetcher";

export { FetchError, FetchRequest, FetchResponse } from "./ConfigFetcher";

export { PrerequisiteFlagComparator, SegmentComparator, SettingType, UserComparator } from "./ConfigJson";

export { ClientCacheState, RefreshErrorCode, RefreshResult } from "./ConfigServiceBase";

export type { FlagOverrides, IOverrideDataSource } from "./FlagOverrides";

export { OverrideBehaviour } from "./FlagOverrides";

export type {
  Condition, ConditionContainer, Config, PercentageOption, PrerequisiteFlagCondition, Segment, SegmentCondition,
  Setting, SettingValue, SettingValueContainer, SettingValueModel, TargetingRule, UserCondition, VariationIdValue,
} from "./ProjectConfig";

export { ConfigJson, deserializeConfig, prepareConfig, createSettingFromValue } from "./ProjectConfig";

export type { IEvaluationDetails, SettingKeyValue, SettingTypeOf } from "./RolloutEvaluator";

export { EvaluationErrorCode } from "./RolloutEvaluator";

export type { IUser, UserAttributeValue } from "./User";

export { User } from "./User";

export type { HookEvents, IProvidesConfigCatClient, IProvidesHooks } from "./Hooks";

export type { Message } from "./Utils";

/* Package public API (common part) */

// List types and functionality here which should be exposed to end users on EVERY platform.
// These exports should be re-exported in the entry module of each platform-specific SDK!

export { PollingMode } from "./ConfigCatClientOptions";

export type { IAutoPollOptions, ILazyLoadingOptions, IManualPollOptions, IOptions } from "./ConfigCatClientOptions";

export { DataGovernance } from "./ConfigCatClientOptions";

export type { IConfigCatLogger, LogEventId, LogMessage } from "./ConfigCatLogger";

export { LogLevel } from "./ConfigCatLogger";

export { FormattableLogMessage } from "./ConfigCatLogger";

export type { IConfigCatCache } from "./ConfigCatCache";

export type {
  ConditionTypeMap, ICondition, IConditionUnion, IConfig, IPercentageOption, IPrerequisiteFlagCondition,
  ISegment, ISegmentCondition, ISetting, ISettingUnion, ISettingValueContainer, ITargetingRule,
  IUserCondition, IUserConditionUnion, SettingTypeMap, SettingValue, UserConditionComparisonValueTypeMap,
  VariationIdValue
} from "./ProjectConfig";

export { PrerequisiteFlagComparator, SegmentComparator, SettingType, UserComparator } from "./ConfigJson";

export type { IConfigCatClient, IConfigCatClientSnapshot } from "./ConfigCatClient";

export { SettingKeyValue } from "./ConfigCatClient";

export type { IEvaluationDetails, SettingTypeOf } from "./RolloutEvaluator";

export type { UserAttributeValue } from "./User";

export { User } from "./User";

export type { FlagOverrides } from "./FlagOverrides";

export { OverrideBehaviour } from "./FlagOverrides";

export { ClientCacheState, RefreshResult } from "./ConfigServiceBase";

export type { HookEvents, IProvidesHooks } from "./Hooks";

export { ConfigJson } from "./ProjectConfig";

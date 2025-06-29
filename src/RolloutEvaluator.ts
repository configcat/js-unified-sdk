import type { LoggerWrapper, LogMessage } from "./ConfigCatLogger";
import { LogLevel, toMessage } from "./ConfigCatLogger";
import { PrerequisiteFlagComparator, SegmentComparator, SettingType, UserComparator } from "./ConfigJson";
import { EvaluateLogBuilder, formatSegmentComparator, formatUserCondition, inferValue, valueToString } from "./EvaluateLogBuilder";
import { sha1, sha256 } from "./Hash";
import type { ArrayOfMaybe, Condition, ConditionContainer, MapOfMaybe, Maybe, ObjectMaybe, PercentageOption, PrerequisiteFlagCondition, ProjectConfig, Segment, SegmentCondition, Setting, SettingValue, SettingValueContainer, SettingValueModel, TargetingRule, UnknownSettingType, UserCondition, VariationIdValue } from "./ProjectConfig";
import { InvalidConfigModelError, nameOfSettingType } from "./ProjectConfig";
import type { ISemVer } from "./Semver";
import { parse as parseSemVer } from "./Semver";
import type { IUser, UserAttributeValue, WellKnownUserObjectAttribute } from "./User";
import { getUserAttribute, getUserAttributes, getUserIdentifier } from "./User";
import type { Message } from "./Utils";
import { ensurePrototype, errorToString, formatStringList, isArray, isNumberInRange, isObject, isStringArray, LazyString, parseFloatStrict, parseIntStrict, utf8Encode } from "./Utils";

export class EvaluateContext {
  private _settingType?: SettingType | UnknownSettingType;
  get settingType(): SettingType | UnknownSettingType { return this._settingType ??= getSettingType(this.setting); }

  private _visitedFlags?: string[];
  get visitedFlags(): string[] { return this._visitedFlags ??= []; }

  isMissingUserObjectLogged?: boolean;
  isMissingUserObjectAttributeLogged?: boolean;

  logBuilder?: EvaluateLogBuilder; // initialized by RolloutEvaluator.evaluate

  constructor(
    readonly key: string,
    readonly setting: ObjectMaybe<Setting>, // type ensured by RolloutEvaluator.evaluate
    readonly user: IUser | undefined,
    readonly settings: MapOfMaybe<Setting>
  ) {
  }

  static forPrerequisiteFlag(key: string, setting: ObjectMaybe<Setting>, dependentFlagContext: EvaluateContext): EvaluateContext {
    const context = new EvaluateContext(key, setting, dependentFlagContext.user, dependentFlagContext.settings);
    context._visitedFlags = dependentFlagContext.visitedFlags; // crucial to use the computed property here to make sure the list is created!
    context.logBuilder = dependentFlagContext.logBuilder;
    return context;
  }
}

export interface IEvaluateResult {
  returnValue: NonNullable<SettingValue>;
  selectedValue: SettingValueContainer;
  matchedTargetingRule?: TargetingRule;
  matchedPercentageOption?: PercentageOption;
}

type IntermediateEvaluateResult = Omit<IEvaluateResult, "returnValue">;

export interface IRolloutEvaluator {
  evaluate(defaultValue: SettingValue, context: EvaluateContext): IEvaluateResult;
}

const targetingRuleIgnoredMessage = "The current targeting rule is ignored and the evaluation continues with the next rule.";

const missingUserObjectError = "cannot evaluate, User Object is missing";
const missingUserAttributeError = (attributeName: string) => `cannot evaluate, the User.${attributeName} attribute is missing`;
const invalidUserAttributeError = (attributeName: string, reason: string) => `cannot evaluate, the User.${attributeName} attribute is invalid (${reason})`;

export class RolloutEvaluator implements IRolloutEvaluator {
  constructor(private readonly logger: LoggerWrapper) {
  }

  evaluate(defaultValue: SettingValue, context: EvaluateContext): IEvaluateResult {
    this.logger.debug("RolloutEvaluator.evaluate() called.");

    let logBuilder = context.logBuilder;

    // Building the evaluation log is expensive, so let's not do it if it wouldn't be logged anyway.
    if (this.logger.isEnabled(LogLevel.Info)) {
      context.logBuilder = logBuilder = new EvaluateLogBuilder(this.logger.eol);

      logBuilder.append(`Evaluating '${context.key}'`);

      if (context.user) {
        logBuilder.append(` for User '${JSON.stringify(getUserAttributes(context.user))}'`);
      }

      logBuilder.increaseIndent();
    }

    let returnValue: SettingValue;
    try {
      // NOTE: We've already checked earlier in the call chain that the defaultValue is of an allowed type (see also ensureAllowedDefaultValue).

      const setting = ensureSetting(context.setting);

      // Setting type -1 indicates a setting which comes from a simple flag override (see also createSettingFromValue and getSettingType).
      const settingType = context.settingType;
      const inferredSettingType = settingType !== (-1 satisfies UnknownSettingType)
        ? settingType
        : inferSettingType(setting.v);

      // When a default value other than null or undefined is specified, the return value must have the same type as the default value
      // so that the consistency between TS (compile-time) and JS (run-time) return value types is maintained.
      if (defaultValue != null
        && inferredSettingType !== void 0 // the case of unsupported flag override values is handled by the unwrapValue call below
        && !isCompatibleValue(defaultValue, inferredSettingType)
      ) {
        const settingTypeName = nameOfSettingType(inferredSettingType);
        throw new EvaluationError(EvaluationErrorCode.SettingValueTypeMismatch,
          "The type of a setting must match the type of the specified default value. "
          + `Setting's type was ${settingTypeName} but the default value's type was ${typeof defaultValue}. `
          + `Please use a default value which corresponds to the setting type ${settingTypeName}. `
          + "Learn more: https://configcat.com/docs/sdk-reference/js/#setting-type-mapping");
      }

      const result = this.evaluateSetting(context) as IEvaluateResult;
      result.returnValue = returnValue = unwrapValue(result.selectedValue.v, settingType);
      return result;
    } catch (err) {
      logBuilder?.resetIndent().increaseIndent();

      returnValue = defaultValue;
      throw err;
    } finally {
      if (logBuilder) {
        logBuilder.newLine(`Returning '${returnValue}'.`)
          .decreaseIndent();
        this.logger.settingEvaluated(logBuilder.toString());
      }
    }
  }

  private evaluateSetting(context: EvaluateContext): IntermediateEvaluateResult {
    let evaluateResult: IntermediateEvaluateResult | undefined;

    const targetingRules = ensureTargetingRuleList(context.setting.r);
    if (targetingRules.length > 0 && (evaluateResult = this.evaluateTargetingRules(targetingRules, context))) {
      return evaluateResult;
    }

    const percentageOptions = ensurePercentageOptionList(context.setting.p);
    if (percentageOptions.length > 0 && (evaluateResult = this.evaluatePercentageOptions(percentageOptions, void 0, context))) {
      return evaluateResult;
    }

    return { selectedValue: context.setting as SettingValueContainer };
  }

  private evaluateTargetingRules(targetingRules: ArrayOfMaybe<TargetingRule>, context: EvaluateContext): IntermediateEvaluateResult | undefined {
    const logBuilder = context.logBuilder;

    logBuilder?.newLine("Evaluating targeting rules and applying the first match if any:");

    for (let i = 0; i < targetingRules.length; i++) {
      const targetingRule = ensureTargetingRule(targetingRules[i]);
      const conditions = ensureConditionList<ConditionContainer>(targetingRule.c);

      const isMatchOrError = this.evaluateConditions(conditions, void 0, targetingRule, context.key, context);

      if (isMatchOrError !== true) {
        if (isEvaluationError(isMatchOrError)) {
          logBuilder?.increaseIndent()
            .newLine(targetingRuleIgnoredMessage)
            .decreaseIndent();
        }
        continue;
      }

      if (!hasPercentageOptions(targetingRule)) {
        return {
          selectedValue: targetingRule.s as SettingValueContainer,
          matchedTargetingRule: targetingRule as TargetingRule,
        };
      }

      const percentageOptions = targetingRule.p as ArrayOfMaybe<PercentageOption>;

      logBuilder?.increaseIndent();

      const evaluateResult = this.evaluatePercentageOptions(percentageOptions, targetingRule, context);
      if (evaluateResult) {
        logBuilder?.decreaseIndent();
        return evaluateResult;
      }

      logBuilder?.newLine(targetingRuleIgnoredMessage)
        .decreaseIndent();
    }
  }

  private evaluatePercentageOptions(percentageOptions: ArrayOfMaybe<PercentageOption>,
    matchedTargetingRule: ObjectMaybe<TargetingRule> | undefined, context: EvaluateContext
  ): IntermediateEvaluateResult | undefined {
    const logBuilder = context.logBuilder;

    if (!context.user) {
      logBuilder?.newLine("Skipping % options because the User Object is missing.");

      if (!context.isMissingUserObjectLogged) {
        this.logger.userObjectIsMissing(context.key);
        context.isMissingUserObjectLogged = true;
      }

      return;
    }

    let percentageOptionsAttributeName = context.setting.a as string | null | undefined;
    let percentageOptionsAttributeValue: UserAttributeValue | null | undefined;
    if (percentageOptionsAttributeName == null) {
      percentageOptionsAttributeName = "Identifier" satisfies WellKnownUserObjectAttribute;
      percentageOptionsAttributeValue = getUserIdentifier(context.user);
    } else if (typeof percentageOptionsAttributeName === "string") {
      percentageOptionsAttributeValue = getUserAttribute(context.user, percentageOptionsAttributeName);
    } else {
      throwInvalidConfigModelError("Percentage evaluation attribute is invalid.");
    }

    if (percentageOptionsAttributeValue == null) {
      logBuilder?.newLine(`Skipping % options because the User.${percentageOptionsAttributeName} attribute is missing.`);

      if (!context.isMissingUserObjectAttributeLogged) {
        this.logger.userObjectAttributeIsMissingPercentage(context.key, percentageOptionsAttributeName);
        context.isMissingUserObjectAttributeLogged = true;
      }

      return;
    }

    logBuilder?.newLine(`Evaluating % options based on the User.${percentageOptionsAttributeName} attribute:`);

    const sha1Hash = sha1(context.key + userAttributeValueToString(percentageOptionsAttributeValue));
    const hashValue = parseInt(sha1Hash.substring(0, 7), 16) % 100;

    logBuilder?.newLine(`- Computing hash in the [0..99] range from User.${percentageOptionsAttributeName} => ${hashValue} (this value is sticky and consistent across all SDKs)`);

    let bucket = 0;
    for (let i = 0; i < percentageOptions.length; i++) {
      const percentageOption = ensurePercentageOption(percentageOptions[i]);

      const percentage = percentageOption.p;
      if (typeof percentage !== "number" || percentage < 0) {
        throwInvalidConfigModelError("Percentage is missing or invalid.");
      }

      bucket += percentage;

      if (hashValue >= bucket) {
        continue;
      }

      if (logBuilder) {
        const percentageOptionValue = unwrapValue(percentageOption.v, context.settingType, true);
        logBuilder.newLine(`- Hash value ${hashValue} selects % option ${i + 1} (${percentage}%), '${valueToString(percentageOptionValue)}'.`);
      }

      return {
        selectedValue: percentageOption as SettingValueContainer,
        matchedTargetingRule: matchedTargetingRule as TargetingRule,
        matchedPercentageOption: percentageOption as PercentageOption,
      };
    }

    throwInvalidConfigModelError("Sum of percentage option percentages is less than 100.");
  }

  private evaluateConditions(conditions: ArrayOfMaybe<ConditionContainer | Condition>, conditionType: (keyof ConditionContainer) | undefined,
    targetingRule: ObjectMaybe<TargetingRule> | undefined, contextSalt: string, context: EvaluateContext
  ): boolean | string {
    // The result of a condition evaluation is either match (true) / no match (false) or an error (string).
    let result: boolean | string = true;

    const logBuilder = context.logBuilder;
    let newLineBeforeThen = false;

    logBuilder?.newLine("- ");

    const unwrapCondition = !conditionType;
    for (let i = 0; i < conditions.length; i++) {
      let condition: ObjectMaybe<Condition>;
      if (unwrapCondition) {
        const container = conditions[i];
        conditionType = getConditionType(container)!;
        condition = conditionType ? (container as ConditionContainer)[conditionType]! : ensureCondition(void 0);
      } else {
        condition = ensureCondition(conditions[i]);
      }

      if (logBuilder) {
        if (!i) {
          logBuilder.append("IF ")
            .increaseIndent();
        } else {
          logBuilder.increaseIndent()
            .newLine("AND ");
        }
      }

      switch (conditionType!) {
        case "u" satisfies keyof ConditionContainer:
          result = this.evaluateUserCondition(condition as ObjectMaybe<UserCondition>, contextSalt, context);
          newLineBeforeThen = conditions.length > 1;
          break;

        case "p" satisfies keyof ConditionContainer:
          result = this.evaluatePrerequisiteFlagCondition(condition as ObjectMaybe<PrerequisiteFlagCondition>, context);
          newLineBeforeThen = true;
          break;

        case "s" satisfies keyof ConditionContainer:
          result = this.evaluateSegmentCondition(condition as ObjectMaybe<SegmentCondition>, context);
          newLineBeforeThen = !isEvaluationError(result) || result !== missingUserObjectError || conditions.length > 1;
          break;

        default:
          throw Error(); // execution should never get here
      }

      const success = result === true;

      if (logBuilder) {
        if (!targetingRule || conditions.length > 1) {
          logBuilder.appendConditionConsequence(success);
        }

        logBuilder.decreaseIndent();
      }

      if (!success) {
        break;
      }
    }

    if (targetingRule) {
      logBuilder?.appendTargetingRuleConsequence(targetingRule, context.settingType as SettingType, result, newLineBeforeThen);
    }

    return result;
  }

  private evaluateUserCondition(condition: ObjectMaybe<UserCondition>, contextSalt: string, context: EvaluateContext): boolean | string {
    const logBuilder = context.logBuilder;
    logBuilder?.appendUserCondition(condition);

    if (!context.user) {
      if (!context.isMissingUserObjectLogged) {
        this.logger.userObjectIsMissing(context.key);
        context.isMissingUserObjectLogged = true;
      }

      return missingUserObjectError;
    }

    const userAttributeName = condition.a;
    if (typeof userAttributeName !== "string") {
      throwInvalidConfigModelError("Comparison attribute is missing or invalid.");
    }

    const userAttributeValue = getUserAttribute(context.user, userAttributeName);
    if (userAttributeValue == null || userAttributeValue === "") { // besides null and undefined, empty string is considered missing value as well
      const conditionString = new LazyString(condition, condition => formatUserCondition(condition));
      this.logger.userObjectAttributeIsMissingCondition(conditionString, context.key, userAttributeName);
      return missingUserAttributeError(userAttributeName);
    }

    let text: string, versionOrError: ISemVer | string, numberOrError: number | string, arrayOrError: ReadonlyArray<string> | string;
    const comparator = condition.c;
    switch (comparator) {
      case UserComparator.TextEquals:
      case UserComparator.TextNotEquals:
        text = getUserAttributeValueAsText(userAttributeName, userAttributeValue, condition, context.key, this.logger);
        return this.evaluateTextEquals(text, ensureStringComparisonValue(condition.s), comparator === UserComparator.TextNotEquals);

      case UserComparator.SensitiveTextEquals:
      case UserComparator.SensitiveTextNotEquals:
        text = getUserAttributeValueAsText(userAttributeName, userAttributeValue, condition, context.key, this.logger);
        return this.evaluateSensitiveTextEquals(text, ensureStringComparisonValue(condition.s),
          getConfigJsonSalt(context.setting), contextSalt, comparator === UserComparator.SensitiveTextNotEquals);

      case UserComparator.TextIsOneOf:
      case UserComparator.TextIsNotOneOf:
        text = getUserAttributeValueAsText(userAttributeName, userAttributeValue, condition, context.key, this.logger);
        return this.evaluateTextIsOneOf(text, ensureComparisonValues(condition.l), comparator === UserComparator.TextIsNotOneOf);

      case UserComparator.SensitiveTextIsOneOf:
      case UserComparator.SensitiveTextIsNotOneOf:
        text = getUserAttributeValueAsText(userAttributeName, userAttributeValue, condition, context.key, this.logger);
        return this.evaluateSensitiveTextIsOneOf(text, ensureComparisonValues(condition.l),
          getConfigJsonSalt(context.setting), contextSalt, comparator === UserComparator.SensitiveTextIsNotOneOf);

      case UserComparator.TextStartsWithAnyOf:
      case UserComparator.TextNotStartsWithAnyOf:
        text = getUserAttributeValueAsText(userAttributeName, userAttributeValue, condition, context.key, this.logger);
        return this.evaluateTextSliceEqualsAnyOf(text, ensureComparisonValues(condition.l), true, comparator === UserComparator.TextNotStartsWithAnyOf);

      case UserComparator.SensitiveTextStartsWithAnyOf:
      case UserComparator.SensitiveTextNotStartsWithAnyOf:
        text = getUserAttributeValueAsText(userAttributeName, userAttributeValue, condition, context.key, this.logger);
        return this.evaluateSensitiveTextSliceEqualsAnyOf(text, ensureComparisonValues(condition.l),
          getConfigJsonSalt(context.setting), contextSalt, true, comparator === UserComparator.SensitiveTextNotStartsWithAnyOf);

      case UserComparator.TextEndsWithAnyOf:
      case UserComparator.TextNotEndsWithAnyOf:
        text = getUserAttributeValueAsText(userAttributeName, userAttributeValue, condition, context.key, this.logger);
        return this.evaluateTextSliceEqualsAnyOf(text, ensureComparisonValues(condition.l), false, comparator === UserComparator.TextNotEndsWithAnyOf);

      case UserComparator.SensitiveTextEndsWithAnyOf:
      case UserComparator.SensitiveTextNotEndsWithAnyOf:
        text = getUserAttributeValueAsText(userAttributeName, userAttributeValue, condition, context.key, this.logger);
        return this.evaluateSensitiveTextSliceEqualsAnyOf(text, ensureComparisonValues(condition.l),
          getConfigJsonSalt(context.setting), contextSalt, false, comparator === UserComparator.SensitiveTextNotEndsWithAnyOf);

      case UserComparator.TextContainsAnyOf:
      case UserComparator.TextNotContainsAnyOf:
        text = getUserAttributeValueAsText(userAttributeName, userAttributeValue, condition, context.key, this.logger);
        return this.evaluateTextContainsAnyOf(text, ensureComparisonValues(condition.l), comparator === UserComparator.TextNotContainsAnyOf);

      case UserComparator.SemVerIsOneOf:
      case UserComparator.SemVerIsNotOneOf:
        versionOrError = getUserAttributeValueAsSemVer(userAttributeName, userAttributeValue, condition, context.key, this.logger);
        return typeof versionOrError !== "string"
          ? this.evaluateSemVerIsOneOf(versionOrError, ensureComparisonValues(condition.l), comparator === UserComparator.SemVerIsNotOneOf)
          : versionOrError;

      case UserComparator.SemVerLess:
      case UserComparator.SemVerLessOrEquals:
      case UserComparator.SemVerGreater:
      case UserComparator.SemVerGreaterOrEquals:
        versionOrError = getUserAttributeValueAsSemVer(userAttributeName, userAttributeValue, condition, context.key, this.logger);
        return typeof versionOrError !== "string"
          ? this.evaluateSemVerRelation(versionOrError, comparator, ensureStringComparisonValue(condition.s))
          : versionOrError;

      case UserComparator.NumberEquals:
      case UserComparator.NumberNotEquals:
      case UserComparator.NumberLess:
      case UserComparator.NumberLessOrEquals:
      case UserComparator.NumberGreater:
      case UserComparator.NumberGreaterOrEquals:
        numberOrError = getUserAttributeValueAsNumber(userAttributeName, userAttributeValue, condition, context.key, this.logger);
        return typeof numberOrError !== "string"
          ? this.evaluateNumberRelation(numberOrError, comparator, ensureNumberComparisonValue(condition.d))
          : numberOrError;

      case UserComparator.DateTimeBefore:
      case UserComparator.DateTimeAfter:
        numberOrError = getUserAttributeValueAsUnixTimeSeconds(userAttributeName, userAttributeValue, condition, context.key, this.logger);
        return typeof numberOrError !== "string"
          ? this.evaluateDateTimeRelation(numberOrError, ensureNumberComparisonValue(condition.d), comparator === UserComparator.DateTimeBefore)
          : numberOrError;

      case UserComparator.ArrayContainsAnyOf:
      case UserComparator.ArrayNotContainsAnyOf:
        arrayOrError = getUserAttributeValueAsStringArray(userAttributeName, userAttributeValue, condition, context.key, this.logger);
        return typeof arrayOrError !== "string"
          ? this.evaluateArrayContainsAnyOf(arrayOrError, ensureComparisonValues(condition.l), comparator === UserComparator.ArrayNotContainsAnyOf)
          : arrayOrError;

      case UserComparator.SensitiveArrayContainsAnyOf:
      case UserComparator.SensitiveArrayNotContainsAnyOf:
        arrayOrError = getUserAttributeValueAsStringArray(userAttributeName, userAttributeValue, condition, context.key, this.logger);
        return typeof arrayOrError !== "string"
          ? this.evaluateSensitiveArrayContainsAnyOf(arrayOrError, ensureComparisonValues(condition.l),
            getConfigJsonSalt(context.setting), contextSalt, comparator === UserComparator.SensitiveArrayNotContainsAnyOf)
          : arrayOrError;

      default:
        throwInvalidConfigModelError("Comparison operator is missing or invalid.");
    }
  }

  private evaluateTextEquals(text: string, comparisonValue: string, negate: boolean): boolean {
    return (text === comparisonValue) !== negate;
  }

  private evaluateSensitiveTextEquals(text: string, comparisonValue: string, configJsonSalt: string, contextSalt: string, negate: boolean): boolean {
    const hash = hashComparisonValue(text, configJsonSalt, contextSalt);
    return (hash === comparisonValue) !== negate;
  }

  private evaluateTextIsOneOf(text: string, comparisonValues: ArrayOfMaybe<string>, negate: boolean): boolean {
    for (let i = 0; i < comparisonValues.length; i++) {
      if (ensureStringComparisonValue(comparisonValues[i]) === text) {
        return !negate;
      }
    }

    return negate;
  }

  private evaluateSensitiveTextIsOneOf(text: string, comparisonValues: ArrayOfMaybe<string>, configJsonSalt: string, contextSalt: string, negate: boolean): boolean {
    const hash = hashComparisonValue(text, configJsonSalt, contextSalt);
    for (let i = 0; i < comparisonValues.length; i++) {
      if (ensureStringComparisonValue(comparisonValues[i]) === hash) {
        return !negate;
      }
    }

    return negate;
  }

  private evaluateTextSliceEqualsAnyOf(text: string, comparisonValues: ArrayOfMaybe<string>, startsWith: boolean, negate: boolean): boolean {
    for (let i = 0; i < comparisonValues.length; i++) {
      const item = ensureStringComparisonValue(comparisonValues[i]);

      if (text.length < item.length) {
        continue;
      }

      // NOTE: String.prototype.startsWith/endsWith were introduced after ES5. We'd rather work around them instead of polyfilling them.
      const result = (startsWith ? text.lastIndexOf(item, 0) : text.indexOf(item, text.length - item.length)) >= 0;
      if (result) {
        return !negate;
      }
    }

    return negate;
  }

  private evaluateSensitiveTextSliceEqualsAnyOf(text: string, comparisonValues: ArrayOfMaybe<string>,
    configJsonSalt: string, contextSalt: string, startsWith: boolean, negate: boolean
  ): boolean {
    const textUtf8 = utf8Encode(text);

    for (let i = 0; i < comparisonValues.length; i++) {
      const item = ensureStringComparisonValue(comparisonValues[i]);

      let sliceLength: number, hash2: string;
      const index = item.indexOf("_");
      if (index < 0
        || isNaN(sliceLength = parseIntStrict(item.slice(0, index)))
        || sliceLength < 0
        || !(hash2 = item.slice(index + 1))
      ) {
        ensureStringComparisonValue(void 0);
        break; // execution should never get here (this is just for keeping the TS compiler happy)
      }

      if (textUtf8.length < sliceLength) {
        continue;
      }

      const sliceUtf8 = startsWith ? textUtf8.slice(0, sliceLength) : textUtf8.slice(textUtf8.length - sliceLength);
      const hash = hashComparisonValueSlice(sliceUtf8, configJsonSalt, contextSalt);

      const result = hash === hash2;
      if (result) {
        return !negate;
      }
    }

    return negate;
  }

  private evaluateTextContainsAnyOf(text: string, comparisonValues: ArrayOfMaybe<string>, negate: boolean): boolean {
    for (let i = 0; i < comparisonValues.length; i++) {
      if (text.indexOf(ensureStringComparisonValue(comparisonValues[i])) >= 0) {
        return !negate;
      }
    }

    return negate;
  }

  private evaluateSemVerIsOneOf(version: ISemVer, comparisonValues: ArrayOfMaybe<string>, negate: boolean): boolean {
    let result = false;

    for (let i = 0; i < comparisonValues.length; i++) {
      const item = ensureStringComparisonValue(comparisonValues[i]);

      // NOTE: Previous versions of the evaluation algorithm ignore empty comparison values.
      // We keep this behavior for backward compatibility.
      if (!item.length) {
        continue;
      }

      const version2 = parseSemVer(item.trim());
      if (!version2) {
        // NOTE: Previous versions of the evaluation algorithm ignored invalid comparison values.
        // We keep this behavior for backward compatibility.
        return false;
      }

      if (!result && version.compare(version2) === 0) {
        // NOTE: Previous versions of the evaluation algorithm require that
        // none of the comparison values are empty or invalid, that is, we can't stop when finding a match.
        // We keep this behavior for backward compatibility.
        result = true;
      }
    }

    return result !== negate;
  }

  private evaluateSemVerRelation(version: ISemVer,
    comparator: UserComparator.SemVerLess | UserComparator.SemVerLessOrEquals | UserComparator.SemVerGreater | UserComparator.SemVerGreaterOrEquals,
    comparisonValue: string): boolean {

    const version2 = parseSemVer(comparisonValue.trim());
    if (!version2) {
      return false;
    }

    const comparisonResult = version.compare(version2);
    switch (comparator) {
      case UserComparator.SemVerLess: return comparisonResult < 0;
      case UserComparator.SemVerLessOrEquals: return comparisonResult <= 0;
      case UserComparator.SemVerGreater: return comparisonResult > 0;
      case UserComparator.SemVerGreaterOrEquals: return comparisonResult >= 0;
    }
  }

  private evaluateNumberRelation(number: number,
    comparator: UserComparator.NumberEquals | UserComparator.NumberNotEquals
      | UserComparator.NumberLess | UserComparator.NumberLessOrEquals
      | UserComparator.NumberGreater | UserComparator.NumberGreaterOrEquals,
    comparisonValue: number
  ): boolean {
    switch (comparator) {
      case UserComparator.NumberEquals: return number === comparisonValue;
      case UserComparator.NumberNotEquals: return number !== comparisonValue;
      case UserComparator.NumberLess: return number < comparisonValue;
      case UserComparator.NumberLessOrEquals: return number <= comparisonValue;
      case UserComparator.NumberGreater: return number > comparisonValue;
      case UserComparator.NumberGreaterOrEquals: return number >= comparisonValue;
    }
  }

  private evaluateDateTimeRelation(number: number, comparisonValue: number, before: boolean): boolean {
    return before ? number < comparisonValue : number > comparisonValue;
  }

  private evaluateArrayContainsAnyOf(array: ReadonlyArray<string>, comparisonValues: ArrayOfMaybe<string>, negate: boolean): boolean {
    for (let i = 0; i < array.length; i++) {
      const text = array[i];
      for (let j = 0; j < comparisonValues.length; j++) {
        if (ensureStringComparisonValue(comparisonValues[j]) === text) {
          return !negate;
        }
      }
    }

    return negate;
  }

  private evaluateSensitiveArrayContainsAnyOf(array: ReadonlyArray<string>, comparisonValues: ArrayOfMaybe<string>,
    configJsonSalt: string, contextSalt: string, negate: boolean
  ): boolean {
    for (let i = 0; i < array.length; i++) {
      const hash = hashComparisonValue(array[i], configJsonSalt, contextSalt);
      for (let j = 0; j < comparisonValues.length; j++) {
        if (ensureStringComparisonValue(comparisonValues[j]) === hash) {
          return !negate;
        }
      }
    }

    return negate;
  }

  private evaluatePrerequisiteFlagCondition(condition: ObjectMaybe<PrerequisiteFlagCondition>, context: EvaluateContext): boolean {
    const logBuilder = context.logBuilder;
    logBuilder?.appendPrerequisiteFlagCondition(condition, context.settings);

    const prerequisiteFlagKey = condition.f;
    if (typeof prerequisiteFlagKey !== "string") {
      throwInvalidConfigModelError("Prerequisite flag key is missing or invalid.");
    }

    const prerequisiteFlag = ensureSetting(context.settings[prerequisiteFlagKey], "Prerequisite flag is missing or invalid.");

    const prerequisiteFlagType = getSettingType(prerequisiteFlag);
    let inferredPrerequisiteFlagType: SettingType | undefined;
    let comparisonValue: NonNullable<SettingValue> | undefined;

    if (prerequisiteFlagType !== (-1 satisfies UnknownSettingType)) {
      inferredPrerequisiteFlagType = prerequisiteFlagType;
      comparisonValue = unwrapValue(condition.v, prerequisiteFlagType, true);
    } else {
      inferredPrerequisiteFlagType = inferSettingType(prerequisiteFlag.v);
      if (inferredPrerequisiteFlagType !== void 0) {
        comparisonValue = unwrapValue(condition.v, inferredPrerequisiteFlagType, true);
        if (inferredPrerequisiteFlagType === SettingType.Double) {
          // In the case of a simple flag override with a number value, we need to accept int and double comparison values.
          const intComparisonValue = unwrapValue(condition.v, SettingType.Int, true);
          if (comparisonValue === void 0) {
            comparisonValue = intComparisonValue;
          } else if (intComparisonValue !== void 0) {
            comparisonValue = void 0; // ambiguous case (both int and double values are present), we consider it a type mismatch
          }
        }
      }
    }

    if (comparisonValue === void 0
      && inferredPrerequisiteFlagType !== void 0 // the case of unsupported flag override values is handled by the unwrapValue call below
    ) {
      comparisonValue = inferValue(condition.v);
      throwInvalidConfigModelError(`Type mismatch between comparison value '${valueToString(comparisonValue)}' and prerequisite flag '${prerequisiteFlagKey}'.`);
    }

    const visitedFlags = context.visitedFlags;
    visitedFlags.push(context.key);

    if (visitedFlags.indexOf(prerequisiteFlagKey) >= 0) {
      visitedFlags.push(prerequisiteFlagKey);
      const dependencyCycle = formatStringList(visitedFlags, void 0, void 0, " -> ");
      throwInvalidConfigModelError(`Circular dependency detected between the following depending flags: ${dependencyCycle}.`);
    }

    const prerequisiteFlagContext = EvaluateContext.forPrerequisiteFlag(prerequisiteFlagKey, prerequisiteFlag, context);

    logBuilder?.newLine("(")
      .increaseIndent()
      .newLine(`Evaluating prerequisite flag '${prerequisiteFlagKey}':`);

    const prerequisiteFlagEvaluateResult = this.evaluateSetting(prerequisiteFlagContext);

    visitedFlags.pop();

    const prerequisiteFlagValue = unwrapValue(prerequisiteFlagEvaluateResult.selectedValue.v, prerequisiteFlagType);

    let result: boolean;

    switch (condition.c) {
      case PrerequisiteFlagComparator.Equals:
        result = prerequisiteFlagValue === comparisonValue;
        break;
      case PrerequisiteFlagComparator.NotEquals:
        result = prerequisiteFlagValue !== comparisonValue;
        break;
      default:
        throwInvalidConfigModelError("Comparison operator is missing or invalid.");
    }

    logBuilder?.newLine(`Prerequisite flag evaluation result: '${valueToString(prerequisiteFlagValue)}'.`)
      .newLine("Condition (")
      .appendPrerequisiteFlagCondition(condition, context.settings)
      .append(") evaluates to ").appendConditionResult(result).append(".")
      .decreaseIndent()
      .newLine(")");

    return result;
  }

  private evaluateSegmentCondition(condition: ObjectMaybe<SegmentCondition>, context: EvaluateContext): boolean | string {
    const maybeSegments: Maybe<ReadonlyArray<Segment>> = (context.setting as Setting)["_configSegments"];

    const logBuilder = context.logBuilder;
    logBuilder?.appendSegmentCondition(condition, maybeSegments);

    if (!context.user) {
      if (!context.isMissingUserObjectLogged) {
        this.logger.userObjectIsMissing(context.key);
        context.isMissingUserObjectLogged = true;
      }

      return missingUserObjectError;
    }

    const segments = ensureSegmentList(maybeSegments);

    const segmentIndex = condition?.s;
    if (!isNumberInRange(segmentIndex, 0, segments.length - 1)) {
      throwInvalidConfigModelError("Segment reference is invalid.");
    }

    const segment = ensureSegment(segments[segmentIndex]);

    const segmentName = segment?.n;
    if (typeof segmentName !== "string" || !segmentName.length) {
      throwInvalidConfigModelError("Segment name is missing.'");
    }

    logBuilder?.newLine("(")
      .increaseIndent()
      .newLine(`Evaluating segment '${segmentName}':`);

    const conditions = ensureConditionList<UserCondition>(segment?.r);

    const segmentResult = this.evaluateConditions(conditions, "u", void 0, segmentName, context);
    let result = segmentResult;

    if (!isEvaluationError(result)) {
      switch (condition.c) {
        case SegmentComparator.IsIn:
          break;
        case SegmentComparator.IsNotIn:
          result = !result;
          break;
        default:
          throwInvalidConfigModelError("Comparison operator is missing or invalid.");
      }
    }

    if (logBuilder) {
      logBuilder.newLine("Segment evaluation result: ");
      (!isEvaluationError(result)
        ? logBuilder.append(`User ${formatSegmentComparator(segmentResult ? SegmentComparator.IsIn : SegmentComparator.IsNotIn)}`)
        : logBuilder.append(result))
        .append(".");

      logBuilder.newLine("Condition (").appendSegmentCondition(condition, segments).append(")");
      (!isEvaluationError(result)
        ? logBuilder.append(" evaluates to ").appendConditionResult(result)
        : logBuilder.append(" failed to evaluate"))
        .append(".");

      logBuilder
        .decreaseIndent()
        .newLine(")");
    }

    return result;
  }
}

function isEvaluationError(isMatchOrError: boolean | string): isMatchOrError is string {
  return typeof isMatchOrError === "string";
}

function hashComparisonValue(value: string, configJsonSalt: string, contextSalt: string): string {
  return hashComparisonValueSlice(utf8Encode(value), configJsonSalt, contextSalt);
}

function hashComparisonValueSlice(sliceUtf8: string, configJsonSalt: string, contextSalt: string): string {
  return sha256(sliceUtf8 + utf8Encode(configJsonSalt) + utf8Encode(contextSalt));
}

function userAttributeValueToString(userAttributeValue: UserAttributeValue): string {
  return typeof userAttributeValue === "string" ? userAttributeValue
    : userAttributeValue instanceof Date ? (userAttributeValue.getTime() / 1000) + ""
    : isStringArray(userAttributeValue) ? JSON.stringify(userAttributeValue)
    : userAttributeValue + "";
}

function getUserAttributeValueAsText(attributeName: string, attributeValue: UserAttributeValue,
  condition: ObjectMaybe<UserCondition>, key: string, logger: LoggerWrapper
): string {
  if (typeof attributeValue === "string") {
    return attributeValue;
  }

  attributeValue = userAttributeValueToString(attributeValue);
  const conditionString = new LazyString(condition, condition => formatUserCondition(condition));
  logger.userObjectAttributeIsAutoConverted(conditionString, key, attributeName, attributeValue);
  return attributeValue;
}

function getUserAttributeValueAsSemVer(attributeName: string, attributeValue: UserAttributeValue,
  condition: ObjectMaybe<UserCondition>, key: string, logger: LoggerWrapper
): ISemVer | string {
  let version: ISemVer | null;
  if (typeof attributeValue === "string" && (version = parseSemVer(attributeValue.trim()))) {
    return version;
  }
  return handleInvalidUserAttribute(logger, condition, key, attributeName, `'${attributeValue}' is not a valid semantic version`);
}

function getUserAttributeValueAsNumber(attributeName: string, attributeValue: UserAttributeValue,
  condition: ObjectMaybe<UserCondition>, key: string, logger: LoggerWrapper
): number | string {
  if (typeof attributeValue === "number") {
    return attributeValue;
  }
  let number: number;
  if (typeof attributeValue === "string"
    && (!isNaN(number = parseFloatStrict(attributeValue.replace(",", "."))) || attributeValue.trim() === "NaN")) {
    return number;
  }
  return handleInvalidUserAttribute(logger, condition, key, attributeName, `'${attributeValue}' is not a valid decimal number`);
}

function getUserAttributeValueAsUnixTimeSeconds(attributeName: string, attributeValue: UserAttributeValue,
  condition: ObjectMaybe<UserCondition>, key: string, logger: LoggerWrapper
): number | string {
  if (attributeValue instanceof Date) {
    return attributeValue.getTime() / 1000;
  }
  if (typeof attributeValue === "number") {
    return attributeValue;
  }
  let number: number;
  if (typeof attributeValue === "string"
    && (!isNaN(number = parseFloatStrict(attributeValue.replace(",", "."))) || attributeValue.trim() === "NaN")) {
    return number;
  }
  return handleInvalidUserAttribute(logger, condition, key, attributeName, `'${attributeValue}' is not a valid Unix timestamp (number of seconds elapsed since Unix epoch)`);
}

function getUserAttributeValueAsStringArray(attributeName: string, attributeValue: UserAttributeValue,
  condition: ObjectMaybe<UserCondition>, key: string, logger: LoggerWrapper
): ReadonlyArray<string> | string {
  let stringArray: unknown = attributeValue;
  if (typeof stringArray === "string") {
    try {
      stringArray = JSON.parse(stringArray);
    } catch { /* intentional no-op */ }
  }
  if (isStringArray(stringArray)) {
    return stringArray;
  }
  return handleInvalidUserAttribute(logger, condition, key, attributeName, `'${attributeValue}' is not a valid string array`);
}

function handleInvalidUserAttribute(logger: LoggerWrapper, condition: ObjectMaybe<UserCondition>, key: string, attributeName: string, reason: string): string {
  const conditionString = new LazyString(condition, condition => formatUserCondition(condition));
  logger.userObjectAttributeIsInvalid(conditionString, key, reason, attributeName);
  return invalidUserAttributeError(attributeName, reason);
}

export function isAllowedValue(value: unknown): value is NonNullable<SettingValue> {
  return inferSettingType(value) !== void 0;
}

function inferSettingType(value: unknown): SettingType | undefined {
  // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
  switch (typeof value) {
    case "boolean": return SettingType.Boolean;
    case "string": return SettingType.String;
    case "number": return SettingType.Double;
  }
}

function isCompatibleValue(value: SettingValue, settingType: SettingType): boolean {
  switch (settingType) {
    case SettingType.Boolean: return typeof value === "boolean";
    case SettingType.String: return typeof value === "string";
    case SettingType.Int:
    case SettingType.Double: return typeof value === "number";
    default: return false;
  }
}

export function ensureSettingMap(settings: Maybe<Readonly<Record<string, Setting>>>): MapOfMaybe<Setting> {
  return isObject(settings ??= {}) ? settings : throwInvalidConfigModelError("Setting map is invalid.");
}

function ensureSetting(setting: Maybe<Setting>, message?: string): ObjectMaybe<Setting> {
  return isObject(setting) ? setting : throwInvalidConfigModelError(message ?? "Setting is missing or invalid.");
}

function ensureSegmentList(segments: Maybe<ReadonlyArray<Segment>>): ArrayOfMaybe<Segment> {
  return isArray(segments ??= []) ? segments : throwInvalidConfigModelError("Segment list is invalid.");
}

function ensureSegment(segment: Maybe<Segment>): ObjectMaybe<Segment> {
  return isObject(segment) ? segment : throwInvalidConfigModelError("Segment is missing or invalid.");
}

function ensureTargetingRuleList(targetingRules: Maybe<ReadonlyArray<TargetingRule>>): ArrayOfMaybe<TargetingRule> {
  return isArray(targetingRules ??= []) ? targetingRules : throwInvalidConfigModelError("Targeting rule list is invalid.");
}

function ensureTargetingRule(targetingRule: Maybe<TargetingRule>): ObjectMaybe<TargetingRule> {
  return isObject(targetingRule) ? targetingRule : throwInvalidConfigModelError("Targeting rule is missing or invalid.");
}

function ensurePercentageOptionList(percentageOptions: Maybe<ReadonlyArray<PercentageOption>>): ArrayOfMaybe<PercentageOption> {
  return isArray(percentageOptions ??= []) ? percentageOptions : throwInvalidConfigModelError("Percentage option list is invalid.");
}

function ensurePercentageOption(percentageOption: Maybe<PercentageOption>): ObjectMaybe<PercentageOption> {
  return isObject(percentageOption) ? percentageOption : throwInvalidConfigModelError("Percentage option is missing or invalid.");
}

function ensureConditionList<TCondition extends ConditionContainer | Condition>(conditions: Maybe<ReadonlyArray<TCondition>>): ArrayOfMaybe<TCondition> {
  return isArray(conditions ??= []) ? conditions : throwInvalidConfigModelError("Condition list is invalid.");
}

function ensureCondition(condition: Maybe<Condition>): ObjectMaybe<Condition> {
  return isObject(condition) ? condition : throwInvalidConfigModelError("Condition is missing or invalid.");
}

function ensureComparisonValues(comparisonValues: Maybe<ReadonlyArray<string>>): ArrayOfMaybe<string> {
  return isArray(comparisonValues) ? comparisonValues : throwInvalidConfigModelError("Comparison value is missing or invalid.");
}

function ensureStringComparisonValue(comparisonValue: Maybe<string>): string {
  return typeof comparisonValue === "string" ? comparisonValue : throwInvalidConfigModelError("Comparison value is missing or invalid.");
}

function ensureNumberComparisonValue(comparisonValue: Maybe<number>): number {
  return typeof comparisonValue === "number" ? comparisonValue : throwInvalidConfigModelError("Comparison value is missing or invalid.");
}

function getConfigJsonSalt(setting: ObjectMaybe<Setting>): string {
  const configJsonSalt = (setting as Setting)["_configJsonSalt"];
  return typeof configJsonSalt === "string" ? configJsonSalt : throwInvalidConfigModelError("Config JSON salt is missing or invalid.");
}

function getSettingType(setting: ObjectMaybe<Setting>): SettingType | UnknownSettingType {
  const settingType = setting?.t;
  if (isNumberInRange(settingType, SettingType.Boolean, SettingType.Double)
    || settingType === (-1 satisfies UnknownSettingType) && isSettingWithSimpleValue(setting)) {
    return settingType;
  }

  throwInvalidConfigModelError("Setting type is missing or invalid.");
}

function isSettingWithSimpleValue(setting: ObjectMaybe<Setting>): boolean {
  return (setting?.r == null || !isArray(setting.r) || !setting.r.length)
    && (setting?.p == null || !isArray(setting.p) || !setting.p.length);
}

export function hasPercentageOptions(targetingRule: ObjectMaybe<TargetingRule>): boolean;
export function hasPercentageOptions(targetingRule: ObjectMaybe<TargetingRule>, ignoreIfInvalid: true): boolean | undefined;
export function hasPercentageOptions(targetingRule: ObjectMaybe<TargetingRule>, ignoreIfInvalid?: boolean): boolean | undefined {
  const simpleValue: Maybe<SettingValueContainer> = targetingRule.s;
  const percentageOptions: Maybe<ReadonlyArray<PercentageOption>> = targetingRule.p;
  if (simpleValue != null) {
    if (percentageOptions == null && isObject(simpleValue)) {
      return false;
    }
  } else if (isArray(percentageOptions) && percentageOptions.length) {
    return true;
  }

  if (!ignoreIfInvalid) {
    throwInvalidConfigModelError("Targeting rule THEN part is missing or invalid.");
  }
}

function getConditionType(container: Maybe<ConditionContainer>): keyof ConditionContainer | undefined {
  let type: keyof ConditionContainer | undefined, condition: Maybe<Condition>;

  condition = (container as ConditionContainer)?.u;
  if (condition != null) {
    if (!isObject(condition)) {
      return;
    }
    type = "u";
  }

  condition = (container as ConditionContainer)?.p;
  if (condition != null) {
    if (type || !isObject(condition)) {
      return;
    }
    type = "p";
  }

  condition = (container as ConditionContainer)?.s;
  if (condition != null) {
    if (type || !isObject(condition)) {
      return;
    }
    type = "s";
  }

  return type;
}

export function unwrapValue(settingValue: Maybe<SettingValueModel>, settingType: SettingType | UnknownSettingType | null,
  ignoreIfInvalid?: false
): NonNullable<SettingValue>;
export function unwrapValue(settingValue: Maybe<SettingValueModel>, settingType: SettingType | UnknownSettingType | null,
  ignoreIfInvalid: true
): NonNullable<SettingValue> | undefined;
export function unwrapValue(settingValue: Maybe<SettingValueModel>, settingType: SettingType | UnknownSettingType | null,
  ignoreIfInvalid?: boolean
): NonNullable<SettingValue> | undefined {
  // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
  switch (settingType) {
    case SettingType.Boolean: {
      const value = (settingValue as SettingValueModel)?.b;
      if (typeof value === "boolean") {
        return value;
      }
      break;
    }
    case SettingType.String: {
      const value = (settingValue as SettingValueModel)?.s;
      if (typeof value === "string") {
        return value;
      }
      break;
    }
    case SettingType.Int: {
      const value = (settingValue as SettingValueModel)?.i;
      if (typeof value === "number" && Number.isSafeInteger(value)) {
        return value;
      }
      break;
    }
    case SettingType.Double: {
      const value = (settingValue as SettingValueModel)?.d;
      if (typeof value === "number") {
        return value;
      }
      break;
    }
    case (-1 satisfies UnknownSettingType):
      if (isAllowedValue(settingValue)) {
        return settingValue;
      }
    // eslint-disable-next-line no-fallthrough
    default: // unsupported value
      if (!ignoreIfInvalid) {
        throwInvalidConfigModelError(
          settingValue === null ? "Setting value is null."
          : settingValue === void 0 ? "Setting value is undefined."
          // eslint-disable-next-line @typescript-eslint/no-base-to-string
          : `Setting value '${settingValue}' is of an unsupported type (${typeof settingValue}).`);
      }
      return;
  }

  if (!ignoreIfInvalid) {
    throwInvalidConfigModelError("Setting value is missing or invalid.");
  }
}

function throwInvalidConfigModelError(message: string): never {
  throw new InvalidConfigModelError(message);
}

/* Evaluation details */

export type SettingTypeOf<T> =
  T extends boolean ? boolean :
  T extends number ? number :
  T extends string ? string :
  T extends null ? boolean | number | string | null :
  T extends undefined ? boolean | number | string | undefined :
  any;

/** Specifies the possible evaluation error codes. */
export const enum EvaluationErrorCode {
  /** An unexpected error occurred during the evaluation. */
  UnexpectedError = -1,
  /** No error occurred (the evaluation was successful). */
  None = 0,
  /** The evaluation failed because of an error in the config model. (Most likely, invalid data was passed to the SDK via flag overrides.) */
  InvalidConfigModel = 1,
  /** The evaluation failed because of a type mismatch between the evaluated setting value and the specified default value. */
  SettingValueTypeMismatch = 2,
  /** The evaluation failed because the config JSON was not available locally. */
  ConfigJsonNotAvailable = 1000,
  /** The evaluation failed because the key of the evaluated setting was not found in the config JSON. */
  SettingKeyMissing = 1001,
}

/** The evaluated value and additional information about the evaluation of a feature flag or setting. */
export interface IEvaluationDetails<TValue extends SettingValue = SettingValue> {
  /** Key of the feature flag or setting. */
  key: string;

  /** Evaluated value of the feature or setting flag. */
  value: TValue;

  /** Variation ID of the feature or setting flag (if available). */
  variationId?: VariationIdValue;

  /** Time of last successful config download (if there has been a successful download already). */
  fetchTime?: Date;

  /** The User object used for the evaluation (if available). */
  user?: IUser;

  /**
   * Indicates whether the default value passed to the setting evaluation methods like `IConfigCatClient.getValueAsync`, `IConfigCatClient.getValueDetailsAsync`, etc.
   * is used as the result of the evaluation.
   */
  isDefaultValue: boolean;

  /** The code identifying the reason for the error in case evaluation failed. */
  errorCode: EvaluationErrorCode;

  /** Error message in case evaluation failed. */
  errorMessage?: string;

  /** The exception object related to the error in case evaluation failed (if any). */
  errorException?: any;

  /** The targeting rule (if any) that matched during the evaluation and was used to return the evaluated value. */
  matchedTargetingRule?: TargetingRule;

  /** The percentage option (if any) that was used to select the evaluated value. */
  matchedPercentageOption?: PercentageOption;
}

/* Helper functions */

function evaluationDetailsFromEvaluateResult<T extends SettingValue>(key: string, evaluateResult: IEvaluateResult,
  fetchTime?: Date, user?: IUser
): IEvaluationDetails<SettingTypeOf<T>> {
  return {
    key,
    value: evaluateResult.returnValue as SettingTypeOf<T>,
    variationId: evaluateResult.selectedValue.i as VariationIdValue,
    fetchTime,
    user,
    isDefaultValue: false,
    matchedTargetingRule: evaluateResult.matchedTargetingRule,
    matchedPercentageOption: evaluateResult.matchedPercentageOption,
    errorCode: EvaluationErrorCode.None,
  };
}

export function evaluationDetailsFromDefaultValue<T extends SettingValue>(key: string, defaultValue: T,
  fetchTime?: Date, user?: IUser, errorMessage?: Message, errorException?: any, errorCode = EvaluationErrorCode.UnexpectedError
): IEvaluationDetails<SettingTypeOf<T>> {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const evaluationDetails: IEvaluationDetails<SettingTypeOf<T>> & { _errorMessage?: Message } = {
    key,
    value: defaultValue as SettingTypeOf<T>,
    fetchTime,
    user,
    isDefaultValue: true,
    errorCode,
    get errorMessage() { return this._errorMessage?.toString(); },
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    errorException,
  };
  if (errorMessage != null) {
    evaluationDetails._errorMessage = errorMessage;
  }
  return evaluationDetails;
}

export function evaluate<T extends SettingValue>(evaluator: IRolloutEvaluator, settings: MapOfMaybe<Setting> | null,
  key: string, defaultValue: T, user: IUser | undefined, remoteConfig: ProjectConfig | null, logger: LoggerWrapper
): IEvaluationDetails<SettingTypeOf<T>> {

  let errorMessage: LogMessage;
  if (!settings) {
    errorMessage = logger.configJsonIsNotPresentSingle(key, "defaultValue", defaultValue);
    return evaluationDetailsFromDefaultValue(key, defaultValue, getTimestampAsDate(remoteConfig), user,
      toMessage(errorMessage), void 0, EvaluationErrorCode.ConfigJsonNotAvailable);
  }

  const setting = settings[key];
  if (setting === void 0) {
    const availableKeys = new LazyString(settings, settings => formatStringList(Object.keys(settings)));
    errorMessage = logger.settingEvaluationFailedDueToMissingKey(key, "defaultValue", defaultValue, availableKeys);
    return evaluationDetailsFromDefaultValue(key, defaultValue, getTimestampAsDate(remoteConfig), user,
      toMessage(errorMessage), void 0, EvaluationErrorCode.SettingKeyMissing);
  }

  const evaluateResult = evaluator.evaluate(defaultValue, new EvaluateContext(key, setting!, user, settings));

  return evaluationDetailsFromEvaluateResult<T>(key, evaluateResult, getTimestampAsDate(remoteConfig), user);
}

export function evaluateAll(evaluator: IRolloutEvaluator, settings: MapOfMaybe<Setting> | null,
  user: IUser | undefined, remoteConfig: ProjectConfig | null, logger: LoggerWrapper, defaultReturnValue: string
): [IEvaluationDetails[], any[] | undefined] {

  let errors: any[] | undefined;

  if (!checkSettingsAvailable(settings, logger, defaultReturnValue)) {
    return [[], errors];
  }

  const evaluationDetailsArray: IEvaluationDetails[] = [];

  for (const [key, setting] of Object.entries(settings)) {
    let evaluationDetails: IEvaluationDetails;
    try {
      const evaluateResult = evaluator.evaluate(null, new EvaluateContext(key, setting!, user, settings));
      evaluationDetails = evaluationDetailsFromEvaluateResult(key, evaluateResult, getTimestampAsDate(remoteConfig), user);
    } catch (err) {
      errors ??= [];
      errors.push(err);
      evaluationDetails = evaluationDetailsFromDefaultValue(key, null, getTimestampAsDate(remoteConfig), user,
        errorToString(err), err, getEvaluationErrorCode(err));
    }

    evaluationDetailsArray.push(evaluationDetails);
  }

  return [evaluationDetailsArray, errors];
}

export function checkSettingsAvailable(settings: MapOfMaybe<Setting> | null, logger: LoggerWrapper,
  defaultReturnValue: string
): settings is MapOfMaybe<Setting> {
  if (!settings) {
    logger.configJsonIsNotPresent(defaultReturnValue);
    return false;
  }

  return true;
}

/** Setting key-value pair. */
export type SettingKeyValue<TValue extends SettingValue = SettingValue> = {
  settingKey: string;
  settingValue: TValue;
};

export function findKeyAndValue(settings: MapOfMaybe<Setting> | null,
  variationId: string, logger: LoggerWrapper, defaultReturnValue: string
): SettingKeyValue | null {
  if (!checkSettingsAvailable(settings, logger, defaultReturnValue)) {
    return null;
  }

  for (const [settingKey, setting] of Object.entries(settings) as [string, ObjectMaybe<Setting>][]) {
    const settingType = getSettingType(ensureSetting(setting));

    if (variationId === setting.i) {
      return { settingKey, settingValue: unwrapValue(setting.v, settingType) };
    }

    const targetingRules = ensureTargetingRuleList(setting.r);
    if (targetingRules.length > 0) {
      for (let i = 0; i < targetingRules.length; i++) {
        const targetingRule = ensureTargetingRule(targetingRules[i]);
        if (hasPercentageOptions(targetingRule)) {
          const percentageOptions = targetingRule.p as ArrayOfMaybe<PercentageOption>;
          for (let j = 0; j < percentageOptions.length; j++) {
            const percentageOption = ensurePercentageOption(percentageOptions[j]);
            if (variationId === percentageOption.i) {
              return { settingKey, settingValue: unwrapValue(percentageOption.v, settingType) };
            }
          }
        } else {
          const simpleValue = targetingRule.s as ObjectMaybe<SettingValueContainer>;
          if (variationId === simpleValue.i) {
            return { settingKey, settingValue: unwrapValue(simpleValue.v, settingType) };
          }
        }
      }
    }

    const percentageOptions = ensurePercentageOptionList(setting.p);
    if (percentageOptions.length > 0) {
      for (let i = 0; i < percentageOptions.length; i++) {
        const percentageOption = ensurePercentageOption(percentageOptions[i]);
        if (variationId === percentageOption.i) {
          return { settingKey, settingValue: unwrapValue(percentageOption.v, settingType) };
        }
      }
    }
  }

  logger.settingForVariationIdIsNotPresent(variationId);
  return null;
}

export function getTimestampAsDate(projectConfig: ProjectConfig | null): Date | undefined {
  return projectConfig ? new Date(projectConfig.timestamp) : void 0;
}

export class EvaluationError extends Error {
  readonly name = EvaluationError.name;

  constructor(
    readonly errorCode: EvaluationErrorCode,
    readonly message: string
  ) {
    super(message);
    ensurePrototype(this, EvaluationError);
  }
}

export function getEvaluationErrorCode(err: any): EvaluationErrorCode {
  return !(err instanceof Error) ? EvaluationErrorCode.UnexpectedError
    : err instanceof EvaluationError ? err.errorCode
    : err instanceof InvalidConfigModelError ? EvaluationErrorCode.InvalidConfigModel
    : EvaluationErrorCode.UnexpectedError;
}

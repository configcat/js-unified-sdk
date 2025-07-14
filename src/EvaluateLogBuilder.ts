import type { SettingType } from "./ConfigJson";
import { PrerequisiteFlagComparator, SegmentComparator, UserComparator } from "./ConfigJson";
import type { PrerequisiteFlagCondition, Segment, SegmentCondition, SettingMap, SettingValue, SettingValueModel, TargetingRule, UserCondition } from "./ProjectConfig";
import { hasPercentageOptions, isAllowedValue, unwrapValue } from "./RolloutEvaluator";
import { formatStringList, hasOwnProperty, isIntegerInRange, isNumber, isString } from "./Utils";

const invalidValuePlaceholder = "<invalid value>";
const invalidNamePlaceholder = "<invalid name>";
const invalidOperatorPlaceholder = "<invalid operator>";
const invalidReferencePlaceholder = "<invalid reference>";

const stringListMaxLength = 10;

export class EvaluateLogBuilder {
  private log = "";
  private indent = "";

  constructor(private readonly eol: string) {
  }

  resetIndent(): this {
    this.indent = "";
    return this;
  }

  increaseIndent(): this {
    this.indent += "  ";
    return this;
  }

  decreaseIndent(): this {
    this.indent = this.indent.slice(0, -2);
    return this;
  }

  newLine(text?: string): this {
    this.log += this.eol + this.indent + (text ?? "");
    return this;
  }

  append(text: string): this {
    this.log += text;
    return this;
  }

  toString(): string {
    return this.log;
  }

  private appendUserConditionCore(comparisonAttribute: string, comparator: UserComparator, comparisonValue?: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    return this.append(`User.${comparisonAttribute} ${formatUserComparator(comparator)} '${comparisonValue ?? invalidValuePlaceholder}'`);
  }

  private appendUserConditionString(
    comparisonAttribute: string, comparator: UserComparator, comparisonValue: string | null | undefined, isSensitive: boolean
  ) {
    if (comparisonValue == null) {
      return this.appendUserConditionCore(comparisonAttribute, comparator);
    }

    return this.appendUserConditionCore(comparisonAttribute, comparator, !isSensitive ? comparisonValue : "<hashed value>");
  }

  private appendUserConditionStringList(
    comparisonAttribute: string, comparator: UserComparator, comparisonValue: ReadonlyArray<string> | null | undefined, isSensitive: boolean
  ): this {
    if (comparisonValue == null) {
      return this.appendUserConditionCore(comparisonAttribute, comparator);
    }

    const valueText = "value", valuesText = "values";

    const comparatorFormatted = formatUserComparator(comparator);
    if (isSensitive) {
      return this.append(`User.${comparisonAttribute} ${comparatorFormatted} [<${comparisonValue.length} hashed ${comparisonValue.length === 1 ? valueText : valuesText}>]`);
    } else {
      const comparisonValueFormatted = formatStringList(comparisonValue, stringListMaxLength, count => `, ... <${count} more ${count === 1 ? valueText : valuesText}>`);

      return this.append(`User.${comparisonAttribute} ${comparatorFormatted} [${comparisonValueFormatted}]`);
    }
  }

  private appendUserConditionNumber(
    comparisonAttribute: string, comparator: UserComparator, comparisonValue: number | null | undefined, isDateTime?: boolean
  ) {
    if (comparisonValue == null) {
      return this.appendUserConditionCore(comparisonAttribute, comparator);
    }

    const comparatorFormatted = formatUserComparator(comparator);
    let date: Date;
    return isDateTime && !isNaN((date = new Date(comparisonValue * 1000)) as unknown as number) // see https://stackoverflow.com/a/1353711/8656352
      ? this.append(`User.${comparisonAttribute} ${comparatorFormatted} '${comparisonValue}' (${date.toISOString()} UTC)`)
      : this.append(`User.${comparisonAttribute} ${comparatorFormatted} '${comparisonValue}'`);
  }

  appendUserCondition(condition: UserCondition): this {
    const comparisonAttribute = condition.a;
    const comparator = condition.c;

    switch (comparator) {
      case UserComparator.TextIsOneOf:
      case UserComparator.TextIsNotOneOf:
      case UserComparator.TextContainsAnyOf:
      case UserComparator.TextNotContainsAnyOf:
      case UserComparator.SemVerIsOneOf:
      case UserComparator.SemVerIsNotOneOf:
      case UserComparator.TextStartsWithAnyOf:
      case UserComparator.TextNotStartsWithAnyOf:
      case UserComparator.TextEndsWithAnyOf:
      case UserComparator.TextNotEndsWithAnyOf:
      case UserComparator.ArrayContainsAnyOf:
      case UserComparator.ArrayNotContainsAnyOf:
        return this.appendUserConditionStringList(comparisonAttribute, comparator, condition.l, false);

      case UserComparator.SemVerLess:
      case UserComparator.SemVerLessOrEquals:
      case UserComparator.SemVerGreater:
      case UserComparator.SemVerGreaterOrEquals:
      case UserComparator.TextEquals:
      case UserComparator.TextNotEquals:
        return this.appendUserConditionString(comparisonAttribute, comparator, condition.s, false);

      case UserComparator.NumberEquals:
      case UserComparator.NumberNotEquals:
      case UserComparator.NumberLess:
      case UserComparator.NumberLessOrEquals:
      case UserComparator.NumberGreater:
      case UserComparator.NumberGreaterOrEquals:
        return this.appendUserConditionNumber(comparisonAttribute, comparator, condition.d);

      case UserComparator.SensitiveTextIsOneOf:
      case UserComparator.SensitiveTextIsNotOneOf:
      case UserComparator.SensitiveTextStartsWithAnyOf:
      case UserComparator.SensitiveTextNotStartsWithAnyOf:
      case UserComparator.SensitiveTextEndsWithAnyOf:
      case UserComparator.SensitiveTextNotEndsWithAnyOf:
      case UserComparator.SensitiveArrayContainsAnyOf:
      case UserComparator.SensitiveArrayNotContainsAnyOf:
        return this.appendUserConditionStringList(comparisonAttribute, comparator, condition.l, true);

      case UserComparator.DateTimeBefore:
      case UserComparator.DateTimeAfter:
        return this.appendUserConditionNumber(comparisonAttribute, comparator, condition.d, true);

      case UserComparator.SensitiveTextEquals:
      case UserComparator.SensitiveTextNotEquals:
        return this.appendUserConditionString(comparisonAttribute, comparator, condition.s, true);

      default: {
        const comparisonValue = inferUserConditionComparisonValue(condition);
        if (isString(comparisonValue)) {
          return this.appendUserConditionString(comparisonAttribute, comparator, comparisonValue, false);
        } else if (isNumber(comparisonValue)) {
          return this.appendUserConditionNumber(comparisonAttribute, comparator, comparisonValue);
        } else if (!comparisonValue) {
          return this.appendUserConditionStringList(comparisonAttribute, comparator, comparisonValue, false);
        } else {
          return this.appendUserConditionCore(comparisonAttribute, comparator);
        }
      }
    }
  }

  appendPrerequisiteFlagCondition(condition: PrerequisiteFlagCondition, settings: SettingMap): this {
    const prerequisiteFlagKey = hasOwnProperty(settings, condition.f)
      ? condition.f
      : invalidReferencePlaceholder;

    const comparator = condition.c;
    const comparisonValue = inferValue(condition.v);

    return this.append(`Flag '${prerequisiteFlagKey}' ${formatPrerequisiteFlagComparator(comparator)} '${valueToString(comparisonValue)}'`);
  }

  appendSegmentCondition(condition: SegmentCondition, segments: ReadonlyArray<Segment> | undefined): this {
    const segmentIndex = condition.s;

    let segmentName: string;
    if (segments && isIntegerInRange(segmentIndex, 0, segments.length - 1)) {
      segmentName = segments[segmentIndex].n;
      if (!segmentName.length) {
        segmentName = invalidNamePlaceholder;
      }
    } else {
      segmentName = invalidReferencePlaceholder;
    }

    const comparator = condition.c;

    return this.append(`User ${formatSegmentComparator(comparator)} '${segmentName}'`);
  }

  appendConditionResult(result: boolean): this {
    return this.append(`${result}`);
  }

  appendConditionConsequence(result: boolean): this {
    this.append(" => ").appendConditionResult(result);
    return result ? this : this.append(", skipping the remaining AND conditions");
  }

  private appendTargetingRuleThenPart(targetingRule: TargetingRule, settingType: SettingType, newLine: boolean): this {
    (newLine ? this.newLine() : this.append(" "))
      .append("THEN");

    if (!hasPercentageOptions(targetingRule, true)) {
      const simpleValue = targetingRule.s!;
      const value = unwrapValue(simpleValue.v, settingType, true);
      return this.append(` '${valueToString(value)}'`);
    }

    return this.append(" % options");
  }

  appendTargetingRuleConsequence(targetingRule: TargetingRule, settingType: SettingType, isMatchOrError: boolean | string, newLine: boolean): this {
    this.increaseIndent();

    this.appendTargetingRuleThenPart(targetingRule, settingType, newLine)
      .append(" => ").append(isMatchOrError === true ? "MATCH, applying rule" : isMatchOrError === false ? "no match" : isMatchOrError);

    return this.decreaseIndent();
  }
}

export function formatUserComparator(comparator: UserComparator): string {
  switch (comparator) {
    case UserComparator.TextIsOneOf:
    case UserComparator.SensitiveTextIsOneOf:
    case UserComparator.SemVerIsOneOf: return "IS ONE OF";
    case UserComparator.TextIsNotOneOf:
    case UserComparator.SensitiveTextIsNotOneOf:
    case UserComparator.SemVerIsNotOneOf: return "IS NOT ONE OF";
    case UserComparator.TextContainsAnyOf: return "CONTAINS ANY OF";
    case UserComparator.TextNotContainsAnyOf: return "NOT CONTAINS ANY OF";
    case UserComparator.SemVerLess:
    case UserComparator.NumberLess: return "<";
    case UserComparator.SemVerLessOrEquals:
    case UserComparator.NumberLessOrEquals: return "<=";
    case UserComparator.SemVerGreater:
    case UserComparator.NumberGreater: return ">";
    case UserComparator.SemVerGreaterOrEquals:
    case UserComparator.NumberGreaterOrEquals: return ">=";
    case UserComparator.NumberEquals: return "=";
    case UserComparator.NumberNotEquals: return "!=";
    case UserComparator.DateTimeBefore: return "BEFORE";
    case UserComparator.DateTimeAfter: return "AFTER";
    case UserComparator.TextEquals:
    case UserComparator.SensitiveTextEquals: return "EQUALS";
    case UserComparator.TextNotEquals:
    case UserComparator.SensitiveTextNotEquals: return "NOT EQUALS";
    case UserComparator.TextStartsWithAnyOf:
    case UserComparator.SensitiveTextStartsWithAnyOf: return "STARTS WITH ANY OF";
    case UserComparator.TextNotStartsWithAnyOf:
    case UserComparator.SensitiveTextNotStartsWithAnyOf: return "NOT STARTS WITH ANY OF";
    case UserComparator.TextEndsWithAnyOf:
    case UserComparator.SensitiveTextEndsWithAnyOf: return "ENDS WITH ANY OF";
    case UserComparator.TextNotEndsWithAnyOf:
    case UserComparator.SensitiveTextNotEndsWithAnyOf: return "NOT ENDS WITH ANY OF";
    case UserComparator.ArrayContainsAnyOf:
    case UserComparator.SensitiveArrayContainsAnyOf: return "ARRAY CONTAINS ANY OF";
    case UserComparator.ArrayNotContainsAnyOf:
    case UserComparator.SensitiveArrayNotContainsAnyOf: return "ARRAY NOT CONTAINS ANY OF";
    default: return invalidOperatorPlaceholder;
  }
}

export function formatUserCondition(condition: UserCondition): string {
  return new EvaluateLogBuilder("").appendUserCondition(condition).toString();
}

export function formatPrerequisiteFlagComparator(comparator: PrerequisiteFlagComparator): string {
  switch (comparator) {
    case PrerequisiteFlagComparator.Equals: return "EQUALS";
    case PrerequisiteFlagComparator.NotEquals: return "NOT EQUALS";
    default: return invalidOperatorPlaceholder;
  }
}

export function formatSegmentComparator(comparator: SegmentComparator): string {
  switch (comparator) {
    case SegmentComparator.IsIn: return "IS IN SEGMENT";
    case SegmentComparator.IsNotIn: return "IS NOT IN SEGMENT";
    default: return invalidOperatorPlaceholder;
  }
}

export function valueToString(value: NonNullable<SettingValue> | undefined): string {
  return isAllowedValue(value) ? value.toString() : invalidValuePlaceholder;
}

export function inferValue(settingValue: SettingValueModel): NonNullable<SettingValue> | undefined {
  let value: SettingValue | null | undefined, currentValue: typeof value;

  value = settingValue.b;

  currentValue = settingValue.s;
  if (currentValue != null) {
    if (value != null) return;
    value = currentValue;
  }

  currentValue = settingValue.i;
  if (currentValue != null) {
    if (value != null) return;
    value = currentValue;
  }

  currentValue = settingValue.d;
  if (currentValue != null) {
    if (value != null) return;
    value = currentValue;
  }

  return value ?? void 0;
}

function inferUserConditionComparisonValue(condition: UserCondition): string | number | ReadonlyArray<string> | undefined {
  let value: string | number | ReadonlyArray<string> | null | undefined, currentValue: typeof value;

  value = condition.s;

  currentValue = condition.d;
  if (currentValue != null) {
    if (value != null) return;
    value = currentValue;
  }

  currentValue = condition.l;
  if (currentValue != null) {
    if (value != null) return;
    value = currentValue;
  }

  return value ?? void 0;
}

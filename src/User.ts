import type { ObjectMap } from "./Utils";
import { createMap, hasOwnProperty } from "./Utils";

export type WellKnownUserObjectAttribute = "Identifier" | "Email" | "Country";

export type UserAttributeValue = string | number | Date | ReadonlyArray<string>;

/**
 * The interface of User Object.
 * Defines the user attributes which are used for evaluating targeting rules and percentage options.
 **/
export interface IUser {
  /** The unique identifier of the user or session (e.g. email address, primary key, session ID, etc.) */
  identifier: string;
  /** Email address of the user. */
  email?: string;
  /** Country of the user. */
  country?: string;
  /**
   * Custom attributes of the user for advanced targeting rule definitions (e.g. user role, subscription type, etc.)
   * @remarks
   * All comparators support `string` values as User Object attribute (in some cases they need to be provided in a specific format though, see below),
   * but some of them also support other types of values. It depends on the comparator how the values will be handled. The following rules apply:
   *
   * **Text-based comparators** (EQUALS, IS ONE OF, etc.)
   * * accept `string` values,
   * * all other values are automatically converted to `string` (a warning will be logged but evaluation will continue as normal).
   *
   * **SemVer-based comparators** (IS ONE OF, &lt;, &gt;=, etc.)
   * * accept `string` values containing a properly formatted, valid semver value,
   * * all other values are considered invalid (a warning will be logged and the currently evaluated targeting rule will be skipped).
   *
   * **Number-based comparators** (=, &lt;, &gt;=, etc.)
   * * accept `number` values,
   * * accept `string` values containing a properly formatted, valid `number` value,
   * * all other values are considered invalid (a warning will be logged and the currently evaluated targeting rule will be skipped).
   *
   * **Date time-based comparators** (BEFORE / AFTER)
   * * accept `Date` values, which are automatically converted to a second-based Unix timestamp,
   * * accept `number` values representing a second-based Unix timestamp,
   * * accept `string` values containing a properly formatted, valid `number` value,
   * * all other values are considered invalid (a warning will be logged and the currently evaluated targeting rule will be skipped).
   *
   * **String array-based comparators** (ARRAY CONTAINS ANY OF / ARRAY NOT CONTAINS ANY OF)
   * * accept arrays of `string`,
   * * accept `string` values containing a valid JSON string which can be deserialized to an array of `string`,
   * * all other values are considered invalid (a warning will be logged and the currently evaluated targeting rule will be skipped).
   **/
  custom?: Record<string, UserAttributeValue>;
}

/**
 * User Object.
 * Contains user attributes which are used for evaluating targeting rules and percentage options.
 * @remarks
 * Please note that the `User` class is not designed to be used as a DTO (data transfer object).
 * (Since the type of the `custom` property is polymorphic, it's not guaranteed that deserializing
 * a serialized instance produces an instance with an identical or even valid data content.)
 **/
export class User implements IUser {
  // NOTE: We keep this class for backward compatibility only. It was an oversight to introduce it instead of a plain interface as
  // consumers were never required to pass an actual instance of `User` (i.e. an object with prototype set to `User.prototype`) to the SDK.
  // (In fact, for a long time we advertised code examples creating a plain object instead of an actual instance of `User`.)
  // Thus, we can't rely on user objects having the correct prototype set, that is, we can't add instance methods to this class.
  // But it wouldn't make much sense anyway. See also: https://stackoverflow.com/q/54645400/8656352

  constructor(
    public identifier: string,
    public email?: string,
    public country?: string,
    public custom: Record<string, UserAttributeValue> = {}
  ) {
  }
}

export function getUserIdentifier(user: IUser): string {
  return user.identifier ?? "";
}

export function getUserAttribute(user: IUser, name: string): UserAttributeValue | null | undefined {
  switch (name) {
    case "Identifier" satisfies WellKnownUserObjectAttribute: return getUserIdentifier(user);
    case "Email" satisfies WellKnownUserObjectAttribute: return user.email;
    case "Country" satisfies WellKnownUserObjectAttribute: return user.country;
    default: return user.custom && hasOwnProperty(user.custom, name) ? user.custom[name] : void 0;
  }
}

export function getUserAttributes(user: IUser): ObjectMap<string, UserAttributeValue> {
  const result = createMap<string, UserAttributeValue>();

  const identifierAttribute: WellKnownUserObjectAttribute = "Identifier";
  const emailAttribute: WellKnownUserObjectAttribute = "Email";
  const countryAttribute: WellKnownUserObjectAttribute = "Country";

  result[identifierAttribute] = user.identifier ?? "";

  if (user.email != null) {
    result[emailAttribute] = user.email;
  }

  if (user.country != null) {
    result[countryAttribute] = user.country;
  }

  if (user.custom != null) {
    const wellKnownAttributes: string[] = [identifierAttribute, emailAttribute, countryAttribute];
    for (const attributeName in user.custom) {
      let attributeValue: UserAttributeValue;
      if (hasOwnProperty(user.custom, attributeName)
        && (attributeValue = user.custom[attributeName]) != null
        && wellKnownAttributes.indexOf(attributeName) < 0) {
        result[attributeName] = attributeValue;
      }
    }
  }

  return result;
}

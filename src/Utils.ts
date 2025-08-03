// NOTE: Normally, we'd just use AbortController/AbortSignal, however that may not be available on all platforms,
// and we don't want to include a complete polyfill. So we implement a simplified version that fits our use case.
export class AbortToken {
  private callbacks: (() => void)[] | undefined = [];
  get aborted(): boolean { return !this.callbacks; }

  abort(): void {
    if (!this.aborted) {
      const callbacks = this.callbacks!;
      this.callbacks = void 0;
      for (const callback of callbacks) {
        callback();
      }
    }
  }

  registerCallback(callback: () => void): () => void {
    if (this.aborted) {
      callback();
      return () => { };
    }

    this.callbacks!.push(callback);
    return () => {
      const callbacks = this.callbacks;
      let index: number;
      if (callbacks && (index = callbacks.indexOf(callback)) >= 0) {
        callbacks.splice(index, 1);
      }
    };
  }
}

export function delay(delayMs: number, abortToken?: AbortToken | null): Promise<boolean> {
  let timerId: ReturnType<typeof setTimeout>;
  return new Promise<boolean>(resolve => {
    const unregisterAbortCallback = abortToken?.registerCallback(() => {
      clearTimeout(timerId);
      resolve(false);
    });

    timerId = setTimeout(() => {
      unregisterAbortCallback?.();
      resolve(true);
    }, delayMs);
  });
}

// eslint-disable-next-line @typescript-eslint/unbound-method
export const getMonotonicTimeMs = typeof performance !== "undefined" && isFunction(performance?.now)
  ? () => performance.now()
  : () => new Date().getTime();

// NOTE: We don't use the built-in WeakRef-related types in the signatures of the exported functions below because
// this module is exposed via the "pubternal" API, and we don't want these types to be included in the generated
// type declarations because that might cause problems with older TypeScript versions.

export function createWeakRef(target: object): unknown {
  return new weakRefConstructor(target);
}

const weakRefConstructor = typeof WeakRef === "function" ? WeakRef : getWeakRefStub();

export function getWeakRefStub(): new (target: object) => unknown {
  type WeakRefImpl = WeakRef<WeakKey> & { target: object };

  // eslint-disable-next-line @typescript-eslint/naming-convention
  const WeakRef = function(this: WeakRefImpl, target: object) {
    this.target = target;
  } as Function as WeakRefConstructor & { isFallback: boolean };

  WeakRef.prototype.deref = function(this: WeakRefImpl) {
    return this.target;
  };

  WeakRef.isFallback = true;

  return WeakRef;
}

export function toStringSafe(value: unknown): string {
  try {
    // NOTE: Attempting to convert symbols and objects with no toString method (e.g. null-prototype objects) to string throws a TypeError.
    return typeof value === "symbol" ? "[symbol]"
      // eslint-disable-next-line @typescript-eslint/unbound-method
      : typeof value === "object" && value !== null && !isFunction(value.toString) ? Object.prototype.toString.call(value)
      : String(value);
  } catch {
    return "[unknown]";
  }
}

/** Formats error in a similar way to Chromium-based browsers. */
export function errorToString(err: any, includeStackTrace = false): string {
  return err instanceof Error ? visit(err, "") : toStringSafe(err);

  function visit(err: Error, indent: string, visited?: Error[]) {
    const errString = err.toString();
    let s = (!indent ? indent : indent.substring(4) + "--> ") + errString;
    if (includeStackTrace && err.stack) {
      let stack = err.stack.trim();
      // NOTE: Some JS runtimes (e.g. V8) includes the error in the stack trace, some don't (e.g. SpiderMonkey).
      if (stack.lastIndexOf(errString, 0) === 0) {
        stack = stack.substring(errString.length).trim();
      }
      s += "\n" + stack.replace(/^\s*(?:at\s)?/gm, indent + "    at ");
    }

    if (typeof AggregateError === "function" && err instanceof AggregateError) {
      (visited ??= []).push(err);
      for (const innerErr of err.errors) {
        if (innerErr instanceof Error) {
          if (visited.indexOf(innerErr) >= 0) {
            continue;
          }
          s += "\n" + visit(innerErr, indent + "    ", visited);
        } else {
          s += "\n" + indent + "--> " + toStringSafe(innerErr);
        }
      }
      visited.pop();
    }

    return s;
  }
}

/** Indicates a null-prototype object that is used as a map. */
export type ObjectMap<TKey extends keyof any, TValue> = Record<TKey, TValue>
  // See also: https://github.com/microsoft/TypeScript/issues/1108
  & { [K in keyof Object]: TValue };

/** Creates a null-prototype object that is used as a map. */
export function createMap<TKey extends keyof any, TValue>(): ObjectMap<TKey, TValue> {
  // See also: https://stackoverflow.com/a/15518712/8656352
  return Object.create(null) as ObjectMap<TKey, TValue>;
}

export const setPrototypeOf = isFunction(Object.setPrototypeOf)
  ? Object.setPrototypeOf as <T extends object>(obj: T, proto: object | null) => T
  : <T extends object>(obj: T, proto: object | null): T => ((obj as Record<string, unknown>).__proto__ = proto, obj);

export function ensurePrototype<T extends object>(obj: T, ctor: new (...args: any[]) => T): void {
  // NOTE: due to a known issue in the TS compiler, instanceof is broken when subclassing Error and targeting ES5 or earlier
  // (see https://github.com/microsoft/TypeScript/issues/13965).
  // Thus, we need to manually fix the prototype chain as recommended in the TS docs
  // (see https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work)

  if (!(obj instanceof ctor)) {
    setPrototypeOf(obj, ctor.prototype as object);
  }
}

export function hasOwnProperty(obj: object, key: keyof any): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

export function isNumber(value: unknown): value is number {
  return typeof value === "number";
}

export function isNumberInRange(value: unknown, minValue: number, maxValue: number): value is number {
  return isNumber(value) && minValue <= value && value <= maxValue;
}

export const isInteger = isFunction(Number.isSafeInteger)
  ? Number.isSafeInteger as (value: unknown) => value is number
  : (value: unknown): value is number => isNumber(value) && isFinite(value) && Math.floor(value) === value && Math.abs(value) <= 9007199254740991;

export function isIntegerInRange(value: unknown, minValue: number, maxValue: number): value is number {
  return isInteger(value) && minValue <= value && value <= maxValue;
}

export function isString(value: unknown): value is string {
  return typeof value === "string";
}

export function isObject(value: unknown): value is Record<keyof any, unknown> {
  return typeof value === "object" && value !== null && !isArray(value);
}

export function isArray(value: unknown): value is ReadonlyArray<unknown> {
  // See also: https://github.com/microsoft/TypeScript/issues/17002#issuecomment-1477626624
  return Array.isArray(value);
}

export function isStringArray(value: unknown): value is ReadonlyArray<string> {
  return isArray(value) && !value.some(item => !isString(item));
}

export function isFunction(value: unknown): value is (...args: unknown[]) => unknown {
  return typeof value === "function";
}

export function isPromiseLike<T>(obj: unknown): obj is PromiseLike<T> {
  // See also: https://stackoverflow.com/a/27746324/8656352
  // eslint-disable-next-line @typescript-eslint/unbound-method
  return isFunction((obj as PromiseLike<T> | undefined)?.then);
}

export function ensureBooleanArg(value: boolean, argName: string, memberPath?: string): boolean {
  isBoolean(value) || throwUnexpectedArgType(value, argName, "boolean", memberPath);
  return value;
}

export function ensureNumberArg(value: number, argName: string, memberPath?: string): number {
  isNumber(value) || throwUnexpectedArgType(value, argName, "number", memberPath);
  return value;
}

export function ensureNumberArgInRange(value: number, argName: string,
  rangeDescription: string, isInRange: (value: number) => boolean, memberPath?: string
): number {
  isNumber(value) || throwUnexpectedArgType(value, argName, "number", memberPath);
  isInRange(value) || throwInvalidArg(argName, `Expected a value ${rangeDescription}, got ${value}.`, memberPath, RangeError);
  return value;
}

export function ensureEnumArg<T extends number>(value: T, argName: string,
  enumName: string, isValidEnum: (value: number) => boolean, memberPath?: string
): T {
  ensureNumberArg(value, argName, memberPath);
  isValidEnum(value) || throwInvalidArg(argName, `Expected a valid \`${enumName}\` value, got '${value}'.`, memberPath, RangeError);
  return value;
}

export function ensureStringArg(value: string, argName: string, requireNonEmpty?: boolean, memberPath?: string): string {
  isString(value) || throwUnexpectedArgType(value, argName, "string", memberPath);
  (value.length || !requireNonEmpty) || throwInvalidArg(argName, "Expected a non-empty string.", memberPath);
  return value;
}

export function ensureFunctionArg<T extends (...args: any[]) => any>(value: T, argName: string, memberPath?: string): T {
  isFunction(value) || throwUnexpectedArgType(value, argName, "function", memberPath);
  return value;
}

export function ensureObjectArg<T extends object>(value: T, argName: string, requiredProps?: ObjectMap<keyof T, boolean>, memberPath?: string): T {
  isObject(value) || throwUnexpectedArgType(value, argName, "object", memberPath);
  if (requiredProps) {
    for (const key in requiredProps) {
      const isMethod = requiredProps[key as keyof T];
      if (!(key in value)
        || (isMethod && !isFunction((value as Record<string, unknown>)[key]))
      ) {
        throwInvalidArg(argName, `Expected an object with ${isMethod ? "method" : "property"} \`${key}\`.`, memberPath, TypeError);
      }
    }
  }
  return value;
}

function throwUnexpectedArgType(value: unknown, argName: string, expectedType: string, memberPath?: string): never {
  const actualType = value === null ? "null" : typeof value;
  throwInvalidArg(argName, `Expected a value of type ${expectedType}, got ${actualType}.`, memberPath, TypeError);
}

export function throwInvalidArg(argName: string, reason: string, memberPath?: string, errorConstructor?: ErrorConstructor): never {
  const argKind = !memberPath ? (memberPath = "", "argument") : "property";
  throw (errorConstructor ?? Error)(`Invalid ${argKind} \`${argName}${memberPath}\`. ${reason}`);
}

export function formatStringList(items: ReadonlyArray<string>, maxLength = 0, getOmittedItemsText?: (count: number) => string, separator = ", "): string {
  const length = items.length;
  if (!length) {
    return "";
  }

  let appendix = "";

  if (maxLength > 0 && length > maxLength) {
    items = items.slice(0, maxLength);
    if (getOmittedItemsText) {
      appendix = getOmittedItemsText(length - maxLength);
    }
  }

  return "'" + items.join("'" + separator + "'") + "'" + appendix;
}

export function utf8Encode(text: string): string {
  function codePointAt(text: string, index: number): number {
    const ch = text.charCodeAt(index);
    if (0xD800 <= ch && ch < 0xDC00) { // is high surrogate?
      const nextCh = text.charCodeAt(index + 1);
      if (0xDC00 <= nextCh && nextCh <= 0xDFFF) { // is low surrogate?
        return (ch << 10) + nextCh - 0x35FDC00;
      }
    }
    return ch;
  }

  let utf8text = "", chunkStart = 0;
  const fromCharCode = String.fromCharCode;

  let i;
  for (i = 0; i < text.length; i++) {
    const cp = codePointAt(text, i);
    if (cp <= 0x7F) {
      continue;
    }

    // See also: https://stackoverflow.com/a/6240184/8656352

    utf8text += text.slice(chunkStart, i);
    if (cp <= 0x7FF) {
      utf8text += fromCharCode(0xC0 | (cp >> 6));
      utf8text += fromCharCode(0x80 | (cp & 0x3F));
    } else if (cp <= 0xFFFF) {
      utf8text += fromCharCode(0xE0 | (cp >> 12));
      utf8text += fromCharCode(0x80 | ((cp >> 6) & 0x3F));
      utf8text += fromCharCode(0x80 | (cp & 0x3F));
    } else {
      utf8text += fromCharCode(0xF0 | (cp >> 18));
      utf8text += fromCharCode(0x80 | ((cp >> 12) & 0x3F));
      utf8text += fromCharCode(0x80 | ((cp >> 6) & 0x3F));
      utf8text += fromCharCode(0x80 | (cp & 0x3F));
      ++i;
    }
    chunkStart = i + 1;
  }

  return utf8text += text.slice(chunkStart, i);
}

export function parseIntStrict(value: string): number {
  // NOTE: JS's int to string conversion (parseInt) is too forgiving, it accepts hex numbers and ignores invalid characters after the number.

  if (!value.length || !/^\s*[+-]?\d+\s*$/.test(value)) {
    return NaN;
  }

  const number = +value;
  return isInteger(number) ? number : NaN;
}

export function parseFloatStrict(value: string): number {
  // NOTE: JS's float to string conversion is too forgiving, it accepts hex numbers and ignores invalid characters after the number.

  if (!value.length || /^\s*$|^\s*0[^\d.eE]/.test(value)) {
    return NaN;
  }

  return +value;
}

export function shallowClone<T extends {}>(obj: T, propertyReplacer?: (key: keyof T, value: unknown) => unknown): Record<keyof T, unknown> {
  const clone = {} as Record<keyof T, unknown>;
  for (const key in obj) {
    if (hasOwnProperty(obj, key)) {
      const value = obj[key];
      clone[key] = propertyReplacer ? propertyReplacer(key, value) : value;
    }
  }
  return clone;
}

export class LazyString<TState = any> {
  private factoryOrValue: ((state: TState) => string) | string;

  constructor(private state: TState, factory: (state: TState) => string) {
    this.factoryOrValue = factory;
  }

  toString(): string {
    let { factoryOrValue } = this;
    if (!isString(factoryOrValue)) {
      this.factoryOrValue = factoryOrValue = factoryOrValue(this.state);
      this.state = (void 0)!;
    }
    return factoryOrValue;
  }
}

export type Message = { toString(): string };

/** Picks a set of properties from object `T` and change their type as specified by `TPropMap`. */
export type PickWithType<T, TPropMap extends { [K in keyof T]?: unknown }> = {
  [K in keyof TPropMap]: TPropMap[K];
};

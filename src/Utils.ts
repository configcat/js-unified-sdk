// NOTE: Normally, we'd just use AbortController/AbortSignal, however that may not be available on all platforms,
// and we don't want to include a complete polyfill. So we implement a simplified version that fits our use case.
export class AbortToken {
  private callbacks: (() => void)[] | null = [];
  get aborted(): boolean { return !this.callbacks; }

  abort(): void {
    if (!this.aborted) {
      const callbacks = this.callbacks!;
      this.callbacks = null;
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

export const getMonotonicTimeMs = typeof performance !== "undefined" && typeof performance.now === "function"
  ? () => performance.now()
  : () => new Date().getTime();

// NOTE: We don't use the built-in WeakRef-related types in the signatures of the exported functions below because
// this module is exposed via the "pubternal" API, and we don't want these types to be included in the generated
// type definitions because that might cause problems with older TypeScript versions.

export function createWeakRef(target: object): unknown {
  return new weakRefConstructor(target);
}

const weakRefConstructor = typeof WeakRef === "function" ? WeakRef : getWeakRefStub() as WeakRefConstructor;

export function getWeakRefStub(): Function {
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

/** Formats error in a similar way to Chromium-based browsers. */
export function errorToString(err: any, includeStackTrace = false): string {
  return err instanceof Error ? visit(err, "") : "" + err;

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

    if (typeof AggregateError !== "undefined" && err instanceof AggregateError) {
      (visited ??= []).push(err);
      for (const innerErr of err.errors) {
        if (innerErr instanceof Error) {
          if (visited.indexOf(innerErr) >= 0) {
            continue;
          }
          s += "\n" + visit(innerErr, indent + "    ", visited);
        } else {
          s += "\n" + indent + "--> " + innerErr;
        }
      }
      visited.pop();
    }

    return s;
  }
}

export function throwError(err: any): never {
  throw err;
}

export function ensurePrototype<T>(obj: T, ctor: new (...args: any[]) => T): void {
  // NOTE: due to a known issue in the TS compiler, instanceof is broken when subclassing Error and targeting ES5 or earlier
  // (see https://github.com/microsoft/TypeScript/issues/13965).
  // Thus, we need to manually fix the prototype chain as recommended in the TS docs
  // (see https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work)

  if (!(obj instanceof ctor)) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    (Object.setPrototypeOf || ((obj, proto) => obj["__proto__"] = proto))(obj, ctor.prototype as object);
  }
}

export function isNumberInRange(value: unknown, minValue: number, maxValue: number): value is number {
  return typeof value === "number" && minValue <= value && value <= maxValue;
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !isArray(value);
}

export function isArray(value: unknown): value is ReadonlyArray<unknown> {
  // See also: https://github.com/microsoft/TypeScript/issues/17002#issuecomment-1477626624
  return Array.isArray(value);
}

export function isStringArray(value: unknown): value is string[] {
  return isArray(value) && !value.some(item => typeof item !== "string");
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

export function isPromiseLike<T>(obj: unknown): obj is PromiseLike<T> {
  // See also: https://stackoverflow.com/a/27746324/8656352
  return typeof (obj as PromiseLike<T> | undefined)?.then === "function";
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
  return Number.isSafeInteger(number) ? number : NaN;
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
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
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
    if (typeof factoryOrValue !== "string") {
      this.factoryOrValue = factoryOrValue = factoryOrValue(this.state);
      this.state = (void 0)!;
    }
    return factoryOrValue;
  }
}

export type Message = { toString(): string };

export function setupPolyfills(): void {
  // Object.values
  if (typeof Object.values === "undefined") {
    Object.values = ObjectValuesPolyfill;
  }

  // Object.entries
  if (typeof Object.entries === "undefined") {
    Object.entries = ObjectEntriesPolyfill;
  }
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export function ObjectValuesPolyfill<T>(o: { [s: string]: T } | ArrayLike<T>): T[] {
  const result: T[] = [];
  for (const key of Object.keys(o)) {
    result.push((o as Record<string, T>)[key]);
  }
  return result;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export function ObjectEntriesPolyfill<T>(o: { [s: string]: T } | ArrayLike<T>): [string, T][] {
  const result: [string, T][] = [];
  for (const key of Object.keys(o)) {
    result.push([key, (o as Record<string, T>)[key]]);
  }
  return result;
}

export function getWeakRefStub(): WeakRefConstructor {
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

export const isWeakRefAvailable = (): boolean => typeof WeakRef === "function";

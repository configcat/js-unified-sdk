import type { IEventEmitter } from "./EventEmitter";
import { createMap, isArray, isFunction } from "./Utils";

type Listener = { fn: (...args: any[]) => void; once: boolean };
type Listeners = Listener | Listener[];

// NOTE: It's better to place this class into a separate module so
// it can be omitted from the final bundle in case it's not used.
// (On platforms where a native implementation is available,
// we may choose to use that.)

/** A platform-independent implementation of `IEventEmitter`. */
export class DefaultEventEmitter implements IEventEmitter {
  private events = createMap<string | symbol, Listeners>();
  private eventCount = 0;

  private addListenerCore(eventName: string | symbol, fn: (...args: any[]) => void, once: boolean) {
    if (!isFunction(fn)) {
      throw TypeError("Listener must be a function");
    }

    const listeners = this.events[eventName];
    const listener: Listener = { fn, once };

    if (!listeners) {
      this.events[eventName] = listener;
      this.eventCount++;
    } else if (!isArray(listeners)) {
      this.events[eventName] = [listeners, listener];
    } else {
      listeners.push(listener);
    }

    return this;
  }

  private removeListenerCore<TState>(eventName: string | symbol, state: TState, isMatch: (listener: Listener, state: TState) => boolean) {
    const listeners = this.events[eventName];

    if (!listeners) {
      return this;
    }

    if (isArray(listeners)) {
      for (let i = listeners.length - 1; i >= 0; i--) {
        if (isMatch(listeners[i], state)) {
          listeners.splice(i, 1);
          if (!listeners.length) {
            this.removeEvent(eventName);
          } else if (listeners.length === 1) {
            this.events[eventName] = listeners[0];
          }
          break;
        }
      }
    } else if (isMatch(listeners, state)) {
      this.removeEvent(eventName);
    }

    return this;
  }

  private removeEvent(eventName: string | symbol) {
    if (--this.eventCount === 0) {
      this.events = createMap();
    } else {
      delete this.events[eventName];
    }
  }

  addListener!: (eventName: string | symbol, listener: (...args: any[]) => void) => this;

  on(eventName: string | symbol, listener: (...args: any[]) => void): this {
    return this.addListenerCore(eventName, listener, false);
  }

  once(eventName: string | symbol, listener: (...args: any[]) => void): this {
    return this.addListenerCore(eventName, listener, true);
  }

  removeListener(eventName: string | symbol, listener: (...args: any[]) => void): this {
    if (!isFunction(listener)) {
      throw TypeError("Listener must be a function");
    }

    return this.removeListenerCore(eventName, listener, (listener, fn) => listener.fn === fn);
  }

  off!: (eventName: string | symbol, listener: (...args: any[]) => void) => this;

  removeAllListeners(eventName?: string | symbol): this {
    if (!arguments.length) {
      this.events = createMap();
      this.eventCount = 0;
    } else if (this.events[eventName!]) {
      this.removeEvent(eventName!);
    }

    return this;
  }

  listeners(eventName: string | symbol): Function[] {
    const listeners = this.events[eventName];

    if (!listeners) {
      return [];
    }

    if (!isArray(listeners)) {
      return [listeners.fn];
    }

    const length = listeners.length, fns = new Array<Function>(length);
    for (let i = 0; i < length; i++) {
      fns[i] = listeners[i].fn;
    }
    return fns;
  }

  listenerCount(eventName: string | symbol): number {
    const listeners = this.events[eventName];

    if (!listeners) {
      return 0;
    }

    if (!isArray(listeners)) {
      return 1;
    }

    return listeners.length;
  }

  eventNames(): (string | symbol)[] {
    const names: (string | symbol)[] = [];

    if (this.eventCount === 0) {
      return names;
    }

    const events = this.events;
    for (const name in events) {
      names.push(name);
    }

    if (isFunction(Object.getOwnPropertySymbols)) {
      return names.concat(Object.getOwnPropertySymbols(events));
    }

    return names;
  }

  emit(eventName: string | symbol, arg0?: any, arg1?: any, arg2?: any, arg3?: any, ...moreArgs: any[]): boolean {
    let listeners = this.events[eventName];

    if (!listeners) {
      return false;
    }

    let listener: Listener, length: number;

    if (!isArray(listeners)) {
      [listener, length] = [listeners, 1];
    } else {
      // According to the specification, potential removes during emit should not change the list of notified listeners,
      // so we need to create a local copy of the current listeners.
      listeners = listeners.slice();
      [listener, length] = [listeners[0], listeners.length];
    }

    const argCount = arguments.length - 1;

    for (let i = 0; ;) {
      if (listener.once) {
        this.removeListenerCore(eventName, listener, (listener, toRemove) => listener === toRemove);
      }

      switch (argCount) {
        case 0: listener.fn.call(this); break;
        case 1: listener.fn.call(this, arg0); break;
        case 2: listener.fn.call(this, arg0, arg1); break;
        case 3: listener.fn.call(this, arg0, arg1, arg2); break;
        case 4: listener.fn.call(this, arg0, arg1, arg2, arg3); break;
        default:
          const args = new Array(argCount);
          for (let j = 0; j < argCount; j++) {
            // eslint-disable-next-line prefer-rest-params, @typescript-eslint/no-unsafe-assignment
            args[j] = arguments[j + 1];
          }
          listener.fn.apply(this, args);
          break;
      }

      if (++i >= length) {
        break;
      }

      listener = (listeners as Listener[])[i];
    }

    return true;
  }
}

/* eslint-disable @typescript-eslint/unbound-method */
const defaultEventEmitterPrototype = DefaultEventEmitter.prototype;
defaultEventEmitterPrototype.addListener = defaultEventEmitterPrototype.on;
defaultEventEmitterPrototype.off = defaultEventEmitterPrototype.removeListener;
/* eslint-enabled @typescript-eslint/unbound-method */

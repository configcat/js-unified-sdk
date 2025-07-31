import type { IConfigCatClient } from "./ConfigCatClient";
import type { ClientCacheState, RefreshResult } from "./ConfigServiceBase";
import type { IEventEmitter, IEventProvider } from "./EventEmitter";
import { NullEventEmitter } from "./EventEmitter";
import type { Config } from "./ProjectConfig";
import type { EvaluationDetails } from "./RolloutEvaluator";
import type { Message } from "./Utils";

/** Hooks (events) that can be emitted by `ConfigCatClient`. */
export type HookEvents = {
  /**
   * Occurs when the client reaches the ready state, i.e. completes initialization.
   *
   * @remarks Ready state is reached as soon as the initial sync with the external cache (if any) completes.
   * If this does not produce up-to-date config data, and the client is online (i.e. HTTP requests are allowed),
   * the first config fetch operation is also awaited in Auto Polling mode before ready state is reported.
   *
   * That is, reaching the ready state usually means the client is ready to evaluate feature flags and settings.
   * However, please note that this is not guaranteed. In case of initialization failure or timeout, the internal cache
   * may be empty or expired even after the ready state is reported. You can verify this by checking the `cacheState` parameter.
   */
  clientReady: [cacheState: ClientCacheState];
  /** Occurs after the value of a feature flag of setting has been evaluated. */
  flagEvaluated: [evaluationDetails: EvaluationDetails];
  /**
   * Occurs after attempting to update the cached config by fetching the latest version from the ConfigCat CDN.
   */
  configFetched: [result: RefreshResult, isInitiatedByUser: boolean];
  /**
   * Occurs after the internally cached config has been updated to a newer version, either as a result of synchronization
   * with the external cache, or as a result of fetching a newer version from the ConfigCat CDN.
   */
  configChanged: [newConfig: Config];
  /** Occurs in the case of a failure in the client. */
  clientError: [message: Message, exception?: any];
};

/** Defines hooks (events) for providing notifications of `ConfigCatClient`'s actions. */
export interface IProvidesHooks extends IEventProvider<HookEvents, IProvidesConfigCatClient> {
}

export interface IProvidesConfigCatClient {
  /** The `IConfigCatClient` instance that emitted the event. */
  readonly configCatClient: IConfigCatClient;
}

const disconnectedEventEmitter = new NullEventEmitter();

export class Hooks implements IProvidesConfigCatClient, IEventEmitter<HookEvents, IProvidesConfigCatClient> {
  private eventEmitter: IEventEmitter;

  configCatClient!: IConfigCatClient; // initialized by ConfigCatClient.constructor

  constructor(eventEmitter: IEventEmitter) {
    this.eventEmitter = eventEmitter;

    // NOTE: Listeners are actually called by eventEmitter, that is, in listeners, `this` will be set to reference the
    // IEventEmitter instance instead of the Hooks one. Thus, we need to augment eventEmitter with a configCatClient
    // property to provide the promised interface for consumers.
    const propertyDescriptor = Object.create(null) as PropertyDescriptor;
    propertyDescriptor.get = () => this.configCatClient satisfies IProvidesConfigCatClient["configCatClient"];
    propertyDescriptor.enumerable = true;
    Object.defineProperty(eventEmitter, "configCatClient" satisfies keyof IProvidesConfigCatClient, propertyDescriptor);
  }

  tryDisconnect(): boolean {
    // Replacing the current IEventEmitter object (eventEmitter) with a special instance of IEventEmitter (disconnectedEventEmitter) achieves multiple things:
    // 1. determines whether the hooks instance has already been disconnected or not,
    // 2. removes implicit references to subscriber objects (so this instance won't keep them alive under any circumstances),
    // 3. makes sure that future subscriptions are ignored from this point on.
    const originalEventEmitter = this.eventEmitter as IEventEmitter<HookEvents>;
    this.eventEmitter = disconnectedEventEmitter;

    return originalEventEmitter !== disconnectedEventEmitter;
  }

  /** @inheritdoc */
  addListener: <TEventName extends keyof HookEvents>(eventName: TEventName, listener: (this: this, ...args: HookEvents[TEventName]) => void) => this =
    // eslint-disable-next-line @typescript-eslint/unbound-method
    this.on;

  /** @inheritdoc */
  on<TEventName extends keyof HookEvents>(eventName: TEventName, listener: (this: this, ...args: HookEvents[TEventName]) => void): this {
    this.eventEmitter.on(eventName, listener as (...args: any[]) => void);
    return this;
  }

  /** @inheritdoc */
  once<TEventName extends keyof HookEvents>(eventName: TEventName, listener: (this: this, ...args: HookEvents[TEventName]) => void): this {
    this.eventEmitter.once(eventName, listener as (...args: any[]) => void);
    return this;
  }

  /** @inheritdoc */
  removeListener<TEventName extends keyof HookEvents>(eventName: TEventName, listener: (this: this, ...args: HookEvents[TEventName]) => void): this {
    this.eventEmitter.removeListener(eventName, listener as (...args: any[]) => void);
    return this;
  }

  /** @inheritdoc */
  off: <TEventName extends keyof HookEvents>(eventName: TEventName, listener: (this: this, ...args: HookEvents[TEventName]) => void) => this =
    // eslint-disable-next-line @typescript-eslint/unbound-method
    this.removeListener;

  /** @inheritdoc */
  removeAllListeners(eventName?: keyof HookEvents): this {
    this.eventEmitter.removeAllListeners(eventName);
    return this;
  }

  /** @inheritdoc */
  listeners(eventName: keyof HookEvents): Function[] {
    return this.eventEmitter.listeners(eventName);
  }

  /** @inheritdoc */
  listenerCount(eventName: keyof HookEvents): number {
    return this.eventEmitter.listenerCount(eventName);
  }

  /** @inheritdoc */
  eventNames(): (keyof HookEvents)[] {
    return this.eventEmitter.eventNames() as (keyof HookEvents)[];
  }

  /** @inheritdoc */
  emit<TEventName extends keyof HookEvents>(eventName: TEventName, ...args: HookEvents[TEventName]): boolean {
    return this.eventEmitter.emit(eventName, ...args);
  }
}

// Strong back-references to the client instance must be avoided so GC can collect it when user doesn't have references to it any more.
// E.g. if a strong reference chain like AutoPollConfigService -> ... -> ConfigCatClient existed, the client instance could not be collected
// because the background polling loop would keep the AutoPollConfigService alive indefinetely, which in turn would keep alive ConfigCatClient.
// We need to break such strong reference chains with a weak reference somewhere. As consumers are free to add hook event handlers which
// close over the client instance (e.g. `client.on("configChanged", cfg => { client.GetValue(...) }`), that is, a chain like
// AutoPollConfigService -> Hooks -> event handler -> ConfigCatClient can be created, it is the hooks reference that we need to make weak.
export type SafeHooksWrapper = Pick<Hooks, "emit">;

import { AugmentedOptions, platform } from "./platform";
import { IConfigCache, IConfigCatCache } from "#lib/ConfigCatCache";
import { IConfigCatClient } from "#lib/ConfigCatClient";
import { AutoPollOptions, IAutoPollOptions, ILazyLoadingOptions, IManualPollOptions, IOptions, LazyLoadOptions, ManualPollOptions } from "#lib/ConfigCatClientOptions";
import { IConfigCatLogger, LogEventId, LogLevel, LogMessage } from "#lib/ConfigCatLogger";
import { FetchRequest, FetchResponse, IConfigCatConfigFetcher as IConfigFetcher } from "#lib/ConfigFetcher";
import { IConfigCatKernel } from "#lib/index.pubternals";
import { ProjectConfig } from "#lib/ProjectConfig";
import { delay } from "#lib/Utils";

export function createKernel(kernelOverride?: Partial<IConfigCatKernel>, options?: IOptions): IConfigCatKernel {
  return platform().createKernel(kernel => Object.assign(kernel, kernelOverride), options);
}

export function createAutoPollOptions(sdkKey: string, options?: IAutoPollOptions, kernel?: IConfigCatKernel): AugmentedOptions<AutoPollOptions> {
  return platform().createAutoPollOptions(sdkKey, options, kernel ?? createKernel(void 0, options));
}

export function createManualPollOptions(sdkKey: string, options?: IManualPollOptions, kernel?: IConfigCatKernel): AugmentedOptions<ManualPollOptions> {
  return platform().createManualPollOptions(sdkKey, options, kernel ?? createKernel(void 0, options));
}

export function createLazyLoadOptions(sdkKey: string, options?: ILazyLoadingOptions, kernel?: IConfigCatKernel): AugmentedOptions<LazyLoadOptions> {
  return platform().createLazyLoadOptions(sdkKey, options, kernel ?? createKernel(void 0, options));
}

export function createClientWithAutoPoll(sdkKey: string, kernelOverride?: Partial<IConfigCatKernel>, options?: IAutoPollOptions): IConfigCatClient {
  return platform().createClientWithAutoPoll(sdkKey, options, kernel => Object.assign(kernel, kernelOverride));
}

export function createClientWithManualPoll(sdkKey: string, kernelOverride?: Partial<IConfigCatKernel>, options?: IManualPollOptions): IConfigCatClient {
  return platform().createClientWithManualPoll(sdkKey, options, kernel => Object.assign(kernel, kernelOverride));
}

export function createClientWithLazyLoad(sdkKey: string, kernelOverride?: IConfigCatKernel, options?: ILazyLoadingOptions): IConfigCatClient {
  return platform().createClientWithLazyLoad(sdkKey, options, kernel => Object.assign(kernel, kernelOverride));
}

export class FakeLogger implements IConfigCatLogger {
  events: [LogLevel, LogEventId, LogMessage, any?][] = [];

  constructor(public level = LogLevel.Info) { }

  reset(): void { this.events.splice(0); }

  log(level: LogLevel, eventId: number, message: LogMessage, exception?: any): void {
    this.events.push([level, eventId, message, exception]);
  }
}

export class FakeCache implements IConfigCache {
  cached: ProjectConfig;

  constructor(cached: ProjectConfig | null = null) {
    this.cached = cached ?? ProjectConfig.empty;
  }

  get localCachedConfig(): ProjectConfig { return this.cached; }

  set(_key: string, config: ProjectConfig): Promise<void> | void {
    this.cached = config;
  }

  get(_key: string): Promise<ProjectConfig> | ProjectConfig {
    return this.cached;
  }

  getInMemory(): ProjectConfig {
    return this.cached;
  }
}

export class FakeExternalCache implements IConfigCatCache {
  cachedValue: string | undefined;

  set(key: string, value: string): void {
    this.cachedValue = value;
  }

  get(key: string): string | undefined {
    return this.cachedValue;
  }
}

export class FaultyFakeExternalCache implements IConfigCatCache {
  set(key: string, value: string): never {
    throw new Error("Operation failed :(");
  }
  get(key: string): never {
    throw new Error("Operation failed :(");
  }
}

export class FakeExternalAsyncCache implements IConfigCatCache {
  cachedValue: string | undefined;

  constructor(private readonly delayMs = 0) {
  }

  async set(key: string, value: string): Promise<void> {
    await delay(this.delayMs);
    this.cachedValue = value;
  }

  async get(key: string): Promise<string | undefined> {
    await delay(this.delayMs);
    return this.cachedValue;
  }
}

export class FakeExternalCacheWithInitialData implements IConfigCatCache {
  expirationDelta: number;

  constructor(expirationDelta = 0) {
    this.expirationDelta = expirationDelta;
  }

  set(key: string, value: string): void | Promise<void> {
    throw new Error("Method not implemented.");
  }
  get(key: string): string | Promise<string | null | undefined> | null | undefined {
    const cachedJson = '{"f":{"debug":{"t":0,"v":{"b":true},"i":"abcdefgh"}}}';
    const config = new ProjectConfig(cachedJson, JSON.parse(cachedJson), ProjectConfig.generateTimestamp() - this.expirationDelta, "\"ETAG\"");
    return ProjectConfig.serialize(config);
  }

}

export class FakeConfigFetcherBase implements IConfigFetcher {
  calledTimes = 0;

  constructor(
    private config: string | null,
    private readonly callbackDelay = 0,
    private readonly getFetchResponse?: (lastConfig: string | null, lastEtag?: string) => FetchResponse) {

    this.config ??= this.defaultConfigJson;
  }

  protected get defaultConfigJson(): string | null { return null; }

  async fetchAsync(request: FetchRequest): Promise<FetchResponse> {
    const nextFetchResponse = this.getFetchResponse
      ? (lastConfig: string | null, lastEtag?: string) => {
        const fr = this.getFetchResponse!(lastConfig, lastEtag);
        this.config = fr.body ?? null;
        return fr;
      }
      : () => {
        return this.config === null ? { statusCode: 404, reasonPhrase: "Not Found" } as FetchResponse
          : this.getEtag() === request.lastETag ? { statusCode: 304, reasonPhrase: "Not Modified" } as FetchResponse
          : { statusCode: 200, reasonPhrase: "OK", eTag: this.getEtag(), body: this.config } as FetchResponse;
      };

    await delay(this.callbackDelay);

    this.calledTimes++;
    return nextFetchResponse(this.config, request.lastETag);
  }

  protected getEtag(): string {
    return "etag";
  }
}

export class FakeConfigFetcher extends FakeConfigFetcherBase {
  static get configJson(): string {
    return '{"f":{"debug":{"t":0,"v":{"b":true},"i":"abcdefgh"}}}';
  }

  get defaultConfigJson(): string { return (this.constructor as typeof FakeConfigFetcher).configJson; }

  constructor(callbackDelayInMilliseconds = 0) {
    super(null, callbackDelayInMilliseconds);
  }
}

export class FakeConfigFetcherWithTwoKeys extends FakeConfigFetcher {
  static get configJson(): string {
    return '{"f":{"debug":{"t":0,"v":{"b":true},"i":"abcdefgh"},"debug2":{"t":0,"v":{"b":true},"i":"12345678"}}}';
  }
}

export class FakeConfigFetcherWithTwoCaseSensitiveKeys extends FakeConfigFetcher {
  static get configJson(): string {
    return '{"f":{"DEBUG":{"t":1,"v":{"s":"DEBUG"},"i":"12345678"},"debug":{"t":1,"r":[{"c":[{"u":{"a":"CUSTOM","c":0,"l":["c"]}}],"s":{"v":{"s":"UPPER-VALUE"},"i":"6ada5ff2"}},{"c":[{"u":{"a":"custom","c":0,"l":["c"]}}],"s":{"v":{"s":"lower-value"},"i":"6ada5ff2"}}],"v":{"s":"debug"},"i":"abcdefgh"}}}';
  }
}

export class FakeConfigFetcherWithTwoKeysAndRules extends FakeConfigFetcher {
  static get configJson(): string {
    return '{"f":{"debug":{"t":1,"r":[{"c":[{"u":{"a":"a","c":1,"l":["abcd"]}}],"s":{"v":{"s":"value"},"i":"6ada5ff2"}}],"v":{"s":"def"},"i":"abcdefgh"},"debug2":{"t":1,"p":[{"p":50,"v":{"s":"value1"},"i":"d227b334"},{"p":50,"v":{"s":"value2"},"i":"622f5d07"}],"v":{"s":"def"},"i":"12345678"}}}';
  }
}

export class FakeConfigFetcherWithPercentageOptionsWithinTargetingRule extends FakeConfigFetcher {
  static get configJson(): string {
    return '{"f":{"debug":{"t":1,"r":[{"c":[{"u":{"a":"a","c":1,"l":["abcd"]}}],"s":{"v":{"s":"value"},"i":"6ada5ff2"}},{"c":[{"u":{"a":"a","c":0,"l":["abcd"]}}],"p":[{"p":50,"v":{"s":"value1"},"i":"d227b334"},{"p":50,"v":{"s":"value2"},"i":"622f5d07"}]}],"v":{"s":"def"},"i":"abcdefgh"}}}';
  }
}

export class FakeConfigFetcherWithRules extends FakeConfigFetcher {
  static get configJson(): string {
    return '{"f":{"debug":{"t":1,"r":[{"c":[{"u":{"a":"eyeColor","c":0,"l":["red"]}}],"s":{"v":{"s":"redValue"},"i":"redVariationId"}},{"c":[{"u":{"a":"eyeColor","c":0,"l":["blue"]}}],"s":{"v":{"s":"blueValue"},"i":"blueVariationId"}}],"v":{"s":"defaultValue"},"i":"defaultVariationId"}}}';
  }
}

export class FakeConfigFetcherWithNullNewConfig extends FakeConfigFetcherBase {
  constructor(callbackDelayInMilliseconds = 0) {
    super(null, callbackDelayInMilliseconds);
  }
}

export class FakeConfigFetcherWithAlwaysVariableEtag extends FakeConfigFetcher {
  static get configJson(): string {
    return '{"f":{"debug":{"t":0,"v":{"b":true},"i":"abcdefgh"}}}';
  }

  private eTag = 0;

  getEtag(): string {
    return `"${(this.eTag++).toString(16).padStart(8, "0")}"`;
  }
}

export class FakeConfigFetcherWithPercentageOptions extends FakeConfigFetcher {
  static get configJson(): string {
    return '{"f":{"string25Cat25Dog25Falcon25Horse":{"t":1,"p":[{"p":25,"v":{"s":"Cat"},"i":"CatVariationId"},{"p":25,"v":{"s":"Dog"},"i":"DogVariationId"},{"p":25,"v":{"s":"Falcon"},"i":"FalconVariationId"},{"p":25,"v":{"s":"Horse"},"i":"HorseVariationId"}],"v":{"s":"Chicken"},"i":"ChickenVariationId"}}}';
  }
}

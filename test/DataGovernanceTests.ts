import { assert } from "chai";
import type { AugmentedOptions } from "./helpers/platform";
import { DataGovernance, IConfigCatKernel, OptionsBase } from "#lib/ConfigCatClientOptions";
import { FetchRequest, FetchResponse, FetchResult, IConfigCatConfigFetcher as IConfigFetcher } from "#lib/ConfigFetcher";
import type * as ConfigJson from "#lib/ConfigJson";
import { ClientCacheState, ConfigServiceBase, RefreshErrorCode } from "#lib/ConfigServiceBase";
import { prepareConfig, ProjectConfig } from "#lib/ProjectConfig";

const globalUrl = "https://cdn-global.configcat.com";
const euOnlyUrl = "https://cdn-eu.configcat.com";
const customUrl = "https://cdn-custom.configcat.com";
const forcedUrl = "https://cdn-forced.configcat.com";
const testObject = { test: { t: 0, v: { b: true } } };

describe("DataGovernance", () => {

  it("sdk global, organization global", async () => {
    // In this case
    // the first invocation should call https://cdn-global.configcat.com
    // and the second should call https://cdn-global.configcat.com
    // without force redirects
    const configService = new FakeConfigServiceBase();
    configService.prepareResponse(globalUrl, globalUrl, 0, testObject);

    let [, config] = await configService.refreshLogicAsync();

    assert.equal(JSON.stringify(config.config!.f), JSON.stringify(testObject));
    configService.validateCallCount(1);
    configService.validateCall(0, globalUrl);

    [, config] = await configService.refreshLogicAsync();
    assert.equal(JSON.stringify(config.config!.f), JSON.stringify(testObject));
    configService.validateCallCount(2);
    configService.validateCall(0, globalUrl);
    configService.validateCall(1, globalUrl);
  });

  it("sdk euonly, organization global", async () => {
    // In this case
    // the first invocation should call https://cdn-eu.configcat.com
    // and the second should call https://cdn-global.configcat.com
    // without force redirects
    const configService = new FakeConfigServiceBase(DataGovernance.EuOnly);
    configService.prepareResponse(euOnlyUrl, globalUrl, 0, testObject);
    configService.prepareResponse(globalUrl, globalUrl, 0, testObject);

    let [, config] = await configService.refreshLogicAsync();
    assert.equal(JSON.stringify(JSON.parse(config.configJson!)["f"]), JSON.stringify(testObject));
    configService.validateCallCount(1);
    configService.validateCall(0, euOnlyUrl);

    [, config] = await configService.refreshLogicAsync();
    assert.equal(JSON.stringify(JSON.parse(config.configJson!)["f"]), JSON.stringify(testObject));
    configService.validateCallCount(2);
    configService.validateCall(0, euOnlyUrl);
    configService.validateCall(1, globalUrl);
  });

  it("sdk global, organization euonly", async () => {
    // In this case
    // the first invocation should call https://cdn-global.configcat.com
    // with an immediate redirect to https://cdn-eu.configcat.com
    // and the second should call https://cdn-eu.configcat.com

    const configService = new FakeConfigServiceBase(DataGovernance.Global);
    configService.prepareResponse(euOnlyUrl, euOnlyUrl, 0, testObject);
    configService.prepareResponse(globalUrl, euOnlyUrl, 1, null);

    let [, config] = await configService.refreshLogicAsync();
    assert.equal(JSON.stringify(JSON.parse(config.configJson!)["f"]), JSON.stringify(testObject));
    configService.validateCallCount(2);
    configService.validateCall(0, globalUrl);
    configService.validateCall(1, euOnlyUrl);

    [, config] = await configService.refreshLogicAsync();
    assert.equal(JSON.stringify(JSON.parse(config.configJson!)["f"]), JSON.stringify(testObject));
    configService.validateCallCount(3);
    configService.validateCall(0, globalUrl);
    configService.validateCall(1, euOnlyUrl);
    configService.validateCall(2, euOnlyUrl);
  });

  it("sdk euonly, organization euonly", async () => {
    // In this case
    // the first invocation should call https://cdn-eu.configcat.com
    // and the second should call https://cdn-eu.configcat.com
    // without redirects
    const configService = new FakeConfigServiceBase(DataGovernance.EuOnly);
    configService.prepareResponse(euOnlyUrl, euOnlyUrl, 0, testObject);

    let [, config] = await configService.refreshLogicAsync();
    assert.equal(JSON.stringify(JSON.parse(config.configJson!)["f"]), JSON.stringify(testObject));
    configService.validateCallCount(1);
    configService.validateCall(0, euOnlyUrl);

    [, config] = await configService.refreshLogicAsync();
    assert.equal(JSON.stringify(JSON.parse(config.configJson!)["f"]), JSON.stringify(testObject));
    configService.validateCallCount(2);
    configService.validateCall(0, euOnlyUrl);
    configService.validateCall(1, euOnlyUrl);
  });

  it("sdk global, custom", async () => {
    // In this case
    // the first invocation should call https://custom.configcat.com
    // and the second should call https://custom.configcat.com
    // without redirects
    const configService = new FakeConfigServiceBase(DataGovernance.Global, customUrl);
    configService.prepareResponse(customUrl, globalUrl, 0, testObject);

    let [, config] = await configService.refreshLogicAsync();
    assert.equal(JSON.stringify(JSON.parse(config.configJson!)["f"]), JSON.stringify(testObject));
    configService.validateCallCount(1);
    configService.validateCall(0, customUrl);

    [, config] = await configService.refreshLogicAsync();
    assert.equal(JSON.stringify(JSON.parse(config.configJson!)["f"]), JSON.stringify(testObject));
    configService.validateCallCount(2);
    configService.validateCall(0, customUrl);
    configService.validateCall(1, customUrl);
  });

  it("sdk euonly, custom", async () => {
    // In this case
    // the first invocation should call https://custom.configcat.com
    // and the second should call https://custom.configcat.com
    // without redirects
    const configService = new FakeConfigServiceBase(DataGovernance.EuOnly, customUrl);
    configService.prepareResponse(customUrl, globalUrl, 0, testObject);

    let [, config] = await configService.refreshLogicAsync();
    assert.equal(JSON.stringify(JSON.parse(config.configJson!)["f"]), JSON.stringify(testObject));
    configService.validateCallCount(1);
    configService.validateCall(0, customUrl);

    [, config] = await configService.refreshLogicAsync();
    assert.equal(JSON.stringify(JSON.parse(config.configJson!)["f"]), JSON.stringify(testObject));
    configService.validateCallCount(2);
    configService.validateCall(0, customUrl);
    configService.validateCall(1, customUrl);
  });

  it("sdk global, custom - should respect custom url when redirect is not forced", async () => {
    // In this case
    // the first invocation should call https://cdn-custom.configcat.com
    // the second invocation should call https://cdn-custom.configcat.com
    const configService = new FakeConfigServiceBase(DataGovernance.Global, customUrl);
    configService.prepareResponse(customUrl, globalUrl, 1, null);

    let [, config] = await configService.refreshLogicAsync();
    assert.isNull(JSON.parse(config.configJson!)["f"]);
    configService.validateCallCount(1);
    configService.validateCall(0, customUrl);

    [, config] = await configService.refreshLogicAsync();
    assert.isNull(JSON.parse(config.configJson!)["f"]);
    configService.validateCallCount(2);
    configService.validateCall(1, customUrl);
  });

  it("sdk global, forced", async () => {
    // In this case
    // the first invocation should call https://cdn-global.configcat.com
    // with an immediate redirect to https://forced.configcat.com
    // and the second should call https://forced.configcat.com
    const configService = new FakeConfigServiceBase(DataGovernance.Global);
    configService.prepareResponse(globalUrl, forcedUrl, 2, null);
    configService.prepareResponse(forcedUrl, forcedUrl, 2, testObject);

    let [, config] = await configService.refreshLogicAsync();
    assert.equal(JSON.stringify(JSON.parse(config.configJson!)["f"]), JSON.stringify(testObject));
    configService.validateCallCount(2);
    configService.validateCall(0, globalUrl);
    configService.validateCall(1, forcedUrl);

    [, config] = await configService.refreshLogicAsync();
    assert.equal(JSON.stringify(JSON.parse(config.configJson!)["f"]), JSON.stringify(testObject));
    configService.validateCallCount(3);
    configService.validateCall(0, globalUrl);
    configService.validateCall(1, forcedUrl);
    configService.validateCall(2, forcedUrl);
  });

  it("sdk euonly, forced", async () => {
    // In this case
    // the first invocation should call https://cdn-eu.configcat.com
    // with an immediate redirect to https://forced.configcat.com
    // and the second should call https://forced.configcat.com
    const configService = new FakeConfigServiceBase(DataGovernance.EuOnly);
    configService.prepareResponse(euOnlyUrl, forcedUrl, 2, null);
    configService.prepareResponse(forcedUrl, forcedUrl, 2, testObject);

    let [, config] = await configService.refreshLogicAsync();
    assert.equal(JSON.stringify(JSON.parse(config.configJson!)["f"]), JSON.stringify(testObject));
    configService.validateCallCount(2);
    configService.validateCall(0, euOnlyUrl);
    configService.validateCall(1, forcedUrl);

    [, config] = await configService.refreshLogicAsync();
    assert.equal(JSON.stringify(JSON.parse(config.configJson!)["f"]), JSON.stringify(testObject));
    configService.validateCallCount(3);
    configService.validateCall(0, euOnlyUrl);
    configService.validateCall(1, forcedUrl);
    configService.validateCall(2, forcedUrl);
  });

  it("sdk baseurl, forced", async () => {
    // In this case
    // the first invocation should call https://cdn-custom.configcat.com
    // with an immediate redirect to https://forced.configcat.com
    // and the second should call https://forced.configcat.com
    const configService = new FakeConfigServiceBase(DataGovernance.EuOnly, customUrl);
    configService.prepareResponse(customUrl, forcedUrl, 2, null);
    configService.prepareResponse(forcedUrl, forcedUrl, 2, testObject);

    let [, config] = await configService.refreshLogicAsync();
    assert.equal(JSON.stringify(JSON.parse(config.configJson!)["f"]), JSON.stringify(testObject));
    configService.validateCallCount(2);
    configService.validateCall(0, customUrl);
    configService.validateCall(1, forcedUrl);

    [, config] = await configService.refreshLogicAsync();
    assert.equal(JSON.stringify(JSON.parse(config.configJson!)["f"]), JSON.stringify(testObject));
    configService.validateCallCount(3);
    configService.validateCall(0, customUrl);
    configService.validateCall(1, forcedUrl);
    configService.validateCall(2, forcedUrl);
  });

  it("sdk redirect loop", async () => {
    // In this case
    // the first invocation should call https://cdn-global.configcat.com
    // with an immediate redirect to https://cdn-eu.configcat.com
    // with an immediate redirect to https://cdn-global.configcat.com
    // the second invocation should call https://cdn-eu.configcat.com
    // with an immediate redirect to https://cdn-global.configcat.com
    // with an immediate redirect to https://cdn-eu.configcat.com
    const configService = new FakeConfigServiceBase(DataGovernance.Global);
    configService.prepareResponse(globalUrl, euOnlyUrl, 1, null);
    configService.prepareResponse(euOnlyUrl, globalUrl, 1, null);

    let [, config] = await configService.refreshLogicAsync();
    assert.isNull(JSON.parse(config.configJson!)["f"]);
    configService.validateCallCount(3);
    configService.validateCall(0, globalUrl);
    configService.validateCall(1, euOnlyUrl);
    configService.validateCall(2, globalUrl);

    [, config] = await configService.refreshLogicAsync();
    assert.isNull(JSON.parse(config.configJson!)["f"]);
    configService.validateCallCount(6);
    configService.validateCall(0, globalUrl);
    configService.validateCall(1, euOnlyUrl);
    configService.validateCall(2, globalUrl);

    configService.validateCall(3, euOnlyUrl);
    configService.validateCall(4, globalUrl);
    configService.validateCall(5, euOnlyUrl);
  });
});

export class FakeConfigFetcher implements IConfigFetcher {
  responses: { [url: string]: FetchResult } = {};
  calls: any[] = [];

  constructor(private readonly options: OptionsBase) { }

  prepareResponse(url: string, fetchResult: FetchResult): void {
    this.responses[url] = fetchResult;
  }

  fetchAsync(request: FetchRequest): Promise<FetchResponse> {
    const { options } = this;
    const getUrl = ((options as Partial<AugmentedOptions<OptionsBase>>).getRealUrl ?? options.getUrl).bind(options);
    const projectConfig = this.responses[getUrl()];
    if (!projectConfig) {
      assert.fail("ConfigFetcher not prepared for " + getUrl());
    }
    this.calls.push(getUrl());
    return Promise.resolve<FetchResponse>({ statusCode: 200, reasonPhrase: "OK", eTag: projectConfig.config.httpETag, body: projectConfig.config.configJson });
  }
}

export class FakeOptions extends OptionsBase {
  constructor(baseUrl?: string, dataGovernance?: DataGovernance) {
    const kernel: Partial<IConfigCatKernel> = { configFetcherFactory: options => new FakeConfigFetcher(options) };
    super("API_KEY", kernel as unknown as IConfigCatKernel, "TEST", { baseUrl, dataGovernance });
  }
}

export class FakeConfigServiceBase extends ConfigServiceBase<FakeOptions> {
  constructor(dataGovernance?: DataGovernance, baseUrl?: string) {
    super(new FakeOptions(baseUrl, dataGovernance));
  }

  get readyPromise(): Promise<ClientCacheState> { throw new Error("Getter not implemented."); }

  getConfigAsync(): Promise<ProjectConfig> { return Promise.resolve(ProjectConfig.empty); }

  refreshLogicAsync(): Promise<[FetchResult, ProjectConfig]> {
    return this.refreshConfigCoreAsync(ProjectConfig.empty, false);
  }

  prepareResponse(baseUrl: string, jsonBaseUrl: string, jsonRedirect: number, jsonFeatureFlags: any): void {
    const configFetcher = this.configFetcher as FakeConfigFetcher;

    const configJson: ConfigJson.Config = {
      p: {
        u: jsonBaseUrl,
        r: jsonRedirect,
        s: "",
      },
      f: jsonFeatureFlags,
    };

    configFetcher.prepareResponse(this.getUrl(baseUrl),
      FetchResult.success(new ProjectConfig(JSON.stringify(configJson), prepareConfig(configJson), ProjectConfig.generateTimestamp(), "etag"), RefreshErrorCode.None));
  }

  validateCallCount(callCount: number): void {
    const configFetcher = this.configFetcher as FakeConfigFetcher;
    assert.equal(configFetcher.calls.length, callCount);
  }

  validateCall(index: number, baseUrl: string): void {
    const configFetcher = this.configFetcher as FakeConfigFetcher;
    assert.equal(this.getUrl(baseUrl), configFetcher.calls[index]);
  }

  private getUrl(baseUrl: string) {
    return baseUrl + "/configuration-files/API_KEY/config_v6.json?sdk=" + this.options.clientVersion;
  }

  getCacheState(cachedConfig: ProjectConfig): ClientCacheState {
    throw new Error("Method not implemented.");
  }
}

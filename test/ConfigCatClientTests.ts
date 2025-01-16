import { assert, expect } from "chai";
import { createAutoPollOptions, createKernel, createLazyLoadOptions, createManualPollOptions, FakeCache, FakeConfigFetcher, FakeConfigFetcherBase, FakeConfigFetcherWithAlwaysVariableEtag, FakeConfigFetcherWithNullNewConfig, FakeConfigFetcherWithPercentageOptions, FakeConfigFetcherWithRules, FakeConfigFetcherWithTwoCaseSensitiveKeys, FakeConfigFetcherWithTwoKeys, FakeConfigFetcherWithTwoKeysAndRules, FakeExternalAsyncCache, FakeExternalCache, FakeExternalCacheWithInitialData, FakeLogger } from "./helpers/fakes";
import { platform } from "./helpers/platform";
import { allowEventLoop } from "./helpers/utils";
import { AutoPollConfigService } from "#lib/AutoPollConfigService";
import { ConfigCatClient, IConfigCatClient, IConfigCatKernel } from "#lib/ConfigCatClient";
import { AutoPollOptions, IAutoPollOptions, ILazyLoadingOptions, IManualPollOptions, IOptions, LazyLoadOptions, ManualPollOptions, OptionsBase, PollingMode } from "#lib/ConfigCatClientOptions";
import { LogLevel } from "#lib/ConfigCatLogger";
import { IFetchResponse } from "#lib/ConfigFetcher";
import { ClientCacheState, ConfigServiceBase, IConfigService, RefreshResult } from "#lib/ConfigServiceBase";
import { MapOverrideDataSource, OverrideBehaviour } from "#lib/FlagOverrides";
import { IProvidesHooks } from "#lib/Hooks";
import { LazyLoadConfigService } from "#lib/LazyLoadConfigService";
import { isWeakRefAvailable, setupPolyfills } from "#lib/Polyfills";
import { Config, IConfig, ProjectConfig, SettingValue, SettingValueContainer } from "#lib/ProjectConfig";
import { EvaluateContext, IEvaluateResult, IEvaluationDetails, IRolloutEvaluator } from "#lib/RolloutEvaluator";
import { User } from "#lib/User";
import { delay } from "#lib/Utils";
import "./helpers/ConfigCatClientCacheExtensions";

describe("ConfigCatClient", () => {
  for (const [sdkKey, customBaseUrl, isValid] of <[string, boolean, boolean][]>[
    ["sdk-key-90123456789012", false, false],
    ["sdk-key-9012345678901/1234567890123456789012", false, false],
    ["sdk-key-90123456789012/123456789012345678901", false, false],
    ["sdk-key-90123456789012/12345678901234567890123", false, false],
    ["sdk-key-901234567890123/1234567890123456789012", false, false],
    ["sdk-key-90123456789012/1234567890123456789012", false, true],
    ["configcat-sdk-1/sdk-key-90123456789012", false, false],
    ["configcat-sdk-1/sdk-key-9012345678901/1234567890123456789012", false, false],
    ["configcat-sdk-1/sdk-key-90123456789012/123456789012345678901", false, false],
    ["configcat-sdk-1/sdk-key-90123456789012/12345678901234567890123", false, false],
    ["configcat-sdk-1/sdk-key-901234567890123/1234567890123456789012", false, false],
    ["configcat-sdk-1/sdk-key-90123456789012/1234567890123456789012", false, true],
    ["configcat-sdk-2/sdk-key-90123456789012/1234567890123456789012", false, false],
    ["configcat-proxy/", false, false],
    ["configcat-proxy/", true, false],
    ["configcat-proxy/sdk-key-90123456789012", false, false],
    ["configcat-proxy/sdk-key-90123456789012", true, true],
  ]) {
    it(`SDK key format should be validated - sdkKey: ${sdkKey} | customBaseUrl: ${customBaseUrl}`, () => {
      const options: IManualPollOptions = customBaseUrl ? { baseUrl: "https://my-configcat-proxy" } : {};
      const configCatKernel = createKernel({ configFetcher: new FakeConfigFetcher() });

      if (isValid) {
        ConfigCatClient.get(sdkKey, PollingMode.ManualPoll, options, configCatKernel).dispose();
      } else {
        assert.throws(() => {
          ConfigCatClient.get(sdkKey, PollingMode.ManualPoll, options, configCatKernel).dispose();
        }, "Invalid 'sdkKey' value");
      }
    });
  }

  it("Initialization With AutoPollOptions should create an instance, getValueAsync works", async () => {
    const configCatKernel = createKernel({ configFetcher: new FakeConfigFetcher() });
    const options: AutoPollOptions = createAutoPollOptions("APIKEY", { logger: null }, configCatKernel);
    const client: IConfigCatClient = new ConfigCatClient(options, configCatKernel);
    assert.isDefined(client);

    assert.equal(true, await client.getValueAsync("debug", false, new User("identifier")));
    assert.equal(true, await client.getValueAsync("debug", false, new User("identifier")));
    await client.forceRefreshAsync();
    assert.equal(true, await client.getValueAsync("debug", false, new User("identifier")));
    assert.equal(true, await client.getValueAsync("debug", false, new User("identifier")));
    assert.equal(false, await client.getValueAsync("NOT_EXISTS", false, new User("identifier")));

    client.dispose();
  });

  it("Initialization With LazyLoadOptions should create an instance, getValueAsync works", async () => {

    const configCatKernel = createKernel({ configFetcher: new FakeConfigFetcher() });
    const options: LazyLoadOptions = createLazyLoadOptions("APIKEY", { logger: null }, configCatKernel);
    const client: IConfigCatClient = new ConfigCatClient(options, configCatKernel);
    assert.isDefined(client);

    assert.equal(true, await client.getValueAsync("debug", false, new User("identifier")));
    assert.equal(true, await client.getValueAsync("debug", false, new User("identifier")));
    assert.equal(false, await client.getValueAsync("NOT_EXISTS", false, new User("identifier")));
    await client.forceRefreshAsync();
    assert.equal(true, await client.getValueAsync("debug", false, new User("identifier")));

    client.dispose();
  });

  it("Initialization With ManualPollOptions should create an instance, getValueAsync works", async () => {

    const configCatKernel = createKernel({ configFetcher: new FakeConfigFetcher() });
    const options: ManualPollOptions = createManualPollOptions("APIKEY", { logger: null }, configCatKernel);
    const client: IConfigCatClient = new ConfigCatClient(options, configCatKernel);
    assert.isDefined(client);

    assert.equal(false, await client.getValueAsync("debug", false, new User("identifier")));
    assert.equal(false, await client.getValueAsync("debug", false, new User("identifier")));
    await client.forceRefreshAsync();
    assert.equal(true, await client.getValueAsync("debug", false, new User("identifier")));
    assert.equal(true, await client.getValueAsync("debug", false, new User("identifier")));
    assert.equal(false, await client.getValueAsync("NOT_EXISTS", false, new User("identifier")));

    client.dispose();
  });

  it("Initialization With ManualPollOptions should create an instance", (done) => {

    const configCatKernel = createKernel({ configFetcher: new FakeConfigFetcher() });
    const options: ManualPollOptions = createManualPollOptions("APIKEY", { logger: null }, configCatKernel);
    const client: IConfigCatClient = new ConfigCatClient(options, configCatKernel);
    assert.isDefined(client);
    client.forceRefreshAsync().then(() => {
      client.getValueAsync("debug", false).then(function(value) {
        assert.equal(true, value);
        client.dispose();
        done();
      });
    });
  });

  it("Initialization With AutoPollOptions should create an instance", (done) => {

    const configCatKernel = createKernel({ configFetcher: new FakeConfigFetcher() });
    const options: AutoPollOptions = createAutoPollOptions("APIKEY", { logger: null }, configCatKernel);
    const client: IConfigCatClient = new ConfigCatClient(options, configCatKernel);
    assert.isDefined(client);

    client.getValueAsync("debug", false).then(function(value) {
      assert.equal(true, value);
      client.dispose();
      done();
    });
  });

  it("Initialization With LazyLoadOptions should create an instance", (done) => {

    const configCatKernel = createKernel({ configFetcher: new FakeConfigFetcherWithNullNewConfig() });
    const options: LazyLoadOptions = createLazyLoadOptions("APIKEY", { logger: null }, configCatKernel);
    const client: IConfigCatClient = new ConfigCatClient(options, configCatKernel);
    assert.isDefined(client);

    client.getValueAsync("debug", false).then(function(value) {
      assert.equal(false, value);
      client.dispose();
      done();
    });
  });

  it("getValueAsync() works without userObject", async () => {

    const configCatKernel = createKernel({ configFetcher: new FakeConfigFetcher() });
    const options: AutoPollOptions = createAutoPollOptions("APIKEY", { logger: null }, configCatKernel);
    const client: IConfigCatClient = new ConfigCatClient(options, configCatKernel);
    assert.isDefined(client);

    const flagEvaluatedEvents: IEvaluationDetails[] = [];
    client.on("flagEvaluated", ed => flagEvaluatedEvents.push(ed));

    const value = await client.getValueAsync("debug", true);
    assert.equal(true, value);

    assert.equal(1, flagEvaluatedEvents.length);
    assert.strictEqual(value, flagEvaluatedEvents[0].value);

    client.dispose();
  });

  it("getAllKeysAsync() works", async () => {

    const configCatKernel = createKernel({ configFetcher: new FakeConfigFetcherWithTwoKeys() });
    const options: AutoPollOptions = createAutoPollOptions("APIKEY", { logger: null }, configCatKernel);
    const client: IConfigCatClient = new ConfigCatClient(options, configCatKernel);
    assert.isDefined(client);
    const keys = await client.getAllKeysAsync();
    assert.equal(keys.length, 2);
    assert.equal(keys[0], "debug");
    assert.equal(keys[1], "debug2");

    client.dispose();
  });

  it("getAllKeysAsync() works - without config", async () => {

    const configCatKernel = createKernel({ configFetcher: new FakeConfigFetcherWithNullNewConfig() });
    const options: AutoPollOptions = createAutoPollOptions("APIKEY", { logger: null, maxInitWaitTimeSeconds: 0 }, configCatKernel);
    const client: IConfigCatClient = new ConfigCatClient(options, configCatKernel);
    assert.isDefined(client);
    const keys = await client.getAllKeysAsync();
    assert.equal(keys.length, 0);

    client.dispose();
  });

  it("getValueDetailsAsync() should return correct result when setting is not available", async () => {

    // Arrange

    const key = "notexists";
    const defaultValue = false;
    const timestamp = new Date().getTime();

    const configFetcherClass = FakeConfigFetcherWithTwoKeys;
    const cachedPc = new ProjectConfig(configFetcherClass.configJson, Config.deserialize(configFetcherClass.configJson), timestamp, "etag");
    const configCache = new FakeCache(cachedPc);
    const configCatKernel = createKernel({ configFetcher: new configFetcherClass(), defaultCacheFactory: () => configCache });
    const options = createManualPollOptions("APIKEY", void 0, configCatKernel);
    const client = new ConfigCatClient(options, configCatKernel);

    const user = new User("a@configcat.com");

    const flagEvaluatedEvents: IEvaluationDetails[] = [];
    client.on("flagEvaluated", ed => flagEvaluatedEvents.push(ed));

    // Act

    const actual = await client.getValueDetailsAsync(key, defaultValue, user);

    // Assert

    assert.strictEqual(key, actual.key);
    assert.strictEqual(defaultValue, actual.value);
    assert.isTrue(actual.isDefaultValue);
    assert.isUndefined(actual.variationId);
    assert.strictEqual(cachedPc.timestamp, actual.fetchTime?.getTime());
    assert.strictEqual(user, actual.user);
    assert.isDefined(actual.errorMessage);
    assert.isUndefined(actual.errorException);
    assert.isUndefined(actual.matchedTargetingRule);
    assert.isUndefined(actual.matchedPercentageOption);

    assert.equal(1, flagEvaluatedEvents.length);
    assert.strictEqual(actual, flagEvaluatedEvents[0]);

    client.dispose();
  });

  it("getValueDetailsAsync() should return correct result when setting is available but no rule applies", async () => {

    // Arrange

    const key = "debug";
    const defaultValue = false;
    const timestamp = new Date().getTime();

    const configFetcherClass = FakeConfigFetcherWithTwoKeys;
    const cachedPc = new ProjectConfig(configFetcherClass.configJson, Config.deserialize(configFetcherClass.configJson), timestamp, "etag");
    const configCache = new FakeCache(cachedPc);
    const configCatKernel = createKernel({ configFetcher: new configFetcherClass(), defaultCacheFactory: () => configCache });
    const options = createManualPollOptions("APIKEY", void 0, configCatKernel);
    const client = new ConfigCatClient(options, configCatKernel);

    const user = new User("a@configcat.com");

    const flagEvaluatedEvents: IEvaluationDetails[] = [];
    client.on("flagEvaluated", ed => flagEvaluatedEvents.push(ed));

    // Act

    const actual = await client.getValueDetailsAsync(key, defaultValue, user);

    // Assert

    assert.strictEqual(key, actual.key);
    assert.strictEqual(true, actual.value);
    assert.isFalse(actual.isDefaultValue);
    assert.strictEqual("abcdefgh", actual.variationId);
    assert.strictEqual(cachedPc.timestamp, actual.fetchTime?.getTime());
    assert.strictEqual(user, actual.user);
    assert.isUndefined(actual.errorMessage);
    assert.isUndefined(actual.errorException);
    assert.isUndefined(actual.matchedTargetingRule);
    assert.isUndefined(actual.matchedPercentageOption);

    assert.equal(1, flagEvaluatedEvents.length);
    assert.strictEqual(actual, flagEvaluatedEvents[0]);

    client.dispose();
  });

  it("getValueDetailsAsync() should return correct result when setting is available and a comparison-based rule applies", async () => {

    // Arrange

    const key = "debug";
    const defaultValue = "N/A";
    const timestamp = new Date().getTime();

    const configFetcherClass = FakeConfigFetcherWithRules;
    const cachedPc = new ProjectConfig(configFetcherClass.configJson, Config.deserialize(configFetcherClass.configJson), timestamp, "etag");
    const configCache = new FakeCache(cachedPc);
    const configCatKernel = createKernel({ configFetcher: new configFetcherClass(), defaultCacheFactory: () => configCache });
    const options = createManualPollOptions("APIKEY", void 0, configCatKernel);
    const client = new ConfigCatClient(options, configCatKernel);

    const user = new User("a@configcat.com");
    user.custom = { eyeColor: "red" };

    const flagEvaluatedEvents: IEvaluationDetails[] = [];
    client.on("flagEvaluated", ed => flagEvaluatedEvents.push(ed));

    // Act

    const actual = await client.getValueDetailsAsync(key, defaultValue, user);

    // Assert

    assert.strictEqual(key, actual.key);
    assert.strictEqual("redValue", actual.value);
    assert.isFalse(actual.isDefaultValue);
    assert.strictEqual("redVariationId", actual.variationId);
    assert.strictEqual(cachedPc.timestamp, actual.fetchTime?.getTime());
    assert.strictEqual(user, actual.user);
    assert.isUndefined(actual.errorMessage);
    assert.isUndefined(actual.errorException);
    assert.isDefined(actual.matchedTargetingRule);
    assert.strictEqual(actual.value, (actual.matchedTargetingRule.then as SettingValueContainer).value);
    assert.strictEqual(actual.variationId, (actual.matchedTargetingRule.then as SettingValueContainer).variationId);
    assert.isUndefined(actual.matchedPercentageOption);

    assert.equal(1, flagEvaluatedEvents.length);
    assert.strictEqual(actual, flagEvaluatedEvents[0]);

    client.dispose();
  });

  it("getValueDetailsAsync() should return correct result when setting is available and a percentage-based rule applies", async () => {

    // Arrange

    const key = "string25Cat25Dog25Falcon25Horse";
    const defaultValue = "N/A";
    const timestamp = new Date().getTime();

    const configFetcherClass = FakeConfigFetcherWithPercentageOptions;
    const cachedPc = new ProjectConfig(configFetcherClass.configJson, Config.deserialize(configFetcherClass.configJson), timestamp, "etag");
    const configCache = new FakeCache(cachedPc);
    const configCatKernel = createKernel({ configFetcher: new configFetcherClass(), defaultCacheFactory: () => configCache });
    const options = createManualPollOptions("APIKEY", void 0, configCatKernel);
    const client = new ConfigCatClient(options, configCatKernel);

    const user = new User("a@configcat.com");

    const flagEvaluatedEvents: IEvaluationDetails[] = [];
    client.on("flagEvaluated", ed => flagEvaluatedEvents.push(ed));

    // Act

    const actual = await client.getValueDetailsAsync(key, defaultValue, user);

    // Assert

    assert.strictEqual(key, actual.key);
    assert.strictEqual("Cat", actual.value);
    assert.isFalse(actual.isDefaultValue);
    assert.strictEqual("CatVariationId", actual.variationId);
    assert.strictEqual(cachedPc.timestamp, actual.fetchTime?.getTime());
    assert.strictEqual(user, actual.user);
    assert.isUndefined(actual.errorMessage);
    assert.isUndefined(actual.errorException);
    assert.isUndefined(actual.matchedTargetingRule);
    assert.isDefined(actual.matchedPercentageOption);
    assert.strictEqual(actual.value, actual.matchedPercentageOption.value);
    assert.strictEqual(actual.variationId, actual.matchedPercentageOption.variationId);

    assert.equal(1, flagEvaluatedEvents.length);
    assert.strictEqual(actual, flagEvaluatedEvents[0]);

    client.dispose();
  });

  it("getValueDetailsAsync() should return default value when exception thrown", async () => {

    // Arrange

    const key = "debug";
    const defaultValue = false;
    const timestamp = new Date().getTime();

    const configFetcherClass = FakeConfigFetcherWithTwoKeys;
    const cachedPc = new ProjectConfig(configFetcherClass.configJson, Config.deserialize(configFetcherClass.configJson), timestamp, "etag");
    const configCache = new FakeCache(cachedPc);
    const configCatKernel = createKernel({ configFetcher: new configFetcherClass(), defaultCacheFactory: () => configCache });
    const options = createManualPollOptions("APIKEY", void 0, configCatKernel);
    const client = new ConfigCatClient(options, configCatKernel);

    const err = new Error("Something went wrong.");
    client["evaluator"] = new class implements IRolloutEvaluator {
      evaluate(defaultValue: SettingValue, context: EvaluateContext): IEvaluateResult {
        throw err;
      }
    }();

    const user = new User("a@configcat.com");

    const flagEvaluatedEvents: IEvaluationDetails[] = [];
    const errorEvents: [string, any][] = [];
    client.on("flagEvaluated", ed => flagEvaluatedEvents.push(ed));
    client.on("clientError", (msg: string, err: any) => errorEvents.push([msg, err]));

    // Act

    const actual = await client.getValueDetailsAsync(key, defaultValue, user);

    // Assert

    assert.strictEqual(key, actual.key);
    assert.strictEqual(defaultValue, actual.value);
    assert.isTrue(actual.isDefaultValue);
    assert.isUndefined(actual.variationId);
    assert.strictEqual(cachedPc.timestamp, actual.fetchTime?.getTime());
    assert.strictEqual(user, actual.user);
    assert.isDefined(actual.errorMessage);
    assert.strictEqual(err, actual.errorException);
    assert.isUndefined(actual.matchedTargetingRule);
    assert.isUndefined(actual.matchedPercentageOption);

    assert.equal(1, flagEvaluatedEvents.length);
    assert.strictEqual(actual, flagEvaluatedEvents[0]);

    assert.equal(1, errorEvents.length);
    const [actualErrorMessage, actualErrorException] = errorEvents[0];
    expect(actualErrorMessage).to.include("Error occurred in the `getValueDetailsAsync` method");
    assert.strictEqual(err, actualErrorException);

    client.dispose();
  });

  it("getAllValueDetailsAsync() should return correct result", async () => {

    // Arrange

    const timestamp = new Date().getTime();

    const configFetcherClass = FakeConfigFetcherWithTwoKeys;
    const cachedPc = new ProjectConfig(configFetcherClass.configJson, Config.deserialize(configFetcherClass.configJson), timestamp, "etag");
    const configCache = new FakeCache(cachedPc);
    const configCatKernel = createKernel({ configFetcher: new configFetcherClass(), defaultCacheFactory: () => configCache });
    const options = createManualPollOptions("APIKEY", void 0, configCatKernel);
    const client = new ConfigCatClient(options, configCatKernel);

    const user = new User("a@configcat.com");

    const flagEvaluatedEvents: IEvaluationDetails[] = [];
    client.on("flagEvaluated", ed => flagEvaluatedEvents.push(ed));

    // Act

    const actual = await client.getAllValueDetailsAsync(user);

    // Assert

    const expected = [
      { key: "debug", value: true, variationId: "abcdefgh" },
      { key: "debug2", value: true, variationId: "12345678" },
    ];

    for (const { key, value, variationId } of expected) {
      const actualDetails = actual.find(details => details.key === key)!;

      assert.isDefined(actualDetails);
      assert.strictEqual(value, actualDetails.value);
      assert.isFalse(actualDetails.isDefaultValue);
      assert.strictEqual(variationId, actualDetails.variationId);
      assert.strictEqual(cachedPc.timestamp, actualDetails.fetchTime?.getTime());
      assert.strictEqual(user, actualDetails.user);
      assert.isUndefined(actualDetails.errorMessage);
      assert.isUndefined(actualDetails.errorException);
      assert.isUndefined(actualDetails.matchedTargetingRule);
      assert.isUndefined(actualDetails.matchedPercentageOption);

      const flagEvaluatedDetails = flagEvaluatedEvents.find(details => details.key === key)!;

      assert.isDefined(flagEvaluatedDetails);
      assert.strictEqual(actualDetails, flagEvaluatedDetails);
    }

    client.dispose();
  });

  it("getAllValueDetailsAsync() should return default value when exception thrown", async () => {

    // Arrange

    const timestamp = new Date().getTime();

    const configFetcherClass = FakeConfigFetcherWithTwoKeys;
    const cachedPc = new ProjectConfig(configFetcherClass.configJson, Config.deserialize(configFetcherClass.configJson), timestamp, "etag");
    const configCache = new FakeCache(cachedPc);
    const configCatKernel = createKernel({ configFetcher: new configFetcherClass(), defaultCacheFactory: () => configCache });
    const options = createManualPollOptions("APIKEY", void 0, configCatKernel);
    const client = new ConfigCatClient(options, configCatKernel);

    const err = new Error("Something went wrong.");
    client["evaluator"] = new class implements IRolloutEvaluator {
      evaluate(defaultValue: SettingValue, context: EvaluateContext): IEvaluateResult {
        throw err;
      }
    }();

    const user = new User("a@configcat.com");

    const flagEvaluatedEvents: IEvaluationDetails[] = [];
    const errorEvents: [string, any][] = [];
    client.on("flagEvaluated", ed => flagEvaluatedEvents.push(ed));
    client.on("clientError", (msg: string, err: any) => errorEvents.push([msg, err]));

    // Act

    const actual = await client.getAllValueDetailsAsync(user);

    // Assert

    for (const key of ["debug", "debug2"]) {
      const actualDetails = actual.find(details => details.key === key)!;

      assert.isNull(actualDetails.value);
      assert.isTrue(actualDetails.isDefaultValue);
      assert.isUndefined(actualDetails.variationId);
      assert.strictEqual(cachedPc.timestamp, actualDetails.fetchTime?.getTime());
      assert.strictEqual(user, actualDetails.user);
      assert.isDefined(actualDetails.errorMessage);
      assert.strictEqual(err, actualDetails.errorException);
      assert.isUndefined(actualDetails.matchedTargetingRule);
      assert.isUndefined(actualDetails.matchedPercentageOption);

      const flagEvaluatedDetails = flagEvaluatedEvents.find(details => details.key === key)!;

      assert.isDefined(flagEvaluatedDetails);
      assert.strictEqual(actualDetails, flagEvaluatedDetails);
    }

    assert.equal(1, errorEvents.length);
    const [actualErrorMessage, actualErrorException] = errorEvents[0];
    expect(actualErrorMessage).to.include("Error occurred in the `getAllValueDetailsAsync` method.");
    if (typeof AggregateError !== "undefined") {
      assert.instanceOf(actualErrorException, AggregateError);
      assert.deepEqual(Array(actual.length).fill(err), actualErrorException.errors);
    } else {
      assert.strictEqual(err, actualErrorException);
    }

    client.dispose();
  });

  it("Initialization With AutoPollOptions - config changed in every fetch - should fire configChanged every polling iteration", async () => {

    const configCatKernel = createKernel({ configFetcher: new FakeConfigFetcherWithAlwaysVariableEtag() });
    let configChangedEventCount = 0;
    const pollIntervalSeconds = 1;
    const userOptions: IAutoPollOptions = {
      logger: null,
      pollIntervalSeconds,
      setupHooks: hooks => hooks.on("configChanged", () => configChangedEventCount++),
    };
    const options: AutoPollOptions = createAutoPollOptions("APIKEY", userOptions, configCatKernel);
    const client = new ConfigCatClient(options, configCatKernel);
    try {
      await delay(2.5 * pollIntervalSeconds * 1000);

      assert.equal(configChangedEventCount, 3);
    } finally { client.dispose(); }
  });

  it("Initialization With AutoPollOptions - config doesn't change - should fire configChanged only once", async () => {

    const configCatKernel = createKernel({ configFetcher: new FakeConfigFetcher() });
    let configChangedEventCount = 0;
    const pollIntervalSeconds = 1;
    const userOptions: IAutoPollOptions = {
      logger: null,
      pollIntervalSeconds,
      setupHooks: hooks => hooks.on("configChanged", () => configChangedEventCount++),
    };
    const options: AutoPollOptions = createAutoPollOptions("APIKEY", userOptions, configCatKernel);
    const client = new ConfigCatClient(options, configCatKernel);
    try {
      await delay(2.5 * pollIntervalSeconds * 1000);

      assert.equal(configChangedEventCount, 1);
    } finally { client.dispose(); }
  });

  it("Initialization With AutoPollOptions - with maxInitWaitTimeSeconds - getValueAsync should wait", async () => {

    const maxInitWaitTimeSeconds = 2;

    const configCatKernel = createKernel({ configFetcher: new FakeConfigFetcher(500) });
    const options: AutoPollOptions = createAutoPollOptions("APIKEY", { maxInitWaitTimeSeconds }, configCatKernel);

    const startDate: number = new Date().getTime();
    const client: IConfigCatClient = new ConfigCatClient(options, configCatKernel);
    const actualValue = await client.getValueAsync("debug", false);
    const elapsedMilliseconds: number = new Date().getTime() - startDate;

    assert.isAtLeast(elapsedMilliseconds, 500 - 25); // 25 ms for tolerance
    assert.isAtMost(elapsedMilliseconds, maxInitWaitTimeSeconds * 1000 + 75); // 75 ms for tolerance
    assert.equal(actualValue, true);

    client.dispose();
  });

  for (const statusCode of [403, 404, 500, null]) {
    it(`Initialization With AutoPollOptions - with maxInitWaitTimeSeconds - getValueDetailsAsync should not wait maxInitWaitTimeSeconds even if fetch result is ${statusCode ?? "network error"}`, async () => {

      const maxInitWaitTimeSeconds = 2;

      const configFetchDelay = maxInitWaitTimeSeconds * 1000 / 4;
      const configFetcher = new FakeConfigFetcherBase(null, configFetchDelay, () =>
        statusCode ? { statusCode, reasonPhrase: "x" } : (() => { throw "network error"; })());

      const configCatKernel = createKernel({ configFetcher });
      const options: AutoPollOptions = createAutoPollOptions("APIKEY", { maxInitWaitTimeSeconds }, configCatKernel);

      const startDate: number = new Date().getTime();
      const client: IConfigCatClient = new ConfigCatClient(options, configCatKernel);
      const actualDetails = await client.getValueDetailsAsync("debug", false);
      const elapsedMilliseconds: number = new Date().getTime() - startDate;

      assert.isAtLeast(elapsedMilliseconds, 500 - 25); // 25 ms for tolerance
      assert.isAtMost(elapsedMilliseconds, configFetchDelay * 2 + 75); // 75 ms for tolerance
      assert.equal(actualDetails.isDefaultValue, true);
      assert.equal(actualDetails.value, false);

      client.dispose();
    });
  }

  it("Initialization With AutoPollOptions - with maxInitWaitTimeSeconds - getValueAsync should wait for maxInitWaitTimeSeconds only and return default value", async () => {

    const maxInitWaitTimeSeconds = 1;

    const configCatKernel = createKernel({ configFetcher: new FakeConfigFetcherWithNullNewConfig(10000) });
    const options: AutoPollOptions = createAutoPollOptions("APIKEY", { maxInitWaitTimeSeconds }, configCatKernel);

    const startDate: number = new Date().getTime();
    const client: IConfigCatClient = new ConfigCatClient(options, configCatKernel);
    const actualValue = await client.getValueAsync("debug", false);
    const elapsedMilliseconds: number = new Date().getTime() - startDate;

    assert.isAtLeast(elapsedMilliseconds, (maxInitWaitTimeSeconds * 1000) - 25); // 25 ms for tolerance
    assert.isAtMost(elapsedMilliseconds, (maxInitWaitTimeSeconds * 1000) + 75); // 75 ms for tolerance
    assert.equal(actualValue, false);

    client.dispose();
  });

  describe("Initialization - with waitForReady", () => {

    const maxInitWaitTimeSeconds = 1;
    const configFetcher = new FakeConfigFetcherBase("{}", 0, (lastConfig, lastETag) => ({
      statusCode: 500,
      reasonPhrase: "",
      eTag: (lastETag as any | 0) + 1 + "",
      body: lastConfig,
    } as IFetchResponse));

    it("AutoPoll - should wait", async () => {
      const configCatKernel = createKernel({ configFetcher: new FakeConfigFetcher() });
      const options: AutoPollOptions = createAutoPollOptions("APIKEY", void 0, configCatKernel);

      const client: IConfigCatClient = new ConfigCatClient(options, configCatKernel);
      const state = await client.waitForReady();

      assert.equal(state, ClientCacheState.HasUpToDateFlagData);
      assert.equal(client.snapshot().getValue("debug", false), true);

      client.dispose();
    });

    it("AutoPoll - should wait for maxInitWaitTimeSeconds", async () => {

      const configFetcher = new FakeConfigFetcherWithNullNewConfig(maxInitWaitTimeSeconds * 2 * 1000);
      const configCatKernel = createKernel({ configFetcher });
      const options: AutoPollOptions = createAutoPollOptions("APIKEY", { maxInitWaitTimeSeconds }, configCatKernel);

      const startDate: number = new Date().getTime();
      const client: IConfigCatClient = new ConfigCatClient(options, configCatKernel);
      const state = await client.waitForReady();
      const elapsedMilliseconds: number = new Date().getTime() - startDate;

      assert.isAtLeast(elapsedMilliseconds, (maxInitWaitTimeSeconds * 1000) - 25); // 25 ms for tolerance
      assert.isAtMost(elapsedMilliseconds, (maxInitWaitTimeSeconds * 1000) + 75); // 75 ms for tolerance

      assert.equal(state, ClientCacheState.NoFlagData);

      const snapshot = client.snapshot();
      assert.equal(snapshot.getValue("debug", false), false);
      const evaluationDetails = snapshot.getValueDetails("debug", false);
      assert.isTrue(evaluationDetails.isDefaultValue);
      assert.equal(evaluationDetails.value, false);

      client.dispose();
    });

    it("AutoPoll - should wait for maxInitWaitTimeSeconds and return cached", async () => {

      const configFetcher = new FakeConfigFetcherBase("{}", maxInitWaitTimeSeconds * 2 * 1000, (lastConfig, lastETag) => ({
        statusCode: 500,
        reasonPhrase: "",
        eTag: (lastETag as any | 0) + 1 + "",
        body: lastConfig,
      } as IFetchResponse));
      const configCatKernel = createKernel({ configFetcher });
      const options: AutoPollOptions = createAutoPollOptions("APIKEY", {
        maxInitWaitTimeSeconds: maxInitWaitTimeSeconds,
        cache: new FakeExternalCacheWithInitialData(120_000),
      }, configCatKernel);

      const startDate: number = new Date().getTime();
      const client: IConfigCatClient = new ConfigCatClient(options, configCatKernel);
      const state = await client.waitForReady();
      const elapsedMilliseconds: number = new Date().getTime() - startDate;

      assert.isAtLeast(elapsedMilliseconds, (maxInitWaitTimeSeconds * 1000) - 25); // 25 ms for tolerance
      assert.isAtMost(elapsedMilliseconds, (maxInitWaitTimeSeconds * 1000) + 75); // 75 ms for tolerance

      assert.equal(state, ClientCacheState.HasCachedFlagDataOnly);

      const snapshot = client.snapshot();
      assert.equal(snapshot.getValue("debug", false), true);
      const evaluationDetails = snapshot.getValueDetails("debug", false);
      assert.isFalse(evaluationDetails.isDefaultValue);
      assert.equal(evaluationDetails.value, true);

      client.dispose();
    });

    it("LazyLoad - return cached", async () => {

      const configCatKernel = createKernel({ configFetcher });
      const options: LazyLoadOptions = createLazyLoadOptions("APIKEY", {
        cache: new FakeExternalCacheWithInitialData(),
      }, configCatKernel);

      const client: IConfigCatClient = new ConfigCatClient(options, configCatKernel);
      const state = await client.waitForReady();

      assert.equal(state, ClientCacheState.HasUpToDateFlagData);
      assert.equal(client.snapshot().getValue("debug", false), true);

      client.dispose();
    });

    it("LazyLoad - expired, return cached", async () => {

      const configCatKernel = createKernel({ configFetcher });
      const options: LazyLoadOptions = createLazyLoadOptions("APIKEY", {
        cache: new FakeExternalCacheWithInitialData(120_000),
      }, configCatKernel);

      const client: IConfigCatClient = new ConfigCatClient(options, configCatKernel);
      const state = await client.waitForReady();

      assert.equal(state, ClientCacheState.HasCachedFlagDataOnly);
      assert.equal(client.snapshot().getValue("debug", false), true);

      client.dispose();
    });

    it("ManualPoll - return cached", async () => {

      const configCatKernel = createKernel({ configFetcher });
      const options: ManualPollOptions = createManualPollOptions("APIKEY", {
        cache: new FakeExternalCacheWithInitialData(),
      }, configCatKernel);

      const client: IConfigCatClient = new ConfigCatClient(options, configCatKernel);
      const state = await client.waitForReady();

      assert.equal(state, ClientCacheState.HasCachedFlagDataOnly);
      const snapshot = client.snapshot();
      assert.equal(snapshot.getValue("debug", false), true);
      assert.deepEqual(snapshot.getAllKeys(), ["debug"]);
      assert.isNotNull(snapshot.fetchedConfig);

      client.dispose();
    });

    it("ManualPoll - flag override - local only", async () => {
      const configCatKernel = createKernel({ configFetcher: configFetcher });
      const options: ManualPollOptions = createManualPollOptions("localhost", {
        flagOverrides: {
          dataSource: new MapOverrideDataSource({
            "fakeKey": true,
          }),
          behaviour: OverrideBehaviour.LocalOnly,
        },
      }, configCatKernel);

      const client: IConfigCatClient = new ConfigCatClient(options, configCatKernel);
      const state = await client.waitForReady();

      assert.equal(state, ClientCacheState.HasLocalOverrideFlagDataOnly);
      const snapshot = client.snapshot();
      assert.equal(snapshot.getValue("fakeKey", false), true);
      assert.deepEqual(snapshot.getAllKeys(), ["fakeKey"]);
      assert.isNull(snapshot.fetchedConfig);

      client.dispose();
    });
  });

  it("getValueAsync - User.Identifier is an empty string - should return evaluated value", async () => {

    const configCatKernel = createKernel({ configFetcher: new FakeConfigFetcherWithTwoKeysAndRules() });
    const options: AutoPollOptions = createAutoPollOptions("APIKEY", void 0, configCatKernel);
    const client: IConfigCatClient = new ConfigCatClient(options, configCatKernel);

    const user: User = new User("");

    const actual = await client.getValueAsync("debug2", "N/A", user);

    assert.equal(actual, "value2");

    client.dispose();
  });

  it("getValueAsync - User.Identifier can be non empty string - should return evaluated value", async () => {

    const configCatKernel = createKernel({ configFetcher: new FakeConfigFetcherWithTwoKeysAndRules() });
    const options: AutoPollOptions = createAutoPollOptions("APIKEY", void 0, configCatKernel);
    const client: IConfigCatClient = new ConfigCatClient(options, configCatKernel);

    const user: User = new User("userId");

    const actual = await client.getValueAsync("debug2", "N/A", user);

    assert.equal(actual, "value1");

    client.dispose();
  });

  it("getValueAsync - case sensitive key tests", async () => {

    const configCatKernel = createKernel({ configFetcher: new FakeConfigFetcherWithTwoCaseSensitiveKeys() });
    const options: AutoPollOptions = createAutoPollOptions("APIKEY", void 0, configCatKernel);
    const client: IConfigCatClient = new ConfigCatClient(options, configCatKernel);

    let actual = await client.getValueAsync("debug", "N/A");

    assert.equal(actual, "debug");
    assert.notEqual(actual, "DEBUG");

    actual = await client.getValueAsync("DEBUG", "N/A");

    assert.notEqual(actual, "debug");
    assert.equal(actual, "DEBUG");

    client.dispose();
  });

  it("getValueAsync - case sensitive attribute tests", async () => {
    const configCatKernel = createKernel({ configFetcher: new FakeConfigFetcherWithTwoCaseSensitiveKeys() });
    const options: AutoPollOptions = createAutoPollOptions("APIKEY", void 0, configCatKernel);
    const client: IConfigCatClient = new ConfigCatClient(options, configCatKernel);

    let user: User = new User("", void 0, void 0, { "CUSTOM": "c" });
    let actual = await client.getValueAsync("debug", "N/A", user);

    assert.equal(actual, "UPPER-VALUE");

    user = new User("", void 0, void 0, { "custom": "c" });
    actual = await client.getValueAsync("debug", "N/A", user);

    assert.equal(actual, "lower-value");

    user = new User("", void 0, void 0, { "custom": "c", "CUSTOM": "c" });
    actual = await client.getValueAsync("debug", "N/A", user);

    assert.equal(actual, "UPPER-VALUE");

    client.dispose();
  });

  it("getAllValuesAsync - works", async () => {

    const configCatKernel = createKernel({ configFetcher: new FakeConfigFetcherWithTwoKeys() });
    const options: AutoPollOptions = createAutoPollOptions("APIKEY", void 0, configCatKernel);
    const client: IConfigCatClient = new ConfigCatClient(options, configCatKernel);

    const flagEvaluatedEvents: IEvaluationDetails[] = [];
    client.on("flagEvaluated", ed => flagEvaluatedEvents.push(ed));

    const actual = await client.getAllValuesAsync();

    assert.equal(actual.length, 2);

    assert.deepEqual(flagEvaluatedEvents.map(evt => [evt.key, evt.value]), actual.map(kv => [kv.settingKey, kv.settingValue]));

    client.dispose();
  });

  it("getAllValuesAsync - without config - return empty array", async () => {

    const configCatKernel = createKernel({ configFetcher: new FakeConfigFetcherWithNullNewConfig() });
    const options: AutoPollOptions = createAutoPollOptions("APIKEY", { logger: null, maxInitWaitTimeSeconds: 0 }, configCatKernel);
    const client: IConfigCatClient = new ConfigCatClient(options, configCatKernel);

    const flagEvaluatedEvents: IEvaluationDetails[] = [];
    client.on("flagEvaluated", ed => flagEvaluatedEvents.push(ed));

    const actual = await client.getAllValuesAsync();

    assert.isDefined(actual);
    assert.equal(actual.length, 0);

    assert.equal(flagEvaluatedEvents.length, 0);

    client.dispose();
  });

  it("Initialization With LazyLoadOptions - multiple getValueAsync should not cause multiple config fetches", async () => {

    const configFetcher = new FakeConfigFetcher(500);
    const configCatKernel = createKernel({ configFetcher });
    const options: LazyLoadOptions = createLazyLoadOptions("APIKEY", void 0, configCatKernel);
    const client: IConfigCatClient = new ConfigCatClient(options, configCatKernel);

    await Promise.all([client.getValueAsync("debug", false), client.getValueAsync("debug", false)]);
    assert.equal(1, configFetcher.calledTimes);

    client.dispose();
  });

  it("Initialization With LazyLoadOptions - multiple getValue calls should not cause multiple config fetches", done => {

    const configFetcher = new FakeConfigFetcher(500);
    const configCatKernel = createKernel({ configFetcher });
    const options: LazyLoadOptions = createLazyLoadOptions("APIKEY", void 0, configCatKernel);
    const client: IConfigCatClient = new ConfigCatClient(options, configCatKernel);

    let callbackCount = 0;

    const callback = (value: any) => {
      {
        callbackCount++;
        if (callbackCount > 1) {
          assert.equal(1, configFetcher.calledTimes);
          client.dispose();
          done();
        }
      }
    };

    client.getValueAsync("debug", false).then(callback);
    client.getValueAsync("debug", false).then(callback);
  });

  it("Initialization With AutoPollOptions with expired cache - getValue should take care of maxInitWaitTimeSeconds", done => {

    const configFetcher = new FakeConfigFetcher(500);
    const configJson = "{\"f\": { \"debug\": { \"v\": { \"b\": false }, \"i\": \"abcdefgh\", \"t\": 0, \"p\": [], \"r\": [] } } }";
    const configCache = new FakeCache(new ProjectConfig(configJson, Config.deserialize(configJson), new Date().getTime() - 10000000, "etag2"));
    const configCatKernel = createKernel({ configFetcher, defaultCacheFactory: () => configCache });
    const options: AutoPollOptions = createAutoPollOptions("APIKEY", { maxInitWaitTimeSeconds: 10 }, configCatKernel);
    const client: IConfigCatClient = new ConfigCatClient(options, configCatKernel);

    client.getValueAsync("debug", false).then(value => {
      client.dispose();
      done(value ? null : new Error("Wrong value."));
    });
  });

  it("Initialization With AutoPollOptions with expired cache - getValueAsync should take care of maxInitWaitTimeSeconds", async () => {

    const configFetcher = new FakeConfigFetcher(500);
    const configJson = "{\"f\": { \"debug\": { \"v\": { \"b\": false }, \"i\": \"abcdefgh\", \"t\": 0, \"p\": [], \"r\": [] } } }";
    const configCache = new FakeCache(new ProjectConfig(configJson, Config.deserialize(configJson), new Date().getTime() - 10000000, "etag2"));
    const configCatKernel = createKernel({ configFetcher, defaultCacheFactory: () => configCache });
    const options: AutoPollOptions = createAutoPollOptions("APIKEY", { maxInitWaitTimeSeconds: 10 }, configCatKernel);
    const client: IConfigCatClient = new ConfigCatClient(options, configCatKernel);

    const value = await client.getValueAsync("debug", false);
    assert.isTrue(value);

    client.dispose();
  });

  it("Dispose should stop the client in every scenario", done => {

    const configFetcher = new FakeConfigFetcher(500);
    const configCatKernel = createKernel({ configFetcher });
    const options: AutoPollOptions = createAutoPollOptions("APIKEY", { pollIntervalSeconds: 2 }, configCatKernel);
    const client: IConfigCatClient = new ConfigCatClient(options, configCatKernel);
    client.dispose();
    assert.equal(configFetcher.calledTimes, 0);
    setTimeout(() => {
      assert.equal(configFetcher.calledTimes, 1);
      client.dispose();
      done();
    }, 4000);
  });

  for (const passOptionsToSecondGet of [false, true]) {
    it(`get() should return cached instance ${passOptionsToSecondGet ? "with" : "without"} warning`, done => {
      // Arrange

      const sdkKey = "test-67890123456789012/1234567890123456789012";

      const logger = new FakeLogger(LogLevel.Debug);

      const configCatKernel = createKernel({ configFetcher: new FakeConfigFetcher() });
      const options: IManualPollOptions = { logger };

      // Act

      const client1 = ConfigCatClient.get(sdkKey, PollingMode.ManualPoll, options, configCatKernel);
      const logEvents1 = [...logger.events];

      logger.reset();
      const client2 = ConfigCatClient.get(sdkKey, PollingMode.ManualPoll, passOptionsToSecondGet ? options : null, configCatKernel);
      const logEvents2 = [...logger.events];

      const instanceCount = ConfigCatClient["instanceCache"].getAliveCount();

      client2.dispose();
      client1.dispose();

      // Assert

      assert.equal(1, instanceCount);
      assert.strictEqual(client1, client2);
      assert.isEmpty(logEvents1.filter(([, , msg]) => msg.toString().indexOf("the specified options are ignored") >= 0));

      if (passOptionsToSecondGet) {
        assert.isNotEmpty(logEvents2.filter(([, , msg]) => msg.toString().indexOf("the specified options are ignored") >= 0));
      } else {
        assert.isEmpty(logEvents2.filter(([, , msg]) => msg.toString().indexOf("the specified options are ignored") >= 0));
      }

      done();
    });
  }

  it("dispose() should remove cached instance", done => {
    // Arrange

    const sdkKey = "test-67890123456789012/1234567890123456789012";

    const configCatKernel = createKernel({ configFetcher: new FakeConfigFetcher() });

    const client1 = ConfigCatClient.get(sdkKey, PollingMode.ManualPoll, null, configCatKernel);

    // Act

    const instanceCount1 = ConfigCatClient["instanceCache"].getAliveCount();

    client1.dispose();

    const instanceCount2 = ConfigCatClient["instanceCache"].getAliveCount();

    // Assert

    assert.equal(1, instanceCount1);
    assert.equal(0, instanceCount2);

    done();
  });

  it("dispose() should remove current cached instance only", done => {
    // Arrange

    const sdkKey = "test-67890123456789012/1234567890123456789012";

    const configCatKernel = createKernel({ configFetcher: new FakeConfigFetcher() });

    const client1 = ConfigCatClient.get(sdkKey, PollingMode.ManualPoll, null, configCatKernel);

    // Act

    const instanceCount1 = ConfigCatClient["instanceCache"].getAliveCount();

    client1.dispose();

    const instanceCount2 = ConfigCatClient["instanceCache"].getAliveCount();

    const client2 = ConfigCatClient.get(sdkKey, PollingMode.ManualPoll, null, configCatKernel);

    const instanceCount3 = ConfigCatClient["instanceCache"].getAliveCount();

    client1.dispose();

    const instanceCount4 = ConfigCatClient["instanceCache"].getAliveCount();

    client2.dispose();

    const instanceCount5 = ConfigCatClient["instanceCache"].getAliveCount();

    // Assert

    assert.equal(1, instanceCount1);
    assert.equal(0, instanceCount2);
    assert.equal(1, instanceCount3);
    assert.equal(1, instanceCount4);
    assert.equal(0, instanceCount5);

    done();
  });

  it("disposeAll() should remove all cached instances", done => {
    // Arrange

    const sdkKey1 = "test1-7890123456789012/1234567890123456789012", sdkKey2 = "test2-7890123456789012/1234567890123456789012";

    const configCatKernel = createKernel({ configFetcher: new FakeConfigFetcher() });

    const client1 = ConfigCatClient.get(sdkKey1, PollingMode.AutoPoll, null, configCatKernel);
    const client2 = ConfigCatClient.get(sdkKey2, PollingMode.ManualPoll, null, configCatKernel);

    // Act

    const instanceCount1 = ConfigCatClient["instanceCache"].getAliveCount();

    ConfigCatClient.disposeAll();

    const instanceCount2 = ConfigCatClient["instanceCache"].getAliveCount();

    // Assert

    assert.equal(2, instanceCount1);
    assert.equal(0, instanceCount2);
    assert.isObject(client1);
    assert.isObject(client2);

    done();
  });

  it("GC should be able to collect cached instances when no strong references are left", async function() {
    // Arrange

    setupPolyfills();
    const { gc } = platform();
    if (!gc || !isWeakRefAvailable()) {
      this.skip();
    }
    const isFinalizationRegistryAvailable = typeof FinalizationRegistry !== "undefined";

    const sdkKey1 = "test1-7890123456789012/1234567890123456789012", sdkKey2 = "test2-7890123456789012/1234567890123456789012";

    const logger = new FakeLogger(LogLevel.Debug);
    const configCatKernel = createKernel({ configFetcher: new FakeConfigFetcher() });

    function createClients() {
      ConfigCatClient.get(sdkKey1, PollingMode.AutoPoll, { logger, maxInitWaitTimeSeconds: 0 }, configCatKernel);
      ConfigCatClient.get(sdkKey2, PollingMode.ManualPoll, { logger }, configCatKernel);

      return ConfigCatClient["instanceCache"].getAliveCount();
    }

    // Act

    const instanceCount1 = createClients();

    await gc();

    if (isFinalizationRegistryAvailable) {
      // We need to allow the finalizer callbacks to execute.
      await allowEventLoop(10);
    }

    const instanceCount2 = ConfigCatClient["instanceCache"].getAliveCount();

    // Assert

    assert.equal(2, instanceCount1);

    if (isFinalizationRegistryAvailable) {
      assert.equal(0, instanceCount2);
      assert.equal(2, logger.events.filter(([, , msg]) => msg.toString().indexOf("finalize() called") >= 0).length);
    } else {
      // When finalization is not available, Auto Polling won't be stopped.
      assert.equal(1, instanceCount2);
    }
  });

  it("GC should be able to collect cached instances when hook handler closes over client instance and no strong references are left", async function() {
    // Arrange

    setupPolyfills();
    const { gc } = platform();
    if (!gc || !isWeakRefAvailable() || typeof FinalizationRegistry === "undefined") {
      this.skip();
    }

    const sdkKey1 = "test1-7890123456789012/1234567890123456789012";

    const configCatKernel = createKernel({ configFetcher: new FakeConfigFetcher() });

    function createClients() {
      const client = ConfigCatClient.get(sdkKey1, PollingMode.AutoPoll, { maxInitWaitTimeSeconds: 0 }, configCatKernel);
      client.on("configChanged", () => client.getValueAsync("flag", null));

      return ConfigCatClient["instanceCache"].getAliveCount();
    }

    // Act

    const instanceCount1 = createClients();

    await gc();

    // We need to allow the finalizer callbacks to execute.
    await allowEventLoop(10);

    const instanceCount2 = ConfigCatClient["instanceCache"].getAliveCount();

    // Assert

    assert.equal(1, instanceCount1);
    assert.equal(0, instanceCount2);
  });

  // For these tests we need to choose a ridiculously large poll interval/ cache TTL to make sure that config is fetched only once.
  const optionsFactoriesForOfflineModeTests: [PollingMode, (sdkKey: string, kernel: IConfigCatKernel, offline: boolean) => OptionsBase][] = [
    [PollingMode.AutoPoll, (sdkKey, kernel, offline) => createAutoPollOptions(sdkKey, { offline, pollIntervalSeconds: 100_000, maxInitWaitTimeSeconds: 1 }, kernel)],
    [PollingMode.LazyLoad, (sdkKey, kernel, offline) => createLazyLoadOptions(sdkKey, { offline, cacheTimeToLiveSeconds: 100_000 }, kernel)],
    [PollingMode.ManualPoll, (sdkKey, kernel, offline) => createManualPollOptions(sdkKey, { offline }, kernel)],
  ];

  for (const [pollingMode, optionsFactory] of optionsFactoriesForOfflineModeTests) {
    it(`setOnline() should make a(n) ${PollingMode[pollingMode]} client created in offline mode transition to online mode.`, async () => {

      const configFetcher = new FakeConfigFetcherBase("{}", 100, (lastConfig, lastETag) => ({
        statusCode: 200,
        reasonPhrase: "OK",
        eTag: (lastETag as any | 0) + 1 + "",
        body: lastConfig,
      } as IFetchResponse));
      const configCache = new FakeCache();
      const configCatKernel = createKernel({ configFetcher, defaultCacheFactory: () => configCache });
      const options = optionsFactory("APIKEY", configCatKernel, true);
      const client = new ConfigCatClient(options, configCatKernel);
      const configService = client["configService"] as ConfigServiceBase<OptionsBase>;

      let expectedFetchTimes = 0;

      // 1. Checks that client is initialized to offline mode
      assert.isTrue(client.isOffline);
      assert.isTrue((await configService.getConfig()).isEmpty);

      // 2. Checks that repeated calls to setOffline() have no effect
      client.setOffline();

      assert.isTrue(client.isOffline);
      assert.equal(expectedFetchTimes, configFetcher.calledTimes);

      // 3. Checks that setOnline() does enable HTTP calls
      client.setOnline();

      if (configService instanceof AutoPollConfigService) {
        assert.isTrue(await configService["initializationPromise"]);
        expectedFetchTimes++;
      }

      assert.isFalse(client.isOffline);
      assert.equal(expectedFetchTimes, configFetcher.calledTimes);

      const etag1 = ((await configService.getConfig()).httpETag ?? "0") as any | 0;
      if (configService instanceof LazyLoadConfigService) {
        expectedFetchTimes++;
      }

      (expectedFetchTimes > 0 ? assert.notEqual : assert.equal)(0, etag1);

      // 4. Checks that forceRefreshAsync() initiates a HTTP call in online mode
      const refreshResult = await client.forceRefreshAsync();
      expectedFetchTimes++;

      assert.isFalse(client.isOffline);
      assert.equal(expectedFetchTimes, configFetcher.calledTimes);

      const etag2 = ((await configService.getConfig()).httpETag ?? "0") as any | 0;
      assert.isTrue(etag2 > etag1);

      assert.isTrue(refreshResult.isSuccess);
      assert.isNull(refreshResult.errorMessage);
      assert.isUndefined(refreshResult.errorException);

      // 5. Checks that setOnline() has no effect after client gets disposed
      client.dispose();

      client.setOnline();
      assert.isTrue(client.isOffline);
    });
  }

  for (const [pollingMode, optionsFactory] of optionsFactoriesForOfflineModeTests) {
    it(`setOffline() should make a(n) ${PollingMode[pollingMode]} client created in online mode transition to offline mode.`, async () => {

      const configFetcher = new FakeConfigFetcherBase("{}", 100, (lastConfig, lastETag) => ({
        statusCode: 200,
        reasonPhrase: "OK",
        eTag: (lastETag as any | 0) + 1 + "",
        body: lastConfig,
      } as IFetchResponse));

      const configCache = new FakeCache();
      const configCatKernel = createKernel({ configFetcher, defaultCacheFactory: () => configCache });
      const options = optionsFactory("APIKEY", configCatKernel, false);
      const client = new ConfigCatClient(options, configCatKernel);
      const configService = client["configService"] as ConfigServiceBase<OptionsBase>;

      let expectedFetchTimes = 0;

      // 1. Checks that client is initialized to online mode
      assert.isFalse(client.isOffline);

      if (configService instanceof AutoPollConfigService) {
        assert.isTrue(await configService["initializationPromise"]);
        expectedFetchTimes++;
      }

      assert.equal(expectedFetchTimes, configFetcher.calledTimes);

      const etag1 = ((await configService.getConfig()).httpETag ?? "0") as any | 0;
      if (configService instanceof LazyLoadConfigService) {
        expectedFetchTimes++;
      }

      (expectedFetchTimes > 0 ? assert.notEqual : assert.equal)(0, etag1);

      // 2. Checks that repeated calls to setOnline() have no effect
      client.setOnline();

      assert.isFalse(client.isOffline);
      assert.equal(expectedFetchTimes, configFetcher.calledTimes);

      // 3. Checks that setOffline() does disable HTTP calls
      client.setOffline();

      assert.isTrue(client.isOffline);
      assert.equal(expectedFetchTimes, configFetcher.calledTimes);

      assert.equal(etag1, ((await configService.getConfig()).httpETag ?? "0") as any | 0);

      // 4. Checks that forceRefreshAsync() does not initiate a HTTP call in offline mode
      const refreshResult = await client.forceRefreshAsync();

      assert.isTrue(client.isOffline);
      assert.equal(expectedFetchTimes, configFetcher.calledTimes);

      assert.equal(etag1, ((await configService.getConfig()).httpETag ?? "0") as any | 0);

      assert.isFalse(refreshResult.isSuccess);
      expect(refreshResult.errorMessage).to.contain("offline mode");
      assert.isUndefined(refreshResult.errorException);

      // 5. Checks that setOnline() has no effect after client gets disposed
      client.dispose();

      client.setOnline();
      assert.isTrue(client.isOffline);
    });
  }

  for (const addListenersViaOptions of [false, true]) {
    it(`ConfigCatClient should emit events, which listeners added ${addListenersViaOptions ? "via options" : "directly on the client"} should get notified of.`, async () => {
      let clientReadyEventCount = 0;
      const configChangedEvents: IConfig[] = [];
      const flagEvaluatedEvents: IEvaluationDetails[] = [];
      const errorEvents: [string, any][] = [];

      const handleClientReady = () => clientReadyEventCount++;
      const handleConfigChanged = (pc: IConfig) => configChangedEvents.push(pc);
      const handleFlagEvaluated = (ed: IEvaluationDetails) => flagEvaluatedEvents.push(ed);
      const handleClientError = (msg: string, err: any) => errorEvents.push([msg, err]);

      function setupHooks(hooks: IProvidesHooks) {
        hooks.on("clientReady", handleClientReady);
        hooks.on("configChanged", handleConfigChanged);
        hooks.on("flagEvaluated", handleFlagEvaluated);
        hooks.on("clientError", handleClientError);
      }

      const configFetcher = new FakeConfigFetcherWithTwoKeys();
      const configCache = new FakeCache();
      const configCatKernel = createKernel({ configFetcher, defaultCacheFactory: () => configCache });
      const userOptions: IManualPollOptions = addListenersViaOptions ? { setupHooks } : {};
      const options = createManualPollOptions("APIKEY", userOptions, configCatKernel);

      const expectedErrorMessage = "Error occurred in the `forceRefreshAsync` method.";
      const expectedErrorException = new Error("Something went wrong.");

      // 1. Client gets created
      const client = new ConfigCatClient(options, configCatKernel);

      if (!addListenersViaOptions) {
        setupHooks(client);
      }

      const state = await client.waitForReady();

      assert.equal(state, ClientCacheState.NoFlagData);
      assert.equal(clientReadyEventCount, 1);
      assert.equal(configChangedEvents.length, 0);
      assert.equal(flagEvaluatedEvents.length, 0);
      assert.equal(errorEvents.length, 0);

      // 2. Fetch fails
      const originalConfigService = client["configService"] as ConfigServiceBase<OptionsBase>;
      client["configService"] = new class implements IConfigService {
        readonly readyPromise = Promise.resolve(ClientCacheState.NoFlagData);
        getConfig(): Promise<ProjectConfig> { return Promise.resolve(ProjectConfig.empty); }
        refreshConfigAsync(): Promise<[RefreshResult, ProjectConfig]> { return Promise.reject(expectedErrorException); }
        get isOffline(): boolean { return false; }
        setOnline(): void { }
        setOffline(): void { }
        getCacheState(): ClientCacheState { return ClientCacheState.NoFlagData; }
        dispose(): void { }
      }();

      await client.forceRefreshAsync();

      assert.equal(configChangedEvents.length, 0);
      assert.equal(errorEvents.length, 1);
      const [actualErrorMessage, actualErrorException] = errorEvents[0];
      expect(actualErrorMessage).to.includes(expectedErrorMessage);
      assert.strictEqual(actualErrorException, expectedErrorException);

      // 3. Fetch succeeds
      client["configService"] = originalConfigService;

      await client.forceRefreshAsync();
      const cachedPc = await configCache.get("");

      assert.equal(configChangedEvents.length, 1);
      assert.strictEqual(configChangedEvents[0], cachedPc.config);

      // 4. All flags are evaluated
      const keys = await client.getAllKeysAsync();
      const evaluationDetails: IEvaluationDetails[] = [];
      for (const key of keys) {
        evaluationDetails.push(await client.getValueDetailsAsync(key, false));
      }

      assert.equal(evaluationDetails.length, flagEvaluatedEvents.length);
      assert.deepEqual(evaluationDetails, flagEvaluatedEvents);

      // 5. Client gets disposed
      client.dispose();

      assert.equal(clientReadyEventCount, 1);
      assert.equal(configChangedEvents.length, 1);
      assert.equal(evaluationDetails.length, flagEvaluatedEvents.length);
      assert.equal(errorEvents.length, 1);
    });
  }

  it("forceRefresh() should return failure including error in case of failed fetch", async () => {
    const errorMessage = "Something went wrong";
    const errorException = new Error(errorMessage);

    const configFetcher = new FakeConfigFetcherBase(null, 100, (lastConfig, lastETag) => { throw errorException; });
    const configCache = new FakeCache();
    const configCatKernel = createKernel({ configFetcher, defaultCacheFactory: () => configCache });
    const options = createManualPollOptions("APIKEY", void 0, configCatKernel);

    const client = new ConfigCatClient(options, configCatKernel);

    const refreshResult = await client.forceRefreshAsync();

    assert.isFalse(refreshResult.isSuccess);
    assert.isString(refreshResult.errorMessage);
    assert.strictEqual(refreshResult.errorException, errorException);

    client.dispose();
  });

  it("forceRefresh() should return failure including error in case of unexpected exception", async () => {
    const errorMessage = "Something went wrong";
    const errorException = new Error(errorMessage);

    const configFetcher = new FakeConfigFetcherBase(null, 100, (lastConfig, lastETag) => { throw errorException; });
    const configCache = new FakeCache();
    const configCatKernel = createKernel({ configFetcher, defaultCacheFactory: () => configCache });
    const options = createManualPollOptions("APIKEY", void 0, configCatKernel);

    const client = new ConfigCatClient(options, configCatKernel);

    client["configService"] = new class implements IConfigService {
      readonly readyPromise = Promise.resolve(ClientCacheState.NoFlagData);
      getConfig(): Promise<ProjectConfig> { return Promise.resolve(ProjectConfig.empty); }
      refreshConfigAsync(): Promise<[RefreshResult, ProjectConfig]> { throw errorException; }
      get isOffline(): boolean { return false; }
      setOnline(): void { }
      setOffline(): void { }
      getCacheState(): ClientCacheState { return ClientCacheState.NoFlagData; }
      dispose(): void { }
    }();

    const refreshResult = await client.forceRefreshAsync();

    assert.isFalse(refreshResult.isSuccess);
    expect(refreshResult.errorMessage).to.include(errorMessage);
    assert.strictEqual(refreshResult.errorException, errorException);

    client.dispose();
  });

  for (const pollingMode of [PollingMode.AutoPoll, PollingMode.LazyLoad, PollingMode.ManualPoll]) {
    const testCases: [boolean, boolean, string, ClientCacheState, ClientCacheState][] = [
      [false, false, "empty", ClientCacheState.NoFlagData, ClientCacheState.NoFlagData],
      [true, false, "empty", ClientCacheState.NoFlagData, ClientCacheState.NoFlagData],
      [true, true, "empty", ClientCacheState.NoFlagData, ClientCacheState.NoFlagData],
      [true, false, "expired", ClientCacheState.HasCachedFlagDataOnly, ClientCacheState.HasCachedFlagDataOnly],
      [true, true, "expired", ClientCacheState.NoFlagData, ClientCacheState.HasCachedFlagDataOnly],
    ];

    if (pollingMode !== PollingMode.ManualPoll) {
      testCases.push(
        [true, false, "fresh", ClientCacheState.HasUpToDateFlagData, ClientCacheState.HasUpToDateFlagData],
        [true, true, "fresh", ClientCacheState.NoFlagData, ClientCacheState.HasUpToDateFlagData]
      );
    }

    for (const [externalCache, asyncCacheGet, initialCacheState, expectedImmediateCacheState, expectedDelayedCacheState] of testCases) {
      const cacheType = externalCache ? (asyncCacheGet ? "external cache (async get)" : "external cache (sync get)") : "in-memory cache";
      it(`${PollingMode[pollingMode]} - snapshot() should correctly report client cache state - ${cacheType} - ${initialCacheState}`, async () => {
        const configFetcher = new FakeConfigFetcher(100);
        const configJson = configFetcher.defaultConfigJson;
        const configCatKernel = createKernel({ configFetcher });
        const asyncCacheDelayMs = 1, expirationSeconds = 5;

        const clientOptions: IOptions = {
          cache: externalCache ? (asyncCacheGet ? new FakeExternalAsyncCache(asyncCacheDelayMs) : new FakeExternalCache()) : null,
        };
        let options: OptionsBase;
        switch (pollingMode) {
          case PollingMode.AutoPoll:
            (clientOptions as IAutoPollOptions).pollIntervalSeconds = expirationSeconds;
            options = createAutoPollOptions("APIKEY", clientOptions, configCatKernel);
            break;
          case PollingMode.LazyLoad:
            (clientOptions as ILazyLoadingOptions).cacheTimeToLiveSeconds = expirationSeconds;
            options = createLazyLoadOptions("APIKEY", clientOptions, configCatKernel);
            break;
          case PollingMode.ManualPoll:
            options = createManualPollOptions("APIKEY", clientOptions, configCatKernel);
            break;
        }

        if (clientOptions.cache && (initialCacheState === "expired" || initialCacheState === "fresh")) {
          const timestamp = ProjectConfig.generateTimestamp() - expirationSeconds * 1000 * (initialCacheState === "expired" ? 1.5 : 0.5);
          const pc = new ProjectConfig(configJson, Config.deserialize(configJson), timestamp, "\"etag\"");
          await clientOptions.cache.set(options.getCacheKey(), ProjectConfig.serialize(pc));
        }

        const client = new ConfigCatClient(options, configCatKernel);
        try {
          // After client instantiation, if IConfigCatCache.get is a sync operation, the snapshot should immediately report the expected cache state.
          let snapshot = client.snapshot();
          assert.equal(expectedImmediateCacheState, snapshot.cacheState);

          // Otherwise, it should report the expected cache state after some delay.
          await delay(asyncCacheDelayMs + 10);
          snapshot = client.snapshot();
          assert.equal(expectedDelayedCacheState, snapshot.cacheState);
        } finally {
          client.dispose();
        }
      });
    }
  }
});

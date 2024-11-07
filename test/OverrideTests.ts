import { assert, expect } from "chai";
import { FakeConfigFetcherBase, FakeConfigFetcherWithNullNewConfig, createAutoPollOptions, createKernel, createManualPollOptions } from "./helpers/fakes";
import { SettingKeyValue } from "#lib";
import { ConfigCatClient, IConfigCatClient } from "#lib/ConfigCatClient";
import { AutoPollOptions, ManualPollOptions } from "#lib/ConfigCatClientOptions";
import { IQueryStringProvider, MapOverrideDataSource, OverrideBehaviour } from "#lib/FlagOverrides";
import { createFlagOverridesFromQueryParams } from "#lib/index.pubternals";
import { SettingValue } from "#lib/ProjectConfig";
import { isAllowedValue } from "#lib/RolloutEvaluator";

describe("Local Overrides", () => {
  it("Values from map - LocalOnly", async () => {
    const configCatKernel = createKernel({
      configFetcher: new FakeConfigFetcherBase('{"f":{"fakeKey":{"t":0,"v":{"b":false}}}}'),
    });

    const overrideMap = {
      enabledFeature: true,
      disabledFeature: false,
      intSetting: 5,
      doubleSetting: 3.14,
      stringSetting: "test"
    };

    const options: AutoPollOptions = createAutoPollOptions("localhost", {
      flagOverrides: {
        dataSource: new MapOverrideDataSource(overrideMap),
        behaviour: OverrideBehaviour.LocalOnly
      }
    }, configCatKernel);
    const client: IConfigCatClient = new ConfigCatClient(options, configCatKernel);

    assert.equal(await client.getValueAsync("enabledFeature", null), true);
    assert.equal(await client.getValueAsync("disabledFeature", null), false);
    assert.equal(await client.getValueAsync("intSetting", null), 5);
    assert.equal(await client.getValueAsync("doubleSetting", null), 3.14);
    assert.equal(await client.getValueAsync("stringSetting", null), "test");

    overrideMap.disabledFeature = true;
    overrideMap.intSetting = -5;

    assert.equal(await client.getValueAsync("enabledFeature", null), true);
    assert.equal(await client.getValueAsync("disabledFeature", null), false);
    assert.equal(await client.getValueAsync("intSetting", null), 5);
    assert.equal(await client.getValueAsync("doubleSetting", null), 3.14);
    assert.equal(await client.getValueAsync("stringSetting", null), "test");

    client.dispose();
  });

  it("Values from map - LocalOnly - watch changes - async", async () => {
    const configCatKernel = createKernel({
      configFetcher: new FakeConfigFetcherBase('{"f":{"fakeKey":{"t":0,"v":{"b":false}}}}'),
    });

    const overrideMap = {
      enabledFeature: true,
      disabledFeature: false,
      intSetting: 5,
      doubleSetting: 3.14,
      stringSetting: "test"
    };

    const options: AutoPollOptions = createAutoPollOptions("localhost", {
      flagOverrides: {
        dataSource: new MapOverrideDataSource(overrideMap, true),
        behaviour: OverrideBehaviour.LocalOnly
      }
    }, configCatKernel);
    const client: IConfigCatClient = new ConfigCatClient(options, configCatKernel);

    assert.equal(await client.getValueAsync("enabledFeature", null), true);
    assert.equal(await client.getValueAsync("disabledFeature", null), false);
    assert.equal(await client.getValueAsync("intSetting", null), 5);
    assert.equal(await client.getValueAsync("doubleSetting", null), 3.14);
    assert.equal(await client.getValueAsync("stringSetting", null), "test");

    overrideMap.disabledFeature = true;
    overrideMap.intSetting = -5;

    assert.equal(await client.getValueAsync("enabledFeature", null), true);
    assert.equal(await client.getValueAsync("disabledFeature", null), true);
    assert.equal(await client.getValueAsync("intSetting", null), -5);
    assert.equal(await client.getValueAsync("doubleSetting", null), 3.14);
    assert.equal(await client.getValueAsync("stringSetting", null), "test");

    client.dispose();
  });

  it("Values from map - LocalOnly - watch changes - sync", async () => {
    const configCatKernel = createKernel({
      configFetcher: new FakeConfigFetcherBase('{"f":{"fakeKey":{"t":0,"v":{"b":false}}}}'),
    });

    const overrideMap = {
      enabledFeature: true,
      disabledFeature: false,
      intSetting: 5,
      doubleSetting: 3.14,
      stringSetting: "test"
    };

    const options: AutoPollOptions = createAutoPollOptions("localhost", {
      flagOverrides: {
        dataSource: new MapOverrideDataSource(overrideMap, true),
        behaviour: OverrideBehaviour.LocalOnly
      }
    }, configCatKernel);
    const client: IConfigCatClient = new ConfigCatClient(options, configCatKernel);

    let snapshot = client.snapshot();
    assert.equal(await snapshot.getValue("enabledFeature", null), true);
    assert.equal(await snapshot.getValue("disabledFeature", null), false);
    assert.equal(await snapshot.getValue("intSetting", null), 5);
    assert.equal(await snapshot.getValue("doubleSetting", null), 3.14);
    assert.equal(await snapshot.getValue("stringSetting", null), "test");

    overrideMap.disabledFeature = true;
    overrideMap.intSetting = -5;

    snapshot = client.snapshot();
    assert.equal(await snapshot.getValue("enabledFeature", null), true);
    assert.equal(await snapshot.getValue("disabledFeature", null), true);
    assert.equal(await snapshot.getValue("intSetting", null), -5);
    assert.equal(await snapshot.getValue("doubleSetting", null), 3.14);
    assert.equal(await snapshot.getValue("stringSetting", null), "test");

    client.dispose();
  });

  it("Values from map - LocalOverRemote", async () => {
    const configCatKernel = createKernel({
      configFetcher: new FakeConfigFetcherBase('{"f":{"fakeKey":{"t":0,"v":{"b":false}}}}'),
    });
    const options: AutoPollOptions = createAutoPollOptions("localhost", {
      flagOverrides: {
        dataSource: new MapOverrideDataSource({
          fakeKey: true,
          nonexisting: true
        }),
        behaviour: OverrideBehaviour.LocalOverRemote
      }
    }, configCatKernel);
    const client: IConfigCatClient = new ConfigCatClient(options, configCatKernel);

    assert.equal(await client.getValueAsync("fakeKey", false), true);
    assert.equal(await client.getValueAsync("nonexisting", false), true);

    client.dispose();
  });

  it("Values from map - RemoteOverLocal", async () => {
    const configCatKernel = createKernel({
      configFetcher: new FakeConfigFetcherBase('{"f":{"fakeKey":{"t":0,"v":{"b":false}}}}'),
    });
    const options: AutoPollOptions = createAutoPollOptions("localhost", {
      flagOverrides: {
        dataSource: new MapOverrideDataSource({
          fakeKey: true,
          nonexisting: true
        }),
        behaviour: OverrideBehaviour.RemoteOverLocal
      }
    }, configCatKernel);
    const client: IConfigCatClient = new ConfigCatClient(options, configCatKernel);

    assert.equal(await client.getValueAsync("fakeKey", true), false);
    assert.equal(await client.getValueAsync("nonexisting", false), true);

    client.dispose();
  });

  it("Values from map - RemoteOverLocal - failing remote", async () => {
    const configCatKernel = createKernel({
      configFetcher: new FakeConfigFetcherBase(null),
    });
    const options: AutoPollOptions = createAutoPollOptions("localhost", {
      flagOverrides: {
        dataSource: new MapOverrideDataSource({
          fakeKey: true,
          nonexisting: true
        }),
        behaviour: OverrideBehaviour.RemoteOverLocal
      },
      maxInitWaitTimeSeconds: 1
    }, configCatKernel);
    const client: IConfigCatClient = new ConfigCatClient(options, configCatKernel);

    assert.equal(await client.getValueAsync("fakeKey", false), true);
    assert.equal(await client.getValueAsync("nonexisting", false), true);

    client.dispose();
  });

  it("Values from map - another map style", async () => {
    const dataSource: { [key: string]: any } = {};
    dataSource["enabled-feature"] = true;
    dataSource["disabled_feature"] = false;
    dataSource["int-setting"] = 5;
    dataSource["double_setting"] = 3.14;
    dataSource["string-setting"] = "test";
    const configCatKernel = createKernel({
      configFetcher: new FakeConfigFetcherBase('{"f":{"fakeKey":{"t":0,"v":{"b":false}}}}'),
    });
    const options: AutoPollOptions = createAutoPollOptions("localhost", {
      flagOverrides: {
        dataSource: new MapOverrideDataSource(dataSource),
        behaviour: OverrideBehaviour.RemoteOverLocal
      }
    }, configCatKernel);
    const client: IConfigCatClient = new ConfigCatClient(options, configCatKernel);

    assert.equal(await client.getValueAsync("enabled-feature", false), true);
    assert.equal(await client.getValueAsync("disabled_feature", true), false);
    assert.equal(await client.getValueAsync("int-setting", 0), 5);
    assert.equal(await client.getValueAsync("double_setting", 0), 3.14);
    assert.equal(await client.getValueAsync("string-setting", ""), "test");
    assert.equal(await client.getValueAsync("fakeKey", true), false);

    client.dispose();
  });

  it("Values from query string - changes not watched", async () => {
    const configCatKernel = createKernel({
      configFetcher: new FakeConfigFetcherBase('{"f":{"stringDefaultCat":{"t":1,"v":{"s":"CAT"}},"stringDefaultDog":{"t":1,"v":{"s":"DOG"}}}}'),
    });

    let currentQueryString = "?cc-stringDefaultCat=OVERRIDE_CAT&stringDefaultDog=OVERRIDE_DOG";
    const queryStringProvider: IQueryStringProvider = { get currentValue() { return currentQueryString; } };

    const options: AutoPollOptions = createAutoPollOptions("localhost", {
      flagOverrides: createFlagOverridesFromQueryParams(OverrideBehaviour.LocalOverRemote, false, void 0, queryStringProvider),
    }, configCatKernel);
    const client: IConfigCatClient = new ConfigCatClient(options, configCatKernel);

    assert.equal(await client.getValueAsync("stringDefaultCat", ""), "OVERRIDE_CAT");
    assert.equal(await client.getValueAsync("stringDefaultDog", ""), "DOG");

    currentQueryString = "?cc-stringDefaultCat=CHANGED_OVERRIDE_CAT";

    assert.equal(await client.getValueAsync("stringDefaultCat", ""), "OVERRIDE_CAT");
    assert.equal(await client.getValueAsync("stringDefaultDog", ""), "DOG");

    client.dispose();
  });

  it("Values from query string - changes watched", async () => {
    const configCatKernel = createKernel({
      configFetcher: new FakeConfigFetcherBase('{"f":{"stringDefaultCat":{"t":1,"v":{"s":"CAT"}},"stringDefaultDog":{"t":1,"v":{"s":"DOG"}}}}'),
    });

    let currentQueryString = "?cc-stringDefaultCat=OVERRIDE_CAT&stringDefaultDog=OVERRIDE_DOG";
    const queryStringProvider: IQueryStringProvider = { get currentValue() { return currentQueryString; } };

    const options: AutoPollOptions = createAutoPollOptions("localhost", {
      flagOverrides: createFlagOverridesFromQueryParams(OverrideBehaviour.LocalOverRemote, true, void 0, queryStringProvider),
    }, configCatKernel);
    const client: IConfigCatClient = new ConfigCatClient(options, configCatKernel);

    assert.equal(await client.getValueAsync("stringDefaultCat", ""), "OVERRIDE_CAT");
    assert.equal(await client.getValueAsync("stringDefaultDog", ""), "DOG");

    currentQueryString = "?cc-stringDefaultCat=CHANGED_OVERRIDE_CAT";

    assert.equal(await client.getValueAsync("stringDefaultCat", ""), "CHANGED_OVERRIDE_CAT");
    assert.equal(await client.getValueAsync("stringDefaultDog", ""), "DOG");

    client.dispose();
  });

  it("Values from query string - parsed query string", async () => {
    const configCatKernel = createKernel({
      configFetcher: new FakeConfigFetcherBase('{"f":{"stringDefaultCat":{"t":1,"v":{"s":"CAT"}},"stringDefaultDog":{"t":1,"v":{"s":"DOG"}}}}'),
    });

    let currentQueryString: { [key: string]: string } = {
      "cc-stringDefaultCat": "OVERRIDE_CAT",
      "stringDefaultDog": "OVERRIDE_DOG",
    };
    const queryStringProvider: IQueryStringProvider = { get currentValue() { return currentQueryString; } };

    const options: AutoPollOptions = createAutoPollOptions("localhost", {
      flagOverrides: createFlagOverridesFromQueryParams(OverrideBehaviour.LocalOverRemote, true, void 0, queryStringProvider),
    }, configCatKernel);
    const client: IConfigCatClient = new ConfigCatClient(options, configCatKernel);

    assert.equal(await client.getValueAsync("stringDefaultCat", ""), "OVERRIDE_CAT");
    assert.equal(await client.getValueAsync("stringDefaultDog", ""), "DOG");

    currentQueryString = {
      "cc-stringDefaultCat": "CHANGED_OVERRIDE_CAT"
    };

    assert.equal(await client.getValueAsync("stringDefaultCat", ""), "CHANGED_OVERRIDE_CAT");
    assert.equal(await client.getValueAsync("stringDefaultDog", ""), "DOG");

    client.dispose();
  });

  it("Values from query string - respects custom parameter name prefix", async () => {
    const configCatKernel = createKernel({
      configFetcher: new FakeConfigFetcherBase('{"f":{"numberDefaultZero":{"t":2,"v":{"i":42}}}}'),
    });

    const currentQueryString = "?numberDefaultZero=43&cc-numberDefaultZero=44";
    const queryStringProvider: IQueryStringProvider = { get currentValue() { return currentQueryString; } };

    const options: AutoPollOptions = createAutoPollOptions("localhost", {
      flagOverrides: createFlagOverridesFromQueryParams(OverrideBehaviour.LocalOverRemote, void 0, "", queryStringProvider),
    }, configCatKernel);
    const client: IConfigCatClient = new ConfigCatClient(options, configCatKernel);

    assert.equal(await client.getValueAsync("numberDefaultZero", 0), 43);
    assert.equal(await client.getValueAsync("cc-numberDefaultZero", 0), 44);

    client.dispose();
  });

  it("Values from query string - respects force string value suffix", async () => {
    const configCatKernel = createKernel({
      configFetcher: new FakeConfigFetcherBase('{"f":{"stringDefaultCat":{"t":1,"v":{"s":"CAT"}}}}'),
    });

    const currentQueryString = "?cc-stringDefaultCat;str=TRUE&cc-boolDefaultFalse=TRUE";
    const queryStringProvider: IQueryStringProvider = { get currentValue() { return currentQueryString; } };

    const options: AutoPollOptions = createAutoPollOptions("localhost", {
      flagOverrides: createFlagOverridesFromQueryParams(OverrideBehaviour.LocalOverRemote, void 0, void 0, queryStringProvider),
    }, configCatKernel);
    const client: IConfigCatClient = new ConfigCatClient(options, configCatKernel);

    assert.equal(await client.getValueAsync("stringDefaultCat", ""), "TRUE");
    assert.equal(await client.getValueAsync("boolDefaultFalse", false), true);

    client.dispose();
  });

  it("Values from query string - handles query string edge cases", async () => {
    const configCatKernel = createKernel({
      configFetcher: new FakeConfigFetcherBase('{"f":{"stringDefaultCat":{"t":1,"v":{"s":"CAT"}}}}'),
    });

    const currentQueryString = "?&some&=garbage&&cc-stringDefaultCat=OVERRIDE_CAT&=cc-stringDefaultCat&cc-stringDefaultCat";
    const queryStringProvider: IQueryStringProvider = { get currentValue() { return currentQueryString; } };

    const options: AutoPollOptions = createAutoPollOptions("localhost", {
      flagOverrides: createFlagOverridesFromQueryParams(OverrideBehaviour.LocalOverRemote, void 0, void 0, queryStringProvider),
    }, configCatKernel);
    const client: IConfigCatClient = new ConfigCatClient(options, configCatKernel);

    assert.equal(await client.getValueAsync("stringDefaultCat", ""), "");
    assert.isNull(await client.getValueAsync("some", null));

    client.dispose();
  });

  it("LocalOnly - forceRefresh() should return failure", async () => {
    const configCatKernel = createKernel({
      configFetcher: new FakeConfigFetcherBase('{"f":{"fakeKey":{"t":0,"v":{"b":false}}}}'),
    });
    const options: ManualPollOptions = createManualPollOptions("localhost", {
      flagOverrides: {
        dataSource: new MapOverrideDataSource({
          "fakeKey": true,
          "nonexisting": true,
        }),
        behaviour: OverrideBehaviour.LocalOnly
      }
    }, configCatKernel);
    const client: IConfigCatClient = new ConfigCatClient(options, configCatKernel);

    const refreshResult = await client.forceRefreshAsync();

    assert.isTrue(await client.getValueAsync("fakeKey", false));
    assert.isTrue(await client.getValueAsync("nonexisting", false));

    assert.isFalse(refreshResult.isSuccess);
    expect(refreshResult.errorMessage).to.contain("LocalOnly");
    assert.isUndefined(refreshResult.errorException);

    client.dispose();
  });

  for (const [overrideValue, defaultValue, expectedEvaluatedValue] of [
    [true, false, true],
    [true, "", ""],
    [true, 0, 0],
    ["text", false, false],
    ["text", "", "text"],
    ["text", 0, 0],
    [42, false, false],
    [42, "", ""],
    [42, 0, 42],
    [3.14, false, false],
    [3.14, "", ""],
    [3.14, 0, 3.14],
    [null, false, false],
    [void 0, false, false],
    [{}, false, false],
    [[], false, false],
    [function() { }, false, false],
  ]) {
    it(`Override value type mismatch should be handled correctly (${overrideValue}, ${defaultValue})`, async () => {
      const key = "flag";

      const map = { [key]: overrideValue as NonNullable<SettingValue> };

      const configCatKernel = createKernel({
        configFetcher: new FakeConfigFetcherWithNullNewConfig(),
      });

      const options: ManualPollOptions = createManualPollOptions("localhost", {
        flagOverrides: {
          dataSource: new MapOverrideDataSource(map),
          behaviour: OverrideBehaviour.LocalOnly
        }
      }, configCatKernel);

      const client: IConfigCatClient = new ConfigCatClient(options, configCatKernel);

      const actualEvaluatedValue = await client.getValueAsync(key, defaultValue as SettingValue);
      const actualEvaluatedValues = await client.getAllValuesAsync();

      assert.strictEqual(expectedEvaluatedValue, actualEvaluatedValue);

      const expectedEvaluatedValues: SettingKeyValue[] = [{
        settingKey: key,
        settingValue: isAllowedValue(overrideValue) ? overrideValue : null
      }];
      assert.deepEqual(expectedEvaluatedValues, actualEvaluatedValues);

      client.dispose();
    });
  }
});

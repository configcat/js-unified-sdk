import { assert, expect } from "chai";
import { createAutoPollOptions, createKernel, createManualPollOptions, FakeConfigFetcherBase, FakeConfigFetcherWithNullNewConfig } from "./helpers/fakes";
import { RefreshErrorCode, SettingKeyValue, User } from "#lib";
import { ConfigCatClient, IConfigCatClient } from "#lib/ConfigCatClient";
import { AutoPollOptions, ManualPollOptions } from "#lib/ConfigCatClientOptions";
import { IOverrideDataSource, IQueryStringProvider, MapOverrideDataSource, OverrideBehaviour } from "#lib/FlagOverrides";
import { createCustomFlagOverrides, createFlagOverridesFromQueryParams } from "#lib/index.pubternals";
import { ConfigJson, InvalidConfigModelError, prepareConfig, Setting, SettingValue } from "#lib/ProjectConfig";
import { EvaluationError, EvaluationErrorCode, isAllowedValue } from "#lib/RolloutEvaluator";

describe("Local Overrides", () => {
  it("Values from map - LocalOnly", async () => {
    const configCatKernel = createKernel({
      configFetcherFactory: () => new FakeConfigFetcherBase('{"f":{"fakeKey":{"t":0,"v":{"b":false}}}}'),
    });

    const overrideMap = {
      enabledFeature: true,
      disabledFeature: false,
      intSetting: 5,
      doubleSetting: 3.14,
      stringSetting: "test",
    };

    const options: AutoPollOptions = createAutoPollOptions("localhost", {
      flagOverrides: {
        dataSource: new MapOverrideDataSource(overrideMap),
        behaviour: OverrideBehaviour.LocalOnly,
      },
    }, configCatKernel);
    const client: IConfigCatClient = new ConfigCatClient(options);

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
      configFetcherFactory: () => new FakeConfigFetcherBase('{"f":{"fakeKey":{"t":0,"v":{"b":false}}}}'),
    });

    const overrideMap = {
      enabledFeature: true,
      disabledFeature: false,
      intSetting: 5,
      doubleSetting: 3.14,
      stringSetting: "test",
    };

    const options: AutoPollOptions = createAutoPollOptions("localhost", {
      flagOverrides: {
        dataSource: new MapOverrideDataSource(overrideMap, true),
        behaviour: OverrideBehaviour.LocalOnly,
      },
    }, configCatKernel);
    const client: IConfigCatClient = new ConfigCatClient(options);

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
      configFetcherFactory: () => new FakeConfigFetcherBase('{"f":{"fakeKey":{"t":0,"v":{"b":false}}}}'),
    });

    const overrideMap = {
      enabledFeature: true,
      disabledFeature: false,
      intSetting: 5,
      doubleSetting: 3.14,
      stringSetting: "test",
    };

    const options: AutoPollOptions = createAutoPollOptions("localhost", {
      flagOverrides: {
        dataSource: new MapOverrideDataSource(overrideMap, true),
        behaviour: OverrideBehaviour.LocalOnly,
      },
    }, configCatKernel);
    const client: IConfigCatClient = new ConfigCatClient(options);

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
      configFetcherFactory: () => new FakeConfigFetcherBase('{"f":{"fakeKey":{"t":0,"v":{"b":false}}}}'),
    });
    const options: AutoPollOptions = createAutoPollOptions("localhost", {
      flagOverrides: {
        dataSource: new MapOverrideDataSource({
          fakeKey: true,
          nonexisting: true,
        }),
        behaviour: OverrideBehaviour.LocalOverRemote,
      },
    }, configCatKernel);
    const client: IConfigCatClient = new ConfigCatClient(options);

    assert.equal(await client.getValueAsync("fakeKey", false), true);
    assert.equal(await client.getValueAsync("nonexisting", false), true);

    client.dispose();
  });

  it("Values from map - RemoteOverLocal", async () => {
    const configCatKernel = createKernel({
      configFetcherFactory: () => new FakeConfigFetcherBase('{"f":{"fakeKey":{"t":0,"v":{"b":false}}}}'),
    });
    const options: AutoPollOptions = createAutoPollOptions("localhost", {
      flagOverrides: {
        dataSource: new MapOverrideDataSource({
          fakeKey: true,
          nonexisting: true,
        }),
        behaviour: OverrideBehaviour.RemoteOverLocal,
      },
    }, configCatKernel);
    const client: IConfigCatClient = new ConfigCatClient(options);

    assert.equal(await client.getValueAsync("fakeKey", true), false);
    assert.equal(await client.getValueAsync("nonexisting", false), true);

    client.dispose();
  });

  it("Values from map - RemoteOverLocal - failing remote", async () => {
    const configCatKernel = createKernel({
      configFetcherFactory: () => new FakeConfigFetcherBase(null),
    });
    const options: AutoPollOptions = createAutoPollOptions("localhost", {
      flagOverrides: {
        dataSource: new MapOverrideDataSource({
          fakeKey: true,
          nonexisting: true,
        }),
        behaviour: OverrideBehaviour.RemoteOverLocal,
      },
      maxInitWaitTimeSeconds: 1,
    }, configCatKernel);
    const client: IConfigCatClient = new ConfigCatClient(options);

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
      configFetcherFactory: () => new FakeConfigFetcherBase('{"f":{"fakeKey":{"t":0,"v":{"b":false}}}}'),
    });
    const options: AutoPollOptions = createAutoPollOptions("localhost", {
      flagOverrides: {
        dataSource: new MapOverrideDataSource(dataSource),
        behaviour: OverrideBehaviour.RemoteOverLocal,
      },
    }, configCatKernel);
    const client: IConfigCatClient = new ConfigCatClient(options);

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
      configFetcherFactory: () => new FakeConfigFetcherBase('{"f":{"stringDefaultCat":{"t":1,"v":{"s":"CAT"}},"stringDefaultDog":{"t":1,"v":{"s":"DOG"}}}}'),
    });

    let currentQueryString = "?cc-stringDefaultCat=OVERRIDE_CAT&stringDefaultDog=OVERRIDE_DOG";
    const queryStringProvider: IQueryStringProvider = { get currentValue() { return currentQueryString; } };

    const options: AutoPollOptions = createAutoPollOptions("localhost", {
      flagOverrides: createFlagOverridesFromQueryParams(OverrideBehaviour.LocalOverRemote, false, void 0, queryStringProvider),
    }, configCatKernel);
    const client: IConfigCatClient = new ConfigCatClient(options);

    assert.equal(await client.getValueAsync("stringDefaultCat", ""), "OVERRIDE_CAT");
    assert.equal(await client.getValueAsync("stringDefaultDog", ""), "DOG");

    currentQueryString = "?cc-stringDefaultCat=CHANGED_OVERRIDE_CAT";

    assert.equal(await client.getValueAsync("stringDefaultCat", ""), "OVERRIDE_CAT");
    assert.equal(await client.getValueAsync("stringDefaultDog", ""), "DOG");

    client.dispose();
  });

  it("Values from query string - changes watched", async () => {
    const configCatKernel = createKernel({
      configFetcherFactory: () => new FakeConfigFetcherBase('{"f":{"stringDefaultCat":{"t":1,"v":{"s":"CAT"}},"stringDefaultDog":{"t":1,"v":{"s":"DOG"}}}}'),
    });

    let currentQueryString = "?cc-stringDefaultCat=OVERRIDE_CAT&stringDefaultDog=OVERRIDE_DOG";
    const queryStringProvider: IQueryStringProvider = { get currentValue() { return currentQueryString; } };

    const options: AutoPollOptions = createAutoPollOptions("localhost", {
      flagOverrides: createFlagOverridesFromQueryParams(OverrideBehaviour.LocalOverRemote, true, void 0, queryStringProvider),
    }, configCatKernel);
    const client: IConfigCatClient = new ConfigCatClient(options);

    assert.equal(await client.getValueAsync("stringDefaultCat", ""), "OVERRIDE_CAT");
    assert.equal(await client.getValueAsync("stringDefaultDog", ""), "DOG");

    currentQueryString = "?cc-stringDefaultCat=CHANGED_OVERRIDE_CAT";

    assert.equal(await client.getValueAsync("stringDefaultCat", ""), "CHANGED_OVERRIDE_CAT");
    assert.equal(await client.getValueAsync("stringDefaultDog", ""), "DOG");

    client.dispose();
  });

  it("Values from query string - parsed query string", async () => {
    const configCatKernel = createKernel({
      configFetcherFactory: () => new FakeConfigFetcherBase('{"f":{"stringDefaultCat":{"t":1,"v":{"s":"CAT"}},"stringDefaultDog":{"t":1,"v":{"s":"DOG"}}}}'),
    });

    let currentQueryString: { [key: string]: string } = {
      "cc-stringDefaultCat": "OVERRIDE_CAT",
      "stringDefaultDog": "OVERRIDE_DOG",
    };
    const queryStringProvider: IQueryStringProvider = { get currentValue() { return currentQueryString; } };

    const options: AutoPollOptions = createAutoPollOptions("localhost", {
      flagOverrides: createFlagOverridesFromQueryParams(OverrideBehaviour.LocalOverRemote, true, void 0, queryStringProvider),
    }, configCatKernel);
    const client: IConfigCatClient = new ConfigCatClient(options);

    assert.equal(await client.getValueAsync("stringDefaultCat", ""), "OVERRIDE_CAT");
    assert.equal(await client.getValueAsync("stringDefaultDog", ""), "DOG");

    currentQueryString = {
      "cc-stringDefaultCat": "CHANGED_OVERRIDE_CAT",
    };

    assert.equal(await client.getValueAsync("stringDefaultCat", ""), "CHANGED_OVERRIDE_CAT");
    assert.equal(await client.getValueAsync("stringDefaultDog", ""), "DOG");

    client.dispose();
  });

  it("Values from query string - respects custom parameter name prefix", async () => {
    const configCatKernel = createKernel({
      configFetcherFactory: () => new FakeConfigFetcherBase('{"f":{"numberDefaultZero":{"t":2,"v":{"i":42}}}}'),
    });

    const currentQueryString = "?numberDefaultZero=43&cc-numberDefaultZero=44";
    const queryStringProvider: IQueryStringProvider = { get currentValue() { return currentQueryString; } };

    const options: AutoPollOptions = createAutoPollOptions("localhost", {
      flagOverrides: createFlagOverridesFromQueryParams(OverrideBehaviour.LocalOverRemote, void 0, "", queryStringProvider),
    }, configCatKernel);
    const client: IConfigCatClient = new ConfigCatClient(options);

    assert.equal(await client.getValueAsync("numberDefaultZero", 0), 43);
    assert.equal(await client.getValueAsync("cc-numberDefaultZero", 0), 44);

    client.dispose();
  });

  it("Values from query string - respects force string value suffix", async () => {
    const configCatKernel = createKernel({
      configFetcherFactory: () => new FakeConfigFetcherBase('{"f":{"stringDefaultCat":{"t":1,"v":{"s":"CAT"}}}}'),
    });

    const currentQueryString = "?cc-stringDefaultCat;str=TRUE&cc-boolDefaultFalse=TRUE";
    const queryStringProvider: IQueryStringProvider = { get currentValue() { return currentQueryString; } };

    const options: AutoPollOptions = createAutoPollOptions("localhost", {
      flagOverrides: createFlagOverridesFromQueryParams(OverrideBehaviour.LocalOverRemote, void 0, void 0, queryStringProvider),
    }, configCatKernel);
    const client: IConfigCatClient = new ConfigCatClient(options);

    assert.equal(await client.getValueAsync("stringDefaultCat", ""), "TRUE");
    assert.equal(await client.getValueAsync("boolDefaultFalse", false), true);

    client.dispose();
  });

  it("Values from query string - handles query string edge cases", async () => {
    const configCatKernel = createKernel({
      configFetcherFactory: () => new FakeConfigFetcherBase('{"f":{"stringDefaultCat":{"t":1,"v":{"s":"CAT"}}}}'),
    });

    const currentQueryString = "?&some&=garbage&&cc-stringDefaultCat=OVERRIDE_CAT&=cc-stringDefaultCat&cc-stringDefaultCat";
    const queryStringProvider: IQueryStringProvider = { get currentValue() { return currentQueryString; } };

    const options: AutoPollOptions = createAutoPollOptions("localhost", {
      flagOverrides: createFlagOverridesFromQueryParams(OverrideBehaviour.LocalOverRemote, void 0, void 0, queryStringProvider),
    }, configCatKernel);
    const client: IConfigCatClient = new ConfigCatClient(options);

    assert.equal(await client.getValueAsync("stringDefaultCat", ""), "");
    assert.isNull(await client.getValueAsync("some", null));

    client.dispose();
  });

  it("Values from custom data source", async () => {
    // "Beta users" segment: Email IS ONE OF ['jane@example.com', 'john@example.com']
    const config = prepareConfig({
      "p": {
        "s": "UZWYnRWPwF7hApMquVrUmyPRGziigICYz372JOYqXgw=",
      } as ConfigJson.Preferences,
      "s": [
        {
          "n": "Beta users",
          "r": [
            {
              "a": "Email",
              "c": 16,
              "l": [
                "89f6d080752f2969b6802c399e6141885c4ce40fb151f41b9ec955c1f4790490",
                "2dde8bd2436cb07d45fb455847f8a09ea2427313c278b3352a39db31e6106c4c",
              ],
            },
          ],
        },
      ],
      "f": {
        "isInSegment": {
          "t": 0,
          "r": [
            {
              "c": [
                {
                  "s": {
                    "s": 0,
                    "c": 0,
                  },
                },
              ],
              "s": {
                "v": {
                  "b": true,
                },
                "i": "1",
              },
            },
          ],
          "v": {
            "b": false,
          },
          "i": "0",
        },
        "isNotInSegment": {
          "t": 0,
          "r": [
            {
              "c": [
                {
                  "s": {
                    "s": 0,
                    "c": 1,
                  },
                },
              ],
              "s": {
                "v": {
                  "b": true,
                },
                "i": "1",
              },
            },
          ],
          "v": {
            "b": false,
          },
          "i": "0",
        },
      },
    });

    const customDataSource = new (class implements IOverrideDataSource {
      getOverrides(): Record<string, Setting> {
        return config.f!;
      }
    })();

    const options: ManualPollOptions = createManualPollOptions("localhost", {
      flagOverrides: createCustomFlagOverrides(customDataSource, OverrideBehaviour.LocalOnly),
    });
    const client: IConfigCatClient = new ConfigCatClient(options);

    const keys = await client.snapshot().getAllKeys();
    expect(keys).to.have.members(["isInSegment", "isNotInSegment"]);

    const user = new User("12345", "jane@example.com");

    assert.isTrue(await client.getValueAsync("isInSegment", null, user));
    assert.isFalse(await client.getValueAsync("isNotInSegment", null, user));

    client.dispose();
  });

  it("LocalOnly - forceRefreshAsync() should return failure", async () => {
    const configCatKernel = createKernel({
      configFetcherFactory: () => new FakeConfigFetcherBase('{"s": "f":{"fakeKey":{"t":0,"v":{"b":false}}}}'),
    });
    const options: ManualPollOptions = createManualPollOptions("localhost", {
      flagOverrides: {
        dataSource: new MapOverrideDataSource({
          "fakeKey": true,
          "nonexisting": true,
        }),
        behaviour: OverrideBehaviour.LocalOnly,
      },
    }, configCatKernel);
    const client: IConfigCatClient = new ConfigCatClient(options);

    const refreshResult = await client.forceRefreshAsync();

    assert.isTrue(await client.getValueAsync("fakeKey", false));
    assert.isTrue(await client.getValueAsync("nonexisting", false));

    assert.isFalse(refreshResult.isSuccess);
    assert.strictEqual(refreshResult.errorCode, RefreshErrorCode.LocalOnlyClient);
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
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    it(`Override value type mismatch should be handled correctly (${overrideValue}, ${defaultValue})`, async () => {
      const key = "flag";

      const map = { [key]: overrideValue as NonNullable<SettingValue> };

      const configCatKernel = createKernel({
        configFetcherFactory: () => new FakeConfigFetcherWithNullNewConfig(),
      });

      const options: ManualPollOptions = createManualPollOptions("localhost", {
        flagOverrides: {
          dataSource: new MapOverrideDataSource(map),
          behaviour: OverrideBehaviour.LocalOnly,
        },
      }, configCatKernel);

      const client: IConfigCatClient = new ConfigCatClient(options);

      const actualEvaluatedValueDetails = await client.getValueDetailsAsync(key, defaultValue as SettingValue);
      const actualEvaluatedValue = actualEvaluatedValueDetails.value;
      const actualEvaluatedValues = await client.getAllValuesAsync();

      assert.strictEqual(expectedEvaluatedValue, actualEvaluatedValue);

      if (defaultValue !== expectedEvaluatedValue) {
        assert.isFalse(actualEvaluatedValueDetails.isDefaultValue);
        assert.strictEqual(actualEvaluatedValueDetails.errorCode, EvaluationErrorCode.None);
        assert.isUndefined(actualEvaluatedValueDetails.errorMessage);
        assert.isUndefined(actualEvaluatedValueDetails.errorException);
      } else {
        assert.isTrue(actualEvaluatedValueDetails.isDefaultValue);
        assert.isDefined(actualEvaluatedValueDetails.errorMessage);
        if (!isAllowedValue(overrideValue)) {
          assert.strictEqual(actualEvaluatedValueDetails.errorCode, EvaluationErrorCode.InvalidConfigModel);
          assert.instanceOf(actualEvaluatedValueDetails.errorException, InvalidConfigModelError);
        } else {
          assert.strictEqual(actualEvaluatedValueDetails.errorCode, EvaluationErrorCode.SettingValueTypeMismatch);
          assert.instanceOf(actualEvaluatedValueDetails.errorException, EvaluationError);
        }
      }

      const expectedEvaluatedValues: SettingKeyValue[] = [{
        settingKey: key,
        settingValue: isAllowedValue(overrideValue) ? overrideValue : null,
      }];
      assert.deepEqual(expectedEvaluatedValues, actualEvaluatedValues);

      client.dispose();
    });
  }
});

import { assert, expect } from "chai";
import { FakeLogger } from "./helpers/fakes";
import { platform } from "./helpers/platform";
import { FormattableLogMessage, IConfigCatClient, IEvaluationDetails, IOptions, LogLevel, OverrideBehaviour, PollingMode, SettingKeyValue, User } from "#lib";
import { ConfigCatClient } from "#lib/ConfigCatClient";
import { createConsoleLogger, createFlagOverridesFromMap, OptionsBase } from "#lib/index.pubternals";

const sdkKey = "PKDVCLf-Hq-h-kCzMp-L7Q/psuH7BGHoUmdONrzzUOY7A";

for (const pollingMode of [PollingMode.AutoPoll, PollingMode.ManualPoll, PollingMode.LazyLoad]) {
  describe("Integration tests - Normal use", () => {

    const options: IOptions = { logger: createConsoleLogger(LogLevel.Off) };

    let client: IConfigCatClient;

    beforeEach(function() {
      client = platform().getClient(sdkKey, pollingMode, options);
    });

    afterEach(function() {
      client.dispose();
    });

    it(`${PollingMode[pollingMode]} - getValueAsync() with key: 'stringDefaultCat' should return 'Cat'`, async () => {

      const defaultValue = "NOT_CAT";

      if (pollingMode === PollingMode.ManualPoll) {
        await client.forceRefreshAsync();
      }

      const actual: string = await client.getValueAsync("stringDefaultCat", defaultValue);
      assert.strictEqual(actual, "Cat");
      assert.notStrictEqual(actual, defaultValue);
    });

    it(`${PollingMode[pollingMode]} - getValueAsync() with key: 'NotExistsKey' should return default value`, async () => {

      const defaultValue = "NOT_CAT";

      if (pollingMode === PollingMode.ManualPoll) {
        await client.forceRefreshAsync();
      }

      const actual: string = await client.getValueAsync("NotExistsKey", defaultValue);
      assert.equal(actual, defaultValue);
    });

    it(`${PollingMode[pollingMode]} - getValueAsync() with key: 'RolloutEvaluate' should return default value`, async () => {
      if (pollingMode === PollingMode.ManualPoll) {
        await client.forceRefreshAsync();
      }

      const actual: string = await client.getValueAsync("string25Cat25Dog25Falcon25Horse", "N/A", new User("nacho@gmail.com"));
      assert.equal(actual, "Horse");
    });

    it(`${PollingMode[pollingMode]} - getValueDetailsAsync() with key: 'stringDefaultCat' should return 'Cat'`, async () => {

      const defaultValue = "NOT_CAT";

      if (pollingMode === PollingMode.ManualPoll) {
        await client.forceRefreshAsync();
      }

      const actual: IEvaluationDetails = await client.getValueDetailsAsync("stringDefaultCat", defaultValue);
      assert.isFalse(actual.isDefaultValue);
      assert.strictEqual(actual.value, "Cat");
      assert.strictEqual(actual.variationId, "7a0be518");
    });

    it(`${PollingMode[pollingMode]} - getValueDetailsAsync() with key: 'NotExistsKey' should return default value`, async () => {

      const defaultValue = "NOT_CAT";

      if (pollingMode === PollingMode.ManualPoll) {
        await client.forceRefreshAsync();
      }

      const actual: IEvaluationDetails = await client.getValueDetailsAsync("NotExistsKey", defaultValue);
      assert.isTrue(actual.isDefaultValue);
      assert.strictEqual(actual.value, defaultValue);
      assert.isNull(actual.variationId ?? null);
    });

    it(`${PollingMode[pollingMode]} - getAllKeysAsync() should return all keys`, async () => {

      if (pollingMode === PollingMode.ManualPoll) {
        await client.forceRefreshAsync();
      }

      const keys: string[] = await client.getAllKeysAsync();

      assert.equal(keys.length, 16);
      const keysObject: any = {};
      keys.forEach(value => keysObject[value] = {});
      assert.containsAllKeys(keysObject, [
        "stringDefaultCat",
        "stringIsInDogDefaultCat",
        "stringIsNotInDogDefaultCat",
        "stringContainsDogDefaultCat",
        "stringNotContainsDogDefaultCat",
        "string25Cat25Dog25Falcon25Horse",
        "string75Cat0Dog25Falcon0Horse",
        "string25Cat25Dog25Falcon25HorseAdvancedRules",
        "boolDefaultTrue",
        "boolDefaultFalse",
        "bool30TrueAdvancedRules",
        "integer25One25Two25Three25FourAdvancedRules",
        "integerDefaultOne",
        "doubleDefaultPi",
        "double25Pi25E25Gr25Zero",
        "keySampleText",
      ]);
    });

    it(`${PollingMode[pollingMode]} - getAllValuesAsync() should return all values`, async () => {

      if (pollingMode === PollingMode.ManualPoll) {
        await client.forceRefreshAsync();
      }

      const sks: SettingKeyValue[] = await client.getAllValuesAsync();
      const settingKeys: any = {};
      sks.forEach((i) => (settingKeys[i.settingKey] = i.settingValue));
      assert.equal(sks.length, 16);
      assert.equal(settingKeys.stringDefaultCat, "Cat");
      assert.equal(settingKeys.stringIsInDogDefaultCat, "Cat");
      assert.equal(settingKeys.stringIsNotInDogDefaultCat, "Cat");
      assert.equal(settingKeys.stringContainsDogDefaultCat, "Cat");
      assert.equal(settingKeys.stringNotContainsDogDefaultCat, "Cat");
      assert.equal(settingKeys.string25Cat25Dog25Falcon25Horse, "Chicken");
      assert.equal(settingKeys.string75Cat0Dog25Falcon0Horse, "Chicken");
      assert.equal(settingKeys.string25Cat25Dog25Falcon25HorseAdvancedRules, "Chicken");
      assert.equal(settingKeys.boolDefaultTrue, true);
      assert.equal(settingKeys.boolDefaultFalse, false);
      assert.equal(settingKeys.bool30TrueAdvancedRules, true);
      assert.equal(settingKeys.integer25One25Two25Three25FourAdvancedRules, -1);
      assert.equal(settingKeys.integerDefaultOne, 1);
      assert.equal(settingKeys.doubleDefaultPi, 3.1415);
      assert.equal(settingKeys.double25Pi25E25Gr25Zero, -1);
      assert.equal(settingKeys.keySampleText, "Cat");
    });

    it(`${PollingMode[pollingMode]} - getAllValueDetailsAsync() should return all values with details`, async () => {

      if (pollingMode === PollingMode.ManualPoll) {
        await client.forceRefreshAsync();
      }

      const eds: IEvaluationDetails[] = await client.getAllValueDetailsAsync();
      const settingValues: any = {};
      const variationIds: any = {};

      assert.equal(eds.length, 16);
      eds.forEach(ed => {
        assert.isFalse(ed.isDefaultValue);
        settingValues[ed.key] = ed.value;
        variationIds[ed.key] = ed.variationId;
      });

      assert.equal(settingValues.stringDefaultCat, "Cat");
      assert.equal(settingValues.stringIsInDogDefaultCat, "Cat");
      assert.equal(settingValues.stringIsNotInDogDefaultCat, "Cat");
      assert.equal(settingValues.stringContainsDogDefaultCat, "Cat");
      assert.equal(settingValues.stringNotContainsDogDefaultCat, "Cat");
      assert.equal(settingValues.string25Cat25Dog25Falcon25Horse, "Chicken");
      assert.equal(settingValues.string75Cat0Dog25Falcon0Horse, "Chicken");
      assert.equal(settingValues.string25Cat25Dog25Falcon25HorseAdvancedRules, "Chicken");
      assert.equal(settingValues.boolDefaultTrue, true);
      assert.equal(settingValues.boolDefaultFalse, false);
      assert.equal(settingValues.bool30TrueAdvancedRules, true);
      assert.equal(settingValues.integer25One25Two25Three25FourAdvancedRules, -1);
      assert.equal(settingValues.integerDefaultOne, 1);
      assert.equal(settingValues.doubleDefaultPi, 3.1415);
      assert.equal(settingValues.double25Pi25E25Gr25Zero, -1);
      assert.equal(settingValues.keySampleText, "Cat");

      assert.equal(variationIds.stringDefaultCat, "7a0be518");
      assert.equal(variationIds.stringIsInDogDefaultCat, "83372510");
      assert.equal(variationIds.stringIsNotInDogDefaultCat, "2459598d");
      assert.equal(variationIds.stringContainsDogDefaultCat, "ce564c3a");
      assert.equal(variationIds.stringNotContainsDogDefaultCat, "44ab483a");
      assert.equal(variationIds.string25Cat25Dog25Falcon25Horse, "2588a3e6");
      assert.equal(variationIds.string75Cat0Dog25Falcon0Horse, "aa65b5ce");
      assert.equal(variationIds.string25Cat25Dog25Falcon25HorseAdvancedRules, "8250ef5a");
      assert.equal(variationIds.boolDefaultTrue, "09513143");
      assert.equal(variationIds.boolDefaultFalse, "489a16d2");
      assert.equal(variationIds.bool30TrueAdvancedRules, "607147d5");
      assert.equal(variationIds.integer25One25Two25Three25FourAdvancedRules, "ce3c4f5a");
      assert.equal(variationIds.integerDefaultOne, "faadbf54");
      assert.equal(variationIds.doubleDefaultPi, "5af8acc7");
      assert.equal(variationIds.double25Pi25E25Gr25Zero, "9503a1de");
      assert.equal(variationIds.keySampleText, "69ef126c");
    });

  });
}

describe("Integration tests - Wrong SDK key", () => {

  it("Auto poll with wrong SDK Key - getValueAsync() should return default value", async () => {

    const defaultValue = "NOT_CAT";
    const client: IConfigCatClient = platform().getClient("WRONG_SDK_KEY-56789012/1234567890123456789012", PollingMode.AutoPoll,
      { requestTimeoutMs: 500, maxInitWaitTimeSeconds: 1 });

    const actual: string = await client.getValueAsync("stringDefaultCat", defaultValue);
    assert.strictEqual(actual, defaultValue);

    client.dispose();
  });

  it("Manual poll with wrong SDK Key - getValueAsync() should return default value", async () => {

    const defaultValue = "NOT_CAT";
    const client: IConfigCatClient = platform().getClient("WRONG_SDK_KEY-56789012/1234567890123456789012", PollingMode.ManualPoll, { requestTimeoutMs: 500 });

    const actual: string = await client.getValueAsync("stringDefaultCat", defaultValue);
    assert.strictEqual(actual, defaultValue);
    await client.forceRefreshAsync();
    const actual2: string = await client.getValueAsync("stringDefaultCat", defaultValue);
    assert.strictEqual(actual2, defaultValue);

    client.dispose();
  });

  it("Lazy load with wrong SDK Key - getValueAsync() should return default value", async () => {

    const defaultValue = "NOT_CAT";
    const client: IConfigCatClient = platform().getClient("WRONG_SDK_KEY-56789012/1234567890123456789012", PollingMode.LazyLoad, { requestTimeoutMs: 500 });

    const actual: string = await client.getValueAsync("stringDefaultCat", defaultValue);
    assert.strictEqual(actual, defaultValue);

    client.dispose();
  });

  it("getAllKeysAsync() should not crash with wrong SDK Key", async () => {

    const client: IConfigCatClient = platform().getClient("WRONG_SDK_KEY-56789012/1234567890123456789012", PollingMode.ManualPoll, { requestTimeoutMs: 500 });

    const keys: string[] = await client.getAllKeysAsync();
    assert.equal(keys.length, 0);

    client.dispose();
  });
});

describe("Integration tests - Other cases", () => {

  it("Override - local only", async () => {
    const defaultValue = "DEFAULT_CAT";

    const overrideMap = { stringDefaultCat: "NOT_CAT" };

    const clientOverride: IConfigCatClient = platform().getClient("localonly", PollingMode.AutoPoll, {
      flagOverrides: createFlagOverridesFromMap(overrideMap, OverrideBehaviour.LocalOnly),
      logger: createConsoleLogger(LogLevel.Off),
    });
    try {
      let actual = await clientOverride.getValueAsync("stringDefaultCat", defaultValue);
      assert.strictEqual(actual, "NOT_CAT");

      overrideMap.stringDefaultCat = "ANOTHER_CAT";

      actual = await clientOverride.getValueAsync("stringDefaultCat", defaultValue);
      assert.strictEqual(actual, "NOT_CAT");
    } finally { clientOverride.dispose(); }
  });

  it("Override - local only - watch changes", async () => {
    const defaultValue = "DEFAULT_CAT";

    const overrideMap = { stringDefaultCat: "NOT_CAT" };

    const clientOverride: IConfigCatClient = platform().getClient("localonly", PollingMode.AutoPoll, {
      flagOverrides: createFlagOverridesFromMap(overrideMap, OverrideBehaviour.LocalOnly, true),
      logger: createConsoleLogger(LogLevel.Off),
    });
    try {
      let actual = await clientOverride.getValueAsync("stringDefaultCat", defaultValue);
      assert.strictEqual(actual, "NOT_CAT");

      overrideMap.stringDefaultCat = "ANOTHER_CAT";

      actual = await clientOverride.getValueAsync("stringDefaultCat", defaultValue);
      assert.strictEqual(actual, "ANOTHER_CAT");
    } finally { clientOverride.dispose(); }
  });

  it("Should include ray ID in log messages when http response is not successful", async function() {
    const fakeLogger = new FakeLogger();

    const client: IConfigCatClient = platform().getClient("configcat-sdk-1/~~~~~~~~~~~~~~~~~~~~~~/~~~~~~~~~~~~~~~~~~~~~~", PollingMode.ManualPoll, { logger: fakeLogger });

    // TODO: Remove this as soon as we update the CDN CORS settings (see also https://trello.com/c/RSGwVoqC)
    const clientVersion: string = (((client as ConfigCatClient)["options"]) as OptionsBase)["clientVersion"];
    if (clientVersion.includes("ConfigCat-UnifiedJS-Browser") || clientVersion.includes("ConfigCat-UnifiedJS-ChromiumExtension")) {
      this.skip();
    }

    await client.forceRefreshAsync();

    const errors = fakeLogger.events.filter(([, eventId]) => eventId === 1100);
    assert.strictEqual(errors.length, 1);

    const [[, , error]] = errors;
    assert.instanceOf(error, FormattableLogMessage);

    assert.strictEqual(error.argNames.length, 2);
    assert.strictEqual(error.argNames[0], "SDK_KEY");
    assert.strictEqual(error.argNames[1], "RAY_ID");

    assert.strictEqual(error.argValues.length, 2);
    const [actualSdkKey, actualRayId] = error.argValues;
    assert.equal(actualSdkKey, "***************/**********************/****************~~~~~~");
    assert.isString(actualRayId);

    expect(error.toString()).to.contain(actualRayId);

    client.dispose();
  });

});

import { assert } from "chai";
import { createAutoPollOptions, createKernel, FakeConfigFetcherWithNullNewConfig, FakeConfigFetcherWithPercentageOptionsWithinTargetingRule, FakeConfigFetcherWithTwoKeysAndRules } from "./helpers/fakes";
import { ConfigCatClient, IConfigCatClient } from "#lib/ConfigCatClient";
import { AutoPollOptions } from "#lib/ConfigCatClientOptions";

describe("ConfigCatClient", () => {
  it("getKeyAndValueAsync() works with default", async () => {
    const configCatKernel = createKernel({
      configFetcherFactory: () => new FakeConfigFetcherWithTwoKeysAndRules(),
    });
    const options: AutoPollOptions = createAutoPollOptions("APIKEY", { logger: null }, configCatKernel);
    const client: IConfigCatClient = new ConfigCatClient(options, configCatKernel);

    const result = await client.getKeyAndValueAsync("abcdefgh");
    assert.equal(result?.settingKey, "debug");
    assert.equal(result?.settingValue, "def");

    client.dispose();
  });

  it("getKeyAndValueAsync() works with rollout rules", async () => {
    const configCatKernel = createKernel({
      configFetcherFactory: () => new FakeConfigFetcherWithTwoKeysAndRules(),
    });
    const options: AutoPollOptions = createAutoPollOptions("APIKEY", { logger: null }, configCatKernel);
    const client: IConfigCatClient = new ConfigCatClient(options, configCatKernel);

    const result = await client.getKeyAndValueAsync("6ada5ff2");
    assert.equal(result?.settingKey, "debug");
    assert.equal(result?.settingValue, "value");

    client.dispose();
  });

  it("getKeyAndValueAsync() works with percentage options", async () => {
    const configCatKernel = createKernel({
      configFetcherFactory: () => new FakeConfigFetcherWithTwoKeysAndRules(),
    });
    const options: AutoPollOptions = createAutoPollOptions("APIKEY", { logger: null }, configCatKernel);
    const client: IConfigCatClient = new ConfigCatClient(options, configCatKernel);

    const result = await client.getKeyAndValueAsync("622f5d07");
    assert.equal(result?.settingKey, "debug2");
    assert.equal(result?.settingValue, "value2");

    client.dispose();
  });

  it("getKeyAndValueAsync() works with percentage options within targeting rule", async () => {
    const configCatKernel = createKernel({
      configFetcherFactory: () => new FakeConfigFetcherWithPercentageOptionsWithinTargetingRule(),
    });
    const options: AutoPollOptions = createAutoPollOptions("APIKEY", { logger: null }, configCatKernel);
    const client: IConfigCatClient = new ConfigCatClient(options, configCatKernel);

    const result = await client.getKeyAndValueAsync("622f5d07");
    assert.equal(result?.settingKey, "debug");
    assert.equal(result?.settingValue, "value2");

    client.dispose();
  });

  it("getKeyAndValueAsync() with null config", async () => {
    const configCatKernel = createKernel({
      configFetcherFactory: () => new FakeConfigFetcherWithNullNewConfig(),
    });
    const options: AutoPollOptions = createAutoPollOptions("APIKEY", { logger: null, maxInitWaitTimeSeconds: 0 }, configCatKernel);
    const client: IConfigCatClient = new ConfigCatClient(options, configCatKernel);

    const result = await client.getKeyAndValueAsync("622f5d07");
    assert.isNull(result);

    client.dispose();
  });

  it("getKeyAndValueAsync() with non-existing id", async () => {
    const configCatKernel = createKernel({
      configFetcherFactory: () => new FakeConfigFetcherWithTwoKeysAndRules(),
    });
    const options: AutoPollOptions = createAutoPollOptions("APIKEY", { logger: null }, configCatKernel);
    const client: IConfigCatClient = new ConfigCatClient(options, configCatKernel);

    const result = await client.getKeyAndValueAsync("non-exisiting");
    assert.isNull(result);

    client.dispose();
  });
});

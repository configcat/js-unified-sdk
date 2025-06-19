import { assert } from "chai";
import { createAutoPollOptions, createKernel, FakeConfigFetcherWithNullNewConfig, FakeConfigFetcherWithPercentageOptionsWithinTargetingRule, FakeConfigFetcherWithTwoKeysAndRules } from "./helpers/fakes";
import { ConfigCatClient, IConfigCatClient } from "#lib/ConfigCatClient";
import { AutoPollOptions } from "#lib/ConfigCatClientOptions";

describe("Variation ID", () => {
  for (const useSnapshot of [false, true]) {
    it(`getKeyAndValue() works with default - useSnapshot: ${useSnapshot}`, async () => {
      const configCatKernel = createKernel({
        configFetcherFactory: () => new FakeConfigFetcherWithTwoKeysAndRules(),
      });
      const options: AutoPollOptions = createAutoPollOptions("APIKEY", { logger: null }, configCatKernel);
      const client: IConfigCatClient = new ConfigCatClient(options, configCatKernel);

      await client.waitForReady();

      const result = useSnapshot
        ? client.snapshot().getKeyAndValue("abcdefgh")
        : await client.getKeyAndValueAsync("abcdefgh");

      assert.equal(result?.settingKey, "debug");
      assert.equal(result?.settingValue, "def");

      client.dispose();
    });

    it(`getKeyAndValue() works with rollout rules - useSnapshot: ${useSnapshot}`, async () => {
      const configCatKernel = createKernel({
        configFetcherFactory: () => new FakeConfigFetcherWithTwoKeysAndRules(),
      });
      const options: AutoPollOptions = createAutoPollOptions("APIKEY", { logger: null }, configCatKernel);
      const client: IConfigCatClient = new ConfigCatClient(options, configCatKernel);

      await client.waitForReady();

      const result = useSnapshot
        ? client.snapshot().getKeyAndValue("6ada5ff2")
        : await client.getKeyAndValueAsync("6ada5ff2");

      assert.equal(result?.settingKey, "debug");
      assert.equal(result?.settingValue, "value");

      client.dispose();
    });

    it(`getKeyAndValue() works with percentage options - useSnapshot: ${useSnapshot}`, async () => {
      const configCatKernel = createKernel({
        configFetcherFactory: () => new FakeConfigFetcherWithTwoKeysAndRules(),
      });
      const options: AutoPollOptions = createAutoPollOptions("APIKEY", { logger: null }, configCatKernel);
      const client: IConfigCatClient = new ConfigCatClient(options, configCatKernel);

      await client.waitForReady();

      const result = useSnapshot
        ? client.snapshot().getKeyAndValue("622f5d07")
        : await client.getKeyAndValueAsync("622f5d07");

      assert.equal(result?.settingKey, "debug2");
      assert.equal(result?.settingValue, "value2");

      client.dispose();
    });

    it(`getKeyAndValue() works with percentage options within targeting rule - useSnapshot: ${useSnapshot}`, async () => {
      const configCatKernel = createKernel({
        configFetcherFactory: () => new FakeConfigFetcherWithPercentageOptionsWithinTargetingRule(),
      });
      const options: AutoPollOptions = createAutoPollOptions("APIKEY", { logger: null }, configCatKernel);
      const client: IConfigCatClient = new ConfigCatClient(options, configCatKernel);

      await client.waitForReady();

      const result = useSnapshot
        ? client.snapshot().getKeyAndValue("622f5d07")
        : await client.getKeyAndValueAsync("622f5d07");

      assert.equal(result?.settingKey, "debug");
      assert.equal(result?.settingValue, "value2");

      client.dispose();
    });

    it(`getKeyAndValue() with null config - useSnapshot: ${useSnapshot}`, async () => {
      const configCatKernel = createKernel({
        configFetcherFactory: () => new FakeConfigFetcherWithNullNewConfig(),
      });
      const options: AutoPollOptions = createAutoPollOptions("APIKEY", { logger: null, maxInitWaitTimeSeconds: 0 }, configCatKernel);
      const client: IConfigCatClient = new ConfigCatClient(options, configCatKernel);

      await client.waitForReady();

      const result = useSnapshot
        ? client.snapshot().getKeyAndValue("622f5d07")
        : await client.getKeyAndValueAsync("622f5d07");

      assert.isNull(result);

      client.dispose();
    });

    it(`getKeyAndValue() with non-existing id - useSnapshot: ${useSnapshot}`, async () => {
      const configCatKernel = createKernel({
        configFetcherFactory: () => new FakeConfigFetcherWithTwoKeysAndRules(),
      });
      const options: AutoPollOptions = createAutoPollOptions("APIKEY", { logger: null }, configCatKernel);
      const client: IConfigCatClient = new ConfigCatClient(options, configCatKernel);

      await client.waitForReady();

      const result = useSnapshot
        ? client.snapshot().getKeyAndValue("non-exisiting")
        : await client.getKeyAndValueAsync("non-exisiting");

      assert.isNull(result);

      client.dispose();
    });
  }
});

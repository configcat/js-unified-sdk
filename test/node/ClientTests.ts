import { assert } from "chai";
import { FlagOverrides, IConfigCatClient, PollingMode } from "#lib";
import { ConfigCatClient } from "#lib/ConfigCatClient";
import { ConfigServiceBase } from "#lib/ConfigServiceBase";
import * as configcatClient from "#lib/node";
import { NodeHttpConfigFetcher } from "#lib/node/NodeHttpConfigFetcher";

describe("ConfigCatClient tests", () => {

  for (const pollingMode of [PollingMode.AutoPoll, PollingMode.LazyLoad, PollingMode.ManualPoll]) {
    it(`getClient() should createInstance with ${PollingMode[pollingMode]}`, () => {

      const client: IConfigCatClient = configcatClient.getClient("SDKKEY-890123456789012/1234567890123456789012", pollingMode);

      assert.isDefined(client);

      client.dispose();
    });

    it(`getClient() should set proxy - ${PollingMode[pollingMode]}`, () => {
      const proxy = "http://fake-proxy.com:8080";

      const client: IConfigCatClient = configcatClient.getClient("SDKKEY-890123456789012/1234567890123456789012", pollingMode, {
        proxy,
      });

      assert.isDefined(client);

      const configService = (client as ConfigCatClient)["configService"];
      if (!(configService instanceof ConfigServiceBase)) assert.fail();

      const configFetcher = configService["configFetcher"];
      assert.instanceOf(configFetcher, NodeHttpConfigFetcher);

      assert.strictEqual(configFetcher["proxy"], proxy);

      client.dispose();
    });
  }

  it("createFlagOverridesFromMap() should createOverrides", () => {

    const overrides: FlagOverrides = configcatClient.createFlagOverridesFromMap({ test: true }, configcatClient.OverrideBehaviour.LocalOnly);

    assert.isDefined(overrides);
  });
});

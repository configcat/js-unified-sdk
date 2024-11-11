import { assert } from "chai";
import { FlagOverrides, IConfigCatClient, PollingMode } from "#lib";
import * as configcatClient from "#lib/deno";

describe("ConfigCatClient tests", () => {

  for (const pollingMode of [PollingMode.AutoPoll, PollingMode.LazyLoad, PollingMode.ManualPoll]) {
    it(`getClient() should createInstance with ${PollingMode[pollingMode]}`, () => {

      const client: IConfigCatClient = configcatClient.getClient("SDKKEY-890123456789012/1234567890123456789012", pollingMode);

      assert.isDefined(client);

      client.dispose();
    });
  }

  it("createFlagOverridesFromMap() should createOverrides", () => {

    const overrides: FlagOverrides = configcatClient.createFlagOverridesFromMap({ test: true }, configcatClient.OverrideBehaviour.LocalOnly);

    assert.isDefined(overrides);
  });
});

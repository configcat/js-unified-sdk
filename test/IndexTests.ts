import { assert } from "chai";
import { createKernel, FakeConfigFetcher } from "./helpers/fakes";
import { PollingMode } from "#lib";
import { IConfigCatClient } from "#lib/ConfigCatClient";
import * as configcatClient from "#lib/index.pubternals";

describe("ConfigCatClient index (main)", () => {

  it("getClient ShouldCreateInstance - AutoPoll", () => {

    const configCatKernel = createKernel({ configFetcherFactory: () => new FakeConfigFetcher() });
    const client: IConfigCatClient = configcatClient.getClient("SDKKEY-890123456789012/1234567890123456789012", PollingMode.AutoPoll, void 0, configCatKernel);

    try {
      assert.isDefined(client);
    } finally {
      client.dispose();
    }
  });

  it("getClient ShouldCreateInstance - LazyLoad", () => {

    const configCatKernel = createKernel({ configFetcherFactory: () => new FakeConfigFetcher() });
    const client: IConfigCatClient = configcatClient.getClient("SDKKEY-890123456789012/1234567890123456789012", PollingMode.LazyLoad, void 0, configCatKernel);

    try {
      assert.isDefined(client);
    } finally {
      client.dispose();
    }
  });

  it("getClient ShouldCreateInstance - ManualPoll", () => {

    const configCatKernel = createKernel({ configFetcherFactory: () => new FakeConfigFetcher() });
    const client: IConfigCatClient = configcatClient.getClient("SDKKEY-890123456789012/1234567890123456789012", PollingMode.ManualPoll, void 0, configCatKernel);

    try {
      assert.isDefined(client);
    } finally {
      client.dispose();
    }
  });
});

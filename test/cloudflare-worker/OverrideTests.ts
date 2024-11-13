import type * as cloudflare from "@cloudflare/workers-types";
import { assert } from "chai";
import { FakeConfigFetcherBase, createAutoPollOptions, createKernel } from "../helpers/fakes";
import { createFlagOverridesFromQueryParams } from "#lib/cloudflare-worker";
import { ConfigCatClient, IConfigCatClient } from "#lib/ConfigCatClient";
import { AutoPollOptions } from "#lib/ConfigCatClientOptions";
import { IQueryStringProvider, OverrideBehaviour } from "#lib/FlagOverrides";

// eslint-disable-next-line @typescript-eslint/naming-convention
declare const Request: typeof cloudflare.Request;

describe("Flag Overrides (Cloudflare Workers)", () => {
  it("Values from query string - using request", async () => {
    const configCatKernel = createKernel({
      configFetcher: new FakeConfigFetcherBase('{"f":{"stringDefaultCat":{"t":1,"v":{"s":"CAT"}},"stringDefaultDog":{"t":1,"v":{"s":"DOG"}}}}'),
    });

    const currentQueryString = "?cc-stringDefaultCat=OVERRIDE_CAT&stringDefaultDog=OVERRIDE_DOG";
    const request = new Request("http://dummy/" + currentQueryString);

    const options: AutoPollOptions = createAutoPollOptions("localhost", {
      flagOverrides: createFlagOverridesFromQueryParams(OverrideBehaviour.LocalOverRemote, request, void 0),
    }, configCatKernel);
    const client: IConfigCatClient = new ConfigCatClient(options, configCatKernel);

    assert.equal(await client.getValueAsync("stringDefaultCat", ""), "OVERRIDE_CAT");
    assert.equal(await client.getValueAsync("stringDefaultDog", ""), "DOG");

    client.dispose();
  });

  it("Values from query string - using custom query string provider", async () => {
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
});

import { assert, expect } from "chai";
import { FakeConfigFetcherWithTwoKeys, FakeLogger } from "./helpers/fakes";
import { platform } from "./helpers/platform";
import { FetchRequest, FetchResponse, FormattableLogMessage, IConfigCatConfigFetcher } from "#lib";
import { ConfigCatClient } from "#lib/ConfigCatClient";
import { OptionsBase } from "#lib/ConfigCatClientOptions";

describe("ConfigCatConfigFetcherTests", () => {

  it("Custom config fetcher - Success", async () => {
    // Arrange

    const configJson = FakeConfigFetcherWithTwoKeys.configJson;

    const eTag = "\"abc\"";
    const responseHeaders: [string, string][] = [
      ["CF-RAY", "CF-12345"],
      ["ETag", eTag],
    ];

    const configFetcherRequests: FetchRequest[] = [];
    const configFetcher = new class implements IConfigCatConfigFetcher {
      fetchAsync(request: FetchRequest) {
        configFetcherRequests.push(request);
        return Promise.resolve(new FetchResponse(200, "OK", responseHeaders, configJson));
      }
    }();

    const client = platform().createClientWithManualPoll(
      "test-ccf-s-23456789012/1234567890123456789012",
      { configFetcher }
    );

    // Act

    await client.forceRefreshAsync();
    let value = await client.getValueAsync("debug", false);

    assert.strictEqual(value, true);

    assert.strictEqual(configFetcherRequests.length, 1);
    assert.isUndefined(configFetcherRequests[0].lastETag);

    await client.forceRefreshAsync();
    value = await client.getValueAsync("debug", false);

    // Assert

    assert.strictEqual(value, true);

    assert.strictEqual(configFetcherRequests.length, 2);
    assert.strictEqual(configFetcherRequests[1].lastETag, eTag);
  });

  it("Custom config fetcher - Failure", async () => {
    // Arrange

    const fakeLogger = new FakeLogger();

    const rayId = "CF-12345";
    const responseHeaders: [string, string][] = [
      ["CF-RAY", rayId],
    ];

    const configFetcherRequests: FetchRequest[] = [];
    const configFetcher = new class implements IConfigCatConfigFetcher {
      fetchAsync(request: FetchRequest) {
        configFetcherRequests.push(request);
        return Promise.resolve(new FetchResponse(403, "Forbidden", responseHeaders));
      }
    }();

    const client = platform().createClientWithManualPoll(
      "test-ccf-f-23456789012/1234567890123456789012",
      { configFetcher, logger: fakeLogger }
    );

    // Act

    await client.forceRefreshAsync();
    const value = await client.getValueAsync("debug", false);

    // Assert

    assert.strictEqual(value, false);

    assert.strictEqual(configFetcherRequests.length, 1);
    assert.isUndefined(configFetcherRequests[0].lastETag);

    // TODO: Remove this as soon as we update the CDN CORS settings (see also https://trello.com/c/RSGwVoqC)
    const clientVersion: string = (((client as ConfigCatClient)["options"]) as OptionsBase)["clientVersion"];
    if (clientVersion.includes("ConfigCat-UnifiedJS-Browser") || clientVersion.includes("ConfigCat-UnifiedJS-ChromiumExtension")) {
      return;
    }

    const errors = fakeLogger.events.filter(([, eventId]) => eventId === 1100);
    assert.strictEqual(errors.length, 1);

    const [[, , error]] = errors;
    assert.instanceOf(error, FormattableLogMessage);

    assert.strictEqual(error.argNames.length, 1);
    assert.strictEqual(error.argNames[0], "RAY_ID");

    assert.strictEqual(error.argValues.length, 1);
    assert.strictEqual(error.argValues[0], rayId);

    expect(error.toString()).to.contain(rayId);
  });

});

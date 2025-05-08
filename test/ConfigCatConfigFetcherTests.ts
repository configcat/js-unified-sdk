import { assert } from "chai";
import { FakeConfigFetcherWithTwoKeys, FakeLogger } from "./helpers/fakes";
import { platform } from "./helpers/platform";
import { FetchRequest, FetchResponse, IConfigCatConfigFetcher } from "#lib";

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
      "test-67890123456789012/1234567890123456789012",
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

    const responseHeaders: [string, string][] = [
      ["CF-RAY", "CF-12345"],
    ];

    const configFetcherRequests: FetchRequest[] = [];
    const configFetcher = new class implements IConfigCatConfigFetcher {
      fetchAsync(request: FetchRequest) {
        configFetcherRequests.push(request);
        return Promise.resolve(new FetchResponse(403, "Forbidden", responseHeaders));
      }
    }();

    const client = platform().createClientWithManualPoll(
      "test-67890123456789012/1234567890123456789012",
      { configFetcher, logger: fakeLogger }
    );

    // Act

    await client.forceRefreshAsync();
    const value = await client.getValueAsync("debug", false);

    // Assert

    assert.strictEqual(value, false);

    assert.strictEqual(configFetcherRequests.length, 1);
    assert.isUndefined(configFetcherRequests[0].lastETag);

    const errors = fakeLogger.events.filter(([, eventId]) => eventId === 1100);
    assert.strictEqual(errors.length, 1);
  });

});

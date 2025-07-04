import { assert } from "chai";
import fetchMock from "fetch-mock";
import { FakeLogger } from "../helpers/fakes";
import { platform } from ".";
import { LogLevel, RefreshErrorCode } from "#lib";
import { getMonotonicTimeMs } from "#lib/Utils";

describe("HTTP tests", () => {
  const sdkKey = "PKDVCLf-Hq-h-kCzMp-L7Q/psuH7BGHoUmdONrzzUOY7A";
  const baseUrl = "https://cdn-global.test.com";

  if (typeof AbortController !== "undefined") {
    it("HTTP timeout", async () => {
      const requestTimeoutMs = 1500;

      fetchMock.get(url => url.startsWith(baseUrl),
        new Promise(resolve => setTimeout(() => resolve({ throws: new Error("Test failed.") }), requestTimeoutMs * 2)));

      try {
        const logger = new FakeLogger();

        const client = platform.createClientWithManualPoll(sdkKey, {
          requestTimeoutMs,
          baseUrl,
          logger,
        });
        const startTime = getMonotonicTimeMs();
        const refreshResult = await client.forceRefreshAsync();
        const duration = getMonotonicTimeMs() - startTime;
        assert.isTrue(duration > 1000 && duration < 2000);

        const defaultValue = "NOT_CAT";
        assert.strictEqual(defaultValue, await client.getValueAsync("stringDefaultCat", defaultValue));

        assert.strictEqual(refreshResult.errorCode, RefreshErrorCode.HttpRequestTimeout);
        assert.isDefined(logger.events.find(([level, , msg]) => level === LogLevel.Error && msg.toString().startsWith("Request timed out while trying to fetch config JSON.")));

        client.dispose();
      } finally {
        fetchMock.reset();
      }
    });
  }

  it("404 Not found", async () => {
    fetchMock.get(url => url.startsWith(baseUrl), 404);

    try {
      const logger = new FakeLogger();

      const client = platform.createClientWithManualPoll(sdkKey, {
        requestTimeoutMs: 1000,
        baseUrl,
        logger,
      });

      const refreshResult = await client.forceRefreshAsync();

      const defaultValue = "NOT_CAT";
      assert.strictEqual(defaultValue, await client.getValueAsync("stringDefaultCat", defaultValue));

      assert.strictEqual(refreshResult.errorCode, RefreshErrorCode.InvalidSdkKey);
      assert.isDefined(logger.events.find(([level, , msg]) => level === LogLevel.Error && msg.toString().startsWith("Your SDK Key seems to be wrong:")));

      client.dispose();
    } finally {
      fetchMock.reset();
    }
  });

  it("Unexpected status code", async () => {
    fetchMock.get(url => url.startsWith(baseUrl), 502);

    try {
      const logger = new FakeLogger();

      const client = platform.createClientWithManualPoll(sdkKey, {
        requestTimeoutMs: 1000,
        baseUrl,
        logger,
      });

      const refreshResult = await client.forceRefreshAsync();

      const defaultValue = "NOT_CAT";
      assert.strictEqual(defaultValue, await client.getValueAsync("stringDefaultCat", defaultValue));

      assert.strictEqual(refreshResult.errorCode, RefreshErrorCode.UnexpectedHttpResponse);
      assert.isDefined(logger.events.find(([level, , msg]) => level === LogLevel.Error && msg.toString().startsWith("Unexpected HTTP response was received while trying to fetch config JSON:")));

      client.dispose();
    } finally {
      fetchMock.reset();
    }
  });

  it("Unexpected error", async () => {
    fetchMock.get(url => url.startsWith(baseUrl),
      { throws: new Error("Connection error.") });

    try {
      const logger = new FakeLogger();

      const client = platform.createClientWithManualPoll(sdkKey, {
        requestTimeoutMs: 1000,
        baseUrl,
        logger,
      });

      const refreshResult = await client.forceRefreshAsync();

      const defaultValue = "NOT_CAT";
      assert.strictEqual(defaultValue, await client.getValueAsync("stringDefaultCat", defaultValue));

      assert.strictEqual(refreshResult.errorCode, RefreshErrorCode.HttpRequestFailure);
      assert.isDefined(logger.events.find(([level, , msg]) => level === LogLevel.Error && msg.toString().startsWith("Unexpected error occurred while trying to fetch config JSON.")));

      client.dispose();
    } finally {
      fetchMock.reset();
    }
  });
});

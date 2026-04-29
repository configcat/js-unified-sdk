import { assert } from "chai";
import fetchMock from "npm:fetch-mock";
import { FakeLogger } from "../helpers/fakes";
import { platform } from "../helpers/platform";
import { LogLevel, RefreshErrorCode } from "#lib";
import { getMonotonicTimeMs } from "#lib/Utils";

const denoVersionComponents = Deno.version.deno.split(".");
const denoMajorVersion = Number(denoVersionComponents[0]);
const denoMinorVersion = Number(denoVersionComponents[1]);

if (denoMajorVersion >= 2 || denoMajorVersion === 1 && denoMinorVersion >= 38) {
  describe("HTTP tests", () => {
    const sdkKey = "PKDVCLf-Hq-h-kCzMp-L7Q/psuH7BGHoUmdONrzzUOY7A";
    const baseUrl = "https://cdn-global.test.com";

    it("HTTP timeout", async () => {
      const requestTimeoutMs = 750;

      let requestCount = 0;

      fetchMock.get(
        url => url.startsWith(baseUrl),
        () => (++requestCount, new Promise(resolve => setTimeout(() => resolve({ throws: new Error("Test failed.") }), requestTimeoutMs * 4)))
      );

      try {
        const logger = new FakeLogger(LogLevel.Debug);

        const client = platform().createClientWithManualPoll(sdkKey, {
          requestTimeoutMs,
          baseUrl,
          logger,
        });
        const startTime = getMonotonicTimeMs();
        const refreshResult = await client.forceRefreshAsync();
        const duration = getMonotonicTimeMs() - startTime;
        // NOTE: Elapsed time is expected to be twice as `requestTimeoutMs` due to retry.
        assert.isTrue(duration > 1000 && duration < 2000);

        const defaultValue = "NOT_CAT";
        assert.strictEqual(defaultValue, await client.getValueAsync("stringDefaultCat", defaultValue));

        assert.strictEqual(refreshResult.errorCode, RefreshErrorCode.HttpRequestTimeout);
        assert.isDefined(logger.events.find(([level, , msg]) => level === LogLevel.Error && msg.toString().startsWith("Request timed out while trying to fetch config JSON.")));

        assert.strictEqual(requestCount, 2);

        client.dispose();
      } finally {
        fetchMock.reset();
      }
    });

    it("404 Not found", async () => {
      let requestCount = 0;

      fetchMock.get(
        url => url.startsWith(baseUrl),
        () => (++requestCount, 404)
      );

      try {
        const logger = new FakeLogger(LogLevel.Debug);

        const client = platform().createClientWithManualPoll(sdkKey, {
          requestTimeoutMs: 1000,
          baseUrl,
          logger,
        });

        const refreshResult = await client.forceRefreshAsync();

        const defaultValue = "NOT_CAT";
        assert.strictEqual(defaultValue, await client.getValueAsync("stringDefaultCat", defaultValue));

        assert.strictEqual(refreshResult.errorCode, RefreshErrorCode.InvalidSdkKey);
        assert.isDefined(logger.events.find(([level, , msg]) => level === LogLevel.Error && msg.toString().startsWith("Your SDK Key seems to be wrong:")));

        assert.strictEqual(requestCount, 1);

        client.dispose();
      } finally {
        fetchMock.reset();
      }
    });

    it("Unexpected status code", async () => {
      let requestCount = 0;

      fetchMock.get(
        url => url.startsWith(baseUrl),
        () => (++requestCount, 502)
      );

      try {
        const logger = new FakeLogger(LogLevel.Debug);

        const client = platform().createClientWithManualPoll(sdkKey, {
          requestTimeoutMs: 1000,
          baseUrl,
          logger,
        });

        const refreshResult = await client.forceRefreshAsync();

        const defaultValue = "NOT_CAT";
        assert.strictEqual(defaultValue, await client.getValueAsync("stringDefaultCat", defaultValue));

        assert.strictEqual(refreshResult.errorCode, RefreshErrorCode.UnexpectedHttpResponse);
        assert.isDefined(logger.events.find(([level, , msg]) => level === LogLevel.Error && msg.toString().startsWith("Unexpected HTTP response was received while trying to fetch config JSON:")));

        assert.strictEqual(requestCount, 2);

        client.dispose();
      } finally {
        fetchMock.reset();
      }
    });

    it("Unexpected error", async () => {
      let requestCount = 0;

      fetchMock.get(
        url => url.startsWith(baseUrl),
        () => (++requestCount, { throws: new Error("Connection error.") })
      );

      try {
        const logger = new FakeLogger(LogLevel.Debug);

        const client = platform().createClientWithManualPoll(sdkKey, {
          requestTimeoutMs: 1000,
          baseUrl,
          logger,
        });

        const refreshResult = await client.forceRefreshAsync();

        const defaultValue = "NOT_CAT";
        assert.strictEqual(defaultValue, await client.getValueAsync("stringDefaultCat", defaultValue));

        assert.strictEqual(refreshResult.errorCode, RefreshErrorCode.HttpRequestFailure);
        assert.isDefined(logger.events.find(([level, , msg]) => level === LogLevel.Error && msg.toString().startsWith("Unexpected error occurred while trying to fetch config JSON.")));

        assert.strictEqual(requestCount, 2);

        client.dispose();
      } finally {
        fetchMock.reset();
      }
    });

    // NOTE: For Deno, we skip the "Abort on dispose" test case as it fails with some weird "Uncaught (in promise)"
    // error. This is probably related to the test runner (mocha) or fetch-mock because the test works as expected
    // in a standalone console application.
  });
}

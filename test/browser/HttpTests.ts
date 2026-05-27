import { assert } from "chai";
import * as mockxmlhttprequest from "mock-xmlhttprequest";
import { FakeLogger } from "../helpers/fakes";
import { platform } from ".";
import { LogLevel, RefreshErrorCode } from "#lib";
import { delay, errorToString, getMonotonicTimeMs } from "#lib/Utils";

describe("HTTP tests", () => {
  const sdkKey = "configcat-sdk-1/PKDVCLf-Hq-h-kCzMp-L7Q/AG6C1ngVb0CvM07un6JisQ";
  const baseUrl = "https://cdn-global.test.com";

  it("HTTP timeout", async () => {
    const requestTimeoutMs = 750;

    let requestCount = 0;

    const server = mockxmlhttprequest.newServer({
      get: [
        url => url.startsWith(baseUrl),
        request => (++requestCount, setTimeout(() => request.setRequestTimeout(), requestTimeoutMs)),
      ],
    });

    try {
      server.install(window);

      const logger = new FakeLogger(LogLevel.Debug);

      const client = platform.createClientWithManualPoll(sdkKey, {
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
      server.remove();
    }
  });

  it("404 Not found", async () => {
    let requestCount = 0;

    const server = mockxmlhttprequest.newServer({
      get: [
        url => url.startsWith(baseUrl),
        request => (++requestCount, request.setResponseHeaders(404, null, "Not Found"), request.setResponseBody()),
      ],
    });

    try {
      server.install(window);

      const logger = new FakeLogger(LogLevel.Debug);

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

      assert.strictEqual(requestCount, 1);

      client.dispose();
    } finally {
      server.remove();
    }
  });

  it("Unexpected status code", async () => {
    let requestCount = 0;

    const server = mockxmlhttprequest.newServer({
      get: [
        url => url.startsWith(baseUrl),
        request => (++requestCount, request.setResponseHeaders(502, null, "Bad Gateway"), request.setResponseBody()),
      ],
    });

    try {
      server.install(window);

      const logger = new FakeLogger(LogLevel.Debug);

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

      assert.strictEqual(requestCount, 2);

      client.dispose();
    } finally {
      server.remove();
    }
  });

  it("Unexpected error", async () => {
    let requestCount = 0;

    const server = mockxmlhttprequest.newServer({
      get: [
        url => url.startsWith(baseUrl),
        request => (++requestCount, request.setNetworkError()),
      ],
    });

    try {
      server.install(window);

      const logger = new FakeLogger(LogLevel.Debug);

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

      assert.strictEqual(requestCount, 2);

      client.dispose();
    } finally {
      server.remove();
    }
  });

  it("Abort on dispose", async () => {
    const delayMs = 250;

    let requestCount = 0;

    const server = mockxmlhttprequest.newServer({
      get: [
        url => url.startsWith(baseUrl),
        request => {
          ++requestCount;
          delay(delayMs).then(() => {
            request.setResponseHeaders(502, null, "Bad Gateway");
            request.setResponseBody();
          });
        },
      ],
    });

    try {
      server.install(window);

      const logger = new FakeLogger(LogLevel.Debug);

      const client = platform.createClientWithManualPoll(sdkKey, {
        requestTimeoutMs: 1000,
        baseUrl,
        logger,
      });

      const forceRefreshPromise = client.forceRefreshAsync();
      await delay(delayMs / 5);
      client.dispose();
      const refreshResult = await forceRefreshPromise;

      assert.strictEqual(refreshResult.errorCode, RefreshErrorCode.UnexpectedError);
      assert.include(refreshResult.errorMessage?.toString(), "Request was aborted.");
      assert.isDefined(logger.events.find(([level, eventId, , err]) => level === LogLevel.Error && eventId === 1003 && errorToString(err).includes("Request was aborted.")));

      assert.strictEqual(requestCount, 1);
    } finally {
      server.remove();
    }
  });
});

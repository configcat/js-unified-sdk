import { assert } from "chai";
import type { ClientRequestArgs } from "http";
import * as https from "https";
import * as mockttp from "mockttp";
import type { Duplex } from "stream";
import { FakeLogger } from "../helpers/fakes";
import { platform } from ".";
import { LogLevel, RefreshErrorCode } from "#lib";
import { delay, errorToString, getMonotonicTimeMs } from "#lib/Utils";

// If the tests are failing with strange https or proxy errors, it is most likely that the local .key and .pem files are expired.
// You can regenerate them anytime (./test/cert/regenerate.md).
describe("HTTP tests", () => {
  let server: mockttp.Mockttp;
  const sdkKey = "PKDVCLf-Hq-h-kCzMp-L7Q/psuH7BGHoUmdONrzzUOY7A";

  beforeEach(async () => {
    server = mockttp.getLocal({
      https: {
        keyPath: "./test/node/cert/testCA.key",
        certPath: "./test/node/cert/testCA.pem",
      },
    });
    await server.start();
  });
  afterEach(() => server.stop());

  it("HTTP timeout", async () => {
    let requestCount = 0;

    server.forAnyRequest()
      .matching(() => (++requestCount, true))
      .thenTimeout();

    const logger = new FakeLogger(LogLevel.Debug);

    const client = platform.createClientWithManualPoll(sdkKey, {
      requestTimeoutMs: 750,
      baseUrl: server.url,
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
  });

  it("404 Not found", async () => {
    let requestCount = 0;

    server.forAnyRequest()
      .matching(() => (++requestCount, true))
      .thenReply(404, "Not Found");

    const logger = new FakeLogger(LogLevel.Debug);

    const client = platform.createClientWithManualPoll(sdkKey, {
      requestTimeoutMs: 1000,
      baseUrl: server.url,
      logger,
    });

    const refreshResult = await client.forceRefreshAsync();

    const defaultValue = "NOT_CAT";
    assert.strictEqual(defaultValue, await client.getValueAsync("stringDefaultCat", defaultValue));

    assert.strictEqual(refreshResult.errorCode, RefreshErrorCode.InvalidSdkKey);
    assert.isDefined(logger.events.find(([level, , msg]) => level === LogLevel.Error && msg.toString().startsWith("Your SDK Key seems to be wrong:")));

    assert.strictEqual(requestCount, 1);

    client.dispose();
  });

  it("Unexpected status code", async () => {
    let requestCount = 0;

    server.forAnyRequest()
      .matching(() => (++requestCount, true))
      .thenReply(502, "Bad Gateway");

    const logger = new FakeLogger(LogLevel.Debug);

    const client = platform.createClientWithManualPoll(sdkKey, {
      requestTimeoutMs: 1000,
      baseUrl: server.url,
      logger,
    });

    const refreshResult = await client.forceRefreshAsync();

    const defaultValue = "NOT_CAT";
    assert.strictEqual(defaultValue, await client.getValueAsync("stringDefaultCat", defaultValue));

    assert.strictEqual(refreshResult.errorCode, RefreshErrorCode.UnexpectedHttpResponse);
    assert.isDefined(logger.events.find(([level, , msg]) => level === LogLevel.Error && msg.toString().startsWith("Unexpected HTTP response was received while trying to fetch config JSON:")));

    assert.strictEqual(requestCount, 2);

    client.dispose();
  });

  it("Unexpected error", async () => {
    let requestCount = 0;

    server.forAnyRequest()
      .matching(() => (++requestCount, true))
      .thenCloseConnection();

    const logger = new FakeLogger(LogLevel.Debug);

    const client = platform.createClientWithManualPoll(sdkKey, {
      requestTimeoutMs: 1000,
      baseUrl: server.url,
      logger,
    });

    const refreshResult = await client.forceRefreshAsync();

    const defaultValue = "NOT_CAT";
    assert.strictEqual(defaultValue, await client.getValueAsync("stringDefaultCat", defaultValue));

    assert.strictEqual(refreshResult.errorCode, RefreshErrorCode.HttpRequestFailure);
    assert.isDefined(logger.events.find(([level, , msg]) => level === LogLevel.Error && msg.toString().startsWith("Unexpected error occurred while trying to fetch config JSON.")));

    assert.strictEqual(requestCount, 2);

    client.dispose();
  });

  for (const useAgentFactory of [false, true]) {
    it(`HTTP proxy ${useAgentFactory ? "with" : "without"} agent factory`, async () => {
      let proxyCallCount = 0;

      server.forAnyRequest().forHost("cdn-global.configcat.com:443").thenPassThrough({
        beforeRequest: (_: any) => {
          proxyCallCount++;
        },
      });

      const client = platform.createClientWithManualPoll(sdkKey, {
        httpsAgent: !useAgentFactory ? new MockttpProxyAgent(server.url) : void 0,
        httpsAgentFactory: useAgentFactory ? () => new MockttpProxyAgent(server.url) : void 0,
      });

      const refreshResult = await client.forceRefreshAsync();
      assert.strictEqual(proxyCallCount, 1);

      const defaultValue = "NOT_CAT";
      assert.strictEqual("Cat", await client.getValueAsync("stringDefaultCat", defaultValue));

      assert.strictEqual(refreshResult.errorCode, RefreshErrorCode.None);

      await client.forceRefreshAsync();
      assert.strictEqual(proxyCallCount, 2);

      client.dispose();
    });
  }

  it("Abort on dispose", async () => {
    const delayMs = 250;

    let requestCount = 0;

    server.forAnyRequest()
      .matching(() => (++requestCount, true))
      .thenCallback(async () => {
        await delay(delayMs);
        return { statusCode: 200, statusMessage: "OK", body: "{}" };
      });

    const logger = new FakeLogger(LogLevel.Debug);

    const client = platform.createClientWithManualPoll(sdkKey, {
      requestTimeoutMs: 1000,
      baseUrl: server.url,
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
  });
});

// NOTE: We need to augment the https.Agent type as some necessary methods are not defined in `@types/node`.
declare module "https" {
  interface Agent {
    createConnection(options: ClientRequestArgs, callback?: Function): Duplex;
  }
}

class MockttpProxyAgent extends https.Agent {
  private readonly proxyUrl: URL;

  constructor(proxyUrl: string) {
    super();
    this.proxyUrl = new URL(proxyUrl);
  }

  override createConnection(options: ClientRequestArgs, callback?: Function): Duplex {
    const proxyOptions = {
      ...options,
      host: this.proxyUrl.hostname,
      port: this.proxyUrl.port || 443,
      headers: {
        ...options?.headers,
        ["Host"]: `${options.host}:${options.port}`,
      },
    };

    return super.createConnection(proxyOptions, callback);
  }
}

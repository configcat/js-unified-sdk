import { assert } from "chai";
import type { ClientRequestArgs } from "http";
import * as https from "https";
import * as mockttp from "mockttp";
import type { Duplex } from "stream";
import { FakeLogger } from "../helpers/fakes";
import { platform } from ".";
import { LogLevel, RefreshErrorCode } from "#lib";
import { getMonotonicTimeMs, throwError } from "#lib/Utils";

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
    server.forAnyRequest().thenTimeout();

    const logger = new FakeLogger();

    const client = platform.createClientWithManualPoll(sdkKey, {
      requestTimeoutMs: 1000,
      baseUrl: server.url,
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
  });

  it("404 Not found", async () => {
    server.forAnyRequest().thenReply(404, "Not Found");

    const logger = new FakeLogger();

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

    client.dispose();
  });

  it("Unexpected status code", async () => {
    server.forAnyRequest().thenReply(502, "Bad Gateway");

    const logger = new FakeLogger();

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

    client.dispose();
  });

  it("Unexpected error", async () => {
    server.forAnyRequest().thenCloseConnection();

    const logger = new FakeLogger();

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

    client.dispose();
  });

  it("HTTP proxy", async () => {
    let agentProviderCallCount = 0;
    let proxyCallCount = 0;

    server.forAnyRequest().forHost("cdn-global.configcat.com:443").thenPassThrough({
      beforeRequest: (_: any) => {
        proxyCallCount++;
      },
    });

    const client = platform.createClientWithManualPoll(sdkKey, {
      httpsAgent: new MockttpProxyAgent(server.url)
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

  createConnection(options: ClientRequestArgs, callback: Function): Duplex {
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

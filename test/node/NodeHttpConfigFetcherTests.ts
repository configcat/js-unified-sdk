import { assert } from "chai";
import { EventEmitter } from "events";
import * as http from "http";
import * as https from "https";
import type * as net from "net";
import * as stream from "stream";
import { FakeLogger } from "../helpers/fakes";
import { platform } from ".";
import { FetchError, FetchRequest, FetchResponse, LogLevel } from "#lib";
import { LoggerWrapper } from "#lib/ConfigCatLogger";
import { CONFIGCAT_USER_AGENT_HEADER_NAME, getRequestHeaders } from "#lib/ConfigFetcher";
import { NodeHttpConfigFetcher } from "#lib/node";
import { delay, isArray } from "#lib/Utils";

const testSdkKey = "configcat-sdk-1/PKDVCLf-Hq-h-kCzMp-L7Q/u28_1qNyZ0Wz-ldYHIU7-g";
const testETag = "W/\"123\"";

describe("NodeHttpConfigFetcher tests", () => {
  for (const [runParallel, useHttps] of <[boolean, boolean][]>[
    [false, false],
    [false, true],
    [true, false],
    [true, true],
  ]) {
    it(`Should reuse internally managed agent on expected response - runParallel: ${runParallel} | useHttps: ${useHttps}`, async () => {
      // Arrange

      const timeoutMs = 15_000;

      const logger = new LoggerWrapper(new FakeLogger(LogLevel.Debug));

      const capturedParams: [FakeHttpAgent, timeoutMs: number | undefined][] = [];
      let agentFactoryCallCount = 0;

      const onRequest: FakeAgentOnRequest = function(options) {
        capturedParams.push([this, options.timeout]);
        return [{ statusCode: 304, statusMessage: "Not Modified", headers: { etag: testETag } }];
      };

      const configFetcher = new NodeHttpConfigFetcher(useHttps
        ? { httpsAgentFactory: () => (++agentFactoryCallCount, new FakeHttpsAgent(onRequest)) }
        : { httpAgentFactory: () => (++agentFactoryCallCount, new FakeHttpAgent(onRequest)) }
      );

      const options = platform.createManualPollOptions(testSdkKey);
      let requestUrl = options.getUrl();
      requestUrl = (useHttps ? "https" : "http") + requestUrl.substring(requestUrl.indexOf("://"));

      const fetchRequest = new FetchRequest(requestUrl, testETag, [], timeoutMs);

      // Act

      if (runParallel) {
        await Promise.all([
          configFetcher["fetchInternalAsync"](fetchRequest, logger),
          configFetcher["fetchInternalAsync"](fetchRequest, logger),
        ]);
      } else {
        await configFetcher["fetchInternalAsync"](fetchRequest, logger);
        await configFetcher["fetchInternalAsync"](fetchRequest, logger);
      }

      configFetcher.dispose();

      // Assert

      assert.strictEqual(capturedParams.length, 2);

      const [[agent1, timeoutMs1], [agent2, timeoutMs2]] = capturedParams;

      assert.strictEqual(agent2, agent1);
      assert.strictEqual(timeoutMs1, timeoutMs);
      assert.strictEqual(timeoutMs2, timeoutMs);

      assert.strictEqual(agentFactoryCallCount, 1);
    });
  }

  for (const [testCase, useHttps] of <["408" | "timeout" | "error", boolean][]>[
    ["408", false],
    ["408", true],
    ["timeout", false],
    ["timeout", true],
    ["error", false],
    ["error", true],
  ]) {
    it(`Should renew internally managed agent when response on unexpected response or failure - case: ${testCase} | useHttps: ${useHttps}`, async () => {
      // Arrange

      const timeoutMs = 500;

      const logger = new LoggerWrapper(new FakeLogger(LogLevel.Debug));

      const capturedParams: [FakeHttpAgent, timeoutMs: number | undefined][] = [];
      let agentFactoryCallCount = 0;

      let onRequest: FakeAgentOnRequest;
      switch (testCase) {
        case "408":
          onRequest = function(options) {
            capturedParams.push([this, options.timeout]);
            return [{ statusCode: 408, statusMessage: "Request Timeout" }];
          };
          break;
        case "timeout":
          onRequest = function(options) {
            capturedParams.push([this, options.timeout]);
            return ["timeout", timeoutMs];
          };
          break;
        case "error":
          onRequest = function(options) {
            capturedParams.push([this, options.timeout]);
            return ["error"];
          };
          break;
      }

      const configFetcher = new NodeHttpConfigFetcher(useHttps
        ? { httpsAgentFactory: () => (++agentFactoryCallCount, new FakeHttpsAgent(onRequest)) }
        : { httpAgentFactory: () => (++agentFactoryCallCount, new FakeHttpAgent(onRequest)) }
      );

      const options = platform.createManualPollOptions(testSdkKey);
      let requestUrl = options.getUrl();
      requestUrl = (useHttps ? "https" : "http") + requestUrl.substring(requestUrl.indexOf("://"));

      const fetchRequest = new FetchRequest(requestUrl, testETag, [], timeoutMs);

      // Act

      let fetchResponse: FetchResponse | undefined;
      let fetchError: FetchError | undefined;
      try {
        fetchResponse = await configFetcher["fetchInternalAsync"](fetchRequest, logger);
      } catch (err) {
        if (!(err instanceof FetchError)) {
          throw err;
        }
        fetchError = err;
      }

      configFetcher.dispose();

      // Assert

      switch (testCase) {
        case "408":
          assert.isDefined(fetchResponse);
          assert.equal(fetchResponse.statusCode, 408);
          break;
        case "timeout":
          assert.isDefined(fetchError);
          assert.equal(fetchError.cause, "timeout");
          break;
        case "error":
          assert.isDefined(fetchError);
          assert.equal(fetchError.cause, "failure");
          break;
      }

      assert.strictEqual(capturedParams.length, 2);

      const [[agent1, timeoutMs1], [agent2, timeoutMs2]] = capturedParams;

      assert.notStrictEqual(agent2, agent1);
      assert.strictEqual(timeoutMs1, timeoutMs);
      assert.strictEqual(timeoutMs2, timeoutMs);

      assert.strictEqual(agentFactoryCallCount, 2);
    });
  }

  for (const useHttps of [false, true]) {
    it(`Should not renew internally managed agent after renew within threshold - useHttps: ${useHttps}`, async () => {
      // Arrange

      const timeoutMs = 500;
      const agentRenewalThresholdMs = 1000;
      const requestRetryDelayMs = 10;

      const logger = new LoggerWrapper(new FakeLogger(LogLevel.Debug));

      const capturedParams: [FakeHttpAgent, timeoutMs: number | undefined][] = [];
      let agentFactoryCallCount = 0;

      const onRequest: FakeAgentOnRequest = function(options) {
        capturedParams.push([this, options.timeout]);
        return ["error"];
      };

      const configFetcher = new NodeHttpConfigFetcher(useHttps
        ? { httpsAgentFactory: () => (++agentFactoryCallCount, new FakeHttpsAgent(onRequest)) }
        : { httpAgentFactory: () => (++agentFactoryCallCount, new FakeHttpAgent(onRequest)) }
      );

      configFetcher["agentRenewalThresholdMs"] = agentRenewalThresholdMs;
      configFetcher["requestRetryDelayMs"] = requestRetryDelayMs;

      const options = platform.createManualPollOptions(testSdkKey);
      let requestUrl = options.getUrl();
      requestUrl = (useHttps ? "https" : "http") + requestUrl.substring(requestUrl.indexOf("://"));

      const fetchRequest = new FetchRequest(requestUrl, testETag, [], timeoutMs);

      async function expectFetchError(action: () => Promise<void>) {
        try {
          await action();
          assert.fail(`Expected ${FetchError.name}.`);
        } catch (err) {
          if (!(err instanceof FetchError && (err as FetchError).cause === "failure")) {
            assert.fail(`Expected ${FetchError.name}.`);
          }
        }
      }

      // Act

      await expectFetchError(() => configFetcher["fetchInternalAsync"](fetchRequest, logger));

      await expectFetchError(() => configFetcher["fetchInternalAsync"](fetchRequest, logger));

      await delay(agentRenewalThresholdMs * 3 / 2);

      await expectFetchError(() => configFetcher["fetchInternalAsync"](fetchRequest, logger));

      configFetcher.dispose();

      // Assert

      assert.strictEqual(capturedParams.length, 6);

      const [
        [agent1], [agent2], // 1st call to FetchAsync
        [agent3], [agent4], // 2nd call to FetchAsync
        [agent5], [agent6], // 3rd call to FetchAsync
      ] = capturedParams;

      assert.notStrictEqual(agent2, agent1);
      assert.strictEqual(agent3, agent2);
      assert.strictEqual(agent4, agent3);
      assert.strictEqual(agent5, agent4);
      assert.notStrictEqual(agent6, agent5);
      assert.notStrictEqual(agent6, agent1);

      assert.strictEqual(agentFactoryCallCount, 3);
    });
  }

  for (const [testCase, useHttps] of <["200" | "408" | "timeout" | "error", boolean][]>[
    ["200", false],
    ["200", true],
    ["408", false],
    ["408", true],
    ["timeout", false],
    ["timeout", true],
    ["error", false],
    ["error", true],
  ]) {
    it(`Should use passed external agent - case: ${testCase} | useHttps: ${useHttps}`, async () => {
      // Arrange

      const timeoutMs = 500;
      const body = "{}";

      const logger = new LoggerWrapper(new FakeLogger(LogLevel.Debug));

      const capturedParams: [FakeHttpAgent, timeoutMs: number | undefined][] = [];

      let onRequest: FakeAgentOnRequest;
      switch (testCase) {
        case "200":
          onRequest = function(options) {
            capturedParams.push([this, options.timeout]);
            return [{ statusCode: 200, statusMessage: "OK", headers: { etag: testETag }, body }];
          };
          break;
        case "408":
          onRequest = function(options) {
            capturedParams.push([this, options.timeout]);
            return [{ statusCode: 408, statusMessage: "Request Timeout" }];
          };
          break;
        case "timeout":
          onRequest = function(options) {
            capturedParams.push([this, options.timeout]);
            return ["timeout", timeoutMs];
          };
          break;
        case "error":
          onRequest = function(options) {
            capturedParams.push([this, options.timeout]);
            return ["error"];
          };
          break;
      }

      let agent: http.Agent | https.Agent;

      const configFetcher = new NodeHttpConfigFetcher(useHttps
        ? { httpsAgent: agent = new FakeHttpsAgent(onRequest) }
        : { httpAgent: agent = new FakeHttpAgent(onRequest) }
      );

      const options = platform.createManualPollOptions(testSdkKey);
      let requestUrl = options.getUrl();
      requestUrl = (useHttps ? "https" : "http") + requestUrl.substring(requestUrl.indexOf("://"));

      const fetchRequest = new FetchRequest(requestUrl, testETag, [], timeoutMs);

      // Act

      let fetchResponse: FetchResponse | undefined;
      let fetchError: FetchError | undefined;
      try {
        fetchResponse = await configFetcher["fetchInternalAsync"](fetchRequest, logger);
      } catch (err) {
        if (!(err instanceof FetchError)) {
          throw err;
        }
        fetchError = err;
      }

      configFetcher.dispose();

      // Assert

      switch (testCase) {
        case "200":
          assert.isDefined(fetchResponse);
          assert.equal(fetchResponse.statusCode, 200);
          assert.equal(fetchResponse.reasonPhrase, "OK");
          assert.equal(fetchResponse.eTag, testETag);
          assert.equal(fetchResponse.body, body);
          break;
        case "408":
          assert.isDefined(fetchResponse);
          assert.equal(fetchResponse.statusCode, 408);
          break;
        case "timeout":
          assert.isDefined(fetchError);
          assert.equal(fetchError.cause, "timeout");
          break;
        case "error":
          assert.isDefined(fetchError);
          assert.equal(fetchError.cause, "failure");
          break;
      }

      assert.strictEqual(capturedParams.length, testCase !== "200" ? 2 : 1);

      const [[agent1, timeoutMs1]] = capturedParams;

      assert.strictEqual(agent1, agent);
      assert.strictEqual(timeoutMs1, timeoutMs);

      if (testCase !== "200") {
        const [, [agent2, timeoutMs2]] = capturedParams;

        assert.strictEqual(agent2, agent);
        assert.strictEqual(timeoutMs2, timeoutMs);
      }
    });
  }

  for (const useHttps of [false, true]) {
    it(`Should not destroy external agent - useHttps: ${useHttps}`, () => {
      // Arrange

      const onRequest: FakeAgentOnRequest = () => ["error"];
      let agent: FakeHttpAgent | FakeHttpsAgent;

      const configFetcher = new NodeHttpConfigFetcher(useHttps
        ? { httpsAgent: agent = new FakeHttpsAgent(onRequest) }
        : { httpAgent: agent = new FakeHttpAgent(onRequest) }
      );

      // Act

      configFetcher.dispose();

      // Assert

      assert.isFalse(agent.destroyed);
    });
  }

  for (const [eTag, useCustomUrl, addCustomHeaders] of <[string | undefined, boolean, boolean][]>[
    [void 0, false, false],
    [void 0, false, true],
    [void 0, true, false],
    [void 0, true, true],
    [testETag, false, false],
    [testETag, false, true],
    [testETag, true, false],
    [testETag, true, true],
  ]) {
    it(`Should send user agent headers - eTag: ${eTag} | useCustomUrl: ${useCustomUrl} | addCustomHeaders: ${addCustomHeaders}`, async () => {
      // Arrange

      const timeoutMs = 15_000;

      const capturedRequests: [url: string, headers: Record<string, number | string | string[]> | undefined][] = [];

      const extraHeaders: [string, string][] | undefined = addCustomHeaders
        ? [
          ["X-Custom", "1"],
          [CONFIGCAT_USER_AGENT_HEADER_NAME, "x"],
        ]
        : void 0;

      const configFetcher = new class extends NodeHttpConfigFetcher {
        protected override setRequestHeaders(requestOptions: { headers?: Record<string, number | string | string[]> }, headers: ReadonlyArray<readonly [string, string]>): void {
          super.setRequestHeaders(requestOptions, extraHeaders ? [...headers, ...extraHeaders] : headers);
        }
      }();

      configFetcher["fetchCoreAsync"] = function(...args: unknown[]) {
        const url = args[1] as string;
        const requestOptions = args[2] as (http.RequestOptions | https.RequestOptions) & { headers?: Record<string, http.OutgoingHttpHeader> };
        capturedRequests.push([url, requestOptions.headers]);
        return new FetchResponse(200, "OK", [], "{}");
      };

      const options = platform.createManualPollOptions(testSdkKey);

      const requestUrl = useCustomUrl
        ? "http://example.com/configcat?x#y"
        : options.getUrl();
      const requestHeaders = getRequestHeaders(options.clientVersion);
      const fetchRequest = new FetchRequest(requestUrl, eTag, requestHeaders, timeoutMs);

      // Act

      await configFetcher.fetchAsync(fetchRequest);

      configFetcher.dispose();

      // Assert

      assert.equal(capturedRequests.length, 1);

      const [[actualRequestUrl, actualRequestHeaders]] = capturedRequests;
      assert.equal(actualRequestUrl, requestUrl);

      const eTagHeaderValues: string[] = [];
      if (actualRequestHeaders) {
        for (const key of Object.keys(actualRequestHeaders)) {
          if (key.toLowerCase() === "if-none-match") {
            const value = actualRequestHeaders[key];
            if (isArray(value)) eTagHeaderValues.push(...value);
            else eTagHeaderValues.push(value + "");
          }
        }
      }

      if (eTag) assert.deepEqual(eTagHeaderValues, [eTag]);
      else assert.equal(eTagHeaderValues.length, 0);

      const expectedHeaders: Record<string, string[]> = {};
      for (const [key, value] of useCustomUrl && addCustomHeaders ? [...requestHeaders, ...extraHeaders!] : requestHeaders) {
        const normalizedKey = key.toLowerCase();
        let currentValues = expectedHeaders[normalizedKey];
        if (!currentValues) currentValues = expectedHeaders[normalizedKey] = [];
        currentValues.push(value);
      }

      const actualHeaders: Record<string, string[]> = {};
      if (actualRequestHeaders) {
        for (const key of Object.keys(actualRequestHeaders)) {
          const normalizedKey = key.toLowerCase();
          if (eTag && normalizedKey === "if-none-match") continue;
          const value = actualRequestHeaders[key];
          let currentValues = actualHeaders[normalizedKey];
          if (!currentValues) currentValues = actualHeaders[normalizedKey] = [];
          if (isArray(value)) currentValues.push(...value);
          else currentValues.push(value + "");
        }
      }

      assert.deepEqual(actualHeaders, expectedHeaders);
    });
  }
});

type FakeAgentOnRequest = (this: FakeHttpAgent, options: http.RequestOptions) => FakeAgentOnRequestResult;

type FakeAgentOnRequestResult = [FakeResponse | "abort" | "timeout" | "error", delayMs?: number];

type FakeResponse = {
  statusCode?: number;
  statusMessage?: string;
  headers?: http.IncomingHttpHeaders;
  body?: string | Buffer;
};

/**
 * Implements the minimal `http.Agent` interface for testing purposes without actual network connections.
 */
class FakeHttpAgent extends EventEmitter implements http.Agent {
  maxSockets = Infinity;
  maxFreeSockets = 256;
  maxTotalSockets = Infinity;
  scheduling = "lifo";
  sockets = {};
  freeSockets = {};
  requests = {};

  destroyed = false;

  constructor(private readonly onRequest: FakeAgentOnRequest) {
    super();
  }

  getName(options: http.RequestOptions): string {
    return `${options.host}:${options.port ?? 80}`;
  }

  addRequest(req: http.ClientRequest, options: http.RequestOptions): void {
    const [response, delayMs] = this.onRequest(options);

    const endRequest = (options: http.RequestOptions, response: FakeAgentOnRequestResult[0]) => {
      switch (response) {
        case "abort":
          // eslint-disable-next-line @typescript-eslint/no-deprecated
          req.aborted = true;
          req.emit("close");
          return;
        case "timeout":
          req.emit("timeout");
          return;
        case "error":
          req.emit("error", Error("Network error."));
          return;
        default:
          req.emit("response", new FakeIncomingMessage(options.method, response));
      }
    };

    setTimeout(() => endRequest(options, response), delayMs ?? 0);
  }

  createConnection(): never {
    throw Error("Not implemented.");
  }

  createSocket(): never {
    throw Error("Not implemented.");
  }

  removeSocket(): never {
    throw Error("Not implemented.");
  }

  keepSocketAlive(): false {
    return false;
  }

  reuseSocket(): false {
    return false;
  }

  destroy(): void {
    this.destroyed = true;
  }
}

/**
 * Implements the minimal `https.Agent` interface for testing purposes without actual network connections.
 */
class FakeHttpsAgent extends FakeHttpAgent implements https.Agent {
  readonly options = {};

  override addRequest(req: http.ClientRequest, options: http.RequestOptions): void {
    if (typeof options.protocol === "undefined") {
      options.protocol = "https:";
    }
    super.addRequest(req, options);
  }
}

class FakeIncomingMessage extends stream.Readable implements http.IncomingMessage {
  readonly httpVersion = "1.1";
  readonly httpVersionMajor = 1;
  readonly httpVersionMinor = 1;
  complete = true;
  get rawHeaders(): string[] { throw Error("Not supported."); }
  get rawTrailers(): string[] { throw Error("Not supported."); }
  trailers: { [key: string]: string | undefined } = {};
  aborted = false;
  upgrade = false;
  get url(): string { throw Error("Not supported."); }
  method: string | undefined = void 0;
  statusCode: number | undefined = void 0;
  statusMessage: string | undefined = void 0;
  get socket(): any { throw Error("Not supported."); }
  headers: http.IncomingHttpHeaders;
  get connection(): net.Socket { throw Error("Not supported."); }

  get headersDistinct(): Record<string, string[]> {
    const result: Record<string, string[]> = {};
    for (const key of Object.keys(this.headers)) {
      const value = this.headers[key];
      if (value) {
        result[key] = Array.isArray(value) ? value : [value];
      }
    }
    return result;
  }

  get trailersDistinct(): Record<string, string[]> {
    return {};
  }

  constructor(method: string | undefined, response: FakeResponse) {
    super();

    this.method = method;
    this.statusCode = response.statusCode ?? 200;
    this.statusMessage = response.statusMessage ?? "OK";
    this.headers = response.headers ?? {};

    if (response.body) {
      const bodyBuffer = typeof response.body === "string"
        ? Buffer.from(response.body)
        : response.body;

      process.nextTick(() => {
        this.emit("data", bodyBuffer);
        this.emit("end");
      });
    } else {
      process.nextTick(() => this.emit("end"));
    }
  }

  setTimeout(msecs: number, callback?: () => void): this {
    if (callback) {
      this.once("timeout", callback);
    }
    return this;
  }

  // eslint-disable-next-line @typescript-eslint/naming-convention
  override _read(size: number): void { }
}

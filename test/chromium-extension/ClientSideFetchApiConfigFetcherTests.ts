import { assert } from "chai";
import { platform } from ".";
import { FetchRequest } from "#lib";
import { ClientSideFetchApiConfigFetcher } from "#lib/chromium-extension";
import { CONFIGCAT_USER_AGENT_HEADER_NAME, ETAG_QUERYPARAM_NAME, getRequestHeaders, SDK_QUERYPARAM_NAME, USER_AGENT_HEADER_NAME } from "#lib/ConfigFetcher";

const testSdkKey = "configcat-sdk-1/PKDVCLf-Hq-h-kCzMp-L7Q/u28_1qNyZ0Wz-ldYHIU7-g";
const testETag = "W/\"123\"";

describe("ClientSideFetchApiConfigFetcher tests", () => {
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
    it(`Should not send user agent headers - eTag: ${eTag} | useCustomUrl: ${useCustomUrl} | addCustomHeaders: ${addCustomHeaders}`, async () => {
      // Arrange

      const timeoutMs = 15_000;

      const capturedRequests: [url: string, headers: [string, string][] | undefined][] = [];

      const extraHeaders: [string, string][] | undefined = addCustomHeaders
        ? [
          ["X-Custom", "1"],
          [CONFIGCAT_USER_AGENT_HEADER_NAME, "x"],
        ]
        : void 0;

      const configFetcher = new class extends ClientSideFetchApiConfigFetcher {
        protected override setRequestHeaders(requestInit: { headers?: [string, string][] }, headers: ReadonlyArray<readonly [string, string]>): void {
          for (const [name, value] of extraHeaders ?? []) {
            (requestInit.headers ??= []).push([name, value]);
          }
        }
      }();

      configFetcher["fetchCoreAsync"] = function(...args: unknown[]) {
        const url = args[0] as string;
        const requestInit = args[1] as RequestInit & { headers?: [string, string][] };
        capturedRequests.push([url, requestInit.headers]);
        return { status: 200, statusText: "OK", headers: new Headers([]), text: () => Promise.resolve("{}") } as Response;
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

      const parsedExpectedUrl = new URL(requestUrl);
      const parsedActualUrl = new URL(actualRequestUrl);
      assert.equal(parsedActualUrl.origin, parsedExpectedUrl.origin);
      assert.equal(parsedActualUrl.pathname, parsedExpectedUrl.pathname);

      const parsedActualQuery = parsedActualUrl.searchParams;
      const [, expectedUserAgentHeaderValue] = fetchRequest.headers.find(([name]) => name === USER_AGENT_HEADER_NAME)!;
      assert.deepEqual(parsedActualQuery.getAll(SDK_QUERYPARAM_NAME), [expectedUserAgentHeaderValue]);
      assert.deepEqual(parsedActualQuery.getAll(ETAG_QUERYPARAM_NAME), eTag ? [eTag] : useCustomUrl ? [""] : []);

      const eTagHeaderValues: string[] = [];
      if (actualRequestHeaders) {
        for (const [key, value] of actualRequestHeaders) {
          if (key.toLowerCase() === "if-none-match") {
            eTagHeaderValues.push(value);
          }
        }
      }

      assert.equal(eTagHeaderValues.length, 0);

      const expectedHeaders: Record<string, string[]> = {};
      for (const [key, value] of useCustomUrl && addCustomHeaders ? extraHeaders! : []) {
        const normalizedKey = key.toLowerCase();
        let currentValues = expectedHeaders[normalizedKey];
        if (!currentValues) currentValues = expectedHeaders[normalizedKey] = [];
        currentValues.push(value);
      }

      const actualHeaders: Record<string, string[]> = {};
      if (actualRequestHeaders) {
        for (const [key, value] of actualRequestHeaders) {
          const normalizedKey = key.toLowerCase();
          if (eTag && normalizedKey === "if-none-match") continue;
          let currentValues = actualHeaders[normalizedKey];
          if (!currentValues) currentValues = actualHeaders[normalizedKey] = [];
          currentValues.push(value);
        }
      }

      assert.deepEqual(actualHeaders, expectedHeaders);
    });
  }
});

import { assert } from "chai";
import { platform } from "../helpers/platform";
import { FetchRequest } from "#lib";
import { CONFIGCAT_USER_AGENT_HEADER_NAME, getRequestHeaders } from "#lib/ConfigFetcher";
import { ServerSideFetchApiConfigFetcher } from "#lib/deno";

const testSdkKey = "configcat-sdk-1/PKDVCLf-Hq-h-kCzMp-L7Q/u28_1qNyZ0Wz-ldYHIU7-g";
const testETag = "W/\"123\"";

describe("ServerSideFetchApiConfigFetcher tests", () => {
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

      const capturedRequests: [url: string, headers: [string, string][] | undefined][] = [];

      const extraHeaders: [string, string][] | undefined = addCustomHeaders
        ? [
          ["X-Custom", "1"],
          [CONFIGCAT_USER_AGENT_HEADER_NAME, "x"],
        ]
        : void 0;

      const configFetcher = new class extends ServerSideFetchApiConfigFetcher {
        protected override setRequestHeaders(requestInit: { headers?: [string, string][] }, headers: ReadonlyArray<readonly [string, string]>): void {
          super.setRequestHeaders(requestInit, extraHeaders ? [...headers, ...extraHeaders] : headers);
        }
      }();

      configFetcher["fetchCoreAsync"] = function(...args: unknown[]) {
        const url = args[0] as string;
        const requestInit = args[1] as RequestInit & { headers?: [string, string][] };
        capturedRequests.push([url, requestInit.headers]);
        return { status: 200, statusText: "OK", headers: new Headers([]), text: () => Promise.resolve("{}") } as Response;
      };

      const options = platform().createManualPollOptions(testSdkKey);

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
        for (const [key, value] of actualRequestHeaders) {
          if (key.toLowerCase() === "if-none-match") {
            eTagHeaderValues.push(value);
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

import { assert, expect } from "chai";
import { createManualPollOptions, FakeConfigFetcherWithTwoKeys, FakeLogger } from "./helpers/fakes";
import { platform } from "./helpers/platform";
import { FetchRequest, FetchResponse, FormattableLogMessage, IConfigCatConfigFetcher } from "#lib";
import { isCdnUrl } from "#lib/ConfigCatClientOptions";
import { adjustUrlForBrowser, CONFIGCAT_USER_AGENT_HEADER_NAME, ETAG_QUERYPARAM_NAME, SDK_QUERYPARAM_NAME, USER_AGENT_HEADER_NAME } from "#lib/ConfigFetcher";

const testSdkKey = "configcat-sdk-1/PKDVCLf-Hq-h-kCzMp-L7Q/u28_1qNyZ0Wz-ldYHIU7-g";
const testETag = "W/\"123\"";

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

    client.dispose();
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

    const errors = fakeLogger.events.filter(([, eventId]) => eventId === 1100);
    assert.strictEqual(errors.length, 1);

    const [[, , error]] = errors;
    assert.instanceOf(error, FormattableLogMessage);
    assert.strictEqual(error.argNames.length, 2);
    assert.strictEqual(error.argNames[0], "SDK_KEY");
    assert.strictEqual(error.argNames[1], "RAY_ID");

    assert.strictEqual(error.argValues.length, 2);
    const [actualSdkKey, actualRayId] = error.argValues;
    assert.equal(actualSdkKey, "**********************/****************789012");
    assert.equal(actualRayId, rayId);

    expect(error.toString()).to.contain(rayId);

    client.dispose();
  });

  for (const [queryAndFragment, sdkKey, etag, useAbsoluteUrl] of <[string, string, string | undefined, boolean][]>[
    ["", testSdkKey, testETag, false],
    ["", testSdkKey, testETag, true],
    ["", "configcat%2dsdk%2d1/PKDVCLf%2dHq%2dh%2dkCzMp%2dL7Q/u28_1qNyZ0Wz%2dldYHIU7%2dg", testETag, false],
    ["", "configcat%2dsdk%2d1/PKDVCLf%2dHq%2dh%2dkCzMp%2dL7Q/u28_1qNyZ0Wz%2dldYHIU7%2dg", testETag, true],
    ["", testSdkKey, null, false],
    ["", testSdkKey, null, true],
    ["?", testSdkKey, testETag, false],
    ["?", testSdkKey, testETag, true],
    ["?", testSdkKey, null, false],
    ["?", testSdkKey, null, true],
    ["?ccetag=123", testSdkKey, testETag, false],
    ["?ccetag=123", testSdkKey, testETag, true],
    ["?ccetag=123#f", testSdkKey, testETag, false],
    ["?ccetag=123#f", testSdkKey, testETag, true],
    ["#f", testSdkKey, testETag, false],
    ["#f", testSdkKey, testETag, true],
  ]) {
    it(`AdjustUriForBrowser should work - queryAndFragment: ${queryAndFragment} | sdkKey: ${sdkKey} | etag: ${etag} | useAbsoluteUrl: ${useAbsoluteUrl}`, () => {
      // Arrange

      const options = createManualPollOptions(sdkKey);

      let url = options.getUrl() + queryAndFragment;
      const parsedAbsoluteUrl = new URL(url);

      if (!useAbsoluteUrl) {
        const index = url.indexOf("://");
        url = url.substring(url.indexOf("/", index + 3));
      }

      const requestHeaders: [string, string][] = [
        [USER_AGENT_HEADER_NAME, options.clientVersion],
        [CONFIGCAT_USER_AGENT_HEADER_NAME, options.clientVersion],
      ];
      const fetchRequest = new FetchRequest(url, etag, requestHeaders, Infinity);

      // Act

      const adjustedUrl = adjustUrlForBrowser(url, fetchRequest);

      // Assert

      const parsedAdjustedUrl = new URL(useAbsoluteUrl ? adjustedUrl : "https://x" + adjustedUrl);

      assert.strictEqual(parsedAdjustedUrl.pathname, parsedAbsoluteUrl.pathname);

      const normalizedUserAgentHeaderName = USER_AGENT_HEADER_NAME.toLowerCase();
      const expectedUserAgentHeaderValue = fetchRequest.headers.find(([key]) => key.toLowerCase() === normalizedUserAgentHeaderName)![1];

      const expectedQueryParams: [string, string][] = [];
      expectedQueryParams.push([SDK_QUERYPARAM_NAME, expectedUserAgentHeaderValue]);
      if (etag || parsedAbsoluteUrl.searchParams.size) {
        expectedQueryParams.push([ETAG_QUERYPARAM_NAME, etag ?? ""]);
      }
      parsedAbsoluteUrl.searchParams.forEach((value, key) => expectedQueryParams.push([key, value]));

      const actualQueryParams: [string, string][] = [];
      parsedAdjustedUrl.searchParams.forEach((value, key) => actualQueryParams.push([key, value]));

      assert.deepEqual(actualQueryParams, expectedQueryParams);

      assert.strictEqual(parsedAdjustedUrl.hash, "");
    });
  }

  for (const [url, expectedResult] of <[string, boolean][]>[
    ["/", false],
    ["/configuration-files/configcat-sdk-1/PKDVCLf-Hq-h-kCzMp-L7Q/u28_1qNyZ0Wz-ldYHIU7-g/config_v6.json", false],
    ["file:///configuration-files/configcat-sdk-1/PKDVCLf-Hq-h-kCzMp-L7Q/u28_1qNyZ0Wz-ldYHIU7-g/config_v6.json", false],
    ["http://cdn-global.configcat.com/configuration-files/configcat-sdk-1/PKDVCLf-Hq-h-kCzMp-L7Q/u28_1qNyZ0Wz-ldYHIU7-g/config_v6.json", true],
    ["https://cdn-global.configcat.com/configuration-files/configcat-sdk-1/PKDVCLf-Hq-h-kCzMp-L7Q/u28_1qNyZ0Wz-ldYHIU7-g/config_v6.json", true],
    ["https://cdn-global.configcat.com/configuration-files/configcat-sdk-1/PKDVCLf-Hq-h-kCzMp-L7Q/u28_1qNyZ0Wz-ldYHIU7-g/config_v6.json?x=/configcat-proxy/", true],
    ["https://cdn-global.configcat.com/configuration-files/configcat-sdk-1/PKDVCLf-Hq-h-kCzMp-L7Q/u28_1qNyZ0Wz-ldYHIU7-g/config_v6.json?x#/configcat-proxy/", true],
    ["https://cdn-global.configcat.com/configuration-files/configcat-sdk-1/PKDVCLf-Hq-h-kCzMp-L7Q/u28_1qNyZ0Wz-ldYHIU7-g/config_v6.json#/configcat-proxy/", true],
    ["https://cdn-global.configcat.com/configuration%2dfiles/configcat%2dsdk%2d1/PKDVCLf%2dHq%2dh%2dkCzMp%2dL7Q/u28_1qNyZ0Wz%2dldYHIU7%2dg/config_v6.json", true],
    ["https://cdn-global.configcat.com./configuration-files/configcat-sdk-1/PKDVCLf-Hq-h-kCzMp-L7Q/u28_1qNyZ0Wz-ldYHIU7-g/config_v6.json", true],
    ["https://cdn-global.configcat.com/configcat-proxy/configuration-files/configcat-sdk-1/PKDVCLf-Hq-h-kCzMp-L7Q/u28_1qNyZ0Wz-ldYHIU7-g/config_v6.json", false],
    ["https://cdn-global.configcat.com/configcat%2dproxy/configuration-files/configcat-sdk-1/PKDVCLf-Hq-h-kCzMp-L7Q/u28_1qNyZ0Wz-ldYHIU7-g/config_v6.json", false],
    ["https://cdn-global.configcat.com/configuration-files/configcat-proxy/configcat-sdk-1/PKDVCLf-Hq-h-kCzMp-L7Q/u28_1qNyZ0Wz-ldYHIU7-g/config_v6.json", false],
    ["https://cdn-global.configcat.com/configuration-files/configcat%2Dproxy/configcat-sdk-1/PKDVCLf-Hq-h-kCzMp-L7Q/u28_1qNyZ0Wz-ldYHIU7-g/config_v6.json?x", false],
  ]) {
    it(`IsCdnUri should work - url: ${url}`, () => {
      // Arrange

      // Act

      const actualResult = isCdnUrl(url);

      // Assert

      assert.strictEqual(actualResult, expectedResult);
    });
  }
});

import { assert } from "chai";
import { CloudflareConfigCache, getCloudflareCache } from "#lib/cloudflare-worker/CloudflareConfigCache";

describe("CloudflareConfigCache tests", () => {
  it("CloudflareConfigCache works with non latin 1 characters", async function() {
    const cloudflareCahe = getCloudflareCache();
    assert.isDefined(cloudflareCahe);

    const cache = new CloudflareConfigCache(cloudflareCahe);
    const key = "testkey";
    const text = "äöüÄÖÜçéèñışğâ¢™✓😀";
    await cache.set(key, text);
    const retrievedValue = await cache.get(key);
    assert.strictEqual(retrievedValue, text);
  });
});

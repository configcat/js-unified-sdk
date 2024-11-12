import { assert } from "chai";
import { IndexedDBCache, getDBConnectionFactory } from "#lib/shared/IndexedDBCache";

describe("IndexedDBCache cache tests", () => {
  it("IndexedDBCache works with non latin 1 characters", async function() {
    if (typeof indexedDB === "undefined") {
      this.skip();
    }

    const dbConnectionFactory = getDBConnectionFactory();
    assert.isDefined(dbConnectionFactory);

    const cache = new IndexedDBCache(dbConnectionFactory!);
    const key = "testkey";
    const text = "äöüÄÖÜçéèñışğâ¢™✓😀";
    await cache.set(key, text);
    const retrievedValue = await cache.get(key);
    assert.strictEqual(retrievedValue, text);
  });
});

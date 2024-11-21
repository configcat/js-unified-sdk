import { assert } from "chai";
import { IndexedDBConfigCache, getDBConnectionFactory } from "#lib/shared/IndexedDBConfigCache";

describe("IndexedDBConfigCache tests", () => {
  it("IndexedDBConfigCache works with non latin 1 characters", async function() {
    if (typeof indexedDB === "undefined") {
      this.skip();
    }

    const dbConnectionFactory = getDBConnectionFactory();
    assert.isDefined(dbConnectionFactory);

    const cache = new IndexedDBConfigCache(dbConnectionFactory!);
    const key = "testkey";
    const text = "äöüÄÖÜçéèñışğâ¢™✓😀";
    await cache.set(key, text);
    const retrievedValue = await cache.get(key);
    assert.strictEqual(retrievedValue, text);
  });
});

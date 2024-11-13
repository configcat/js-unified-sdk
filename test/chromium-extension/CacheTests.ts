import { assert } from "chai";
import { FakeLogger } from "../helpers/fakes";
import { createClientWithLazyLoad } from ".";
import { LogLevel } from "#lib";
import { ChromeLocalStorageConfigCache, fromUtf8Base64, toUtf8Base64 } from "#lib/chromium-extension/ChromeLocalStorageConfigCache";
import { ExternalConfigCache } from "#lib/ConfigCatCache";

describe("Base64 encode/decode test", () => {
  let allBmpChars = "";
  for (let i = 0; i <= 0xFFFF; i++) {
    if (i < 0xD800 || 0xDFFF < i) { // skip lone surrogate chars
      allBmpChars += String.fromCharCode(i);
    }
  }

  for (const input of [
    "",
    "\n",
    "äöüÄÖÜçéèñışğâ¢™✓😀",
    allBmpChars
  ]) {
    it(`Base64 encode/decode works - input: ${input.slice(0, Math.min(input.length, 128))}`, () => {
      assert.strictEqual(fromUtf8Base64(toUtf8Base64(input)), input);
    });
  }
});

describe("LocalStorageConfigCache tests", () => {
  it("LocalStorageConfigCache works with non latin 1 characters", async () => {

    const fakeLocalStorage = createFakeLocalStorage();
    const cache = new ChromeLocalStorageConfigCache(fakeLocalStorage);
    const key = "testkey";
    const text = "äöüÄÖÜçéèñışğâ¢™✓😀";
    await cache.set(key, text);
    const retrievedValue = await cache.get(key);
    assert.strictEqual(retrievedValue, text);
    assert.strictEqual((await fakeLocalStorage.get(key))[key], "w6TDtsO8w4TDlsOcw6fDqcOow7HEscWfxJ/DosKi4oSi4pyT8J+YgA==");
  });

  it("Error is logged when LocalStorageConfigCache.get throws", async () => {
    const errorMessage = "Something went wrong.";
    const faultyLocalStorage = Object.assign(createFakeLocalStorage(), {
      get() { return Promise.reject(new Error(errorMessage)); }
    });

    const fakeLogger = new FakeLogger();

    const client = createClientWithLazyLoad("configcat-sdk-1/PKDVCLf-Hq-h-kCzMp-L7Q/AG6C1ngVb0CvM07un6JisQ", { logger: fakeLogger },
      kernel => {
        kernel.defaultCacheFactory = options => new ExternalConfigCache(new ChromeLocalStorageConfigCache(faultyLocalStorage), options.logger);
        return kernel;
      });

    try { await client.getValueAsync("stringDefaultCat", ""); }
    finally { client.dispose(); }

    assert.isDefined(fakeLogger.events.find(([level, eventId, , err]) => level === LogLevel.Error && eventId === 2200 && err instanceof Error && err.message === errorMessage));
  });

  it("Error is logged when LocalStorageConfigCache.set throws", async () => {
    const errorMessage = "Something went wrong.";
    const faultyLocalStorage = Object.assign(createFakeLocalStorage(), {
      set() { return Promise.reject(new Error(errorMessage)); }
    });

    const fakeLogger = new FakeLogger();

    const client = createClientWithLazyLoad("configcat-sdk-1/PKDVCLf-Hq-h-kCzMp-L7Q/AG6C1ngVb0CvM07un6JisQ", { logger: fakeLogger },
      kernel => {
        kernel.defaultCacheFactory = options => new ExternalConfigCache(new ChromeLocalStorageConfigCache(faultyLocalStorage), options.logger);
        return kernel;
      });

    try { await client.getValueAsync("stringDefaultCat", ""); }
    finally { client.dispose(); }

    assert.isDefined(fakeLogger.events.find(([level, eventId, , err]) => level === LogLevel.Error && eventId === 2201 && err instanceof Error && err.message === errorMessage));
  });
});

function createFakeLocalStorage(): chrome.storage.LocalStorageArea {
  let localStorage: { [key: string]: any } = {};

  return <Partial<chrome.storage.LocalStorageArea>>{
    set(items: { [key: string]: any }) {
      localStorage = { ...localStorage, ...items };
      return Promise.resolve();
    },
    get(keys?: string | string[] | { [key: string]: any } | null) {
      let result = localStorage;
      if (typeof keys === "string") {
        result = { [keys]: localStorage[keys] };
      }
      else if (keys != null) {
        throw new Error("Not implemented.");
      }
      return Promise.resolve(result);
    }
  } as chrome.storage.LocalStorageArea;
}

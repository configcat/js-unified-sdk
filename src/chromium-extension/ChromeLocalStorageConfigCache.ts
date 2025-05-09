import type { IConfigCache, IConfigCatCache } from "../ConfigCatCache";
import { ExternalConfigCache } from "../ConfigCatCache";
import type { OptionsBase } from "../ConfigCatClientOptions";

/* eslint-disable @typescript-eslint/no-deprecated */

export class ChromeLocalStorageConfigCache implements IConfigCatCache {
  private static tryGetFactory(): ((options: OptionsBase) => IConfigCache) | undefined {
    const localStorage = getChromeLocalStorage();
    if (localStorage) {
      return options => new ExternalConfigCache(new ChromeLocalStorageConfigCache(localStorage), options.logger);
    }
  }

  constructor(private readonly storage: chrome.storage.LocalStorageArea) {
  }

  async set(key: string, value: string): Promise<void> {
    await this.storage.set({ [key]: toUtf8Base64(value) });
  }

  async get(key: string): Promise<string | undefined> {
    const cacheObj = await this.storage.get(key);
    const configString = cacheObj[key] as string | undefined;
    if (configString) {
      return fromUtf8Base64(configString);
    }
  }
}

export function getChromeLocalStorage(): chrome.storage.LocalStorageArea | undefined {
  if (typeof chrome !== "undefined") {
    return chrome.storage?.local;
  }
}

export function toUtf8Base64(str: string): string {
  str = encodeURIComponent(str);
  str = str.replace(/%([0-9A-F]{2})/g, (_, p1: string) => String.fromCharCode(parseInt(p1, 16)));
  return btoa(str);
}

export function fromUtf8Base64(str: string): string {
  str = atob(str);
  str = str.replace(/[%\x80-\xFF]/g, m => "%" + m.charCodeAt(0).toString(16));
  return decodeURIComponent(str);
}

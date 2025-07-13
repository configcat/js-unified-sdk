import type * as cloudflare from "@cloudflare/workers-types/2023-03-01";
import type { IConfigCache, IConfigCatCache } from "../ConfigCatCache";
import { ExternalConfigCache } from "../ConfigCatCache";
import type { OptionsBase } from "../ConfigCatClientOptions";

const CACHE_NAME = "@configcat/sdk";

interface ICloudflareCache {
  put(request: string, response: ICloudflareResponse): Promise<void>;
  match(request: string): Promise<ICloudflareResponse | undefined>;
}

interface ICloudflareResponse {
  text(): Promise<string>;
}

declare const caches: typeof cloudflare.caches;

// eslint-disable-next-line @typescript-eslint/naming-convention
declare const Response: typeof cloudflare.Response;

export class CloudflareConfigCache implements IConfigCatCache {
  private static tryGetFactory(): ((options: OptionsBase) => IConfigCache) | undefined {
    const cache = getCloudflareCache();
    if (cache) {
      return options => new ExternalConfigCache(new CloudflareConfigCache(cache), options.logger);
    }
  }

  private cache: Promise<ICloudflareCache> | undefined;

  constructor(cache: Promise<ICloudflareCache>) {
    this.cache = cache;
  }

  async set(key: string, value: string): Promise<void> {
    try {
      const cache = await (this.cache ?? caches.open(CACHE_NAME));
      await cache.put(cacheUrlFor(key), new Response(value));
    } catch (err) {
      this.cache = void 0;
      throw err;
    }
  }

  async get(key: string): Promise<string | undefined> {
    try {
      const cache = await (this.cache ?? caches.open(CACHE_NAME));
      const response = await cache.match(cacheUrlFor(key));
      if (response) {
        return await response.text();
      }
    } catch (err) {
      this.cache = void 0;
      throw err;
    }
  }
}

export function getCloudflareCache(): Promise<ICloudflareCache> | undefined {
  if (typeof caches !== "undefined") {
    try {
      return caches.open(CACHE_NAME);
    } catch { /* intentional no-op */ }
  }
}

function cacheUrlFor(key: string) {
  return `http://sdk-config-cache.configcat.com/${encodeURIComponent(key)}`;
}

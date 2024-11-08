import { ConfigCatClientCache } from "#lib/ConfigCatClient";

declare module "#lib/ConfigCatClient" {
  interface ConfigCatClientCache {
    getSize(): number;
    getAliveCount(): number;
  }
}

ConfigCatClientCache.prototype.getSize = function(this: ConfigCatClientCache) {
  return Object.keys(this["instances"]).length;
};

ConfigCatClientCache.prototype.getAliveCount = function(this: ConfigCatClientCache) {
  return Object.values(this["instances"] as Record<string, [WeakRef<any>, object]>).filter(([weakRef]) => !!weakRef.deref()).length;
};

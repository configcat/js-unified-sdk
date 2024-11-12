import type { IConfigCache, IConfigCatCache } from "../ConfigCatCache";
import { ExternalConfigCache } from "../ConfigCatCache";
import type { OptionsBase } from "../ConfigCatClientOptions";

const OBJECT_STORE_NAME = "configCache";

type DBConnectionFactory = () => Promise<IDBDatabase>;

export class IndexedDBCache implements IConfigCatCache {
  static tryGetFactory(): ((options: OptionsBase) => IConfigCache) | undefined {
    const dbConnectionFactory = getDBConnectionFactory();
    if (dbConnectionFactory) {
      return options => new ExternalConfigCache(new IndexedDBCache(dbConnectionFactory), options.logger);
    }
  }

  constructor(private readonly dbConnectionFactory: DBConnectionFactory) {
  }

  async set(key: string, value: string): Promise<void> {
    const db = await this.dbConnectionFactory();
    try {
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(OBJECT_STORE_NAME, "readwrite");
        const store = transaction.objectStore(OBJECT_STORE_NAME);
        store.put(value, key);
        transaction.oncomplete = () => resolve();
        transaction.onerror = event => reject((event.target as IDBRequest<IDBValidKey>).error);
      });
    }
    finally { db.close(); }
  }

  async get(key: string): Promise<string | undefined> {
    const db = await this.dbConnectionFactory();
    try {
      return await new Promise<string | undefined>((resolve, reject) => {
        const transaction = db.transaction(OBJECT_STORE_NAME, "readonly");
        const store = transaction.objectStore(OBJECT_STORE_NAME);
        const storeRequest = store.get(key);
        let value: string | undefined;
        storeRequest.onsuccess = event => value = (event.target as IDBRequest<any>).result;
        transaction.oncomplete = () => resolve(value);
        transaction.onerror = event => reject((event.target as IDBRequest<IDBValidKey>).error);
      });
    }
    finally { db.close(); }
  }
}

export function getDBConnectionFactory(): DBConnectionFactory | undefined {
  if (typeof indexedDB !== "undefined") {
    try {
      const dbConnectionFactory = () => new Promise<IDBDatabase>((resolve, reject) => {
        const openRequest = indexedDB.open("@configcat/sdk");
        openRequest.onupgradeneeded = event =>
          (event.target as IDBOpenDBRequest).result.createObjectStore(OBJECT_STORE_NAME);
        openRequest.onsuccess = event => resolve((event.target as IDBOpenDBRequest).result);
        openRequest.onerror = event => reject((event.target as IDBOpenDBRequest).error);
      });

      // Check if it is possible to connect to the DB.
      dbConnectionFactory().then(db => db.close());

      return dbConnectionFactory;
    }
    catch { /* intentional no-op */ }
  }
}

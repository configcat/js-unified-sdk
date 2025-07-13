import type { IConfigCache, IConfigCatCache } from "../ConfigCatCache";
import { ExternalConfigCache } from "../ConfigCatCache";
import type { OptionsBase } from "../ConfigCatClientOptions";

const OBJECT_STORE_NAME = "configCache";

type DBConnectionFactory = () => Promise<IIndexedDBDatabase>;

interface IIndexedDBDatabase {
  transaction(storeNames: string | string[], mode: "readonly" | "readwrite"): IIndexedDBTransaction;
  close(): void;
}

interface IIndexedDBTransaction {
  oncomplete: ((ev: any) => any) | null;
  onerror: ((ev: any) => any) | null;
  objectStore(name: string): IIndexedDBObjectStore;
}

interface IIndexedDBObjectStore {
  get(query: string): IIndexedDBRequest;
  put(value: any, key: string): IIndexedDBRequest;
}

interface IIndexedDBRequest<T = any> {
  readonly result: T;
  readonly error: Error | null;
  onsuccess: ((ev: any) => any) | null;
}

interface IIndexedDBRequestEvent<T = any> {
  target: IIndexedDBRequest<T>;
}

export class IndexedDBConfigCache implements IConfigCatCache {
  private static tryGetFactory(): ((options: OptionsBase) => IConfigCache) | undefined {
    const dbConnectionFactory = getDBConnectionFactory();
    if (dbConnectionFactory) {
      return options => new ExternalConfigCache(new IndexedDBConfigCache(dbConnectionFactory), options.logger);
    }
  }

  constructor(private readonly dbConnectionFactory: DBConnectionFactory) {
  }

  async set(key: string, value: string): Promise<void> {
    const db = await this.dbConnectionFactory();
    try {
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(OBJECT_STORE_NAME, "readwrite");
        transaction.oncomplete = () => resolve();
        transaction.onerror = (event: IIndexedDBRequestEvent) => reject(event.target.error!);
        const store = transaction.objectStore(OBJECT_STORE_NAME);
        store.put(value, key);
      });
    } finally { db.close(); }
  }

  async get(key: string): Promise<string | undefined> {
    const db = await this.dbConnectionFactory();
    try {
      return await new Promise<string | undefined>((resolve, reject) => {
        const transaction = db.transaction(OBJECT_STORE_NAME, "readonly");
        let value: string | undefined;
        transaction.oncomplete = () => resolve(value);
        transaction.onerror = (event: IIndexedDBRequestEvent) => reject(event.target.error!);
        const store = transaction.objectStore(OBJECT_STORE_NAME);
        const storeRequest = store.get(key);
        storeRequest.onsuccess = (event: IIndexedDBRequestEvent<string | undefined>) => value = event.target.result;
      });
    } finally { db.close(); }
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
        openRequest.onerror = event => reject((event.target as IDBOpenDBRequest).error!);
      });

      // Check if it is possible to connect to the DB.
      dbConnectionFactory().then(db => db.close()).catch(() => { /* intentional no-op */ });

      return dbConnectionFactory;
    } catch { /* intentional no-op */ }
  }
}

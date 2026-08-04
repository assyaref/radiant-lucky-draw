// ============================================================
// IndexedDB Storage Service - Enterprise Edition
// ============================================================

import { DB_SCHEMA, OFFLINE_CONFIG } from '../config';
import type { CacheEntry, StorageQuotaInfo, DataIntegrityReport, CacheStats } from '../types';


class StorageService {
  private db: IDBDatabase | null = null;
  private ready: Promise<void>;
  private readyResolve!: () => void;
  private cacheHits = 0;
  private cacheMisses = 0;

  constructor() {
    this.ready = new Promise((resolve) => {
      this.readyResolve = resolve;
    });
    this.init();
  }

  private async init(): Promise<void> {
    try {
      this.db = await this.openDatabase();
      await this.runMigrations();
      this.readyResolve();
    } catch (error) {
      console.error('[StorageService] Failed to initialize database:', error);
      this.readyResolve();
    }
  }

  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_SCHEMA.name, DB_SCHEMA.version);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const oldVersion = event.oldVersion;

        console.log(`[StorageService] Upgrading DB from v${oldVersion} to v${DB_SCHEMA.version}`);

        DB_SCHEMA.stores.forEach((store) => {
          if (!db.objectStoreNames.contains(store.name)) {
            const objectStore = db.createObjectStore(store.name, {
              keyPath: store.keyPath,
            });

            store.indexes?.forEach((index) => {
              objectStore.createIndex(index.name, index.keyPath, {
                unique: index.unique || false,
              });
            });
          }
        });

        // Store migration metadata
        if (!db.objectStoreNames.contains('_metadata')) {
          const metaStore = db.createObjectStore('_metadata', { keyPath: 'key' });
          metaStore.put({ key: 'migration', fromVersion: oldVersion, toVersion: DB_SCHEMA.version, timestamp: Date.now() });
          metaStore.put({ key: 'schema_version', value: DB_SCHEMA.version });
        }
      };

      request.onsuccess = (event) => {
        resolve((event.target as IDBOpenDBRequest).result);
      };

      request.onerror = (event) => {
        reject((event.target as IDBOpenDBRequest).error);
      };
    });
  }

  private async runMigrations(): Promise<void> {
    try {
      const meta = await this.get<{ key: string; value: number }>('_metadata', 'schema_version');
      const currentVersion = meta?.value ?? 0;

      if (currentVersion < DB_SCHEMA.version) {
        console.log(`[StorageService] Running migrations from v${currentVersion} to v${DB_SCHEMA.version}`);
        await this.set('_metadata', { key: 'schema_version', value: DB_SCHEMA.version });
      }
    } catch {
      // Metadata store might not exist yet
    }
  }

  async waitForReady(): Promise<void> {
    await this.ready;
  }

  private async ensureDB(): Promise<IDBDatabase> {
    await this.ready;
    if (!this.db) {
      throw new Error('[StorageService] Database not initialized');
    }
    return this.db;
  }

  private getStore(db: IDBDatabase, storeName: string, mode: IDBTransactionMode = 'readonly'): IDBObjectStore {
    const transaction = db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  // ─── Generic CRUD ─────────────────────────────────────────

  async get<T>(storeName: string, key: string): Promise<T | null> {
    try {
      const db = await this.ensureDB();
      return new Promise((resolve, reject) => {
        const store = this.getStore(db, storeName);
        const request = store.get(key);

        request.onsuccess = () => {
          resolve(request.result || null);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`[StorageService] Error getting ${key} from ${storeName}:`, error);
      return null;
    }
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    try {
      const db = await this.ensureDB();
      return new Promise((resolve, reject) => {
        const store = this.getStore(db, storeName);
        const request = store.getAll();

        request.onsuccess = () => {
          resolve(request.result || []);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`[StorageService] Error getting all from ${storeName}:`, error);
      return [];
    }
  }

  async set<T>(storeName: string, value: T): Promise<void> {
    try {
      const db = await this.ensureDB();
      return new Promise((resolve, reject) => {
        const store = this.getStore(db, storeName, 'readwrite');
        const request = store.put(value);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`[StorageService] Error setting value in ${storeName}:`, error);
    }
  }

  async delete(storeName: string, key: string): Promise<void> {
    try {
      const db = await this.ensureDB();
      return new Promise((resolve, reject) => {
        const store = this.getStore(db, storeName, 'readwrite');
        const request = store.delete(key);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`[StorageService] Error deleting ${key} from ${storeName}:`, error);
    }
  }

  async clear(storeName: string): Promise<void> {
    try {
      const db = await this.ensureDB();
      return new Promise((resolve, reject) => {
        const store = this.getStore(db, storeName, 'readwrite');
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`[StorageService] Error clearing ${storeName}:`, error);
    }
  }

  async count(storeName: string): Promise<number> {
    try {
      const db = await this.ensureDB();
      return new Promise((resolve, reject) => {
        const store = this.getStore(db, storeName);
        const request = store.count();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`[StorageService] Error counting ${storeName}:`, error);
      return 0;
    }
  }

  // ─── Cache Operations ──────────────────────────────────────

  async cacheGet<T>(key: string): Promise<T | null> {
    const entry = await this.get<CacheEntry<T>>('cache', key);
    if (!entry) {
      this.cacheMisses++;
      return null;
    }

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      await this.delete('cache', key);
      this.cacheMisses++;
      return null;
    }

    this.cacheHits++;
    return entry.data;
  }

  async cacheSet<T>(key: string, data: T, ttl?: number): Promise<void> {
    const entry: CacheEntry<T> = {
      key,
      data,
      timestamp: Date.now(),
      ttl: ttl || OFFLINE_CONFIG.cacheTTL,
      version: 1,
    };
    await this.set('cache', entry);
  }

  async cacheClear(): Promise<void> {
    await this.clear('cache');
  }

  async cacheClearExpired(): Promise<number> {
    const entries = await this.getAll<CacheEntry>('cache');
    const now = Date.now();
    let cleared = 0;

    for (const entry of entries) {
      if (now - entry.timestamp > entry.ttl) {
        await this.delete('cache', entry.key);
        cleared++;
      }
    }

    return cleared;
  }

  async getCacheStats(): Promise<CacheStats> {
    const entries = await this.getAll<CacheEntry>('cache');
    const now = Date.now();
    const totalHits = this.cacheHits;
    const totalMisses = this.cacheMisses;
    const totalRequests = totalHits + totalMisses;

    const byKey: Record<string, { size: number; ttl: number; age: number }> = {};
    let totalSize = 0;
    let expiredEntries = 0;

    for (const entry of entries) {
      const size = new Blob([JSON.stringify(entry.data)]).size;
      totalSize += size;
      const age = now - entry.timestamp;
      const expired = age > entry.ttl;
      if (expired) expiredEntries++;

      byKey[entry.key] = { size, ttl: entry.ttl, age };
    }

    return {
      totalEntries: entries.length,
      totalSize,
      expiredEntries,
      hitRate: totalRequests > 0 ? totalHits / totalRequests : 0,
      missRate: totalRequests > 0 ? totalMisses / totalRequests : 0,
      byKey,
    };
  }

  // ─── Bulk Operations ───────────────────────────────────────

  async bulkSet<T>(storeName: string, items: T[]): Promise<void> {
    if (items.length === 0) return;

    try {
      const db = await this.ensureDB();
      return new Promise((resolve, reject) => {
        const store = this.getStore(db, storeName, 'readwrite');
        let completed = 0;

        items.forEach((item) => {
          const request = store.put(item);
          request.onsuccess = () => {
            completed++;
            if (completed === items.length) resolve();
          };
          request.onerror = () => reject(request.error);
        });
      });
    } catch (error) {
      console.error(`[StorageService] Error bulk setting in ${storeName}:`, error);
    }
  }

  async bulkDelete(storeName: string, keys: string[]): Promise<void> {
    if (keys.length === 0) return;

    try {
      const db = await this.ensureDB();
      return new Promise((resolve, reject) => {
        const store = this.getStore(db, storeName, 'readwrite');
        let completed = 0;

        keys.forEach((key) => {
          const request = store.delete(key);
          request.onsuccess = () => {
            completed++;
            if (completed === keys.length) resolve();
          };
          request.onerror = () => reject(request.error);
        });
      });
    } catch (error) {
      console.error(`[StorageService] Error bulk deleting from ${storeName}:`, error);
    }
  }

  // ─── Query Operations ──────────────────────────────────────

  async queryByIndex<T>(storeName: string, indexName: string, value: IDBValidKey): Promise<T[]> {
    try {
      const db = await this.ensureDB();
      return new Promise((resolve, reject) => {
        const store = this.getStore(db, storeName);
        const index = store.index(indexName);
        const request = index.getAll(value);

        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`[StorageService] Error querying ${storeName} by ${indexName}:`, error);
      return [];
    }
  }

  async queryByRange<T>(storeName: string, indexName: string, range: IDBKeyRange): Promise<T[]> {
    try {
      const db = await this.ensureDB();
      return new Promise((resolve, reject) => {
        const store = this.getStore(db, storeName);
        const index = store.index(indexName);
        const request = index.getAll(range);

        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`[StorageService] Error querying ${storeName} by range:`, error);
      return [];
    }
  }

  // ─── Storage Quota Management ──────────────────────────────

  async getStorageQuota(): Promise<StorageQuotaInfo> {
    let usage = 0;
    const byStore: Record<string, number> = {};

    for (const store of DB_SCHEMA.stores) {
      const items = await this.getAll<Record<string, unknown>>(store.name);
      const storeSize = items.reduce((acc, item) => {
        return acc + new Blob([JSON.stringify(item)]).size;
      }, 0);
      byStore[store.name] = storeSize;
      usage += storeSize;
    }

    let quota = 50 * 1024 * 1024; // Default 50MB estimate

    if (navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        quota = estimate.quota ?? quota;
        usage = estimate.usage ?? usage;
      } catch {
        // Fallback to estimate
      }
    }

    const usagePercent = quota > 0 ? usage / quota : 0;

    return {
      usage,
      quota,
      usagePercent,
      byStore,
      isWarning: usagePercent >= OFFLINE_CONFIG.storageQuotaWarning,
      isCritical: usagePercent >= OFFLINE_CONFIG.storageQuotaCritical,
    };
  }

  async requestPersistentStorage(): Promise<boolean> {
    if (navigator.storage && navigator.storage.persist) {
      try {
        const persisted = await navigator.storage.persist();
        console.log(`[StorageService] Persistent storage granted: ${persisted}`);
        return persisted;
      } catch {
        return false;
      }
    }
    return false;
  }

  async isStoragePersisted(): Promise<boolean> {
    if (navigator.storage && navigator.storage.persisted) {
      try {
        return await navigator.storage.persisted();
      } catch {
        return false;
      }
    }
    return false;
  }

  // ─── Data Integrity ────────────────────────────────────────

  async checkDataIntegrity(): Promise<DataIntegrityReport> {
    const report: DataIntegrityReport = {
      valid: true,
      stores: {},
      totalCorrupted: 0,
      totalExpired: 0,
      totalOrphaned: 0,
      timestamp: Date.now(),
    };

    for (const store of DB_SCHEMA.stores) {
      const items = await this.getAll<Record<string, unknown>>(store.name);
      let corrupted = 0;
      let expired = 0;
      let orphaned = 0;

      for (const item of items) {
        // Check for corrupted entries (missing keyPath)
        if (!item[store.keyPath]) {
          corrupted++;
          continue;
        }

        // Check for expired cache entries
        if (store.name === 'cache' && item.ttl && item.timestamp) {
          const ttl = item.ttl as number;
          const timestamp = item.timestamp as number;
          if (Date.now() - timestamp > ttl) {
            expired++;
          }
        }
      }

      report.stores[store.name] = {
        totalEntries: items.length,
        corrupted,
        expired,
        orphaned,
        valid: corrupted === 0,
      };

      report.totalCorrupted += corrupted;
      report.totalExpired += expired;
      report.totalOrphaned += orphaned;

      if (corrupted > 0) report.valid = false;
    }

    return report;
  }

  async repairIntegrity(): Promise<DataIntegrityReport> {
    const report = await this.checkDataIntegrity();

    for (const [storeName, storeReport] of Object.entries(report.stores)) {
      if (!storeReport.valid) {
        const items = await this.getAll<Record<string, unknown>>(storeName);
        const store = DB_SCHEMA.stores.find((s) => s.name === storeName);
        if (!store) continue;

        for (const item of items) {
          // Remove corrupted entries
          if (!item[store.keyPath]) {
            const possibleKey = item[store.keyPath];
            if (possibleKey) {
              await this.delete(storeName, possibleKey as string);
            }
          }

          // Remove expired cache entries
          if (storeName === 'cache' && item.ttl && item.timestamp) {
            const ttl = item.ttl as number;
            const timestamp = item.timestamp as number;
            if (Date.now() - timestamp > ttl) {
              await this.delete(storeName, item.key as string);
            }
          }
        }
      }
    }

    return this.checkDataIntegrity();
  }

  // ─── Database Info ─────────────────────────────────────────

  async getDatabaseInfo(): Promise<{ name: string; version: number; stores: Record<string, number> }> {
    const info: Record<string, number> = {};

    for (const store of DB_SCHEMA.stores) {
      info[store.name] = await this.count(store.name);
    }

    return {
      name: DB_SCHEMA.name,
      version: DB_SCHEMA.version,
      stores: info,
    };
  }

  async destroy(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(DB_SCHEMA.name);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const storageService = new StorageService();

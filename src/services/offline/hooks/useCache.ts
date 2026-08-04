// ============================================================
// Hook: useCache
// ============================================================

import { useState, useCallback } from 'react';
import { storageService } from '../storage/StorageService';

interface CacheResult {
  get: <T>(key: string) => Promise<T | null>;
  set: <T>(key: string, data: T, ttl?: number) => Promise<void>;
  remove: (key: string) => Promise<void>;
  clear: () => Promise<void>;
  clearExpired: () => Promise<number>;
  getInfo: () => Promise<{ name: string; version: number; stores: Record<string, number> }>;
  loading: boolean;
}

export function useCache(): CacheResult {
  const [loading, setLoading] = useState(false);

  const get = useCallback(async <T>(key: string) => {
    setLoading(true);
    try {
      return await storageService.cacheGet<T>(key);
    } finally {
      setLoading(false);
    }
  }, []);

  const set = useCallback(async <T>(key: string, data: T, ttl?: number) => {
    setLoading(true);
    try {
      await storageService.cacheSet(key, data, ttl);
    } finally {
      setLoading(false);
    }
  }, []);

  const remove = useCallback(async (key: string) => {
    await storageService.delete('cache', key);
  }, []);

  const clear = useCallback(async () => {
    await storageService.cacheClear();
  }, []);

  const clearExpired = useCallback(async () => {
    return storageService.cacheClearExpired();
  }, []);

  const getInfo = useCallback(async () => {
    return storageService.getDatabaseInfo();
  }, []);

  return {
    get,
    set,
    remove,
    clear,
    clearExpired,
    getInfo,
    loading,
  };
}

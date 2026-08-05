// ============================================================
// useSyncManager Hook - Enterprise Edition
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { syncManager } from '../SyncManager';
import { offlineManager } from '../OfflineManager';
import { OFFLINE_EVENTS } from '../config';
import type { SyncResult, PendingActionType } from '../types';

interface UseSyncManagerReturn {
  isSyncing: boolean;
  lastSyncAt: number | null;
  syncErrors: string[];
  syncNow: (
    triggeredBy?: 'auto' | 'manual' | 'reconnect' | 'background' | 'periodic',
  ) => Promise<SyncResult>;
  queueAction: (
    type: PendingActionType,
    payload: unknown,
    priority?: 'high' | 'normal' | 'low',
    idempotencyKey?: string,
  ) => Promise<string>;
  getQueueStatus: () => Promise<{
    pending: number;
    failed: number;
    completed: number;
    total: number;
  }>;
  syncData: <T>(key: string, fetchFn: () => Promise<T>) => Promise<T>;
  cacheData: <T>(key: string, data: T, ttl?: number) => Promise<void>;
  getCachedData: <T>(key: string) => Promise<T | null>;
  invalidateCache: (key?: string) => Promise<void>;
  clearExpiredCache: () => Promise<number>;
  getCacheStats: () => Promise<any>;
  resolveConflicts: () => Promise<SyncResult>;
  getStorageInfo: () => Promise<any>;
  getStorageQuota: () => Promise<any>;
}

export function useSyncManager(): UseSyncManagerReturn {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(syncManager.getLastSyncAt());
  const [syncErrors, setSyncErrors] = useState<string[]>(syncManager.getSyncErrors());

  useEffect(() => {
    const unsub1 = offlineManager.on(OFFLINE_EVENTS.SYNC_START, () => {
      setIsSyncing(true);
    });

    const unsub2 = offlineManager.on(OFFLINE_EVENTS.SYNC_COMPLETE, () => {
      setIsSyncing(false);
      setLastSyncAt(syncManager.getLastSyncAt());
      setSyncErrors(syncManager.getSyncErrors());
    });

    const unsub3 = offlineManager.on(OFFLINE_EVENTS.SYNC_ERROR, () => {
      setIsSyncing(false);
      setSyncErrors(syncManager.getSyncErrors());
    });

    return () => {
      unsub1();
      unsub2();
      unsub3();
    };
  }, []);

  const syncNow = useCallback(
    async (triggeredBy: 'auto' | 'manual' | 'reconnect' | 'background' | 'periodic' = 'manual') => {
      return syncManager.syncNow(triggeredBy);
    },
    [],
  );

  const queueAction = useCallback(
    async (
      type: PendingActionType,
      payload: unknown,
      priority: 'high' | 'normal' | 'low' = 'normal',
      idempotencyKey?: string,
    ) => {
      return syncManager.queueAction(type, payload, priority, idempotencyKey);
    },
    [],
  );

  const getQueueStatus = useCallback(async () => {
    return syncManager.getQueueStatus();
  }, []);

  const syncData = useCallback(async <T>(key: string, fetchFn: () => Promise<T>) => {
    return syncManager.syncData(key, fetchFn);
  }, []);

  const cacheData = useCallback(async <T>(key: string, data: T, ttl?: number) => {
    return syncManager.cacheData(key, data, ttl);
  }, []);

  const getCachedData = useCallback(async <T>(key: string) => {
    return syncManager.getCachedData<T>(key);
  }, []);

  const invalidateCache = useCallback(async (key?: string) => {
    return syncManager.invalidateCache(key);
  }, []);

  const clearExpiredCache = useCallback(async () => {
    return syncManager.clearExpiredCache();
  }, []);

  const getCacheStats = useCallback(async () => {
    return syncManager.getCacheStats();
  }, []);

  const resolveConflicts = useCallback(async () => {
    return syncManager.resolveConflicts();
  }, []);

  const getStorageInfo = useCallback(async () => {
    return syncManager.getStorageInfo();
  }, []);

  const getStorageQuota = useCallback(async () => {
    return syncManager.getStorageQuota();
  }, []);

  return {
    isSyncing,
    lastSyncAt,
    syncErrors,
    syncNow,
    queueAction,
    getQueueStatus,
    syncData,
    cacheData,
    getCachedData,
    invalidateCache,
    clearExpiredCache,
    getCacheStats,
    resolveConflicts,
    getStorageInfo,
    getStorageQuota,
  };
}

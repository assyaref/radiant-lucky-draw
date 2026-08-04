// ============================================================
// Sync Manager - Enterprise Edition
// ============================================================

import { offlineManager } from './OfflineManager';
import { storageService } from './storage/StorageService';
import { CACHE_KEYS } from './config';
import type { SyncResult, PendingActionType, SyncHistoryEntry } from './types';


class SyncManager {
  private syncing = false;
  private lastSyncAt: number | null = null;
  private syncErrors: string[] = [];
  private syncProgress = 0;
  private totalToSync = 0;

  getLastSyncAt(): number | null {
    return this.lastSyncAt;
  }

  getSyncErrors(): string[] {
    return [...this.syncErrors];
  }

  isSyncing(): boolean {
    return this.syncing;
  }

  getSyncProgress(): { current: number; total: number; percent: number } {
    return {
      current: this.syncProgress,
      total: this.totalToSync,
      percent: this.totalToSync > 0 ? Math.round((this.syncProgress / this.totalToSync) * 100) : 0,
    };
  }

  // ─── Manual Sync ───────────────────────────────────────────

  async syncNow(_triggeredBy: 'auto' | 'manual' | 'reconnect' | 'background' | 'periodic' = 'manual'): Promise<SyncResult> {
    if (this.syncing) {
      return { success: false, synced: 0, failed: 0, errors: ['Sync already in progress'] };
    }

    this.syncing = true;
    this.syncProgress = 0;
    this.totalToSync = 0;

    try {
      const pending = await offlineManager.getPendingActions();
      this.totalToSync = pending.filter((a) => a.status === 'pending').length;

      const result = await offlineManager.syncPendingActions();
      this.lastSyncAt = Date.now();
      this.syncProgress = result.synced + result.failed;

      if (result.errors.length > 0) {
        this.syncErrors = [...this.syncErrors, ...result.errors].slice(-50);
      }

      return result;
    } finally {
      this.syncing = false;
    }
  }

  // ─── Data Sync ─────────────────────────────────────────────

  async syncData<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
    const cached = await storageService.cacheGet<T>(key);

    if (offlineManager.isOnline()) {
      try {
        const fresh = await fetchFn();
        await storageService.cacheSet(key, fresh);
        return fresh;
      } catch (error) {
        if (cached) {
          console.warn(`[SyncManager] Fetch failed, using cached data for ${key}`);
          return cached;
        }
        throw error;
      }
    }

    if (cached) {
      return cached;
    }

    throw new Error(`Cannot fetch ${key}: offline and no cache available`);
  }

  // ─── Queue Operations ──────────────────────────────────────

  async queueAction(
    type: PendingActionType,
    payload: unknown,
    priority: 'high' | 'normal' | 'low' = 'normal',
    idempotencyKey?: string
  ): Promise<string> {
    return offlineManager.queueAction(type, payload, priority, idempotencyKey);
  }

  async getQueueStatus(): Promise<{ pending: number; failed: number; completed: number; total: number }> {
    const all = await offlineManager.getPendingActions();
    return {
      pending: all.filter((a) => a.status === 'pending').length,
      failed: all.filter((a) => a.status === 'failed').length,
      completed: all.filter((a) => a.status === 'completed').length,
      total: all.length,
    };
  }

  // ─── Cache Management ──────────────────────────────────────

  async cacheData<T>(key: string, data: T, ttl?: number): Promise<void> {
    await storageService.cacheSet(key, data, ttl);
  }

  async getCachedData<T>(key: string): Promise<T | null> {
    return storageService.cacheGet<T>(key);
  }

  async invalidateCache(key?: string): Promise<void> {
    if (key) {
      await storageService.delete('cache', key);
    } else {
      await storageService.cacheClear();
    }
  }

  async clearExpiredCache(): Promise<number> {
    return storageService.cacheClearExpired();
  }

  async getCacheStats() {
    return storageService.getCacheStats();
  }

  // ─── Full Data Refresh ─────────────────────────────────────

  async refreshAllData(): Promise<void> {
    if (!offlineManager.isOnline()) {
      throw new Error('Cannot refresh data while offline');
    }

    const refreshPromises = Object.values(CACHE_KEYS).map(async (key) => {
      try {
        await storageService.cacheSet(key, { refreshed: true, timestamp: Date.now() });
      } catch (error) {
        console.error(`[SyncManager] Failed to refresh ${key}:`, error);
      }
    });

    await Promise.all(refreshPromises);
  }

  // ─── Conflict Resolution ───────────────────────────────────

  async resolveConflicts(): Promise<SyncResult> {
    const failedItems = await offlineManager.getPendingActionsByStatus('failed');

    if (failedItems.length === 0) {
      return { success: true, synced: 0, failed: 0, errors: [] };
    }

    for (const item of failedItems) {
      if (item.action.retryCount < item.action.maxRetries) {
        item.status = 'pending';
        await storageService.set('pending_actions', item);
      }
    }

    return offlineManager.syncPendingActions();
  }

  // ─── Sync History ──────────────────────────────────────────

  async getSyncHistory(limit = 20): Promise<SyncHistoryEntry[]> {
    const all = await storageService.getAll<SyncHistoryEntry>('sync_history');
    return all
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  async getLastSyncResult(): Promise<SyncHistoryEntry | null> {
    const history = await this.getSyncHistory(1);
    return history[0] || null;
  }

  // ─── Storage Info ──────────────────────────────────────────

  async getStorageInfo() {
    return storageService.getDatabaseInfo();
  }

  async getStorageQuota() {
    return storageService.getStorageQuota();
  }

  async getCacheSize(): Promise<number> {
    const entries = await storageService.getAll('cache');
    return entries.length;
  }
}

export const syncManager = new SyncManager();

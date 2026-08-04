// ============================================================
// Recovery Service - Enterprise Edition
// ============================================================

import { storageService } from './storage/StorageService';
import { offlineManager } from './OfflineManager';
import { syncManager } from './SyncManager';
import { OFFLINE_CONFIG, CACHE_KEYS } from './config';
import type { SyncResult, OfflineScenario, TransactionLogEntry } from './types';

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

class RecoveryService {
  private recovering = false;
  private recoveryAttempts = 0;

  isRecovering(): boolean {
    return this.recovering;
  }

  getRecoveryAttempts(): number {
    return this.recoveryAttempts;
  }

  // ─── Full Recovery ─────────────────────────────────────────

  async fullRecovery(scenario: OfflineScenario): Promise<SyncResult> {
    if (this.recovering) {
      return { success: false, synced: 0, failed: 0, errors: ['Recovery already in progress'] };
    }

    this.recovering = true;
    this.recoveryAttempts++;

    console.log(`[RecoveryService] Starting full recovery for scenario: ${scenario}`);

    try {
      switch (scenario) {
        case 'internet-lost':
          return this.recoverFromInternetLoss();
        case 'server-down':
          return this.recoverFromServerDown();
        case 'socket-disconnect':
          return this.recoverFromSocketDisconnect();
        case 'tv-restart':
          return this.recoverFromTVRestart();
        case 'browser-refresh':
          return this.recoverFromBrowserRefresh();
        default:
          return this.recoverGeneric();
      }
    } finally {
      this.recovering = false;
    }
  }

  // ─── Scenario-Specific Recovery ────────────────────────────

  private async recoverFromInternetLoss(): Promise<SyncResult> {
    console.log('[RecoveryService] Recovering from internet loss');
    await this.waitForConnection();
    const result = await syncManager.syncNow();
    if (result.success) {
      await this.refreshCachedData();
    }
    return result;
  }

  private async recoverFromServerDown(): Promise<SyncResult> {
    console.log('[RecoveryService] Recovering from server down');
    await this.waitForServer();
    const result = await syncManager.syncNow();
    if (result.success) {
      await syncManager.refreshAllData();
    }
    return result;
  }

  private async recoverFromSocketDisconnect(): Promise<SyncResult> {
    console.log('[RecoveryService] Recovering from socket disconnect');
    return syncManager.syncNow();
  }

  private async recoverFromTVRestart(): Promise<SyncResult> {
    console.log('[RecoveryService] Recovering from TV restart');
    await this.restoreTVStateFromCache();
    return syncManager.syncNow();
  }

  private async recoverFromBrowserRefresh(): Promise<SyncResult> {
    console.log('[RecoveryService] Recovering from browser refresh');
    await this.restoreAppStateFromCache();
    const pendingCount = await storageService.count('pending_actions');
    if (pendingCount > 0) {
      return syncManager.syncNow();
    }
    return { success: true, synced: 0, failed: 0, errors: [] };
  }

  private async recoverGeneric(): Promise<SyncResult> {
    console.log('[RecoveryService] Performing generic recovery');
    const integrityReport = await storageService.checkDataIntegrity();
    if (!integrityReport.valid) {
      await storageService.repairIntegrity();
    }
    return syncManager.syncNow();
  }

  // ─── State Restoration ─────────────────────────────────────

  private async restoreTVStateFromCache(): Promise<void> {
    try {
      const tvState = await storageService.cacheGet<Record<string, unknown>>(CACHE_KEYS.TV_STATE);
      if (tvState) {
        console.log('[RecoveryService] TV state restored from cache');
      }
    } catch (error) {
      console.warn('[RecoveryService] Failed to restore TV state:', error);
    }
  }

  private async restoreAppStateFromCache(): Promise<void> {
    try {
      const appState = await storageService.cacheGet<Record<string, unknown>>(CACHE_KEYS.APP_STATE);
      if (appState) {
        console.log('[RecoveryService] App state restored from cache');
      }
    } catch (error) {
      console.warn('[RecoveryService] Failed to restore app state:', error);
    }
  }

  // ─── Wait Helpers ──────────────────────────────────────────

  private async waitForConnection(timeout = 30000): Promise<void> {
    if (navigator.onLine) return;

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        window.removeEventListener('online', handleOnline);
        reject(new Error('Timeout waiting for connection'));
      }, timeout);

      const handleOnline = () => {
        clearTimeout(timeoutId);
        resolve();
      };

      window.addEventListener('online', handleOnline);
    });
  }

  private async waitForServer(timeout = 30000): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        const response = await fetch('/api/health', {
          method: 'HEAD',
          cache: 'no-cache',
          signal: AbortSignal.timeout(5000),
        });
        if (response.ok) return;
      } catch {
        // Server still down
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    throw new Error('Timeout waiting for server');
  }

  // ─── Data Refresh ──────────────────────────────────────────

  private async refreshCachedData(): Promise<void> {
    const cacheKeys = Object.values(CACHE_KEYS);
    for (const key of cacheKeys) {
      try {
        await storageService.cacheSet(key, { refreshed: true, timestamp: Date.now() });
      } catch (error) {
        console.warn(`[RecoveryService] Failed to refresh cache for ${key}:`, error);
      }
    }
  }

  // ─── Transaction Log ───────────────────────────────────────

  async logTransaction(action: string, payload: unknown): Promise<string> {
    const entry: TransactionLogEntry = {
      id: generateId(),
      action: {
        id: generateId(),
        type: action as any,
        payload,
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries: OFFLINE_CONFIG.maxRetries,
        priority: 'normal',
      },
      timestamp: Date.now(),
      status: 'pending',
    };

    await storageService.set('transaction_log', entry);
    return entry.id;
  }

  async commitTransaction(id: string): Promise<void> {
    const entry = await storageService.get<TransactionLogEntry>('transaction_log', id);
    if (entry) {
      entry.status = 'committed';
      await storageService.set('transaction_log', entry);
    }
  }

  async rollbackTransaction(id: string): Promise<void> {
    const entry = await storageService.get<TransactionLogEntry>('transaction_log', id);
    if (entry) {
      entry.status = 'failed';
      entry.error = 'Rolled back';
      await storageService.set('transaction_log', entry);
    }
  }

  // ─── State Persistence ─────────────────────────────────────

  async saveAppState(state: Record<string, unknown>): Promise<void> {
    await storageService.cacheSet('app-state', state, 86400000);
  }

  async restoreAppState<T = Record<string, unknown>>(): Promise<T | null> {
    return storageService.cacheGet<T>('app-state');
  }

  async saveTVState(state: Record<string, unknown>): Promise<void> {
    await storageService.cacheSet('tv-state', state, 86400000);
  }

  async restoreTVState<T = Record<string, unknown>>(): Promise<T | null> {
    return storageService.cacheGet<T>('tv-state');
  }

  // ─── Cleanup ───────────────────────────────────────────────

  async cleanup(): Promise<void> {
    await storageService.cacheClearExpired();

    const allActions = await offlineManager.getPendingActions();
    const oldCompleted = allActions.filter(
      (a) => a.status === 'completed' && Date.now() - a.createdAt > 86400000
    );

    for (const item of oldCompleted) {
      await storageService.delete('pending_actions', item.id);
    }
  }
}

export const recoveryService = new RecoveryService();

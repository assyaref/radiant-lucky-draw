// ============================================================
// Offline Manager - Enterprise Edition
// ============================================================

import { OFFLINE_CONFIG, OFFLINE_EVENTS, PRIORITY_ORDER, API_ENDPOINTS } from './config';
import { storageService } from './storage/StorageService';
import type {
  ConnectionStatus,
  OfflineScenario,
  OfflineState,
  PendingAction,
  PendingActionType,
  SyncQueueItem,
  SyncResult,
  NetworkInfo,
  SyncHistoryEntry,
  ConflictInfo,
} from './types';

type EventCallback = (...args: unknown[]) => void;

class OfflineManager {
  private state: OfflineState;
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private syncTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private serverCheckTimer: ReturnType<typeof setInterval> | null = null;
  private healthCheckTimer: ReturnType<typeof setInterval> | null = null;
  private processing = false;
  private networkInfo: NetworkInfo | null = null;
  private abortController: AbortController | null = null;

  constructor() {
    this.state = {
      status: navigator.onLine ? 'online' : 'offline',
      scenario: null,
      isOnline: navigator.onLine,
      isServerReachable: true,
      isSocketConnected: true,
      pendingCount: 0,
      lastOnlineAt: navigator.onLine ? Date.now() : null,
      lastOfflineAt: navigator.onLine ? null : Date.now(),
      reconnecting: false,
      reconnectAttempts: 0,
    };

    this.init();
  }

  private async init(): Promise<void> {
    await storageService.waitForReady();
    this.state.pendingCount = await storageService.count('pending_actions');
    this.setupListeners();
    this.startSyncTimer();
    this.startServerCheck();
    this.startHealthCheck();
    this.captureNetworkInfo();
  }

  // ─── Public API ────────────────────────────────────────────

  getState(): OfflineState {
    return { ...this.state };
  }

  isOnline(): boolean {
    return this.state.isOnline && this.state.isServerReachable;
  }

  getPendingCount(): number {
    return this.state.pendingCount;
  }

  getNetworkInfo(): NetworkInfo | null {
    return this.networkInfo ? { ...this.networkInfo } : null;
  }

  // ─── Connection Detection ──────────────────────────────────

  private setupListeners(): void {
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline('internet-lost'));
  }

  private handleOnline(): void {
    console.log('[OfflineManager] Browser detected online');
    this.state.isOnline = true;
    this.state.lastOnlineAt = Date.now();
    this.state.lastOfflineAt = null;
    this.state.reconnectAttempts = 0;

    this.updateStatus('reconnecting');
    this.attemptReconnect();
  }

  private handleOffline(scenario: OfflineScenario): void {
    console.log(`[OfflineManager] Offline detected: ${scenario}`);
    this.state.isOnline = false;
    this.state.lastOfflineAt = Date.now();
    this.state.scenario = scenario;

    this.updateStatus('offline');
    this.emit(OFFLINE_EVENTS.STATUS_CHANGE, this.state);
  }

  // ─── Network Info ──────────────────────────────────────────

  private captureNetworkInfo(): void {
    if ('connection' in navigator) {
      const conn = (navigator as any).connection;
      this.networkInfo = {
        online: navigator.onLine,
        type: conn?.type || 'unknown',
        effectiveType: conn?.effectiveType || 'unknown',
        downlink: conn?.downlink || 0,
        rtt: conn?.rtt || 0,
        dataSaver: conn?.saveData || false,
        saveData: conn?.saveData || false,
      };

      conn?.addEventListener('change', () => {
        this.captureNetworkInfo();
        this.emit(OFFLINE_EVENTS.NETWORK_CHANGE, this.networkInfo);
      });
    }
  }

  // ─── Server Detection ──────────────────────────────────────

  private startServerCheck(): void {
    this.serverCheckTimer = setInterval(() => {
      this.checkServerReachability();
    }, OFFLINE_CONFIG.healthCheckInterval);
  }

  private async checkServerReachability(): Promise<void> {
    try {
      const response = await fetch(API_ENDPOINTS.HEALTH, {
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(OFFLINE_CONFIG.healthCheckTimeout),
      });

      const wasDown = !this.state.isServerReachable;
      this.state.isServerReachable = response.ok;

      if (wasDown && this.state.isServerReachable) {
        console.log('[OfflineManager] Server is reachable again');
        this.handleServerRestored();
      }
    } catch {
      if (this.state.isServerReachable) {
        console.log('[OfflineManager] Server unreachable');
        this.state.isServerReachable = false;
        this.state.scenario = 'server-down';
        this.updateStatus('server-down');
        this.emit(OFFLINE_EVENTS.STATUS_CHANGE, this.state);
      }
    }
  }

  private handleServerRestored(): void {
    this.state.scenario = null;
    this.updateStatus('reconnecting');
    this.attemptReconnect();
  }

  // ─── Health Check ──────────────────────────────────────────

  private startHealthCheck(): void {
    this.healthCheckTimer = setInterval(() => {
      this.performHealthCheck();
    }, OFFLINE_CONFIG.healthCheckInterval * 2);
  }

  private async performHealthCheck(): Promise<void> {
    try {
      const quota = await storageService.getStorageQuota();
      if (quota.isCritical) {
        console.warn('[OfflineManager] Storage quota critical');
        await storageService.cacheClearExpired();
        this.emit(OFFLINE_EVENTS.STORAGE_QUOTA_CRITICAL, quota);
      } else if (quota.isWarning) {
        console.warn('[OfflineManager] Storage quota warning');
        this.emit(OFFLINE_EVENTS.STORAGE_QUOTA_WARNING, quota);
      }
    } catch (error) {
      console.error('[OfflineManager] Health check failed:', error);
    }
  }

  // ─── Socket Detection ──────────────────────────────────────

  setSocketConnected(connected: boolean): void {
    const wasDisconnected = !this.state.isSocketConnected;
    this.state.isSocketConnected = connected;

    if (!connected && this.state.isOnline) {
      this.state.scenario = 'socket-disconnect';
      this.updateStatus('socket-disconnected');
      this.emit(OFFLINE_EVENTS.STATUS_CHANGE, this.state);
    }

    if (wasDisconnected && connected) {
      this.state.scenario = null;
      this.updateStatus('reconnecting');
      this.attemptReconnect();
    }
  }

  // ─── Reconnection ──────────────────────────────────────────

  private attemptReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.state.reconnecting = true;
    this.state.reconnectAttempts++;
    this.emit(OFFLINE_EVENTS.RECONNECTING, this.state.reconnectAttempts);

    const delay = Math.min(
      OFFLINE_CONFIG.reconnectDelay *
        Math.pow(OFFLINE_CONFIG.retryBackoff, this.state.reconnectAttempts - 1),
      30000,
    );

    this.reconnectTimer = setTimeout(async () => {
      const success = await this.tryReconnect();

      if (success) {
        this.state.reconnecting = false;
        this.state.reconnectAttempts = 0;
        this.state.scenario = null;
        this.updateStatus('online');
        this.emit(OFFLINE_EVENTS.RECONNECTED);

        // Trigger sync after reconnection
        await this.syncPendingActions();
      } else if (this.state.reconnectAttempts < OFFLINE_CONFIG.reconnectMaxAttempts) {
        this.attemptReconnect();
      } else {
        this.state.reconnecting = false;
        console.log('[OfflineManager] Max reconnection attempts reached');
      }
    }, delay);
  }

  private async tryReconnect(): Promise<boolean> {
    try {
      const response = await fetch(API_ENDPOINTS.HEALTH, {
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(OFFLINE_CONFIG.healthCheckTimeout),
      });

      if (response.ok) {
        this.state.isServerReachable = true;
        this.state.isOnline = navigator.onLine;
        return true;
      }
    } catch {
      // Server still unreachable
    }

    return false;
  }

  // ─── Status Management ─────────────────────────────────────

  private updateStatus(status: ConnectionStatus): void {
    this.state.status = status;
    this.emit(OFFLINE_EVENTS.STATUS_CHANGE, this.state);
  }

  // ─── Pending Actions Queue ─────────────────────────────────

  async queueAction(
    type: PendingActionType,
    payload: unknown,
    priority: 'high' | 'normal' | 'low' = 'normal',
    idempotencyKey?: string,
  ): Promise<string> {
    const action: PendingAction = {
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      payload,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: OFFLINE_CONFIG.maxRetries,
      priority,
      idempotencyKey,
    };

    // Check for duplicate by idempotency key
    if (idempotencyKey) {
      const existing = await this.findActionByIdempotencyKey(idempotencyKey);
      if (existing) {
        console.log(`[OfflineManager] Duplicate action prevented: ${idempotencyKey}`);
        return existing.id;
      }
    }

    const queueItem: SyncQueueItem = {
      id: action.id,
      action,
      createdAt: Date.now(),
      lastAttempt: null,
      status: 'pending',
      attempts: 0,
    };

    await storageService.set('pending_actions', queueItem);
    this.state.pendingCount = await storageService.count('pending_actions');

    this.emit(OFFLINE_EVENTS.ACTION_QUEUED, action);

    // If online, try to process immediately
    if (this.isOnline()) {
      this.processQueue();
    }

    return action.id;
  }

  private async findActionByIdempotencyKey(key: string): Promise<SyncQueueItem | null> {
    const items = await this.getPendingActions();
    return items.find((item) => item.action.idempotencyKey === key) || null;
  }

  async getPendingActions(): Promise<SyncQueueItem[]> {
    return storageService.getAll<SyncQueueItem>('pending_actions');
  }

  async getPendingActionsByStatus(status: SyncQueueItem['status']): Promise<SyncQueueItem[]> {
    return storageService.queryByIndex<SyncQueueItem>('pending_actions', 'by_status', status);
  }

  async removePendingAction(id: string): Promise<void> {
    await storageService.delete('pending_actions', id);
    this.state.pendingCount = await storageService.count('pending_actions');
    this.emit(OFFLINE_EVENTS.ACTION_PROCESSED, id);
  }

  async clearPendingActions(): Promise<void> {
    await storageService.clear('pending_actions');
    this.state.pendingCount = 0;
  }

  // ─── Sync Engine ───────────────────────────────────────────

  private startSyncTimer(): void {
    this.syncTimer = setInterval(() => {
      if (this.isOnline()) {
        this.syncPendingActions();
      }
    }, OFFLINE_CONFIG.syncInterval);
  }

  async syncPendingActions(): Promise<SyncResult> {
    if (this.processing) {
      return { success: false, synced: 0, failed: 0, errors: ['Already syncing'] };
    }

    this.processing = true;
    this.emit(OFFLINE_EVENTS.SYNC_START);

    const result: SyncResult = {
      success: true,
      synced: 0,
      failed: 0,
      errors: [],
      duration: 0,
      batchId: `batch_${Date.now()}`,
    };

    const startTime = Date.now();

    try {
      const pendingItems = await this.getPendingActionsByStatus('pending');

      // Sort by priority then timestamp
      pendingItems.sort((a, b) => {
        const pDiff = PRIORITY_ORDER[a.action.priority] - PRIORITY_ORDER[b.action.priority];
        return pDiff !== 0 ? pDiff : a.createdAt - b.createdAt;
      });

      // Process in batches
      const batchSize = OFFLINE_CONFIG.maxBatchSize;
      for (let i = 0; i < pendingItems.length; i += batchSize) {
        const batch = pendingItems.slice(i, i + batchSize);
        await this.processBatch(batch, result);

        if (!this.isOnline()) break; // Stop if we go offline mid-sync
      }

      this.state.pendingCount = await storageService.count('pending_actions');
      result.success = result.failed === 0;
      result.duration = Date.now() - startTime;

      // Record sync history
      const historyEntry: SyncHistoryEntry = {
        id: result.batchId!,
        timestamp: Date.now(),
        result: { ...result },
        triggeredBy: 'auto',
        duration: result.duration,
      };
      await storageService.set('sync_history', historyEntry);

      this.emit(OFFLINE_EVENTS.SYNC_COMPLETE, result);
    } catch (error) {
      result.success = false;
      result.errors.push((error as Error).message);
      this.emit(OFFLINE_EVENTS.SYNC_ERROR, error);
    } finally {
      this.processing = false;
    }

    return result;
  }

  private async processBatch(batch: SyncQueueItem[], result: SyncResult): Promise<void> {
    const batchPromises = batch.map(async (item) => {
      try {
        // Lock the item
        item.status = 'in-progress';
        item.lastAttempt = Date.now();
        item.attempts = (item.attempts || 0) + 1;
        item.lockedUntil = Date.now() + 30000; // 30 second lock
        await storageService.set('pending_actions', item);

        await this.processAction(item.action);

        item.status = 'completed';
        item.lockedUntil = undefined;
        await storageService.set('pending_actions', item);
        result.synced++;
      } catch (error) {
        item.action.retryCount++;
        item.status = item.action.retryCount >= item.action.maxRetries ? 'failed' : 'pending';
        item.error = (error as Error).message;
        item.lockedUntil = undefined;
        await storageService.set('pending_actions', item);

        if (item.status === 'failed') {
          result.failed++;
          result.errors.push(`[${item.action.type}] ${(error as Error).message}`);
        }
      }
    });

    await Promise.allSettled(batchPromises);
  }

  private async processAction(action: PendingAction): Promise<void> {
    switch (action.type) {
      case 'draw-start':
      case 'draw-complete':
      case 'register-participant':
      case 'update-prize':
      case 'update-queue':
      case 'announcement':
      case 'sync-request':
      case 'bulk-register':
      case 'draw-cancel':
      case 'prize-reorder':
      case 'settings-update':
      case 'sponsor-update':
        await this.executeApiCall(action);
        break;
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  private async executeApiCall(action: PendingAction): Promise<void> {
    const endpoint = this.getEndpointForAction(action.type);
    if (!endpoint) {
      throw new Error(`No endpoint configured for action type: ${action.type}`);
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Idempotency-Key': action.idempotencyKey || action.id,
      },
      body: JSON.stringify(action.payload),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'Unknown error');
      throw new Error(`API error ${response.status}: ${errorBody}`);
    }
  }

  private getEndpointForAction(type: PendingActionType): string | null {
    const endpointMap: Record<string, string> = {
      'draw-start': `${API_ENDPOINTS.DRAWS}/start`,
      'draw-complete': `${API_ENDPOINTS.DRAWS}/complete`,
      'register-participant': API_ENDPOINTS.PARTICIPANTS,
      'update-prize': API_ENDPOINTS.PRIZES,
      'update-queue': API_ENDPOINTS.QUEUE,
      announcement: API_ENDPOINTS.ANNOUNCEMENTS,
      'sync-request': API_ENDPOINTS.SYNC,
      'bulk-register': `${API_ENDPOINTS.PARTICIPANTS}/bulk`,
      'draw-cancel': `${API_ENDPOINTS.DRAWS}/cancel`,
      'prize-reorder': `${API_ENDPOINTS.PRIZES}/reorder`,
      'settings-update': API_ENDPOINTS.SETTINGS,
      'sponsor-update': API_ENDPOINTS.SPONSORS,
    };
    return endpointMap[type] || null;
  }

  private async processQueue(): Promise<void> {
    if (!this.processing) {
      await this.syncPendingActions();
    }
  }

  // ─── Conflict Resolution ───────────────────────────────────

  async detectConflicts(): Promise<ConflictInfo[]> {
    const failedItems = await this.getPendingActionsByStatus('failed');
    const conflicts: ConflictInfo[] = [];

    for (const item of failedItems) {
      if (item.error?.includes('409') || item.error?.includes('conflict')) {
        conflicts.push({
          id: item.id,
          actionType: item.action.type,
          localPayload: item.action.payload,
          serverPayload: null,
          timestamp: item.createdAt,
          resolved: false,
        });
      }
    }

    return conflicts;
  }

  async resolveConflict(
    conflictId: string,
    resolution: 'local' | 'server' | 'merged',
    mergedPayload?: unknown,
  ): Promise<void> {
    const item = await storageService.get<SyncQueueItem>('pending_actions', conflictId);
    if (!item) throw new Error(`Conflict ${conflictId} not found`);

    switch (resolution) {
      case 'local':
        // Retry with local data
        item.status = 'pending';
        item.action.retryCount = 0;
        item.error = undefined;
        break;
      case 'server':
        // Discard local changes
        await this.removePendingAction(conflictId);
        return;
      case 'merged':
        // Use merged payload
        item.action.payload = mergedPayload;
        item.status = 'pending';
        item.action.retryCount = 0;
        item.error = undefined;
        break;
    }

    await storageService.set('pending_actions', item);

    // Record resolution
    const conflictInfo: ConflictInfo = {
      id: conflictId,
      actionType: item.action.type,
      localPayload: item.action.payload,
      serverPayload: null,
      timestamp: Date.now(),
      resolved: true,
      resolution,
    };
    await storageService.set('conflicts', conflictInfo);

    this.emit(OFFLINE_EVENTS.CONFLICT_RESOLVED, conflictInfo);
  }

  // ─── Background Sync ───────────────────────────────────────

  async registerBackgroundSync(): Promise<void> {
    if (!('serviceWorker' in navigator) || !('SyncManager' in window)) {
      console.log('[OfflineManager] Background sync not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await (registration as any).sync.register('offline-sync');
      console.log('[OfflineManager] Background sync registered');
    } catch (error) {
      console.error('[OfflineManager] Background sync registration failed:', error);
    }
  }

  // ─── Event System ──────────────────────────────────────────

  on(event: string, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  off(event: string, callback: EventCallback): void {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, ...args: unknown[]): void {
    this.listeners.get(event)?.forEach((callback) => {
      try {
        callback(...args);
      } catch (error) {
        console.error(`[OfflineManager] Error in event listener for ${event}:`, error);
      }
    });
  }

  // ─── Cleanup ───────────────────────────────────────────────

  destroy(): void {
    if (this.syncTimer) clearInterval(this.syncTimer);
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.serverCheckTimer) clearInterval(this.serverCheckTimer);
    if (this.healthCheckTimer) clearInterval(this.healthCheckTimer);
    if (this.abortController) this.abortController.abort();
    this.listeners.clear();
  }
}

export const offlineManager = new OfflineManager();

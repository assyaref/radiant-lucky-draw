// ============================================================
// Offline Mode Types - Enterprise Edition
// ============================================================

export type ConnectionStatus =
  'online' | 'offline' | 'reconnecting' | 'server-down' | 'socket-disconnected';

export type OfflineScenario =
  'internet-lost' | 'server-down' | 'socket-disconnect' | 'tv-restart' | 'browser-refresh';

export type PendingActionType =
  | 'draw-start'
  | 'draw-complete'
  | 'register-participant'
  | 'update-prize'
  | 'update-queue'
  | 'announcement'
  | 'sync-request'
  | 'bulk-register'
  | 'draw-cancel'
  | 'prize-reorder'
  | 'settings-update'
  | 'sponsor-update';

export interface PendingAction {
  id: string;
  type: PendingActionType;
  payload: unknown;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  priority: 'high' | 'normal' | 'low';
  idempotencyKey?: string;
  metadata?: Record<string, unknown>;
}

export interface CacheEntry<T = unknown> {
  key: string;
  data: T;
  timestamp: number;
  ttl: number;
  version: number;
  compressed?: boolean;
  checksum?: string;
}

export interface SyncQueueItem {
  id: string;
  action: PendingAction;
  createdAt: number;
  lastAttempt: number | null;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  error?: string;
  attempts: number;
  lockedUntil?: number;
  batchId?: string;
}

export interface OfflineState {
  status: ConnectionStatus;
  scenario: OfflineScenario | null;
  isOnline: boolean;
  isServerReachable: boolean;
  isSocketConnected: boolean;
  pendingCount: number;
  lastOnlineAt: number | null;
  lastOfflineAt: number | null;
  reconnecting: boolean;
  reconnectAttempts: number;
  networkType?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  dataSaver?: boolean;
}

export interface StorageSchema {
  name: string;
  version: number;
  stores: StorageStore[];
}

export interface StorageStore {
  name: string;
  keyPath: string;
  indexes?: { name: string; keyPath: string; unique?: boolean }[];
}

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: string[];
  duration?: number;
  batchId?: string;
}

export interface OfflineConfig {
  maxRetries: number;
  retryDelay: number;
  retryBackoff: number;
  syncInterval: number;
  cacheTTL: number;
  storageVersion: number;
  reconnectMaxAttempts: number;
  reconnectDelay: number;
  healthCheckInterval: number;
  healthCheckTimeout: number;
  maxBatchSize: number;
  conflictStrategy: 'last-write-wins' | 'server-wins' | 'client-wins' | 'manual';
  encryptionEnabled: boolean;
  storageQuotaWarning: number;
  storageQuotaCritical: number;
  backgroundSyncEnabled: boolean;
  periodicSyncInterval: number;
}

// ─── Enterprise Types ─────────────────────────────────────────

export interface NetworkInfo {
  online: boolean;
  type: string;
  effectiveType: string;
  downlink: number;
  rtt: number;
  dataSaver: boolean;
  saveData: boolean;
}

export interface SyncHistoryEntry {
  id: string;
  timestamp: number;
  result: SyncResult;
  triggeredBy: 'auto' | 'manual' | 'reconnect' | 'background' | 'periodic';
  duration: number;
}

export interface TransactionLogEntry {
  id: string;
  action: PendingAction;
  timestamp: number;
  status: 'pending' | 'committed' | 'rolled-back' | 'failed';
  error?: string;
  checkpoint?: boolean;
}

export interface StorageQuotaInfo {
  usage: number;
  quota: number;
  usagePercent: number;
  byStore: Record<string, number>;
  isWarning: boolean;
  isCritical: boolean;
}

export interface ConflictInfo {
  id: string;
  actionType: PendingActionType;
  localPayload: unknown;
  serverPayload: unknown;
  timestamp: number;
  resolved: boolean;
  resolution?: 'local' | 'server' | 'merged';
}

export interface DataIntegrityReport {
  valid: boolean;
  stores: Record<
    string,
    {
      totalEntries: number;
      corrupted: number;
      expired: number;
      orphaned: number;
      valid: boolean;
    }
  >;
  totalCorrupted: number;
  totalExpired: number;
  totalOrphaned: number;
  timestamp: number;
}

export interface BackgroundSyncRegistration {
  tag: string;
  interval: number;
  lastSync: number | null;
  registered: boolean;
}

export interface CacheStats {
  totalEntries: number;
  totalSize: number;
  expiredEntries: number;
  hitRate: number;
  missRate: number;
  byKey: Record<string, { size: number; ttl: number; age: number }>;
}

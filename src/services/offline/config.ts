// ============================================================
// Offline Mode Configuration - Enterprise Edition
// ============================================================

import { env } from '@config/env';
import type { OfflineConfig, StorageSchema } from './types';

export const OFFLINE_CONFIG: OfflineConfig = {
  maxRetries: 5,
  retryDelay: 1000,
  retryBackoff: 2,
  syncInterval: 30000,
  cacheTTL: 3600000,
  storageVersion: 2,
  reconnectMaxAttempts: 10,
  reconnectDelay: 2000,
  healthCheckInterval: 15000,
  healthCheckTimeout: 5000,
  maxBatchSize: 50,
  conflictStrategy: 'last-write-wins',
  encryptionEnabled: false,
  storageQuotaWarning: 0.7,
  storageQuotaCritical: 0.9,
  backgroundSyncEnabled: true,
  periodicSyncInterval: 3600000,
};

export const DB_SCHEMA: StorageSchema = {
  name: 'RadiantLuckyDraw',
  version: 2,
  stores: [
    {
      name: 'pending_actions',
      keyPath: 'id',
      indexes: [
        { name: 'by_status', keyPath: 'status' },
        { name: 'by_priority', keyPath: 'action.priority' },
        { name: 'by_timestamp', keyPath: 'createdAt' },
        { name: 'by_batch', keyPath: 'batchId' },
        { name: 'by_locked', keyPath: 'lockedUntil' },
      ],
    },
    {
      name: 'cache',
      keyPath: 'key',
      indexes: [
        { name: 'by_timestamp', keyPath: 'timestamp' },
        { name: 'by_ttl', keyPath: 'ttl' },
        { name: 'by_version', keyPath: 'version' },
      ],
    },
    {
      name: 'participants',
      keyPath: 'id',
      indexes: [
        { name: 'by_name', keyPath: 'name' },
        { name: 'by_status', keyPath: 'status' },
        { name: 'by_created', keyPath: 'createdAt' },
      ],
    },
    {
      name: 'draws',
      keyPath: 'id',
      indexes: [
        { name: 'by_status', keyPath: 'status' },
        { name: 'by_date', keyPath: 'createdAt' },
        { name: 'by_prize', keyPath: 'prizeId' },
      ],
    },
    {
      name: 'prizes',
      keyPath: 'id',
      indexes: [
        { name: 'by_name', keyPath: 'name' },
        { name: 'by_tier', keyPath: 'tier' },
        { name: 'by_active', keyPath: 'isActive' },
      ],
    },
    {
      name: 'settings',
      keyPath: 'key',
    },
    {
      name: 'sync_history',
      keyPath: 'id',
      indexes: [
        { name: 'by_timestamp', keyPath: 'timestamp' },
        { name: 'by_triggered', keyPath: 'triggeredBy' },
      ],
    },
    {
      name: 'transaction_log',
      keyPath: 'id',
      indexes: [
        { name: 'by_timestamp', keyPath: 'timestamp' },
        { name: 'by_status', keyPath: 'status' },
        { name: 'by_checkpoint', keyPath: 'checkpoint' },
      ],
    },
    {
      name: 'conflicts',
      keyPath: 'id',
      indexes: [
        { name: 'by_resolved', keyPath: 'resolved' },
        { name: 'by_timestamp', keyPath: 'timestamp' },
      ],
    },
  ],
};

export const CACHE_KEYS = {
  PARTICIPANTS: 'participants',
  PRIZES: 'prizes',
  DRAWS: 'draws',
  QUEUE: 'queue',
  SETTINGS: 'settings',
  DASHBOARD: 'dashboard',
  ANALYTICS: 'analytics',
  SPONSORS: 'sponsors',
  ANNOUNCEMENTS: 'announcements',
  TV_STATE: 'tv-state',
  APP_STATE: 'app-state',
  USER_SESSION: 'user-session',
  NETWORK_INFO: 'network-info',
} as const;

export const OFFLINE_EVENTS = {
  STATUS_CHANGE: 'offline:status-change',
  SYNC_START: 'offline:sync-start',
  SYNC_COMPLETE: 'offline:sync-complete',
  SYNC_ERROR: 'offline:sync-error',
  ACTION_QUEUED: 'offline:action-queued',
  ACTION_PROCESSED: 'offline:action-processed',
  CACHE_UPDATED: 'offline:cache-updated',
  RECONNECTING: 'offline:reconnecting',
  RECONNECTED: 'offline:reconnected',
  NETWORK_CHANGE: 'offline:network-change',
  STORAGE_QUOTA_WARNING: 'offline:storage-quota-warning',
  STORAGE_QUOTA_CRITICAL: 'offline:storage-quota-critical',
  CONFLICT_DETECTED: 'offline:conflict-detected',
  CONFLICT_RESOLVED: 'offline:conflict-resolved',
  BACKGROUND_SYNC: 'offline:background-sync',
  DATA_INTEGRITY_CHECK: 'offline:data-integrity-check',
} as const;

// API endpoints resolved from the single configuration source (env.API_BASE_URL).
// This guarantees the offline sync engine targets the same backend as the rest
// of the app (Railway in production, localhost via the Vite proxy in development).
// NOTE: env.API_BASE_URL already includes the `/api` prefix (see src/config/env.ts),
// so it must NOT be appended again here.
const API_BASE = env.API_BASE_URL;

export const API_ENDPOINTS = {
  HEALTH: `${API_BASE}/health`,
  SYNC: `${API_BASE}/sync`,
  PARTICIPANTS: `${API_BASE}/participants`,
  PRIZES: `${API_BASE}/prizes`,
  DRAWS: `${API_BASE}/draws`,
  QUEUE: `${API_BASE}/queue`,
  SETTINGS: `${API_BASE}/settings`,
  ANALYTICS: `${API_BASE}/analytics`,
  SPONSORS: `${API_BASE}/sponsors`,
  ANNOUNCEMENTS: `${API_BASE}/announcements`,
} as const;

export const PRIORITY_ORDER: Record<string, number> = {
  high: 0,
  normal: 1,
  low: 2,
};

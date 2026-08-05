// ============================================================
// Offline Mode Module Index
// ============================================================

// Core Services
export { offlineManager } from './OfflineManager';
export { syncManager } from './SyncManager';
export { recoveryService } from './RecoveryService';
export { storageService } from './storage/StorageService';

// Types
export type {
  ConnectionStatus,
  OfflineScenario,
  PendingActionType,
  PendingAction,
  CacheEntry,
  SyncQueueItem,
  OfflineState,
  StorageSchema,
  StorageStore,
  SyncResult,
  OfflineConfig,
} from './types';

// Config
export { OFFLINE_CONFIG, DB_SCHEMA, CACHE_KEYS, OFFLINE_EVENTS } from './config';

// Hooks
export {
  useOfflineStatus,
  useSyncManager,
  useRecovery,
  useCache,
  usePendingActions,
} from './hooks';

// Context
export { OfflineProvider, useOfflineContext } from './context';

// Components
export { OfflineBanner, OfflineIndicator, SyncStatus } from './components';

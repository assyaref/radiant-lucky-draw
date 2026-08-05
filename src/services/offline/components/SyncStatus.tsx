// ============================================================
// Sync Status Component
// ============================================================

import { motion } from 'framer-motion';
import { useSyncManager } from '../hooks/useSyncManager';
import { usePendingActions } from '../hooks/usePendingActions';

interface SyncStatusProps {
  className?: string;
  compact?: boolean;
}

export function SyncStatus({ className = '', compact = false }: SyncStatusProps) {
  const { isSyncing, lastSyncAt, syncErrors } = useSyncManager();
  const { pendingCount, failedCount } = usePendingActions();

  const formatTime = (timestamp: number) => {
    // eslint-disable-next-line react-hooks/purity -- Date.now used for relative timestamp display
    const diff = Date.now() - timestamp;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return `${Math.floor(diff / 3600000)}h ago`;
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-2 text-xs ${className}`}>
        {isSyncing && (
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="inline-block w-3 h-3 border-2 border-primary-400 border-t-transparent rounded-full"
          />
        )}
        {pendingCount > 0 && <span className="text-amber-400">{pendingCount} pending</span>}
        {failedCount > 0 && <span className="text-red-400">{failedCount} failed</span>}
        {lastSyncAt && !isSyncing && pendingCount === 0 && (
          <span className="text-green-400">Synced {formatTime(lastSyncAt)}</span>
        )}
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border border-dark-border bg-dark-surface-secondary p-4 ${className}`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">Sync Status</h3>
        {isSyncing && (
          <div className="flex items-center gap-2 text-xs text-primary-400">
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="inline-block w-3 h-3 border-2 border-primary-400 border-t-transparent rounded-full"
            />
            Syncing...
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-dark-text-tertiary">Pending</span>
          <span className={pendingCount > 0 ? 'text-amber-400 font-medium' : 'text-green-400'}>
            {pendingCount}
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-dark-text-tertiary">Failed</span>
          <span
            className={failedCount > 0 ? 'text-red-400 font-medium' : 'text-dark-text-secondary'}
          >
            {failedCount}
          </span>
        </div>
        {lastSyncAt && (
          <div className="flex justify-between text-xs">
            <span className="text-dark-text-tertiary">Last Sync</span>
            <span className="text-dark-text-secondary">{formatTime(lastSyncAt)}</span>
          </div>
        )}
      </div>

      {syncErrors.length > 0 && (
        <div className="mt-3 pt-3 border-t border-dark-border">
          <p className="text-xs text-red-400 mb-1">Recent Errors:</p>
          <div className="max-h-20 overflow-y-auto space-y-1">
            {syncErrors.slice(-3).map((err, i) => (
              <p key={i} className="text-xs text-red-400/70 truncate">
                {err}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

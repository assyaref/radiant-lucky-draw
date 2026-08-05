// ============================================================
// Hook: usePendingActions
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { offlineManager } from '../OfflineManager';
import { OFFLINE_EVENTS } from '../config';
import type { SyncQueueItem, PendingActionType } from '../types';

interface PendingActionsResult {
  items: SyncQueueItem[];
  count: number;
  pendingCount: number;
  failedCount: number;
  completedCount: number;
  queueAction: (
    type: PendingActionType,
    payload: unknown,
    priority?: 'high' | 'normal' | 'low',
  ) => Promise<string>;
  removeAction: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function usePendingActions(): PendingActionsResult {
  const [items, setItems] = useState<SyncQueueItem[]>([]);

  const refresh = useCallback(async () => {
    const all = await offlineManager.getPendingActions();
    setItems(all);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load
    refresh();

    const unsubscribe1 = offlineManager.on(OFFLINE_EVENTS.ACTION_QUEUED, refresh);
    const unsubscribe2 = offlineManager.on(OFFLINE_EVENTS.ACTION_PROCESSED, refresh);
    const unsubscribe3 = offlineManager.on(OFFLINE_EVENTS.SYNC_COMPLETE, refresh);

    const interval = setInterval(refresh, 5000);

    return () => {
      unsubscribe1();
      unsubscribe2();
      unsubscribe3();
      clearInterval(interval);
    };
  }, [refresh]);

  const queueAction = useCallback(
    async (
      type: PendingActionType,
      payload: unknown,
      priority: 'high' | 'normal' | 'low' = 'normal',
    ) => {
      return offlineManager.queueAction(type, payload, priority);
    },
    [],
  );

  const removeAction = useCallback(
    async (id: string) => {
      await offlineManager.removePendingAction(id);
      await refresh();
    },
    [refresh],
  );

  const clearAll = useCallback(async () => {
    await offlineManager.clearPendingActions();
    await refresh();
  }, [refresh]);

  return {
    items,
    count: items.length,
    pendingCount: items.filter((i) => i.status === 'pending').length,
    failedCount: items.filter((i) => i.status === 'failed').length,
    completedCount: items.filter((i) => i.status === 'completed').length,
    queueAction,
    removeAction,
    clearAll,
    refresh,
  };
}

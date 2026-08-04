// ============================================================
// Offline Context Provider - Enterprise Edition
// ============================================================

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { offlineManager } from '../OfflineManager';
import { syncManager } from '../SyncManager';
import { recoveryService } from '../RecoveryService';
import { OFFLINE_EVENTS } from '../config';
import type { OfflineState, SyncResult, OfflineScenario } from '../types';

interface OfflineContextValue {
  state: OfflineState;
  isOnline: boolean;
  syncNow: () => Promise<SyncResult>;
  fullRecovery: (scenario: OfflineScenario) => Promise<SyncResult>;
  pendingCount: number;
}

const OfflineContext = createContext<OfflineContextValue | null>(null);

interface OfflineProviderProps {
  children: ReactNode;
  autoRecovery?: boolean;
}

export function OfflineProvider({ children, autoRecovery = true }: OfflineProviderProps) {
  const [state, setState] = useState<OfflineState>(() => offlineManager.getState());

  useEffect(() => {
    const unsubscribe = offlineManager.on(OFFLINE_EVENTS.STATUS_CHANGE, (newState) => {
      setState(newState as OfflineState);
    });

    // Auto recovery on reconnect
    if (autoRecovery) {
      const unsubscribeReconnected = offlineManager.on(OFFLINE_EVENTS.RECONNECTED, async () => {
        console.log('[OfflineContext] Connection restored, running auto recovery...');
        const scenario = offlineManager.getState().scenario || 'internet-lost';
        await recoveryService.fullRecovery(scenario);
      });
      return () => {
        unsubscribe();
        unsubscribeReconnected();
      };
    }

    return unsubscribe;
  }, [autoRecovery]);

  const syncNow = useCallback(async () => {
    return syncManager.syncNow('manual');
  }, []);

  const fullRecovery = useCallback(async (scenario: OfflineScenario) => {
    return recoveryService.fullRecovery(scenario);
  }, []);

  const value: OfflineContextValue = {
    state,
    isOnline: state.isOnline && state.isServerReachable,
    syncNow,
    fullRecovery,
    pendingCount: state.pendingCount,
  };

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
}

export function useOfflineContext(): OfflineContextValue {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOfflineContext must be used within an OfflineProvider');
  }
  return context;
}

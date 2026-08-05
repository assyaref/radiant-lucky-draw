// ============================================================
// useOfflineStatus Hook - Enterprise Edition
// ============================================================

import { useState, useEffect } from 'react';
import { offlineManager } from '../OfflineManager';
import { OFFLINE_EVENTS } from '../config';
import type { OfflineState, NetworkInfo } from '../types';

const DEFAULT_NETWORK_INFO: NetworkInfo = {
  online: true,
  type: 'unknown',
  effectiveType: 'unknown',
  downlink: 0,
  rtt: 0,
  dataSaver: false,
  saveData: false,
};

interface UseOfflineStatusReturn {
  isOnline: boolean;
  status: OfflineState['status'];
  scenario: OfflineState['scenario'];
  pendingCount: number;
  reconnecting: boolean;
  reconnectAttempts: number;
  networkInfo: NetworkInfo;
  lastOnlineAt: number | null;
  lastOfflineAt: number | null;
}

export function useOfflineStatus(): UseOfflineStatusReturn {
  const [state, setState] = useState<OfflineState>(() => offlineManager.getState());
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>(
    () => offlineManager.getNetworkInfo() ?? DEFAULT_NETWORK_INFO,
  );

  useEffect(() => {
    const unsub1 = offlineManager.on(OFFLINE_EVENTS.STATUS_CHANGE, (newState) => {
      setState(newState as OfflineState);
    });

    const unsub2 = offlineManager.on(OFFLINE_EVENTS.NETWORK_CHANGE, (info) => {
      setNetworkInfo(info as NetworkInfo);
    });

    // Poll for pending count updates
    const interval = setInterval(() => {
      const current = offlineManager.getState();
      setState(current);
    }, 5000);

    return () => {
      unsub1();
      unsub2();
      clearInterval(interval);
    };
  }, []);

  return {
    isOnline: state.isOnline && state.isServerReachable,
    status: state.status,
    scenario: state.scenario,
    pendingCount: state.pendingCount,
    reconnecting: state.reconnecting,
    reconnectAttempts: state.reconnectAttempts,
    networkInfo,
    lastOnlineAt: state.lastOnlineAt,
    lastOfflineAt: state.lastOfflineAt,
  };
}

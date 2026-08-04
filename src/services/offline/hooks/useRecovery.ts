// ============================================================
// Hook: useRecovery - Enterprise Edition
// ============================================================

import { useState, useCallback } from 'react';
import { recoveryService } from '../RecoveryService';
import type { SyncResult, OfflineScenario } from '../types';

interface RecoveryResultState {
  fullRecovery: (scenario: OfflineScenario) => Promise<SyncResult>;
  logTransaction: (action: string, payload: unknown) => Promise<string>;
  commitTransaction: (id: string) => Promise<void>;
  rollbackTransaction: (id: string) => Promise<void>;
  cleanup: () => Promise<void>;
  isRecovering: boolean;
  recoveryAttempts: number;
  lastResult: SyncResult | null;
}

export function useRecovery(): RecoveryResultState {
  const [isRecovering, setIsRecovering] = useState(false);
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);

  const fullRecovery = useCallback(async (scenario: OfflineScenario) => {
    setIsRecovering(true);
    try {
      const result = await recoveryService.fullRecovery(scenario);
      setLastResult(result);
      return result;
    } finally {
      setIsRecovering(false);
    }
  }, []);

  const logTransaction = useCallback(async (action: string, payload: unknown) => {
    return recoveryService.logTransaction(action, payload);
  }, []);

  const commitTransaction = useCallback(async (id: string) => {
    await recoveryService.commitTransaction(id);
  }, []);

  const rollbackTransaction = useCallback(async (id: string) => {
    await recoveryService.rollbackTransaction(id);
  }, []);

  const cleanup = useCallback(async () => {
    await recoveryService.cleanup();
  }, []);

  return {
    fullRecovery,
    logTransaction,
    commitTransaction,
    rollbackTransaction,
    cleanup,
    isRecovering,
    recoveryAttempts: recoveryService.getRecoveryAttempts(),
    lastResult,
  };
}

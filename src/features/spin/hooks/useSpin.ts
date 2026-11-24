/**
 * useSpin Hook
 *
 * Hook for managing spin wheel logic.
 * Integrates spinStore with prizeStore and participant data.
 * Provides spinPrize and spinName functions.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSpinStore } from '../store/spinStore';
import { usePrizeStore } from '../../prizes/store/prizeStore';
import type { Prize } from '@/engine/types/prize';
import type { Participant } from '@/engine/types/participant';
import type { WheelSegment } from '../types';
import { api } from '@/api/client';

/**
 * Fetch participants from the API.
 * Falls back to mock data if the API endpoint is not available.
 */
async function fetchParticipants(): Promise<Participant[]> {
  try {
    const response = await api.get<{ data: Participant[] }>('/participants');
    return response.data;
  } catch {
    // Fallback mock participants for demo/testing
    return [
      {
        id: 'p1',
        number: 'T001',
        fullName: 'Budi Santoso',
        company: 'PT Teknologi Maju',
        phone: '081234567890',
        email: 'budi@example.com',
        hasWon: false,
      },
      {
        id: 'p2',
        number: 'T002',
        fullName: 'Siti Nurhaliza',
        company: 'CV Kreatif Digital',
        phone: '081234567891',
        email: 'siti@example.com',
        hasWon: false,
      },
      {
        id: 'p3',
        number: 'T003',
        fullName: 'Ahmad Rizki',
        company: 'PT Bangun Persada',
        phone: '081234567892',
        email: 'ahmad@example.com',
        hasWon: false,
      },
      {
        id: 'p4',
        number: 'T004',
        fullName: 'Dewi Lestari',
        company: 'PT Mega Finance',
        phone: '081234567893',
        email: 'dewi@example.com',
        hasWon: false,
      },
      {
        id: 'p5',
        number: 'T005',
        fullName: 'Rudi Hermawan',
        company: 'PT Indo Teknologi',
        phone: '081234567894',
        email: 'rudi@example.com',
        hasWon: false,
      },
    ];
  }
}

/**
 * Convert Prize array to WheelSegment array.
 */
function prizesToSegments(prizes: Prize[]): WheelSegment[] {
  return prizes.map((prize) => ({
    id: prize.id,
    label: prize.name,
    value: prize.id,
    color: prize.color || '#6366f1',
    weight: prize.weight > 0 ? prize.weight : 1,
    imageUrl: prize.image || undefined,
  }));
}

/**
 * Convert Participant array to WheelSegment array.
 */
function participantsToSegments(participants: Participant[]): WheelSegment[] {
  return participants.map((participant) => ({
    id: participant.id,
    label: participant.fullName,
    value: participant.id,
    color: '#34d399',
    weight: 1,
  }));
}

export function useSpin() {
  const spinStore = useSpinStore();
  const prizeStore = usePrizeStore();

  // Local participants state
  const [participants, setParticipants] = useState<Participant[]>([]);

  // Derived state from spinStore
  const { mode, segments, isSpinning, result, history, error, config } = spinStore;

  // Load prizes into spin segments on mount (prize mode)
  useEffect(() => {
    if (mode === 'prize' && prizeStore.prizes.length > 0 && segments.length === 0) {
      spinStore.setSegments(prizesToSegments(prizeStore.prizes));
    }
  }, [mode, prizeStore.prizes, segments.length, spinStore]);

  // Load participants for name mode
  useEffect(() => {
    if (mode === 'name' && participants.length === 0) {
      fetchParticipants().then((ps) => {
        setParticipants(ps);
        spinStore.setSegments(participantsToSegments(ps));
      });
    }
  }, [mode, participants.length, spinStore]);

  // Sync segments when mode changes
  useEffect(() => {
    if (mode === 'prize') {
      spinStore.setSegments(prizesToSegments(prizeStore.prizes));
    } else if (mode === 'name' && participants.length > 0) {
      spinStore.setSegments(participantsToSegments(participants));
    }
  }, [mode, prizeStore.prizes, participants, spinStore]);

  /**
   * Spin the prize wheel.
   * Selects a prize based on weighted probability.
   */
  const spinPrize = useCallback(
    (seed?: number) => {
      const currentSegments = spinStore.segments;
      if (currentSegments.length === 0) {
        spinStore.setError('No prizes available for spinning');
        return null;
      }
      useSpinStore.setState({ isSpinning: true, error: null });
      return spinStore.spin(seed);
    },
    [spinStore],
  );

  /**
   * Spin the name wheel.
   * Selects a participant with equal probability.
   */
  const spinName = useCallback(
    (seed?: number) => {
      const currentSegments = spinStore.segments;
      if (currentSegments.length === 0) {
        spinStore.setError('No participants available for spinning');
        return null;
      }
      useSpinStore.setState({ isSpinning: true, error: null });
      return spinStore.spin(seed);
    },
    [spinStore],
  );

  /**
   * Reset the spin state.
   */
  const resetSpin = useCallback(() => {
    spinStore.reset();
  }, [spinStore]);

  /**
   * Clear the current result.
   */
  const clearResult = useCallback(() => {
    spinStore.clearResult();
  }, [spinStore]);

  /**
   * Set the spin mode.
   */
  const setSpinMode = useCallback(
    (mode: 'prize' | 'name') => {
      spinStore.setMode(mode);
    },
    [spinStore],
  );

  // Memoized result with typed fields
  const typedResult = useMemo(() => {
    if (!result?.success || !result.segment) return null;

    if (mode === 'prize') {
      return {
        ...result,
        prizeId: result.segment.value,
        prizeName: result.segment.label,
      };
    }
    return {
      ...result,
      participantId: result.segment.value,
      participantName: result.segment.label,
    };
  }, [result, mode]);

  return {
    // State
    mode,
    segments,
    isSpinning,
    result: typedResult,
    history,
    error,
    config,
    participants,

    // Actions
    spinPrize,
    spinName,
    resetSpin,
    clearResult,
    setSpinMode,
    setSegments: spinStore.setSegments,
    addSegment: spinStore.addSegment,
    removeSegment: spinStore.removeSegment,
    clearSegments: spinStore.clearSegments,
  };
}

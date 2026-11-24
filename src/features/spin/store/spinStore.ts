/**
 * Spin Store
 *
 * Zustand store for managing spin wheel state.
 * Handles spin state, results, segments, and mode switching.
 */

import { create } from 'zustand';
import type { SpinMode, WheelConfig, WheelSegment, SpinResult } from '../types';
import { DEFAULT_WHEEL_CONFIG } from '../types';

interface SpinStoreState {
  // Config
  config: WheelConfig;
  mode: SpinMode;

  // Segments
  segments: WheelSegment[];

  // Spin state
  isSpinning: boolean;
  result: SpinResult | null;
  history: SpinResult[];
  error: string | null;

  // Actions
  setConfig: (config: Partial<WheelConfig>) => void;
  setMode: (mode: SpinMode) => void;
  setSegments: (segments: WheelSegment[]) => void;
  addSegment: (segment: WheelSegment) => void;
  removeSegment: (id: string) => void;
  clearSegments: () => void;
  spin: (seed?: number) => SpinResult;
  reset: () => void;
  clearResult: () => void;
  setError: (error: string | null) => void;
}

/**
 * Calculate the final rotation angle based on the selected segment.
 * The pointer is at pointerAngle (default 270deg = top).
 * We want the selected segment to end up at the pointer position.
 */
function calculateRotationAngle(
  segmentIndex: number,
  totalSegments: number,
  pointerAngle: number,
  rotations: number,
): number {
  const segmentAngle = 360 / totalSegments;
  // Angle of the segment center (0deg = right, going clockwise)
  const segmentCenterAngle = segmentIndex * segmentAngle + segmentAngle / 2;
  // Rotate so that segment center aligns with pointer
  // pointerAngle is where the pointer is; we rotate the wheel so segment
  // center ends up at pointerAngle
  const baseRotation = pointerAngle - segmentCenterAngle;
  // Add full rotations for the spin effect
  const totalRotation = baseRotation + rotations * 360;
  return totalRotation;
}

/**
 * Select a segment using weighted random selection.
 * Uses cumulative weight algorithm.
 */
function selectWeightedSegment(
  segments: WheelSegment[],
  seed?: number,
): { segment: WheelSegment; index: number } {
  const totalWeight = segments.reduce((sum, s) => sum + s.weight, 0);
  if (totalWeight <= 0) {
    throw new Error('Total weight must be greater than 0');
  }

  let randomValue: number;
  if (seed !== undefined) {
    // Deterministic random using seed
    const random = new SeededRandom(seed);
    randomValue = random.nextFloat(0, totalWeight);
  } else {
    randomValue = Math.random() * totalWeight;
  }

  let cumulative = 0;
  for (let i = 0; i < segments.length; i++) {
    cumulative += segments[i].weight;
    if (randomValue <= cumulative) {
      return { segment: segments[i], index: i };
    }
  }

  // Fallback - should not reach here
  return { segment: segments[segments.length - 1], index: segments.length - 1 };
}

// Simple seeded random for deterministic spins
class SeededRandom {
  private seed: number;
  constructor(seed: number) {
    this.seed = seed;
  }
  nextFloat(min: number, max: number): number {
    // Simple LCG
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    return min + (this.seed / 4294967296) * (max - min);
  }
}

export const useSpinStore = create<SpinStoreState>((set, get) => ({
  // Initial state
  config: { ...DEFAULT_WHEEL_CONFIG },
  mode: 'prize',
  segments: [],
  isSpinning: false,
  result: null,
  history: [],
  error: null,

  setConfig: (partialConfig) =>
    set((state) => ({
      config: { ...state.config, ...partialConfig },
    })),

  setMode: (mode) =>
    set((state) => ({
      mode,
      config: { ...state.config, mode },
      result: null,
      error: null,
    })),

  setSegments: (segments) => set({ segments }),

  addSegment: (segment) =>
    set((state) => ({
      segments: [...state.segments, segment],
    })),

  removeSegment: (id) =>
    set((state) => ({
      segments: state.segments.filter((s) => s.id !== id),
    })),

  clearSegments: () => set({ segments: [], result: null }),

  spin: (seed?: number) => {
    const state = get();
    const { segments, config } = state;

    if (segments.length === 0) {
      const errorResult: SpinResult = {
        mode: state.mode,
        segment: null as unknown as WheelSegment,
        rotationAngle: 0,
        timestamp: new Date().toISOString(),
        success: false,
        error: 'No segments available for spinning',
      };
      set({ isSpinning: false, error: errorResult.error, result: errorResult });
      return errorResult;
    }

    try {
      const { segment, index } = selectWeightedSegment(segments, seed);
      const rotationAngle = calculateRotationAngle(
        index,
        segments.length,
        config.pointerAngle,
        config.rotations,
      );

      const result: SpinResult = {
        mode: state.mode,
        segment,
        rotationAngle,
        timestamp: new Date().toISOString(),
        success: true,
      };

      // Set mode-specific fields
      if (state.mode === 'prize') {
        result.prizeId = segment.value;
        result.prizeName = segment.label;
      } else {
        result.participantId = segment.value;
        result.participantName = segment.label;
      }

      set((prev) => ({
        isSpinning: false,
        result,
        history: [result, ...prev.history].slice(0, 50), // keep last 50
        error: null,
      }));

      return result;
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Spin failed';
      const errorResult: SpinResult = {
        mode: state.mode,
        segment: null as unknown as WheelSegment,
        rotationAngle: 0,
        timestamp: new Date().toISOString(),
        success: false,
        error: errMsg,
      };
      set({ isSpinning: false, error: errMsg, result: errorResult });
      return errorResult;
    }
  },

  reset: () =>
    set({
      isSpinning: false,
      result: null,
      history: [],
      error: null,
      segments: [],
      config: { ...DEFAULT_WHEEL_CONFIG },
      mode: 'prize',
    }),

  clearResult: () => set({ result: null, error: null }),

  setError: (error) => set({ error }),
}));

import { create } from 'zustand';
import type { Prize } from '../types/prize';
import { PrizeTier } from '../types/prize';
import type { DrawConfig, DrawSession } from '../types/draw';
import type { DrawResult, DrawSummary } from '../types/result';
import { DrawEngine } from '../draw/DrawEngine';

/**
 * Draw Store State.
 * UI-facing Zustand store that wraps the DrawEngine.
 * Provides reactive state for React components.
 */
export interface DrawStoreState {
  /** All registered prizes */
  prizes: Prize[];
  /** Current draw session */
  session: DrawSession | null;
  /** Last draw result */
  lastResult: DrawResult | null;
  /** Draw history */
  history: DrawResult[];
  /** Whether a draw is in progress */
  isDrawing: boolean;
  /** Current error message */
  error: string | null;
  /** Session summary */
  summary: DrawSummary;

  // Actions
  /** Register prizes with the engine */
  registerPrizes: (prizes: Prize[]) => void;
  /** Start a new draw session */
  startSession: (config: DrawConfig) => void;
  /** Execute a single draw */
  draw: (seed?: number) => DrawResult;
  /** Execute multiple draws */
  drawMultiple: (count: number, seed?: number) => DrawResult[];
  /** Reset the engine */
  reset: () => void;
  /** Set deterministic seed */
  setSeed: (seed: number) => void;
  /** Clear history */
  clearHistory: () => void;
  /** Get the underlying engine instance */
  getEngine: () => DrawEngine;
}

/**
 * Create sample prizes for testing.
 * Provides a realistic prize pool out of the box.
 */
export function createSamplePrizes(): Prize[] {
  return [
    {
      id: 'smart-tv',
      name: 'Smart TV 55"',
      description: '55-inch 4K Ultra HD Smart TV',
      tier: PrizeTier.GRAND,
      image: '',
      color: '#fbbf24',
      weight: 0.5,
      stock: 1,
      maxDailyWinner: 1,
      enabled: true,
      displayOrder: 1,
      dailyWinnerCount: 0,
    },
    {
      id: 'laptop',
      name: 'Premium Laptop',
      description: 'High-performance laptop for professionals',
      tier: PrizeTier.VERY_RARE,
      image: '',
      color: '#a78bfa',
      weight: 1,
      stock: 2,
      maxDailyWinner: 1,
      enabled: true,
      displayOrder: 2,
      dailyWinnerCount: 0,
    },
    {
      id: 'tablet',
      name: 'Tablet Pro',
      description: 'Latest generation tablet with stylus support',
      tier: PrizeTier.RARE,
      image: '',
      color: '#60a5fa',
      weight: 3,
      stock: 5,
      maxDailyWinner: 2,
      enabled: true,
      displayOrder: 3,
      dailyWinnerCount: 0,
    },
    {
      id: 'smart-watch',
      name: 'Smart Watch',
      description: 'Fitness tracking smartwatch',
      tier: PrizeTier.RARE,
      image: '',
      color: '#34d399',
      weight: 3,
      stock: 10,
      maxDailyWinner: 3,
      enabled: true,
      displayOrder: 4,
      dailyWinnerCount: 0,
    },
    {
      id: 'power-bank',
      name: 'Power Bank 20000mAh',
      description: 'High-capacity portable charger',
      tier: PrizeTier.NORMAL,
      image: '',
      color: '#f59e0b',
      weight: 15,
      stock: 50,
      maxDailyWinner: 10,
      enabled: true,
      displayOrder: 5,
      dailyWinnerCount: 0,
    },
    {
      id: 'tumbler',
      name: 'Premium Tumbler',
      description: 'Stainless steel insulated tumbler',
      tier: PrizeTier.NORMAL,
      image: '',
      color: '#ef4444',
      weight: 15,
      stock: 100,
      maxDailyWinner: 20,
      enabled: true,
      displayOrder: 6,
      dailyWinnerCount: 0,
    },
    {
      id: 'umbrella',
      name: 'Branded Umbrella',
      description: 'Automatic open/close umbrella',
      tier: PrizeTier.COMMON,
      image: '',
      color: '#94a3b8',
      weight: 40,
      stock: 200,
      maxDailyWinner: 50,
      enabled: true,
      displayOrder: 7,
      dailyWinnerCount: 0,
    },
    {
      id: 'voucher-50k',
      name: 'Voucher Rp 50.000',
      description: 'Shopping voucher worth Rp 50.000',
      tier: PrizeTier.COMMON,
      image: '',
      color: '#64748b',
      weight: 40,
      stock: 500,
      maxDailyWinner: 100,
      enabled: true,
      displayOrder: 8,
      dailyWinnerCount: 0,
    },
    {
      id: 'sticker',
      name: 'Exclusive Sticker Pack',
      description: 'Limited edition Radiant Group sticker pack',
      tier: PrizeTier.COMMON,
      image: '',
      color: '#475569',
      weight: 80,
      stock: 1000,
      maxDailyWinner: 200,
      enabled: true,
      displayOrder: 9,
      dailyWinnerCount: 0,
    },
  ];
}

/**
 * Create a default draw configuration for testing.
 */
export function createDefaultDrawConfig(): DrawConfig {
  return {
    id: 'main-draw',
    name: 'Main Lucky Draw',
    description: 'Radiant Group Main Lucky Draw Event',
    active: true,
    prizeIds: [
      'smart-tv',
      'laptop',
      'tablet',
      'smart-watch',
      'power-bank',
      'tumbler',
      'umbrella',
      'voucher-50k',
      'sticker',
    ],
    maxWinners: 0,
    winnerCount: 0,
    startTime: null,
    endTime: null,
    minTier: null,
  };
}

/**
 * Create the draw store.
 * Wraps the DrawEngine in a reactive Zustand store.
 */
export const useDrawStore = create<DrawStoreState>((set, get) => {
  const engine = new DrawEngine({
    onDrawStart: () => {
      set({ isDrawing: true, error: null });
    },
    onDrawComplete: (result) => {
      set((state) => ({
        isDrawing: false,
        lastResult: result,
        history: [...state.history, result],
        prizes: engine.getAllPrizes(),
      }));
    },
    onDrawError: (error) => {
      set({ isDrawing: false, error });
    },
    onStockUpdated: () => {
      set({ prizes: engine.getAllPrizes() });
    },
  });

  return {
    prizes: [],
    session: null,
    lastResult: null,
    history: [],
    isDrawing: false,
    error: null,
    summary: {
      totalDraws: 0,
      totalAwarded: 0,
      byTier: {},
      totalValue: '0',
      duration: 0,
    },

    registerPrizes: (prizes: Prize[]) => {
      engine.registerPrizes(prizes);
      set({ prizes: engine.getAllPrizes() });
    },

    startSession: (config: DrawConfig) => {
      const session = engine.startSession(config);
      set({ session, history: [], lastResult: null, error: null });
    },

    draw: (seed?: number) => {
      const result = engine.draw(seed);
      set({
        lastResult: result,
        prizes: engine.getAllPrizes(),
        summary: engine.getSummary(),
        session: engine.getSession(),
      });
      return result;
    },

    drawMultiple: (count: number, seed?: number) => {
      const results = engine.drawMultiple(count, seed);
      set({
        lastResult: results[results.length - 1],
        history: [...get().history, ...results],
        prizes: engine.getAllPrizes(),
        summary: engine.getSummary(),
        session: engine.getSession(),
      });
      return results;
    },

    reset: () => {
      engine.reset();
      set({
        prizes: [],
        session: null,
        lastResult: null,
        history: [],
        isDrawing: false,
        error: null,
        summary: {
          totalDraws: 0,
          totalAwarded: 0,
          byTier: {},
          totalValue: '0',
          duration: 0,
        },
      });
    },

    setSeed: (seed: number) => {
      engine.setSeed(seed);
    },

    clearHistory: () => {
      set({ history: [], lastResult: null });
    },

    getEngine: () => engine,
  };
});
import { create } from 'zustand';
import type { TVStage, TVParticipant, TVPrize } from '../../types/live-tv';
import { createDrawEngineService } from '../../engine/service/DrawEngineService';
import type { DrawEventEmitter } from '../../engine/service/DrawEngineService';

// Default prizes for the draw
const DEFAULT_PRIZES: TVPrize[] = [
  { id: 'p1', name: 'Grand Prize', value: '$5,000', icon: '👑', color: '#fbbf24' },
  { id: 'p2', name: 'Smartphone', value: '$1,200', icon: '📱', color: '#60a5fa' },
  { id: 'p3', name: 'Smartwatch', value: '$800', icon: '⌚', color: '#34d399' },
  { id: 'p4', name: 'Headphones', value: '$350', icon: '🎧', color: '#a78bfa' },
  { id: 'p5', name: 'Gift Card', value: '$100', icon: '🎁', color: '#f472b6' },
];

// ─── DrawEngine Integration (RC2.4) ─────────────────────────────────────
//
// The DrawEngineService is the ONLY source of winner selection.
// No Math.random() is used in the UI layer. All randomness is delegated
// to the DrawEngine (weighted probability, stock validation, duplicate
// winner prevention).
//
// The service emits socket events:
//   draw:started, draw:spinning, draw:winner, draw:completed

/** Socket emitter that forwards DrawEngine events to the realtime layer. */
const drawEmitter: DrawEventEmitter = {
  emit: (event, payload) => {
    // Forward to the global socket service if available.
    // The socket service is wired in the app bootstrap; this keeps the
    // store decoupled from the concrete socket implementation.
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('draw-engine:event', { detail: { event, payload } }));
    }
  },
};

/** Singleton DrawEngineService instance for the Live TV flow. */
const drawEngineService = createDrawEngineService(drawEmitter);

// Register the default prize pool once at module load.
drawEngineService.registerPrizes(DEFAULT_PRIZES);

// Start an active draw session for the Live TV flow.
drawEngineService.startSession({
  id: 'live-tv',
  name: 'Live TV Draw',
  description: 'Live TV Lucky Draw',
  active: true,
  prizeIds: DEFAULT_PRIZES.map((p) => p.id),
  maxWinners: 0,
  winnerCount: 0,
  startTime: null,
  endTime: null,
  minTier: null,
});

interface LiveTVState {
  // Core state
  stage: TVStage;
  participant: TVParticipant | null;
  prize: TVPrize | null;
  countdownValue: number;
  isPlaying: boolean;
  autoStart: boolean;

  // Available prizes
  prizes: TVPrize[];

  // Draw statistics (from DrawEngineService)
  drawCount: number;
  totalWinners: number;
  grandPrizeRemaining: number;

  // Actions
  startDraw: (participant: TVParticipant) => void;
  setStage: (stage: TVStage) => void;
  setPrize: (prize: TVPrize) => void;
  setAutoStart: (enabled: boolean) => void;
  resetTV: () => void;
  skipToStage: (stage: TVStage) => void;

  // Flow control
  nextStage: () => void;
  triggerDraw: () => void;
}

const STAGE_ORDER: TVStage[] = [
  'idle',
  'loading',
  'participant',
  'countdown',
  'machine',
  'drawing',
  'winner',
  'confetti',
  'prize',
  'congratulations',
];

function getNextStage(current: TVStage): TVStage | null {
  const idx = STAGE_ORDER.indexOf(current);
  if (idx < 0 || idx >= STAGE_ORDER.length - 1) return null;
  return STAGE_ORDER[idx + 1];
}

/** Refresh statistics from the DrawEngineService. */
function refreshStatistics() {
  const stats = drawEngineService.getStatistics();
  return {
    drawCount: stats.drawCount,
    totalWinners: stats.totalWinners,
    grandPrizeRemaining: stats.grandPrizeRemaining,
  };
}

export const useLiveTVStore = create<LiveTVState>((set, get) => ({
  stage: 'idle',
  participant: null,
  prize: null,
  countdownValue: 3,
  isPlaying: false,
  autoStart: true,
  prizes: DEFAULT_PRIZES,
  drawCount: 0,
  totalWinners: 0,
  grandPrizeRemaining: 0,

  startDraw: (participant) => {
    // Register the participant as eligible for the draw.
    drawEngineService.registerParticipant(participant);

    // Execute the draw via the DrawEngineService (the ONLY source of
    // winner selection). This performs validation, weighted probability,
    // stock validation, and duplicate-winner prevention.
    const result = drawEngineService.executeDraw(participant);

    // Update statistics from the service.
    set(refreshStatistics());

    if (result.success && result.prize) {
      set({
        participant,
        prize: result.prize,
        isPlaying: true,
        stage: 'loading',
        countdownValue: 3,
      });
    } else {
      // Draw failed (e.g. duplicate winner, out of stock). Reset to idle.
      set({
        participant: null,
        prize: null,
        isPlaying: false,
        stage: 'idle',
        countdownValue: 3,
      });
    }
  },

  setStage: (stage) => {
    set({ stage });
  },

  setPrize: (prize) => {
    set({ prize });
  },

  setAutoStart: (enabled) => {
    set({ autoStart: enabled });
  },

  resetTV: () => {
    set({
      stage: 'idle',
      participant: null,
      prize: null,
      countdownValue: 3,
      isPlaying: false,
    });
  },

  skipToStage: (stage) => {
    set({ stage });
  },

  nextStage: () => {
    const { stage, isPlaying } = get();
    if (!isPlaying) return;

    const next = getNextStage(stage);
    if (next) {
      set({ stage: next });
    } else {
      // End of flow - return to idle after congratulations
      setTimeout(() => {
        get().resetTV();
      }, 5000);
    }
  },

  triggerDraw: () => {
    const { participant } = get();
    if (!participant) return;

    // The winner was already determined by the DrawEngineService in
    // startDraw(). This method only drives the animation flow.
    set({ stage: 'drawing' });

    // After drawing animation completes, show winner
    setTimeout(() => {
      set({ stage: 'winner' });
    }, 3000);
  },
}));

// Export the DrawEngineService for advanced use (e.g., testing, statistics)
export { drawEngineService };

/**
 * RealtimeService
 *
 * Socket.IO real-time communication layer for the backend.
 * Acts as the single broadcast hub for queue events so that
 * Operator Dashboard, Queue TV, and Registration stay in sync.
 *
 * Events broadcast:
 * - queue:created    (new participant added to queue)
 * - queue:updated    (full queue state changed)
 * - queue:called     (next participant called)
 * - queue:completed  (participant completed)
 * - queue:skipped    (participant skipped)
 * - queue:cancelled  (participant cancelled)
 *
 * DrawEngine lifecycle events (RC2.4):
 * - draw:started     (draw session started)
 * - draw:spinning    (prize selection in progress)
 * - draw:winner      (winner selected)
 * - draw:completed   (draw lifecycle completed)
 */

import { Server as SocketIOServer } from 'socket.io';
import type { Server as HttpServer } from 'http';
import { logger } from '../utils';

// ─── Queue Event Names ──────────────────────────────────────────────────

export const QUEUE_EVENTS = {
  CREATED: 'queue:created',
  UPDATED: 'queue:updated',
  CALLED: 'queue:called',
  COMPLETED: 'queue:completed',
  SKIPPED: 'queue:skipped',
  CANCELLED: 'queue:cancelled',
} as const;

export type QueueEventName = (typeof QUEUE_EVENTS)[keyof typeof QUEUE_EVENTS];

// ─── DrawEngine Event Names (RC2.4) ─────────────────────────────────────

export const DRAW_EVENTS = {
  STARTED: 'draw:started',
  SPINNING: 'draw:spinning',
  WINNER: 'draw:winner',
  COMPLETED: 'draw:completed',
} as const;

export type DrawEventName = (typeof DRAW_EVENTS)[keyof typeof DRAW_EVENTS];

// ─── Payload Types ──────────────────────────────────────────────────────

export interface QueueEntryPayload {
  id: string;
  participantId: string;
  participantName: string;
  queueNumber: string;
  status: 'waiting' | 'called' | 'completed' | 'cancelled' | 'skipped';
  isPriority: boolean;
  registeredAt: string;
  calledAt?: string;
  completedAt?: string;
}

export interface QueueStatePayload {
  entries: QueueEntryPayload[];
  currentNumber?: string;
  lastCalled?: string;
  estimatedWait: number;
  totalWaiting: number;
  totalFinished: number;
  totalCancelled: number;
  timestamp: string;
}

export interface QueueEventPayload {
  type: QueueEventName;
  entry?: QueueEntryPayload;
  state: QueueStatePayload;
  timestamp: string;
}

// ─── Draw Payload Types (RC2.4) ─────────────────────────────────────────

export interface DrawStartedPayload {
  drawId: string;
  participantId: string;
  participantName: string;
  timestamp: string;
}

export interface DrawSpinningPayload {
  drawId: string;
  participantId: string;
  timestamp: string;
}

export interface DrawWinnerPayload {
  drawId: string;
  participantId: string;
  participantName: string;
  prizeId: string;
  prizeName: string;
  prizeTier: string;
  probability: number;
  timestamp: string;
}

export interface DrawCompletedPayload {
  drawId: string;
  participantId: string;
  prizeId: string;
  prizeName: string;
  remainingStock: number;
  totalWinners: number;
  drawCount: number;
  timestamp: string;
}

// ─── Draw State (Server-Authoritative) ──────────────────────────────────

export type DrawState = 'IDLE' | 'COUNTDOWN' | 'SPINNING' | 'REVEALED' | 'COMPLETED';

export interface ActiveDrawState {
  state: DrawState;
  drawId: string | null;
  participantId: string | null;
  participantName: string | null;
  participantCompany: string | null;
  participantPhotoUrl: string | null;
  prizeId: string | null;
  prizeName: string | null;
  prizeTier: string | null;
  prizeImageUrl: string | null;
  remainingStock: number | null;
  startedAt: string | null;
  lastUpdated: string;
}

// ─── RealtimeService ────────────────────────────────────────────────────

export class RealtimeService {
  private io: SocketIOServer | null = null;
  private activeDraw: ActiveDrawState = {
    state: 'IDLE',
    drawId: null,
    participantId: null,
    participantName: null,
    participantCompany: null,
    participantPhotoUrl: null,
    prizeId: null,
    prizeName: null,
    prizeTier: null,
    prizeImageUrl: null,
    remainingStock: null,
    startedAt: null,
    lastUpdated: new Date().toISOString(),
  };
  private drawSequenceTimers: ReturnType<typeof setTimeout>[] = [];
  private isDrawLocked: boolean = false;

  /** Attach Socket.IO to the HTTP server */
  attach(server: HttpServer): void {
    if (this.io) {
      logger.warn('[Realtime] Socket.IO already attached');
      return;
    }

    this.io = new SocketIOServer(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
      transports: ['websocket', 'polling'],
    });

    // Expose the Socket.IO instance globally so analytics can read the
    // real active connection count (GO LIVE HOTFIX).
    (globalThis as any).__radiantRealtimeIO = this.io;

    this.io.on('connection', (socket) => {
      logger.info(`[Realtime] Client connected: ${socket.id}`);

      // Send current draw state to newly connected monitor clients
      socket.on('draw:get-state', () => {
        socket.emit('draw:state-sync', this.getDrawState());
        logger.info(`[Realtime] Draw state sent to: ${socket.id}`);
      });

      socket.on('disconnect', () => {
        logger.info(`[Realtime] Client disconnected: ${socket.id}`);
      });
    });

    logger.info('[Realtime] Socket.IO attached to HTTP server');
  }

  /** Check if the realtime layer is attached */
  isAttached(): boolean {
    return this.io !== null;
  }

  // ─── Draw Lock ──────────────────────────────────────────────────────

  /** Check if a draw is currently in progress (prevents double spin) */
  isDrawActive(): boolean {
    return this.isDrawLocked;
  }

  /** Attempt to acquire the draw lock. Returns true if lock acquired. */
  acquireDrawLock(): boolean {
    if (this.isDrawLocked) return false;
    this.isDrawLocked = true;
    return true;
  }

  /** Release the draw lock */
  releaseDrawLock(): void {
    this.isDrawLocked = false;
  }

  // ─── Draw State Management ──────────────────────────────────────────

  /** Get the current draw state (for monitor reconnection) */
  getDrawState(): ActiveDrawState {
    return { ...this.activeDraw };
  }

  /** Set draw state internally */
  private setDrawState(partial: Partial<ActiveDrawState>): void {
    this.activeDraw = {
      ...this.activeDraw,
      ...partial,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Start a sequenced draw lifecycle with timed broadcasts.
   * Winner data is provided upfront (already determined by the server).
   * Handles countdown→spinning→winner→completed animation sequence.
   */
  startDrawSequence(winnerData: {
    drawId: string;
    participantId: string;
    participantName: string;
    participantCompany?: string;
    participantPhotoUrl?: string;
    prizeId: string;
    prizeName: string;
    prizeImageUrl?: string;
    prizeTier: string;
    remainingStock: number;
  }): void {
    this.clearDrawTimers();
    const ts = new Date().toISOString();

    // Step 1: COUNTDOWN (immediate)
    this.setDrawState({
      state: 'COUNTDOWN',
      drawId: winnerData.drawId,
      participantId: winnerData.participantId,
      participantName: winnerData.participantName,
      participantCompany: winnerData.participantCompany ?? null,
      participantPhotoUrl: winnerData.participantPhotoUrl ?? null,
      prizeId: winnerData.prizeId,
      prizeName: winnerData.prizeName,
      prizeImageUrl: winnerData.prizeImageUrl ?? null,
      prizeTier: winnerData.prizeTier,
      remainingStock: winnerData.remainingStock,
      startedAt: ts,
    });
    this.broadcastDrawEvent(DRAW_EVENTS.STARTED, { ...winnerData, timestamp: ts });

    // Step 2: SPINNING (after 4s)
    this.drawSequenceTimers.push(
      setTimeout(() => {
        if (this.activeDraw.state !== 'COUNTDOWN') return;
        this.setDrawState({ state: 'SPINNING' });
        this.broadcastDrawEvent(DRAW_EVENTS.SPINNING, {
          drawId: winnerData.drawId,
          participantId: winnerData.participantId,
          participantName: winnerData.participantName,
          participantPhotoUrl: winnerData.participantPhotoUrl ?? null,
          prizeId: winnerData.prizeId,
          prizeName: winnerData.prizeName,
          prizeTier: winnerData.prizeTier,
          prizeImageUrl: winnerData.prizeImageUrl ?? null,
          timestamp: new Date().toISOString(),
        });
      }, 4000),
    );

    // Step 3: REVEALED (after 8s)
    this.drawSequenceTimers.push(
      setTimeout(() => {
        if (this.activeDraw.state !== 'SPINNING') return;
        this.setDrawState({ state: 'REVEALED' });
        this.broadcastDrawEvent(DRAW_EVENTS.WINNER, {
          ...winnerData,
          probability: 0,
          timestamp: new Date().toISOString(),
        });
      }, 8000),
    );

    // Step 4: COMPLETED → IDLE (after 14s + 5s)
    this.drawSequenceTimers.push(
      setTimeout(() => {
        if (this.activeDraw.state !== 'REVEALED') return;
        this.setDrawState({ state: 'COMPLETED' });
        this.broadcastDrawEvent(DRAW_EVENTS.COMPLETED, {
          drawId: winnerData.drawId,
          participantId: winnerData.participantId,
          prizeId: winnerData.prizeId,
          prizeName: winnerData.prizeName,
          remainingStock: winnerData.remainingStock,
          totalWinners: 0,
          drawCount: 0,
          timestamp: new Date().toISOString(),
        });
        setTimeout(() => {
          this.setDrawState({
            state: 'IDLE',
            drawId: null,
            participantId: null,
            participantName: null,
            participantCompany: null,
            participantPhotoUrl: null,
            prizeId: null,
            prizeName: null,
            prizeImageUrl: null,
            prizeTier: null,
            remainingStock: null,
            startedAt: null,
          });
          this.releaseDrawLock();
          logger.info('[Realtime] Draw sequence: IDLE, lock released');
        }, 5000);
      }, 14000),
    );

    logger.info('[Realtime] Draw sequence started', { drawId: winnerData.drawId });
  }

  /** Clear all pending draw sequence timers */
  private clearDrawTimers(): void {
    for (const t of this.drawSequenceTimers) clearTimeout(t);
    this.drawSequenceTimers = [];
  }

  /** Broadcast a queue event to all connected clients */
  broadcastQueueEvent(payload: QueueEventPayload): void {
    if (!this.io) {
      logger.warn('[Realtime] Socket.IO not attached, skipping broadcast');
      return;
    }

    this.io.emit(payload.type, payload);
    logger.info(`[Realtime] Broadcast: ${payload.type}`);
  }

  /** Broadcast a full queue state update */
  broadcastQueueState(state: QueueStatePayload): void {
    if (!this.io) {
      logger.warn('[Realtime] Socket.IO not attached, skipping broadcast');
      return;
    }

    this.io.emit(QUEUE_EVENTS.UPDATED, {
      type: QUEUE_EVENTS.UPDATED,
      state,
      timestamp: new Date().toISOString(),
    });
    logger.info('[Realtime] Broadcast: queue:updated');
  }

  /**
   * Broadcast a draw lifecycle event (RC2.4).
   * Events: draw:started, draw:spinning, draw:winner, draw:completed
   */
  broadcastDrawEvent(event: DrawEventName, payload: Record<string, unknown>): void {
    if (!this.io) {
      logger.warn('[Realtime] Socket.IO not attached, skipping draw broadcast');
      return;
    }

    this.io.emit(event, {
      type: event,
      ...payload,
      timestamp: new Date().toISOString(),
    });
    logger.info(`[Realtime] Broadcast: ${event}`);
  }

  /** Get the underlying Socket.IO server (for advanced use) */
  getIO(): SocketIOServer | null {
    return this.io;
  }
}

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

// ─── RealtimeService ────────────────────────────────────────────────────

export class RealtimeService {
  private io: SocketIOServer | null = null;

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

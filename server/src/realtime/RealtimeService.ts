/**
 * RealtimeService (Supabase edition)
 *
 * Broadcast hub for queue and draw events, now delivered through
 * Supabase Realtime (Broadcast) instead of Socket.IO, so the backend can run
 * as a stateless Supabase Edge Function.
 *
 * - Every event is sent to the public Realtime channel `radiant`
 *   (REALTIME_CHANNEL) with the same event name and payload the Socket.IO
 *   server used, so the frontend keeps its event contract.
 * - The draw lock and the active draw sequence live in the `draw_state`
 *   table (one row), because separate requests may hit separate isolates.
 *   The current draw phase is derived from the time elapsed since the draw
 *   started, so any instance returns the same state.
 * - Only `draw:started` is broadcast for booth spins; clients derive the
 *   follow-up phases from it (see startDrawSequence).
 *
 * Events: queue:created/updated/called/completed/skipped/cancelled,
 *         draw:started/spinning/winner/completed
 */

import { prisma } from '../lib/prisma';
import { logger } from '../utils';

export const REALTIME_CHANNEL = 'radiant';

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

// ─── DrawEngine Event Names ─────────────────────────────────────────────

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

export interface DrawSequenceData {
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
}

// Sequence timeline (ms after start) — same as the Socket.IO implementation.
const T_SPINNING = 4000;
const T_REVEALED = 8000;
const T_COMPLETED = 14000;
const T_IDLE = 19000;
/** Lock held while the spin transaction runs, before the sequence starts. */
const PRE_SEQUENCE_LOCK_SECONDS = 30;

const IDLE_STATE = (): ActiveDrawState => ({
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
});

function envVar(name: string): string | undefined {
  const g = globalThis as any;
  return g.Deno?.env?.get?.(name) ?? (typeof process !== 'undefined' ? process.env[name] : undefined);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const pending = new Set<Promise<unknown>>();

/**
 * Track a broadcast started inside a request. The edge entry (src/edge.ts)
 * awaits flushPendingBroadcasts() before sending each response, so events are
 * delivered even though the isolate may be suspended once the response is out.
 */
function runInBackground(p: Promise<unknown>): void {
  const guarded = p.catch((e) => logger.error('[Realtime] broadcast task failed', { error: String(e) }));
  pending.add(guarded);
  guarded.finally(() => pending.delete(guarded));
  const er = (globalThis as any).EdgeRuntime;
  if (er?.waitUntil) er.waitUntil(guarded);
}

/** Wait for all broadcasts started so far (bounded, never throws). */
export async function flushPendingBroadcasts(timeoutMs = 3000): Promise<void> {
  if (pending.size === 0) return;
  await Promise.race([Promise.allSettled([...pending]), sleep(timeoutMs)]);
}

// ─── RealtimeService ────────────────────────────────────────────────────

export class RealtimeService {
  private readonly url = envVar('SUPABASE_URL');
  private readonly key = envVar('SUPABASE_SERVICE_ROLE_KEY');

  isAttached(): boolean {
    return !!(this.url && this.key);
  }

  // ─── Broadcast transport ────────────────────────────────────────────

  private async send(event: string, payload: Record<string, unknown>): Promise<void> {
    if (!this.isAttached()) {
      logger.warn(`[Realtime] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing, skipping ${event}`);
      return;
    }
    try {
      const res = await fetch(`${this.url}/realtime/v1/api/broadcast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: this.key!,
          Authorization: `Bearer ${this.key}`,
        },
        body: JSON.stringify({
          messages: [{ topic: REALTIME_CHANNEL, event, payload, private: false }],
        }),
      });
      if (!res.ok) {
        logger.warn(`[Realtime] Broadcast ${event} failed: ${res.status} ${await res.text()}`);
      } else {
        logger.info(`[Realtime] Broadcast: ${event}`);
      }
    } catch (e) {
      logger.warn(`[Realtime] Broadcast ${event} error`, { error: String(e) });
    }
  }

  /** Broadcast a queue event to all connected clients */
  broadcastQueueEvent(payload: QueueEventPayload): void {
    runInBackground(this.send(payload.type, payload as unknown as Record<string, unknown>));
  }

  /** Broadcast a full queue state update */
  broadcastQueueState(state: QueueStatePayload): void {
    runInBackground(
      this.send(QUEUE_EVENTS.UPDATED, {
        type: QUEUE_EVENTS.UPDATED,
        state,
        timestamp: new Date().toISOString(),
      }),
    );
  }

  /** Broadcast a draw lifecycle event */
  broadcastDrawEvent(event: DrawEventName, payload: Record<string, unknown>): void {
    runInBackground(
      this.send(event, { type: event, ...payload, timestamp: new Date().toISOString() }),
    );
  }

  // ─── Draw Lock (DB-backed) ──────────────────────────────────────────

  async isDrawActive(): Promise<boolean> {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT (locked_until IS NOT NULL AND locked_until > now()) AS active FROM draw_state WHERE id = 1`,
    );
    return !!rows[0]?.active;
  }

  /** Attempt to acquire the draw lock. Returns true if lock acquired. */
  async acquireDrawLock(): Promise<boolean> {
    const rows = await prisma.$queryRawUnsafe(
      `UPDATE draw_state
          SET locked_until = now() + make_interval(secs => $1), updated_at = now()
        WHERE id = 1 AND (locked_until IS NULL OR locked_until <= now())
        RETURNING id`,
      PRE_SEQUENCE_LOCK_SECONDS,
    );
    return rows.length === 1;
  }

  async releaseDrawLock(): Promise<void> {
    await prisma.$queryRawUnsafe(
      `UPDATE draw_state SET locked_until = NULL, updated_at = now() WHERE id = 1`,
    );
  }

  // ─── Draw State ─────────────────────────────────────────────────────

  /** Current draw state, derived from the stored sequence start time. */
  async getDrawState(): Promise<ActiveDrawState> {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT data, started_at, updated_at,
              (EXTRACT(EPOCH FROM (now() - started_at)) * 1000)::bigint AS elapsed_ms
         FROM draw_state WHERE id = 1`,
    );
    const row = rows[0];
    if (!row || !row.started_at || !row.data) return IDLE_STATE();
    const elapsed = Number(row.elapsed_ms);
    let state: DrawState;
    if (elapsed < T_SPINNING) state = 'COUNTDOWN';
    else if (elapsed < T_REVEALED) state = 'SPINNING';
    else if (elapsed < T_COMPLETED) state = 'REVEALED';
    else if (elapsed < T_IDLE) state = 'COMPLETED';
    else return IDLE_STATE();

    const d = (typeof row.data === 'string' ? JSON.parse(row.data) : row.data) as DrawSequenceData;
    return {
      state,
      drawId: d.drawId,
      participantId: d.participantId,
      participantName: d.participantName,
      participantCompany: d.participantCompany ?? null,
      participantPhotoUrl: d.participantPhotoUrl ?? null,
      prizeId: d.prizeId,
      prizeName: d.prizeName,
      prizeTier: d.prizeTier,
      prizeImageUrl: d.prizeImageUrl ?? null,
      remainingStock: d.remainingStock,
      startedAt: new Date(row.started_at).toISOString(),
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Start a draw lifecycle.
   * The sequence COUNTDOWN (0s) → SPINNING (4s) → REVEALED (8s) → COMPLETED (14s)
   * → IDLE (19s) is anchored on draw_state.started_at:
   *  - GET /booth/draw-state derives the current phase from elapsed time;
   *  - only `draw:started` is broadcast (inside the request, reliably);
   *    clients schedule the follow-up phase events locally from it
   *    (src/services/socket/SocketService.ts), keeping the same timeline
   *    without relying on timers in a suspended edge isolate.
   */
  async startDrawSequence(winnerData: DrawSequenceData): Promise<void> {
    const rows = await prisma.$queryRawUnsafe(
      `UPDATE draw_state
          SET data = $1::jsonb,
              started_at = now(),
              locked_until = now() + make_interval(secs => $2),
              updated_at = now()
        WHERE id = 1
        RETURNING started_at`,
      JSON.stringify(winnerData),
      T_IDLE / 1000,
    );
    const startedAt = rows[0]?.started_at ? new Date(rows[0].started_at).toISOString() : new Date().toISOString();

    await this.send(DRAW_EVENTS.STARTED, {
      type: DRAW_EVENTS.STARTED,
      ...winnerData,
      startedAt,
      phaseOffsetsMs: { spinning: T_SPINNING, winner: T_REVEALED, completed: T_COMPLETED },
      timestamp: startedAt,
    });
    // The lock expires on its own at T_IDLE (locked_until), so a crashed
    // isolate can never leave the booth stuck.
    logger.info('[Realtime] Draw sequence started', { drawId: winnerData.drawId });
  }
}

/**
 * Socket Event Definitions
 *
 * All typed event definitions for the Real-Time Communication Layer.
 * Every event has a request payload, acknowledgement response, and version.
 *
 * Architecture:
 * Mobile App → Socket.IO → Backend Hub → TV Booth / Admin Dashboard
 */

// ─── Event Names ────────────────────────────────────────────────────────

export const SOCKET_EVENTS = {
  // Participant events
  PARTICIPANT_JOIN: 'participant:join',
  PARTICIPANT_UPDATE: 'participant:update',

  // Queue events
  QUEUE_NEXT: 'queue:next',
  QUEUE_CANCEL: 'queue:cancel',
  QUEUE_UPDATE: 'queue:update',
  QUEUE_CREATED: 'queue:created',
  QUEUE_UPDATED: 'queue:updated',
  QUEUE_CALLED: 'queue:called',
  QUEUE_COMPLETED: 'queue:completed',
  QUEUE_SKIPPED: 'queue:skipped',
  QUEUE_CANCELLED: 'queue:cancelled',

  // Draw events
  DRAW_START: 'draw:start',
  DRAW_COUNTDOWN: 'draw:countdown',
  DRAW_SPINNING: 'draw:spinning',
  DRAW_REVEALED: 'draw:revealed',
  DRAW_FINISHED: 'draw:finished',

  // DrawEngine lifecycle events (RC2.4)
  DRAW_STARTED: 'draw:started',
  DRAW_WINNER: 'draw:winner',
  DRAW_COMPLETED: 'draw:completed',
  DRAW_STATE_SYNC: 'draw:state-sync',

  // Winner events
  WINNER_ANNOUNCE: 'winner:announce',

  // System events
  DASHBOARD_UPDATE: 'dashboard:update',
  SYSTEM_STATUS: 'system:status',
} as const;

export type SocketEventName = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];

// ─── Event Versions ─────────────────────────────────────────────────────

export const EVENT_VERSIONS: Record<SocketEventName, string> = {
  [SOCKET_EVENTS.PARTICIPANT_JOIN]: '1.0.0',
  [SOCKET_EVENTS.PARTICIPANT_UPDATE]: '1.0.0',
  [SOCKET_EVENTS.QUEUE_NEXT]: '1.0.0',
  [SOCKET_EVENTS.QUEUE_CANCEL]: '1.0.0',
  [SOCKET_EVENTS.QUEUE_UPDATE]: '1.0.0',
  [SOCKET_EVENTS.QUEUE_CREATED]: '1.0.0',
  [SOCKET_EVENTS.QUEUE_UPDATED]: '1.0.0',
  [SOCKET_EVENTS.QUEUE_CALLED]: '1.0.0',
  [SOCKET_EVENTS.QUEUE_COMPLETED]: '1.0.0',
  [SOCKET_EVENTS.QUEUE_SKIPPED]: '1.0.0',
  [SOCKET_EVENTS.QUEUE_CANCELLED]: '1.0.0',
  [SOCKET_EVENTS.DRAW_START]: '1.0.0',

  [SOCKET_EVENTS.DRAW_COUNTDOWN]: '1.0.0',
  [SOCKET_EVENTS.DRAW_SPINNING]: '1.0.0',
  [SOCKET_EVENTS.DRAW_REVEALED]: '1.0.0',
  [SOCKET_EVENTS.DRAW_FINISHED]: '1.0.0',
  [SOCKET_EVENTS.DRAW_STARTED]: '1.0.0',
  [SOCKET_EVENTS.DRAW_WINNER]: '1.0.0',
  [SOCKET_EVENTS.DRAW_COMPLETED]: '1.0.0',
  [SOCKET_EVENTS.DRAW_STATE_SYNC]: '1.0.0',
  [SOCKET_EVENTS.WINNER_ANNOUNCE]: '1.0.0',

  [SOCKET_EVENTS.DASHBOARD_UPDATE]: '1.0.0',
  [SOCKET_EVENTS.SYSTEM_STATUS]: '1.0.0',
};

// ─── Participant Events ─────────────────────────────────────────────────

export interface ParticipantJoinPayload {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  queueNumber: string;
  registeredAt: string;
}

export interface ParticipantJoinAck {
  success: boolean;
  position: number;
  estimatedWait: number;
  error?: string;
}

export interface ParticipantUpdatePayload {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
}

export interface ParticipantUpdateAck {
  success: boolean;
  error?: string;
}

// ─── Queue Events ───────────────────────────────────────────────────────

export interface QueueNextPayload {
  drawId: string;
  currentQueueNumber: string;
  nextQueueNumber: string;
  timestamp: string;
}

export interface QueueNextAck {
  success: boolean;
  error?: string;
}

export interface QueueCancelPayload {
  drawId: string;
  queueNumber: string;
  reason: string;
  timestamp: string;
}

export interface QueueCancelAck {
  success: boolean;
  error?: string;
}

export interface QueueUpdatePayload {
  drawId: string;
  queue: Array<{
    number: string;
    name: string;
    status: 'waiting' | 'called' | 'cancelled' | 'completed';
  }>;
  totalWaiting: number;
  estimatedWait: number;
}

export interface QueueUpdateAck {
  success: boolean;
  error?: string;
}

// ─── Draw Events ────────────────────────────────────────────────────────

export interface DrawStartPayload {
  drawId: string;
  drawName: string;
  prizeName: string;
  prizeValue: string;
  participantCount: number;
  timestamp: string;
}

export interface DrawStartAck {
  success: boolean;
  error?: string;
}

export interface DrawCountdownPayload {
  drawId: string;
  seconds: number;
  timestamp: string;
}

export interface DrawCountdownAck {
  success: boolean;
  error?: string;
}

export interface DrawSpinningPayload {
  drawId: string;
  timestamp: string;
}

export interface DrawSpinningAck {
  success: boolean;
  error?: string;
}

export interface DrawRevealedPayload {
  drawId: string;
  winnerId: string;
  winnerName: string;
  winnerNumber: string;
  prizeName: string;
  prizeValue: string;
  timestamp: string;
}

export interface DrawRevealedAck {
  success: boolean;
  error?: string;
}

export interface DrawFinishedPayload {
  drawId: string;
  timestamp: string;
}

export interface DrawFinishedAck {
  success: boolean;
  error?: string;
}

// ─── DrawEngine Lifecycle Events (RC2.4) ────────────────────────────────

export interface DrawStartedPayload {
  drawId: string;
  drawName: string;
  participant: {
    id: string;
    name: string;
    number: string;
    company: string;
  };
  prizePool: Array<{
    id: string;
    name: string;
    tier: string;
    remaining: number;
  }>;
  timestamp: string;
}

export interface DrawStartedAck {
  success: boolean;
  error?: string;
}

export interface DrawWinnerPayload {
  drawId: string;
  winner: {
    id: string;
    name: string;
    number: string;
    company: string;
  };
  prize: {
    id: string;
    name: string;
    tier: string;
    value: string;
    icon: string;
    color: string;
  };
  probability: number;
  celebrationLevel: string;
  timestamp: string;
}

export interface DrawWinnerAck {
  success: boolean;
  error?: string;
}

export interface DrawCompletedPayload {
  drawId: string;
  statistics: {
    prizeRemaining: number;
    totalWinners: number;
    grandPrizeRemaining: number;
    drawCount: number;
  };
  timestamp: string;
}

export interface DrawCompletedAck {
  success: boolean;
  error?: string;
}

// ─── Winner Events ──────────────────────────────────────────────────────

export interface WinnerAnnouncePayload {
  drawId: string;
  winner: {
    id: string;
    name: string;
    number: string;
    company: string;
    prize: {
      name: string;
      value: string;
      icon: string;
    };
  };
  timestamp: string;
}

export interface WinnerAnnounceAck {
  success: boolean;
  error?: string;
}

// ─── System Events ──────────────────────────────────────────────────────

export interface DashboardUpdatePayload {
  type: 'queue' | 'draw' | 'winner' | 'system';
  data: Record<string, unknown>;
  timestamp: string;
}

export interface DashboardUpdateAck {
  success: boolean;
  error?: string;
}

export interface SystemStatusPayload {
  status: 'online' | 'offline' | 'maintenance' | 'error';
  uptime: number;
  activeConnections: number;
  activeDraws: number;
  queueLength: number;
  version: string;
  timestamp: string;
}

export interface SystemStatusAck {
  success: boolean;
  error?: string;
}

// ─── Generic Event Envelope ─────────────────────────────────────────────

export interface SocketEventEnvelope<T = unknown> {
  event: SocketEventName;
  version: string;
  timestamp: string;
  payload: T;
  id: string;
}

// ─── Connection Status ──────────────────────────────────────────────────

export type ConnectionStatus =
  'connected' | 'connecting' | 'disconnected' | 'reconnecting' | 'error';

export interface ConnectionInfo {
  status: ConnectionStatus;
  lastConnected: number | null;
  reconnectAttempts: number;
  latency: number;
}

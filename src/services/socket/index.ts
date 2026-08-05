/**
 * Socket.IO Real-Time Communication Layer
 *
 * Barrel export for the entire socket module.
 *
 * Architecture:
 * Mobile App → Socket.IO → Backend Hub → TV Booth / Admin Dashboard
 *
 * Features:
 * - Typed Event Definitions
 * - Reconnect Logic (exponential backoff with jitter)
 * - Heartbeat (latency measurement)
 * - Auto Retry (configurable retries)
 * - Connection Status (connected/connecting/disconnected/reconnecting/error)
 * - Offline Detection (message queueing)
 * - Error Handling (typed error callbacks)
 * - Acknowledgement (promise-based emit)
 * - Message Queue (flush on reconnect)
 * - Versioning (per-event version tracking)
 *
 * Ready for Express integration.
 */

// Core service
export { SocketService, createSocketService } from './SocketService';
export type { SocketServiceConfig } from './SocketService';

// Types
export { SOCKET_EVENTS, EVENT_VERSIONS } from './types';
export type {
  SocketEventName,
  ConnectionStatus,
  ConnectionInfo,
  SocketEventEnvelope,
  ParticipantJoinPayload,
  ParticipantJoinAck,
  ParticipantUpdatePayload,
  ParticipantUpdateAck,
  QueueNextPayload,
  QueueNextAck,
  QueueCancelPayload,
  QueueCancelAck,
  QueueUpdatePayload,
  QueueUpdateAck,
  DrawStartPayload,
  DrawStartAck,
  DrawCountdownPayload,
  DrawCountdownAck,
  DrawSpinningPayload,
  DrawSpinningAck,
  DrawRevealedPayload,
  DrawRevealedAck,
  DrawFinishedPayload,
  DrawFinishedAck,

  // DrawEngine lifecycle (RC2.4)
  DrawStartedPayload,
  DrawStartedAck,
  DrawWinnerPayload,
  DrawWinnerAck,
  DrawCompletedPayload,
  DrawCompletedAck,
  WinnerAnnouncePayload,
  WinnerAnnounceAck,
  DashboardUpdatePayload,
  DashboardUpdateAck,
  SystemStatusPayload,
  SystemStatusAck,
} from './types';

// Context
export { SocketContext, SocketProvider } from './context';
export type { SocketContextValue, SocketProviderProps } from './context';

// Hooks
export { useSocket, useSocketEvent, useSocketConnection, useSocketEmit } from './hooks';
export type { UseSocketConnectionReturn, UseSocketEmitReturn } from './hooks';

// Mock
export { MockSocketServer, createMockSocketServer } from './mock';
export type { MockSocketServerConfig } from './mock';

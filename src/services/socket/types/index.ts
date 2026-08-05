/**
 * Socket Types
 *
 * Barrel export for all socket event types.
 */

export { SOCKET_EVENTS, EVENT_VERSIONS } from './events';

export type {
  SocketEventName,
  ConnectionStatus,
  ConnectionInfo,
  SocketEventEnvelope,

  // Participant
  ParticipantJoinPayload,
  ParticipantJoinAck,
  ParticipantUpdatePayload,
  ParticipantUpdateAck,

  // Queue
  QueueNextPayload,
  QueueNextAck,
  QueueCancelPayload,
  QueueCancelAck,
  QueueUpdatePayload,
  QueueUpdateAck,

  // Draw
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

  // Winner
  WinnerAnnouncePayload,
  WinnerAnnounceAck,

  // System
  DashboardUpdatePayload,
  DashboardUpdateAck,
  SystemStatusPayload,
  SystemStatusAck,
} from './events';

/**
 * MockSocketServer
 *
 * A mock Socket.IO server for development and testing.
 * Simulates the backend hub without requiring an actual Express server.
 * Supports all events with realistic responses and delays.
 *
 * Usage:
 * ```ts
 * const mockServer = new MockSocketServer({ latency: 200 });
 * mockServer.start();
 *
 * // Later
 * mockServer.stop();
 * ```
 */

import {
  type SocketEventName,
  type SocketEventEnvelope,
  type ParticipantJoinPayload,
  type ParticipantJoinAck,
  type ParticipantUpdateAck,
  type QueueNextPayload,
  type QueueNextAck,
  type QueueCancelPayload,
  type QueueCancelAck,
  type QueueUpdatePayload,
  type QueueUpdateAck,
  type DrawStartPayload,
  type DrawStartAck,
  type DrawCountdownPayload,
  type DrawCountdownAck,
  type DrawSpinningPayload,
  type DrawSpinningAck,
  type DrawRevealedPayload,
  type DrawRevealedAck,
  type DrawFinishedPayload,
  type DrawFinishedAck,
  type DrawStartedPayload,
  type DrawStartedAck,
  type DrawWinnerPayload,
  type DrawWinnerAck,
  type DrawCompletedPayload,
  type DrawCompletedAck,
  type WinnerAnnouncePayload,

  type WinnerAnnounceAck,
  type DashboardUpdatePayload,
  type DashboardUpdateAck,
  type SystemStatusPayload,
  SOCKET_EVENTS,
} from '../types';

// ─── Configuration ──────────────────────────────────────────────────────

export interface MockSocketServerConfig {
  /** Simulated network latency in ms (default: 100) */
  latency?: number;
  /** Simulate random failures (0-1, default: 0) */
  failureRate?: number;
  /** Enable debug logging */
  debug?: boolean;
}

// ─── Event Handler ──────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EventHandler = (payload: any, envelope: SocketEventEnvelope<any>) => any;

// ─── MockSocketServer ───────────────────────────────────────────────────

export class MockSocketServer {
  private config: Required<MockSocketServerConfig>;
  private handlers: Map<SocketEventName, EventHandler> = new Map();
  private isRunning: boolean = false;
  private connectedClients: Set<string> = new Set();
  private eventLog: Array<{ event: SocketEventName; timestamp: number }> = [];
  private broadcastListeners: Map<SocketEventName, Set<(payload: unknown) => void>> = new Map();

  // Simulated state
  private queuePosition: number = 0;
  private drawCount: number = 0;

  constructor(config?: MockSocketServerConfig) {
    this.config = {
      latency: config?.latency ?? 100,
      failureRate: config?.failureRate ?? 0,
      debug: config?.debug ?? false,
    };

    this.registerDefaultHandlers();
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────

  /** Start the mock server */
  start(): void {
    this.isRunning = true;
    this.log('[MockServer] Started');
  }

  /** Stop the mock server */
  stop(): void {
    this.isRunning = false;
    this.connectedClients.clear();
    this.eventLog = [];
    this.log('[MockServer] Stopped');
  }

  /** Check if the server is running */
  getIsRunning(): boolean {
    return this.isRunning;
  }

  /** Get the number of connected clients */
  getClientCount(): number {
    return this.connectedClients.size;
  }

  /** Get the event log */
  getEventLog(): Array<{ event: SocketEventName; timestamp: number }> {
    return [...this.eventLog];
  }

  /** Clear the event log */
  clearEventLog(): void {
    this.eventLog = [];
  }

  // ─── Client Simulation ──────────────────────────────────────────────

  /** Simulate a client connecting */
  connectClient(clientId: string): void {
    this.connectedClients.add(clientId);
    this.log(`[MockServer] Client connected: ${clientId}`);
  }

  /** Simulate a client disconnecting */
  disconnectClient(clientId: string): void {
    this.connectedClients.delete(clientId);
    this.log(`[MockServer] Client disconnected: ${clientId}`);
  }

  /** Simulate a broadcast from the server */
  broadcast<T = unknown>(event: SocketEventName, payload: T): void {
    this.log(`[MockServer] Broadcasting: ${event}`);
    this.eventLog.push({ event, timestamp: Date.now() });

    const listeners = this.broadcastListeners.get(event);
    if (listeners) {
      listeners.forEach((cb) => cb(payload));
    }
  }

  /** Listen for broadcasts (simulates client-side listening) */
  onBroadcast<T = unknown>(event: SocketEventName, callback: (payload: T) => void): () => void {
    if (!this.broadcastListeners.has(event)) {
      this.broadcastListeners.set(event, new Set());
    }
    this.broadcastListeners.get(event)!.add(callback as (payload: unknown) => void);

    return () => {
      this.broadcastListeners.get(event)?.delete(callback as (payload: unknown) => void);
    };
  }

  // ─── Event Handling ─────────────────────────────────────────────────

  /**
   * Register a custom handler for an event.
   * Overrides the default handler.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on(event: SocketEventName, handler: (payload: any, envelope: SocketEventEnvelope<any>) => any): void {
    this.handlers.set(event, handler);
  }

  /**
   * Simulate receiving an event (as if from a client).
   * Returns the acknowledgement response.
   */
  async receive<T = unknown, R = unknown>(
    event: SocketEventName,
    payload: T,
  ): Promise<R> {
    if (!this.isRunning) {
      throw new Error('[MockServer] Server is not running');
    }

    this.log(`[MockServer] Received: ${event}`);
    this.eventLog.push({ event, timestamp: Date.now() });

    // Simulate network latency
    await this.delay();

    // Simulate random failure
    if (Math.random() < this.config.failureRate) {
      throw new Error('[MockServer] Simulated failure');
    }

    const handler = this.handlers.get(event);
    if (!handler) {
      throw new Error(`[MockServer] No handler for event: ${event}`);
    }

    const envelope: SocketEventEnvelope<T> = {
      event,
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      payload,
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    };

    return handler(payload, envelope) as Promise<R>;
  }

  // ─── Private ────────────────────────────────────────────────────────

  /** Register default handlers for all events */
  private registerDefaultHandlers(): void {
    // Participant events
    this.handlers.set(SOCKET_EVENTS.PARTICIPANT_JOIN, (_payload: ParticipantJoinPayload): ParticipantJoinAck => {
      this.queuePosition++;
      return {
        success: true,
        position: this.queuePosition,
        estimatedWait: this.queuePosition * 30,
      };
    });

    this.handlers.set(SOCKET_EVENTS.PARTICIPANT_UPDATE, (): ParticipantUpdateAck => ({
      success: true,
    }));

    // Queue events
    this.handlers.set(SOCKET_EVENTS.QUEUE_NEXT, (_payload: QueueNextPayload): QueueNextAck => ({
      success: true,
    }));

    this.handlers.set(SOCKET_EVENTS.QUEUE_CANCEL, (_payload: QueueCancelPayload): QueueCancelAck => ({
      success: true,
    }));

    this.handlers.set(SOCKET_EVENTS.QUEUE_UPDATE, (_payload: QueueUpdatePayload): QueueUpdateAck => ({
      success: true,
    }));

    // Draw events
    this.handlers.set(SOCKET_EVENTS.DRAW_START, (_payload: DrawStartPayload): DrawStartAck => {
      this.drawCount++;
      return { success: true };
    });

    this.handlers.set(SOCKET_EVENTS.DRAW_COUNTDOWN, (_payload: DrawCountdownPayload): DrawCountdownAck => ({
      success: true,
    }));

    this.handlers.set(SOCKET_EVENTS.DRAW_SPINNING, (_payload: DrawSpinningPayload): DrawSpinningAck => ({
      success: true,
    }));

    this.handlers.set(SOCKET_EVENTS.DRAW_REVEALED, (_payload: DrawRevealedPayload): DrawRevealedAck => ({
      success: true,
    }));

    this.handlers.set(SOCKET_EVENTS.DRAW_FINISHED, (_payload: DrawFinishedPayload): DrawFinishedAck => ({
      success: true,
    }));

    // DrawEngine lifecycle events (RC2.4)
    this.handlers.set(SOCKET_EVENTS.DRAW_STARTED, (_payload: DrawStartedPayload): DrawStartedAck => ({
      success: true,
    }));

    this.handlers.set(SOCKET_EVENTS.DRAW_WINNER, (_payload: DrawWinnerPayload): DrawWinnerAck => ({
      success: true,
    }));

    this.handlers.set(SOCKET_EVENTS.DRAW_COMPLETED, (_payload: DrawCompletedPayload): DrawCompletedAck => ({
      success: true,
    }));

    // Winner events

    this.handlers.set(SOCKET_EVENTS.WINNER_ANNOUNCE, (_payload: WinnerAnnouncePayload): WinnerAnnounceAck => ({
      success: true,
    }));

    // System events
    this.handlers.set(SOCKET_EVENTS.DASHBOARD_UPDATE, (_payload: DashboardUpdatePayload): DashboardUpdateAck => ({
      success: true,
    }));

    this.handlers.set(SOCKET_EVENTS.SYSTEM_STATUS, (): SystemStatusPayload => ({
      status: 'online',
      uptime: Date.now(),
      activeConnections: this.connectedClients.size,
      activeDraws: this.drawCount,
      queueLength: this.queuePosition,
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    }));
  }

  /** Simulate network delay */
  private delay(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, this.config.latency));
  }

  /** Debug logging */
  private log(message: string): void {
    if (this.config.debug) {
      // eslint-disable-next-line no-console
      console.log(message);
    }
  }
}

// ─── Factory Function ───────────────────────────────────────────────────

/**
 * Create a new MockSocketServer with sensible defaults.
 */
export function createMockSocketServer(
  config?: MockSocketServerConfig,
): MockSocketServer {
  return new MockSocketServer(config);
}

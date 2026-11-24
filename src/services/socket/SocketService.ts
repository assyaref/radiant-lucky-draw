/**
 * SocketService
 *
 * Realtime client built on Supabase Realtime (Phoenix channels over a plain
 * WebSocket — no extra dependency). It keeps the public API of the former
 * Socket.IO service, so every hook and page works unchanged:
 * - Typed event definitions, connection status tracking, heartbeat
 * - Reconnect logic with exponential backoff
 * - Message queue for offline messages, acknowledgement support
 *
 * Transport:
 * - Server events arrive as Broadcast messages on the `radiant` channel with
 *   the same event names and flat payloads the Socket.IO server emitted.
 * - `draw:get-state` is answered from GET /booth/draw-state and delivered
 *   locally as `draw:state-sync` (same contract as before).
 * - Booth spins only broadcast `draw:started` (with phaseOffsetsMs); this
 *   client schedules `draw:spinning`, `draw:winner` and `draw:completed`
 *   locally on the same timeline the server used (4s / 8s / 14s).
 *
 * Usage:
 * ```ts
 * const socket = new SocketService({ url: env.SUPABASE_URL });
 * socket.connect();
 * socket.on('draw:started', (payload) => { ... });
 * ```
 */

import { env } from '@/config/env';

import {
  type SocketEventName,
  type ConnectionStatus,
  type ConnectionInfo,
  type SocketEventEnvelope,
  EVENT_VERSIONS,
} from './types';

const CHANNEL = 'radiant';
const TOPIC = `realtime:${CHANNEL}`;

interface PhoenixMessage {
  topic: string;
  event: string;
  payload: any;
  ref: string | null;
  join_ref?: string | null;
}

// ─── Configuration ──────────────────────────────────────────────────────

export interface SocketServiceConfig {
  /** Supabase project URL (https://<ref>.supabase.co) */
  url: string;
  /** Extra options (apiKey: Supabase anon/publishable key) */
  options?: Record<string, unknown>;
  /** Heartbeat interval in ms (default: 25000) */
  heartbeatInterval?: number;
  /** Max reconnection attempts (default: 10) */
  maxReconnectAttempts?: number;
  /** Base delay for exponential backoff in ms (default: 1000) */
  reconnectBaseDelay?: number;
  /** Max delay for exponential backoff in ms (default: 30000) */
  reconnectMaxDelay?: number;
  /** Enable debug logging */
  debug?: boolean;
}

// ─── Queued Message ─────────────────────────────────────────────────────

interface QueuedMessage {
  event: SocketEventName;
  payload: unknown;
  ack?: (response: unknown) => void;
  timestamp: number;
  retryCount: number;
}

// ─── SocketService ──────────────────────────────────────────────────────

export class SocketService {
  private ws: WebSocket | null = null;
  private joined = false;
  private refCounter = 0;
  private joinRef: string | null = null;
  private pendingPings = new Map<string, number>();
  private manualClose = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private phaseTimers: ReturnType<typeof setTimeout>[] = [];
  private config: Required<SocketServiceConfig>;
  private status: ConnectionStatus = 'disconnected';
  private lastConnected: number | null = null;
  private reconnectAttempts: number = 0;
  private latency: number = 0;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private messageQueue: QueuedMessage[] = [];
  private isFlushingQueue: boolean = false;

  // Callbacks
  private onStatusChangeCallbacks: Array<(status: ConnectionStatus) => void> = [];
  private onConnectionInfoCallbacks: Array<(info: ConnectionInfo) => void> = [];
  private onErrorCallbacks: Array<(error: Error) => void> = [];

  // Event listeners
  private listeners: Map<SocketEventName, Set<(...args: unknown[]) => void>> = new Map();

  constructor(config: SocketServiceConfig) {
    this.config = {
      url: config.url,
      options: config.options ?? {},
      heartbeatInterval: config.heartbeatInterval ?? 25000,
      maxReconnectAttempts: config.maxReconnectAttempts ?? 10,
      reconnectBaseDelay: config.reconnectBaseDelay ?? 1000,
      reconnectMaxDelay: config.reconnectMaxDelay ?? 30000,
      debug: config.debug ?? false,
    };
  }

  // ─── Connection Management ──────────────────────────────────────────

  /** Connect to Supabase Realtime and join the broadcast channel */
  connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      this.log('[Socket] Already connected');
      return;
    }
    if (typeof WebSocket === 'undefined') {
      this.setStatus('error');
      return;
    }

    this.manualClose = false;
    this.setStatus('connecting');

    const apiKey = String(this.config.options.apiKey ?? env.SUPABASE_ANON_KEY);
    const base = this.config.url.replace(/\/+$/, '').replace(/^http/, 'ws');
    const url = `${base}/realtime/v1/websocket?apikey=${encodeURIComponent(apiKey)}&vsn=1.0.0`;

    let ws: WebSocket;
    try {
      ws = new WebSocket(url);
    } catch (error) {
      this.emitError(error as Error);
      this.setStatus('error');
      this.handleReconnect();
      return;
    }
    this.ws = ws;
    this.joined = false;

    ws.onopen = () => {
      this.log('[Socket] WebSocket open, joining channel');
      this.joinRef = this.nextRef();
      this.sendRaw({
        topic: TOPIC,
        event: 'phx_join',
        payload: {
          config: {
            broadcast: { self: false, ack: false },
            presence: { key: '' },
            postgres_changes: [],
            private: false,
          },
          access_token: apiKey,
        },
        ref: this.joinRef,
        join_ref: this.joinRef,
      });
    };

    ws.onmessage = (ev) => {
      let msg: PhoenixMessage;
      try {
        msg = JSON.parse(String(ev.data));
      } catch {
        return;
      }
      this.handleMessage(msg);
    };

    ws.onerror = () => {
      this.log('[Socket] Connection error');
      this.emitError(new Error('Realtime connection error'));
    };

    ws.onclose = () => {
      if (this.ws !== ws) return;
      this.log('[Socket] Disconnected');
      this.ws = null;
      this.joined = false;
      this.stopHeartbeat();
      this.setStatus('disconnected');
      if (!this.manualClose) this.handleReconnect();
    };
  }

  /** Disconnect from the server */
  disconnect(): void {
    this.log('[Socket] Disconnecting...');
    this.manualClose = true;
    this.stopHeartbeat();
    this.clearPhaseTimers();
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
    this.reconnectAttempts = 0;
    this.messageQueue = [];

    if (this.ws) {
      const ws = this.ws;
      this.ws = null;
      try {
        if (this.joined) this.sendRawOn(ws, { topic: TOPIC, event: 'phx_leave', payload: {}, ref: this.nextRef() });
        ws.close();
      } catch {
        /* ignore */
      }
    }
    this.joined = false;
    this.setStatus('disconnected');
  }

  /** Get current connection status */
  getStatus(): ConnectionStatus {
    return this.status;
  }

  /** Get connection info */
  getConnectionInfo(): ConnectionInfo {
    return {
      status: this.status,
      lastConnected: this.lastConnected,
      reconnectAttempts: this.reconnectAttempts,
      latency: this.latency,
    };
  }

  /** Check if connected */
  isConnected(): boolean {
    return this.status === 'connected' && this.joined && this.ws?.readyState === WebSocket.OPEN;
  }

  // ─── Event Emission ─────────────────────────────────────────────────

  /**
   * Emit an event with typed payload and optional acknowledgement.
   * If offline, the message is queued for later delivery.
   */
  emit<T = unknown, R = unknown>(
    event: SocketEventName,
    payload: T,
    ack?: (response: R) => void,
  ): void {
    const envelope: SocketEventEnvelope<T> = {
      event,
      version: EVENT_VERSIONS[event],
      timestamp: new Date().toISOString(),
      payload,
      id: this.generateId(),
    };

    if (!this.isConnected()) {
      this.log(`[Socket] Offline, queuing message: ${event}`);
      this.messageQueue.push({
        event,
        payload: envelope,
        ack: ack as (response: unknown) => void,
        timestamp: Date.now(),
        retryCount: 0,
      });
      return;
    }

    this.log(`[Socket] Emitting: ${event}`);
    this.deliver(event, envelope, ack as ((response: unknown) => void) | undefined);
  }

  /**
   * Emit an event with automatic retry on failure.
   */
  emitWithRetry<T = unknown, R = unknown>(
    event: SocketEventName,
    payload: T,
    options?: {
      maxRetries?: number;
      retryDelay?: number;
      ack?: (response: R) => void;
    },
  ): void {
    const maxRetries = options?.maxRetries ?? 3;
    const retryDelay = options?.retryDelay ?? 1000;
    let attempts = 0;

    const tryEmit = () => {
      attempts++;
      this.emit<T, R>(event, payload, (response) => {
        const ackResponse = response as { success?: boolean; error?: string };
        if (!ackResponse?.success && attempts < maxRetries) {
          this.log(`[Socket] Retry ${attempts}/${maxRetries} for: ${event}`);
          setTimeout(tryEmit, retryDelay * attempts);
          return;
        }
        options?.ack?.(response);
      });
    };

    tryEmit();
  }

  // ─── Event Listening ────────────────────────────────────────────────

  /**
   * Register a listener for a specific event.
   * Returns an unsubscribe function.
   */
  on<T = unknown>(event: SocketEventName, callback: (payload: T) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    // NOTE: The backend broadcasts flat payloads (e.g. { drawId, participantName, ... }),
    // NOT SocketEventEnvelope-wrapped objects. We pass the raw data through directly so that
    // consumers receive the same shape the backend emitted.
    // For frontend-emitted messages that DO wrap in SocketEventEnvelope, consumers should
    // unwrap .payload themselves if needed — but in this architecture all realtime events
    // originate from the backend and arrive as flat objects.
    const wrappedCallback = (...args: unknown[]) => {
      callback(args[0] as T);
    };

    this.listeners.get(event)!.add(wrappedCallback as (...args: unknown[]) => void);

    return () => {
      this.listeners.get(event)?.delete(wrappedCallback as (...args: unknown[]) => void);
    };
  }

  /**
   * Register a one-time listener for a specific event.
   */
  once<T = unknown>(event: SocketEventName, callback: (payload: T) => void): void {
    const unsubscribe = this.on<T>(event, (payload) => {
      unsubscribe();
      callback(payload);
    });
  }

  /**
   * Remove all listeners for a specific event.
   */
  off(event: SocketEventName): void {
    this.listeners.delete(event);
  }

  /**
   * Remove all listeners.
   */
  removeAllListeners(): void {
    this.listeners.clear();
  }

  // ─── Status Callbacks ───────────────────────────────────────────────

  /** Listen for connection status changes */
  onStatusChange(callback: (status: ConnectionStatus) => void): () => void {
    this.onStatusChangeCallbacks.push(callback);
    return () => {
      this.onStatusChangeCallbacks = this.onStatusChangeCallbacks.filter((cb) => cb !== callback);
    };
  }

  /** Listen for connection info updates */
  onConnectionInfo(callback: (info: ConnectionInfo) => void): () => void {
    this.onConnectionInfoCallbacks.push(callback);
    return () => {
      this.onConnectionInfoCallbacks = this.onConnectionInfoCallbacks.filter(
        (cb) => cb !== callback,
      );
    };
  }

  /** Listen for errors */
  onError(callback: (error: Error) => void): () => void {
    this.onErrorCallbacks.push(callback);
    return () => {
      this.onErrorCallbacks = this.onErrorCallbacks.filter((cb) => cb !== callback);
    };
  }

  // ─── Cleanup ────────────────────────────────────────────────────────

  /** Destroy the service and clean up all resources */
  destroy(): void {
    this.disconnect();
    this.onStatusChangeCallbacks = [];
    this.onConnectionInfoCallbacks = [];
    this.onErrorCallbacks = [];
    this.listeners.clear();
    this.messageQueue = [];
  }

  // ─── Private ────────────────────────────────────────────────────────

  /** Handle reconnection with exponential backoff */
  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.log('[Socket] Max reconnection attempts reached');
      this.setStatus('error');
      this.emitError(new Error('Max reconnection attempts reached'));
      return;
    }

    this.reconnectAttempts++;
    this.setStatus('reconnecting');

    const delay = Math.min(
      this.config.reconnectBaseDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.config.reconnectMaxDelay,
    );

    // Add jitter
    const jitter = Math.random() * 1000;
    const totalDelay = delay + jitter;

    this.log(
      `[Socket] Reconnecting in ${Math.round(totalDelay)}ms (attempt ${this.reconnectAttempts})`,
    );

    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, totalDelay);
  }

  /** Start the heartbeat interval */
  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatTimer = setInterval(() => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
      const ref = this.nextRef();
      this.pendingPings.set(ref, performance.now());
      this.sendRaw({ topic: 'phoenix', event: 'heartbeat', payload: {}, ref });
    }, this.config.heartbeatInterval);
  }

  /** Stop the heartbeat interval */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer !== null) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /** Flush queued messages when reconnected */
  private async flushMessageQueue(): Promise<void> {
    if (this.isFlushingQueue || this.messageQueue.length === 0) return;

    this.isFlushingQueue = true;
    this.log(`[Socket] Flushing ${this.messageQueue.length} queued messages`);

    const queue = [...this.messageQueue];
    this.messageQueue = [];

    for (const msg of queue) {
      try {
        this.deliver(msg.event, msg.payload as SocketEventEnvelope<unknown>, msg.ack);
        // Small delay between flushes to avoid overwhelming the server
        await new Promise((resolve) => setTimeout(resolve, 50));
      } catch {
        this.log(`[Socket] Failed to flush message: ${msg.event}`);
        this.messageQueue.push(msg);
      }
    }

    this.isFlushingQueue = false;
  }

  /** Set connection status and notify listeners */
  private setStatus(status: ConnectionStatus): void {
    this.status = status;
    this.notifyConnectionInfo();

    this.onStatusChangeCallbacks.forEach((cb) => {
      try {
        cb(status);
      } catch (error) {
        this.log(`[Socket] Error in status callback: ${error}`);
      }
    });
  }

  /** Notify connection info listeners */
  private notifyConnectionInfo(): void {
    const info = this.getConnectionInfo();
    this.onConnectionInfoCallbacks.forEach((cb) => {
      try {
        cb(info);
      } catch (error) {
        this.log(`[Socket] Error in connection info callback: ${error}`);
      }
    });
  }

  /** Emit an error to all error listeners */
  private emitError(error: Error): void {
    this.onErrorCallbacks.forEach((cb) => {
      try {
        cb(error);
      } catch (callbackError) {
        this.log(`[Socket] Error in error callback: ${callbackError}`);
      }
    });
  }

  private nextRef(): string {
    this.refCounter += 1;
    return String(this.refCounter);
  }

  private sendRaw(msg: PhoenixMessage): void {
    if (this.ws) this.sendRawOn(this.ws, msg);
  }

  private sendRawOn(ws: WebSocket, msg: PhoenixMessage): void {
    if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
  }

  /** Handle an incoming Phoenix message */
  private handleMessage(msg: PhoenixMessage): void {
    if (msg.topic === 'phoenix' && msg.event === 'phx_reply' && msg.ref) {
      const start = this.pendingPings.get(msg.ref);
      if (start !== undefined) {
        this.pendingPings.delete(msg.ref);
        this.latency = Math.round(performance.now() - start);
        this.notifyConnectionInfo();
      }
      return;
    }
    if (msg.topic !== TOPIC) return;

    switch (msg.event) {
      case 'phx_reply':
        if (msg.ref === this.joinRef) {
          if (msg.payload?.status === 'ok') {
            this.log('[Socket] Connected');
            this.joined = true;
            this.reconnectAttempts = 0;
            this.lastConnected = Date.now();
            this.setStatus('connected');
            this.startHeartbeat();
            this.flushMessageQueue();
          } else {
            this.emitError(new Error(`Realtime join failed: ${JSON.stringify(msg.payload?.response ?? {})}`));
            this.setStatus('error');
            this.ws?.close();
          }
        }
        return;
      case 'phx_error':
      case 'phx_close':
        this.log(`[Socket] Channel ${msg.event}`);
        this.ws?.close();
        return;
      case 'broadcast': {
        const event = msg.payload?.event as SocketEventName | undefined;
        if (!event) return;
        this.dispatch(event, msg.payload?.payload);
        return;
      }
      default:
        return;
    }
  }

  /** Deliver an event to local listeners */
  private dispatch(event: SocketEventName, payload: unknown): void {
    if (event === ('draw:started' as SocketEventName)) this.scheduleDrawPhases(payload);
    const callbacks = this.listeners.get(event);
    if (!callbacks) return;
    [...callbacks].forEach((cb) => {
      try {
        cb(payload);
      } catch (error) {
        this.log(`[Socket] Error in listener for ${event}: ${error}`);
      }
    });
  }

  /**
   * Booth spins broadcast only `draw:started` (with phaseOffsetsMs). Recreate
   * the follow-up phase events locally on the server's timeline.
   */
  private scheduleDrawPhases(raw: unknown): void {
    const d = raw as Record<string, any> | null;
    const offsets = d?.phaseOffsetsMs as { spinning: number; winner: number; completed: number } | undefined;
    if (!d || !offsets) return;
    this.clearPhaseTimers();
    const startedAt = d.startedAt ? Date.parse(d.startedAt) : NaN;
    // Align to the server start time when clocks agree; never trust a wildly skewed clock.
    const elapsed = Number.isFinite(startedAt) ? Date.now() - startedAt : 0;
    const shift = elapsed > 0 && elapsed < 3000 ? elapsed : 0;
    const at = (ms: number, event: string, payload: Record<string, unknown>) =>
      this.phaseTimers.push(
        setTimeout(
          () => this.dispatch(event as SocketEventName, { type: event, ...payload, timestamp: new Date().toISOString() }),
          Math.max(0, ms - shift),
        ),
      );
    at(offsets.spinning, 'draw:spinning', {
      drawId: d.drawId,
      participantId: d.participantId,
      participantName: d.participantName,
      participantPhotoUrl: d.participantPhotoUrl ?? null,
      prizeId: d.prizeId,
      prizeName: d.prizeName,
      prizeTier: d.prizeTier,
      prizeImageUrl: d.prizeImageUrl ?? null,
    });
    const winner: Record<string, unknown> = { ...d };
    for (const k of ['phaseOffsetsMs', 'startedAt', 'type', 'timestamp']) delete winner[k];
    at(offsets.winner, 'draw:winner', { ...winner, probability: 0 });
    at(offsets.completed, 'draw:completed', {
      drawId: d.drawId,
      participantId: d.participantId,
      prizeId: d.prizeId,
      prizeName: d.prizeName,
      remainingStock: d.remainingStock,
      totalWinners: 0,
      drawCount: 0,
    });
  }

  private clearPhaseTimers(): void {
    this.phaseTimers.forEach((t) => clearTimeout(t));
    this.phaseTimers = [];
  }

  /** Send a client event: request/response helpers or a channel broadcast */
  private deliver(
    event: SocketEventName,
    envelope: SocketEventEnvelope<unknown>,
    ack?: (response: unknown) => void,
  ): void {
    if (event === ('draw:get-state' as SocketEventName)) {
      fetch(`${env.API_BASE_URL}/booth/draw-state`)
        .then((r) => r.json())
        .then((j) => {
          if (j?.data) this.dispatch('draw:state-sync' as SocketEventName, j.data);
          ack?.({ success: true, data: j?.data });
        })
        .catch((error) => ack?.({ success: false, error: String(error) }));
      return;
    }
    if (event === ('ping' as SocketEventName)) {
      ack?.({ success: true });
      return;
    }
    this.sendRaw({
      topic: TOPIC,
      event: 'broadcast',
      payload: { type: 'broadcast', event, payload: envelope },
      ref: this.nextRef(),
      join_ref: this.joinRef,
    });
    ack?.({ success: true });
  }

  /** Generate a unique event ID */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
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
 * Create a new SocketService with sensible defaults.
 */
export function createSocketService(config: SocketServiceConfig): SocketService {
  return new SocketService(config);
}

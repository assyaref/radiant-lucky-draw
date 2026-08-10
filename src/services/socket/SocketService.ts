/**
 * SocketService
 *
 * Core Socket.IO service with:
 * - Typed event definitions
 * - Reconnect logic with exponential backoff
 * - Heartbeat mechanism
 * - Auto retry for failed emissions
 * - Connection status tracking
 * - Offline detection
 * - Error handling
 * - Acknowledgement support
 * - Message queue for offline messages
 * - Event versioning
 *
 * Usage:
 * ```ts
 * const socket = new SocketService(env.SOCKET_URL);
 * socket.connect();
 *
 * socket.emit('participant:join', payload, (ack) => { ... });
 * socket.on('draw:countdown', (payload) => { ... });
 * ```
 */

import { io, Socket } from 'socket.io-client';

import {
  type SocketEventName,
  type ConnectionStatus,
  type ConnectionInfo,
  type SocketEventEnvelope,
  EVENT_VERSIONS,
} from './types';

// ─── Configuration ──────────────────────────────────────────────────────

export interface SocketServiceConfig {
  /** Server URL */
  url: string;
  /** Connection options passed to Socket.IO */
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
  private socket: Socket | null = null;
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

  /** Connect to the server */
  connect(): void {
    if (this.socket?.connected) {
      this.log('[Socket] Already connected');
      return;
    }

    this.setStatus('connecting');

    this.socket = io(this.config.url, {
      reconnection: false, // We handle reconnection ourselves
      timeout: 10000,
      transports: ['websocket', 'polling'],
      ...this.config.options,
    });

    this.socket.on('connect', () => {
      this.log('[Socket] Connected');
      this.reconnectAttempts = 0;
      this.lastConnected = Date.now();
      this.setStatus('connected');
      this.startHeartbeat();
      this.flushMessageQueue();
    });

    this.socket.on('disconnect', (reason) => {
      this.log(`[Socket] Disconnected: ${reason}`);
      this.stopHeartbeat();
      this.setStatus('disconnected');
      this.handleReconnect();
    });

    this.socket.on('connect_error', (error) => {
      this.log(`[Socket] Connection error: ${error.message}`);
      this.emitError(error);
      this.setStatus('error');
      this.handleReconnect();
    });

    // Wire up all registered listeners
    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach((cb) => {
        this.socket?.on(event, cb as (...args: unknown[]) => void);
      });
    });
  }

  /** Disconnect from the server */
  disconnect(): void {
    this.log('[Socket] Disconnecting...');
    this.stopHeartbeat();
    this.reconnectAttempts = 0;
    this.messageQueue = [];

    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

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
    return this.status === 'connected' && this.socket?.connected === true;
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

    if (ack) {
      this.socket!.emit(event, envelope, (response: R) => {
        ack(response);
      });
    } else {
      this.socket!.emit(event, envelope);
    }
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

    // If socket is already connected, wire it up
    if (this.socket) {
      this.socket.on(event, wrappedCallback as (...args: unknown[]) => void);
    }

    return () => {
      this.listeners.get(event)?.delete(wrappedCallback as (...args: unknown[]) => void);
      this.socket?.off(event, wrappedCallback as (...args: unknown[]) => void);
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
    this.socket?.off(event);
  }

  /**
   * Remove all listeners.
   */
  removeAllListeners(): void {
    this.listeners.clear();
    this.socket?.removeAllListeners();
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

    setTimeout(() => {
      this.connect();
    }, totalDelay);
  }

  /** Start the heartbeat interval */
  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatTimer = setInterval(() => {
      if (!this.socket?.connected) return;

      const start = performance.now();
      this.socket.emit('ping', () => {
        this.latency = Math.round(performance.now() - start);
        this.notifyConnectionInfo();
      });
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
        if (msg.ack) {
          this.socket!.emit(msg.event, msg.payload, (response: unknown) => {
            msg.ack!(response);
          });
        } else {
          this.socket!.emit(msg.event, msg.payload);
        }
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

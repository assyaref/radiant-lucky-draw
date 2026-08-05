/**
 * SocketContext
 *
 * React context provider for the SocketService.
 * Makes the socket connection and typed event hooks available to all descendant components.
 *
 * Usage:
 * ```tsx
 * <SocketProvider url={env.SOCKET_URL} autoConnect debug>
 *   <YourApp />
 * </SocketProvider>
 * ```
 */

import { createContext, type ReactNode, useState, useEffect, useCallback, useRef } from 'react';

import { type SocketEventName, type ConnectionStatus, type ConnectionInfo } from '../types';
import { SocketService, type SocketServiceConfig } from '../SocketService';

// ─── Context Value ──────────────────────────────────────────────────────

export interface SocketContextValue {
  /** Current connection status */
  status: ConnectionStatus;
  /** Connection info (latency, reconnect attempts, etc.) */
  connectionInfo: ConnectionInfo;
  /** Connect to the server */
  connect: () => void;
  /** Disconnect from the server */
  disconnect: () => void;
  /** Check if connected */
  isConnected: boolean;
  /** Emit an event with typed payload and optional acknowledgement */
  emit: <T = unknown, R = unknown>(
    event: SocketEventName,
    payload: T,
    ack?: (response: R) => void,
  ) => void;
  /** Emit with automatic retry on failure */
  emitWithRetry: <T = unknown, R = unknown>(
    event: SocketEventName,
    payload: T,
    options?: { maxRetries?: number; retryDelay?: number; ack?: (response: R) => void },
  ) => void;
  /** Register a typed event listener (returns unsubscribe function) */
  on: <T = unknown>(event: SocketEventName, callback: (payload: T) => void) => () => void;
  /** Get the underlying SocketService instance */
  getService: () => SocketService;
}

// ─── Context ────────────────────────────────────────────────────────────

export const SocketContext = createContext<SocketContextValue | null>(null);

// ─── Provider Props ─────────────────────────────────────────────────────

export interface SocketProviderProps {
  /** Child components */
  children: ReactNode;
  /** Server URL */
  url: string;
  /** Connection options passed to Socket.IO */
  options?: Record<string, unknown>;
  /** Auto-connect on mount (default: true) */
  autoConnect?: boolean;
  /** Enable debug logging */
  debug?: boolean;
  /** Heartbeat interval in ms (default: 25000) */
  heartbeatInterval?: number;
  /** Max reconnection attempts (default: 10) */
  maxReconnectAttempts?: number;
}

// ─── Provider Component ─────────────────────────────────────────────────

export function SocketProvider({
  children,
  url,
  options,
  autoConnect = true,
  debug = false,
  heartbeatInterval,
  maxReconnectAttempts,
}: SocketProviderProps) {
  const serviceRef = useRef<SocketService | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo>({
    status: 'disconnected',
    lastConnected: null,
    reconnectAttempts: 0,
    latency: 0,
  });

  // Initialize service
  useEffect(() => {
    const config: SocketServiceConfig = {
      url,
      options,
      debug,
      heartbeatInterval,
      maxReconnectAttempts,
    };

    const service = new SocketService(config);
    serviceRef.current = service;

    // Listen for status changes
    const unsubStatus = service.onStatusChange((newStatus) => {
      setStatus(newStatus);
    });

    // Listen for connection info
    const unsubInfo = service.onConnectionInfo((info) => {
      setConnectionInfo(info);
    });

    // Auto-connect
    if (autoConnect) {
      service.connect();
    }

    return () => {
      unsubStatus();
      unsubInfo();
      service.destroy();
      serviceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  // ─── Actions ──────────────────────────────────────────────────────

  const connect = useCallback(() => {
    serviceRef.current?.connect();
  }, []);

  const disconnect = useCallback(() => {
    serviceRef.current?.disconnect();
  }, []);

  const emit = useCallback(
    <T = unknown, R = unknown>(event: SocketEventName, payload: T, ack?: (response: R) => void) => {
      serviceRef.current?.emit(event, payload, ack);
    },
    [],
  );

  const emitWithRetry = useCallback(
    <T = unknown, R = unknown>(
      event: SocketEventName,
      payload: T,
      options?: { maxRetries?: number; retryDelay?: number; ack?: (response: R) => void },
    ) => {
      serviceRef.current?.emitWithRetry(event, payload, options);
    },
    [],
  );

  const on = useCallback(
    <T = unknown,>(event: SocketEventName, callback: (payload: T) => void): (() => void) => {
      return serviceRef.current?.on(event, callback) ?? (() => {});
    },
    [],
  );

  const getService = useCallback((): SocketService => {
    if (!serviceRef.current) {
      throw new Error('[SocketContext] Service not initialized');
    }
    return serviceRef.current;
  }, []);

  const contextValue: SocketContextValue = {
    status,
    connectionInfo,
    connect,
    disconnect,
    isConnected: status === 'connected',
    emit,
    emitWithRetry,
    on,
    getService,
  };

  return <SocketContext.Provider value={contextValue}>{children}</SocketContext.Provider>;
}

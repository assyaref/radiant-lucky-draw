/**
 * useSocketConnection
 *
 * React hook for monitoring and controlling the socket connection status.
 * Provides connection state, auto-reconnect info, and manual connect/disconnect.
 *
 * Usage:
 * ```tsx
 * const { status, isConnected, latency, reconnectAttempts, connect, disconnect } =
 *   useSocketConnection();
 *
 * if (status === 'reconnecting') {
 *   return <ReconnectingOverlay />;
 * }
 * ```
 */

import { useCallback } from 'react';
import { type ConnectionStatus } from '../types';
import { useSocket } from './useSocket';

export interface UseSocketConnectionReturn {
  /** Current connection status */
  status: ConnectionStatus;
  /** Whether the socket is connected */
  isConnected: boolean;
  /** Whether the socket is connecting */
  isConnecting: boolean;
  /** Whether the socket is reconnecting */
  isReconnecting: boolean;
  /** Whether the socket encountered an error */
  isError: boolean;
  /** Whether the socket is disconnected */
  isDisconnected: boolean;
  /** Network latency in ms */
  latency: number;
  /** Number of reconnect attempts */
  reconnectAttempts: number;
  /** Timestamp of last successful connection */
  lastConnected: number | null;
  /** Manually connect */
  connect: () => void;
  /** Manually disconnect */
  disconnect: () => void;
}

/**
 * Hook for monitoring and controlling socket connection status.
 */
export function useSocketConnection(): UseSocketConnectionReturn {
  const { status, connectionInfo, connect, disconnect, isConnected } = useSocket();

  const isConnecting = status === 'connecting';
  const isReconnecting = status === 'reconnecting';
  const isError = status === 'error';
  const isDisconnected = status === 'disconnected';

  const handleConnect = useCallback(() => {
    connect();
  }, [connect]);

  const handleDisconnect = useCallback(() => {
    disconnect();
  }, [disconnect]);

  return {
    status,
    isConnected,
    isConnecting,
    isReconnecting,
    isError,
    isDisconnected,
    latency: connectionInfo.latency,
    reconnectAttempts: connectionInfo.reconnectAttempts,
    lastConnected: connectionInfo.lastConnected,
    connect: handleConnect,
    disconnect: handleDisconnect,
  };
}

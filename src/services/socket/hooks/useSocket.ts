/**
 * useSocket
 *
 * Primary React hook for accessing the SocketContext.
 * Provides typed access to emit, on, status, and connection info.
 *
 * Usage:
 * ```tsx
 * const { status, isConnected, emit, on } = useSocket();
 *
 * // Emit an event
 * emit('participant:join', { id: '123', name: 'John' }, (ack) => {
 *   console.log('Position:', ack.position);
 * });
 *
 * // Listen for events
 * useEffect(() => {
 *   const unsub = on('draw:countdown', (payload) => {
 *     console.log('Countdown:', payload.seconds);
 *   });
 *   return unsub;
 * }, [on]);
 * ```
 */

import { useContext } from 'react';
import { SocketContext, type SocketContextValue } from '../context/SocketContext';

/**
 * Hook for accessing the socket connection.
 * Must be used within a SocketProvider.
 */
export function useSocket(): SocketContextValue {
  const context = useContext(SocketContext);

  if (!context) {
    throw new Error(
      '[useSocket] SocketContext not found. Ensure your component is wrapped in a <SocketProvider>.',
    );
  }

  return context;
}

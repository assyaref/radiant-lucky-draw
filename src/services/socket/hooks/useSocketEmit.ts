/**
 * useSocketEmit
 *
 * React hook for emitting socket events with loading/error state tracking.
 * Useful for one-shot emissions like participant:join or queue:next.
 *
 * Usage:
 * ```tsx
 * const { emit, isLoading, error, response } = useSocketEmit();
 *
 * const handleJoin = async () => {
 *   const ack = await emit('participant:join', payload);
 *   if (ack.success) {
 *     setPosition(ack.position);
 *   }
 * };
 * ```
 */

import { useState, useCallback, useRef } from 'react';
import { type SocketEventName } from '../types';
import { useSocket } from './useSocket';

export interface UseSocketEmitReturn<T = unknown, R = unknown> {
  /** Emit an event and wait for acknowledgement */
  emit: (event: SocketEventName, payload: T) => Promise<R>;
  /** Whether an emission is in progress */
  isLoading: boolean;
  /** Error from the last emission */
  error: Error | null;
  /** Response from the last emission */
  response: R | null;
  /** Clear the error and response */
  reset: () => void;
}

/**
 * Hook for emitting socket events with promise-based acknowledgement.
 */
export function useSocketEmit<T = unknown, R = unknown>(): UseSocketEmitReturn<T, R> {
  const { emit: socketEmit } = useSocket();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [response, setResponse] = useState<R | null>(null);
  const mountedRef = useRef(true);

  const emit = useCallback(
    (event: SocketEventName, payload: T): Promise<R> => {
      return new Promise((resolve, reject) => {
        setIsLoading(true);
        setError(null);

        socketEmit<T, R>(event, payload, (ack) => {
          if (!mountedRef.current) return;

          setIsLoading(false);
          setResponse(ack);

          const ackResponse = ack as { success?: boolean; error?: string };
          if (ackResponse?.success === false) {
            const err = new Error(ackResponse.error ?? 'Emission failed');
            setError(err);
            reject(err);
          } else {
            resolve(ack);
          }
        });
      });
    },
    [socketEmit],
  );

  const reset = useCallback(() => {
    setError(null);
    setResponse(null);
    setIsLoading(false);
  }, []);

  return { emit, isLoading, error, response, reset };
}

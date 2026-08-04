/**
 * useSocketEvent
 *
 * React hook for subscribing to a specific socket event.
 * Automatically manages listener lifecycle (subscribe on mount, unsubscribe on unmount).
 *
 * Usage:
 * ```tsx
 * const { lastPayload, isActive } = useSocketEvent('draw:countdown');
 *
 * // Or with a callback
 * useSocketEvent('draw:countdown', (payload) => {
 *   setSeconds(payload.seconds);
 * });
 * ```
 */

import { useEffect, useState, useCallback } from 'react';
import { type SocketEventName } from '../types';
import { useSocket } from './useSocket';

/**
 * Subscribe to a socket event with a callback.
 * Automatically cleans up on unmount.
 */
export function useSocketEvent<T = unknown>(
  event: SocketEventName,
  callback?: (payload: T) => void,
): {
  lastPayload: T | null;
  isActive: boolean;
} {
  const { on } = useSocket();
  const [lastPayload, setLastPayload] = useState<T | null>(null);
  const [isActive, setIsActive] = useState(false);

  const handleEvent = useCallback(
    (payload: T) => {
      setLastPayload(payload);
      setIsActive(true);
      callback?.(payload);
    },
    [callback],
  );

  useEffect(() => {
    const unsubscribe = on<T>(event, handleEvent);
    return () => {
      unsubscribe();
      setIsActive(false);
    };
  }, [event, on, handleEvent]);

  return { lastPayload, isActive };
}

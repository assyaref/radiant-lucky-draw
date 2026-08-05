/**
 * useQueueSync
 *
 * Keeps the queue store in sync with the backend.
 *
 * On mount:
 *   1. Fetches the initial queue state from GET /queue/state
 *   2. Subscribes to Socket.IO queue events and re-syncs the store
 *      whenever the backend queue changes.
 *
 * The store is a read-only cache; all mutations happen on the backend.
 */

import { useEffect } from 'react';
import { useSocketEvent } from '../../services/socket/hooks';
import { SOCKET_EVENTS } from '../../services/socket/types';
import { useQueueStore } from './queueStore';
import type { QueueState } from '../../api/queue';

/**
 * Extract the queue state from a socket payload.
 *
 * The backend broadcasts two shapes:
 *   - queue:updated  -> { type, state, timestamp }
 *   - queue:created  -> { type, entry, state, timestamp }
 * Both carry the full state under `state`.
 */
function extractState(payload: unknown): QueueState | null {
  if (!payload || typeof payload !== 'object') return null;

  const candidate = payload as { state?: unknown; entries?: unknown };

  // Direct state shape: { entries, ... }
  if (candidate.entries && Array.isArray(candidate.entries)) {
    return candidate as unknown as QueueState;
  }

  // Envelope shape: { state: { entries, ... } }
  if (candidate.state && typeof candidate.state === 'object') {
    const nested = candidate.state as { entries?: unknown };
    if (nested.entries && Array.isArray(nested.entries)) {
      return nested as unknown as QueueState;
    }
  }

  return null;
}

export function useQueueSync() {
  const fetchState = useQueueStore((s) => s.fetchState);
  const syncState = useQueueStore((s) => s.syncState);

  // Initial fetch on mount. Deferred so the store's synchronous loading state
  // update does not run during the effect's synchronous execution
  // (React 19 recommended pattern for set-state-in-effect).
  useEffect(() => {
    const id = setTimeout(() => {
      void fetchState();
    }, 0);
    return () => clearTimeout(id);
  }, [fetchState]);

  // Re-sync whenever the backend broadcasts a queue change.
  // The backend broadcasts the full queue state on every mutation.
  useSocketEvent(SOCKET_EVENTS.QUEUE_UPDATED, (payload) => {
    const state = extractState(payload);
    if (state) {
      syncState(state);
    } else {
      void fetchState();
    }
  });

  // Fallback: refresh on any queue lifecycle event to guarantee consistency.
  useSocketEvent(SOCKET_EVENTS.QUEUE_CREATED, () => void fetchState());
  useSocketEvent(SOCKET_EVENTS.QUEUE_CALLED, () => void fetchState());
  useSocketEvent(SOCKET_EVENTS.QUEUE_COMPLETED, () => void fetchState());
  useSocketEvent(SOCKET_EVENTS.QUEUE_SKIPPED, () => void fetchState());
  useSocketEvent(SOCKET_EVENTS.QUEUE_CANCELLED, () => void fetchState());
}

/**
 * Queue API Client
 *
 * Typed client for the backend queue endpoints.
 *
 * - GET  /queue/state      (public) - initial queue state for TV/registration sync
 * - GET  /queue            (auth)   - full queue state for operator
 * - POST /queue/add        (auth)   - add participant to queue
 * - POST /queue/call-next  (auth)   - call next participant
 * - POST /queue/complete   (auth)   - complete current participant
 * - POST /queue/skip       (auth)   - skip a waiting participant
 * - POST /queue/cancel     (auth)   - cancel a waiting participant
 */

import api from './client';

// ─── Types ──────────────────────────────────────────────────────────────

export interface QueueEntry {
  id: string;
  participantId: string;
  participantName: string;
  queueNumber: string;
  status: string;
  createdAt: string;
}

export interface QueueState {
  entries: QueueEntry[];
  currentNumber?: string;
  lastCalled?: string;
  estimatedWait: number;
  totalWaiting: number;
}

export interface CallNextResult {
  participantId: string;
  participantName: string;
  queueNumber: string;
  message: string;
}

// ─── API ────────────────────────────────────────────────────────────────

export const queueApi = {
  /** Public: fetch the current queue state (used for initial sync) */
  getState: () => api.get<{ data: QueueState }>('/queue/state'),

  /** Auth: fetch the full queue state for the operator */
  getOperatorState: () => api.get<{ data: QueueState }>('/queue'),

  /** Auth: add a participant to the queue */
  addToQueue: (participantId: string) =>
    api.post<{ data: { message: string } }>('/queue/add', { participantId }),

  /** Auth: call the next participant */
  callNext: () => api.post<{ data: CallNextResult }>('/queue/call-next'),

  /** Auth: complete the current participant */
  completeCurrent: (participantId: string) =>
    api.post<{ data: { message: string } }>('/queue/complete', { participantId }),

  /** Auth: skip a waiting participant */
  skip: (participantId: string) =>
    api.post<{ data: { message: string } }>('/queue/skip', { participantId }),

  /** Auth: cancel a waiting participant */
  cancel: (participantId: string) =>
    api.post<{ data: { message: string } }>('/queue/cancel', { participantId }),
};

export default queueApi;

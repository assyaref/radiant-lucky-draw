/**
 * Queue Entity
 */

export interface QueueEntry {
  id: string;
  participantId: string;
  participantName: string;
  queueNumber: string;
  status: 'waiting' | 'called' | 'completed' | 'cancelled' | 'skipped';
  calledAt?: string;
  completedAt?: string;
  drawId?: string;
  createdAt: string;
}


export interface QueueState {
  entries: QueueEntry[];
  currentNumber?: string;
  lastCalled?: string;
  estimatedWait: number;
}

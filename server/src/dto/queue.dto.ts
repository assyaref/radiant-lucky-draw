/**
 * Queue DTOs
 */

export interface QueueEntryResponse {
  id: string;
  participantId: string;
  participantName: string;
  queueNumber: string;
  status: string;
  createdAt: string;
}

export interface QueueStateResponse {
  entries: QueueEntryResponse[];
  currentNumber?: string;
  lastCalled?: string;
  estimatedWait: number;
  totalWaiting: number;
}

export interface CallNextResponse {
  participantId: string;
  participantName: string;
  queueNumber: string;
  message: string;
}

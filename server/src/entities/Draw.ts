/**
 * Draw Entity
 */

export interface Draw {
  id: string;
  name: string;
  prizeId: string;
  prizeName: string;
  status: 'pending' | 'countdown' | 'spinning' | 'revealed' | 'completed' | 'cancelled';
  participantIds: string[];
  winnerId?: string;
  winnerName?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

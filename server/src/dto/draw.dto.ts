/**
 * Draw DTOs
 */

export interface CreateDrawRequest {
  name: string;
  prizeId: string;
  participantIds: string[];
}

export interface UpdateDrawStatusRequest {
  status: 'pending' | 'countdown' | 'spinning' | 'revealed' | 'completed' | 'cancelled';
  // NOTE (RC3): winnerId / winnerName are intentionally NOT accepted from the
  // client. Winner selection is performed exclusively on the server side.
}

export interface DrawResponse {
  id: string;
  name: string;
  prizeId: string;
  prizeName: string;
  status: string;
  participantCount: number;
  winnerId?: string;
  winnerName?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

/**
 * Participant DTOs
 */

export interface CreateParticipantRequest {
  name: string;
  email?: string;
  phone: string;
  company: string;
}

export interface UpdateParticipantRequest {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  status?: 'registered' | 'called' | 'completed' | 'cancelled';
  photoUrl?: string;
  prizeId?: string;
  claimStatus?: 'unclaimed' | 'claimed';
}

export interface ParticipantResponse {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string;
  queueNumber: string;
  status: string;
  registeredAt: string;
  photoUrl?: string;
  prizeId?: string;
  claimStatus: string;
  estimatedWait: number;
  currentQueue: number;
}

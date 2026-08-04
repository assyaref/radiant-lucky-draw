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
}

export interface ParticipantResponse {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  queueNumber: string;
  status: string;
  registeredAt: string;
  estimatedWait: number;
  currentQueue: number;
}

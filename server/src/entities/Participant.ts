/**
 * Participant Entity
 */

export interface Participant {
  id: string;
  eventId?: string | null;
  name: string;
  email: string;
  phone: string | null;
  company: string;
  queueNumber: string;
  status: 'registered' | 'called' | 'completed' | 'cancelled';
  registeredAt: string;
  calledAt?: string;
  completedAt?: string;
  photoUrl?: string;
  prizeId?: string;
  claimStatus: 'unclaimed' | 'claimed';
  drawId?: string;
}

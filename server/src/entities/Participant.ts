/**
 * Participant Entity
 */

export interface Participant {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  queueNumber: string;
  status: 'registered' | 'called' | 'completed' | 'cancelled';
  registeredAt: string;
  calledAt?: string;
  completedAt?: string;
  drawId?: string;
}

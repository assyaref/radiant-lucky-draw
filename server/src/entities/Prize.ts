/**
 * Prize Entity
 */

export interface Prize {
  id: string;
  eventId?: string | null;
  name: string;
  description: string | null;
  value: number;
  currency: string;
  quantity: number;
  remaining: number;
  imageUrl?: string;
  sponsor?: string;
  tier: 'doorprize' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'grand';
  probability: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

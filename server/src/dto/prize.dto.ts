/**
 * Prize DTOs
 */

export interface CreatePrizeRequest {
  name: string;
  eventId?: string;
  description?: string;
  value: number;
  currency?: string;
  quantity: number;
  imageUrl?: string;
  sponsor?: string;
  tier: 'doorprize' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'grand';
  probability?: number;
}

export interface UpdatePrizeRequest {
  name?: string;
  eventId?: string;
  description?: string;
  value?: number;
  currency?: string;
  quantity?: number;
  imageUrl?: string;
  sponsor?: string;
  tier?: 'doorprize' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'grand';
  probability?: number;
  isActive?: boolean;
}

export interface PrizeResponse {
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
  tier: string;
  probability: number;
  isActive: boolean;
  createdAt: string;
}

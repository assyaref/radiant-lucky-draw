/**
 * Prize DTOs
 */

export interface CreatePrizeRequest {
  name: string;
  description: string;
  value: number;
  currency?: string;
  quantity: number;
  imageUrl?: string;
  sponsor?: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  probability?: number;
}

export interface UpdatePrizeRequest {
  name?: string;
  description?: string;
  value?: number;
  currency?: string;
  quantity?: number;
  imageUrl?: string;
  sponsor?: string;
  tier?: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  probability?: number;
  isActive?: boolean;
}

export interface PrizeResponse {
  id: string;
  name: string;
  description: string;
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

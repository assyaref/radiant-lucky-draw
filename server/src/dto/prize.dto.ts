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
  isActive: boolean;
  createdAt: string;
}

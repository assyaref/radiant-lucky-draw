/**
 * Prize Entity
 */

export interface Prize {
  id: string;
  name: string;
  description: string;
  value: number;
  currency: string;
  quantity: number;
  remaining: number;
  imageUrl?: string;
  sponsor?: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

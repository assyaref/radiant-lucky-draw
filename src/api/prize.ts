/**
 * Prize API
 *
 * API client functions for Prize management (CRUD).
 * All prizes are sourced from the Prize table via the backend.
 */

import api from './client';

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
  tier: string;
  probability: number;
  isActive: boolean;
  createdAt: string;
}

export interface CreatePrizePayload {
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

export interface UpdatePrizePayload {
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

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export interface Paginated<T> {
  success: boolean;
  data: T[];
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export const prizeApi = {
  /** List all prizes (paginated) */
  list: (params?: { page?: number; limit?: number; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.search) query.set('search', params.search);
    const qs = query.toString();
    return api.get<Paginated<Prize>>(`/prizes${qs ? `?${qs}` : ''}`);
  },

  /** Get a single prize by id */
  getById: (id: string) => api.get<ApiEnvelope<Prize>>(`/prizes/${id}`),

  /** Create a new prize */
  create: (payload: CreatePrizePayload) => api.post<ApiEnvelope<Prize>>('/prizes', payload),

  /** Update an existing prize */
  update: (id: string, payload: UpdatePrizePayload) =>
    api.put<ApiEnvelope<Prize>>(`/prizes/${id}`, payload),

  /** Delete a prize */
  remove: (id: string) => api.delete<ApiEnvelope<{ id: string }>>(`/prizes/${id}`),
};

export default prizeApi;

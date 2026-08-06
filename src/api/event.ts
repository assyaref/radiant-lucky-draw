/**
 * Event API Client
 * M4.1 Enterprise Integration
 */

import api from './client';

export interface EventData {
  id: string;
  name: string;
  description?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  status: string;
  logoUrl?: string;
  bannerUrl?: string;
  theme?: string;
  createdBy?: string;
  _count?: { participants: number; prizes: number; winners: number; booths: number };
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventPayload {
  name: string;
  description?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  logoUrl?: string;
  bannerUrl?: string;
  theme?: string;
}

export interface UpdateEventPayload {
  name?: string;
  description?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  logoUrl?: string;
  bannerUrl?: string;
  theme?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta?: { page: number; limit: number; total: number; totalPages: number };
}

export const eventApi = {
  list: (params?: { page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    return api.get<PaginatedResponse<EventData>>(`/events${qs ? `?${qs}` : ''}`);
  },

  getById: (id: string) => api.get<{ success: boolean; data: EventData }>(`/events/${id}`),

  create: (payload: CreateEventPayload) =>
    api.post<{ success: boolean; data: EventData }>('/events', payload),

  update: (id: string, payload: UpdateEventPayload) =>
    api.put<{ success: boolean; data: EventData }>(`/events/${id}`, payload),

  delete: (id: string) => api.delete<{ success: boolean }>(`/events/${id}`),
};

export default eventApi;

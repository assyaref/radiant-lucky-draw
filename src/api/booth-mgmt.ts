/**
 * Booth Management API Client
 * M4.1 Enterprise Integration
 */

import api from './client';

export interface BoothData {
  id: string;
  name: string;
  code: string;
  location?: string;
  status: string;
  eventId: string;
  operatorId?: string;
  theme?: string;
  qrCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBoothPayload {
  name: string;
  code: string;
  location?: string;
  eventId: string;
  operatorId?: string;
  theme?: string;
  status?: string;
}

export interface UpdateBoothPayload {
  name?: string;
  code?: string;
  location?: string;
  status?: string;
  operatorId?: string;
  theme?: string;
}

export const boothMgmtApi = {
  listByEvent: (eventId: string) =>
    api.get<{ success: boolean; data: BoothData[] }>(`/booths?eventId=${eventId}`),

  getById: (id: string) => api.get<{ success: boolean; data: BoothData }>(`/booths/${id}`),

  create: (payload: CreateBoothPayload) =>
    api.post<{ success: boolean; data: BoothData }>('/booths', payload),

  update: (id: string, payload: UpdateBoothPayload) =>
    api.put<{ success: boolean; data: BoothData }>(`/booths/${id}`, payload),

  delete: (id: string) => api.delete<{ success: boolean }>(`/booths/${id}`),
};

export default boothMgmtApi;

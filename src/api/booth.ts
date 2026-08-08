/**
 * Booth API
 *
 * API client functions for the Digital Lucky Draw Booth Enterprise flow.
 */

import api from './client';

export interface BoothConfig {
  eventName: string;
  eventDate?: string;
  theme: string;
  celebrationLevel: string;
  soundEnabled: boolean;
  totalParticipants: number;
  prizes: PublicPrize[];
}

export interface PublicPrize {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  tier: string;
}

export interface BoothParticipant {
  id: string;
  name: string;
  company: string;
  whatsapp?: string;
  photoUrl?: string;
  status?: string;
  registeredAt: string;
  hasPhoto: boolean;
}

export interface UploadPhotoResult {
  id: string;
  photoUrl: string;
}

export interface SpinResult {
  drawId: string;
  participantId: string;
  participantName: string;
  prizeId: string;
  prizeName: string;
  prizeImageUrl?: string;
  prizeTier: string;
  remainingStock: number;
  timestamp: string;
}

export interface Winner {
  id: string;
  drawId: string;
  participantId: string;
  participantName: string;
  participantCompany: string;
  participantPhone?: string;
  participantPhotoUrl?: string;
  prizeId: string;
  prizeName: string;
  prizeImageUrl?: string;
  prizeTier: string;
  prizeValue: number;
  claimStatus: 'unclaimed' | 'claimed';
  claimedAt?: string;
  claimedBy?: string;
  announcedAt: string;
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

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export const boothApi = {
  /** Get public booth configuration + active prizes */
  getConfig: () => api.get<ApiEnvelope<BoothConfig>>('/booth/config'),

  /** Register a new booth participant */
  registerParticipant: (payload: { name: string; company: string; whatsapp?: string }) =>
    api.post<ApiEnvelope<BoothParticipant>>('/booth/participants', payload),

  /** Upload participant face photo (base64 data URL) */
  uploadPhoto: (payload: { participantId: string; photo: string }) =>
    api.post<ApiEnvelope<UploadPhotoResult>>('/booth/participants/photo', payload),

  /** Perform a lucky draw spin */
  spin: (payload: { participantId: string }) =>
    api.post<ApiEnvelope<SpinResult>>('/booth/luckydraw/spin', payload),

  /** List winners (admin) */
  listWinners: (params?: { page?: number; limit?: number; claimStatus?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.claimStatus) query.set('claimStatus', params.claimStatus);
    const qs = query.toString();
    return api.get<Paginated<Winner>>(`/booth/winners${qs ? `?${qs}` : ''}`);
  },

  /** List participants (admin, authenticated) */
  listParticipants: (params?: { page?: number; limit?: number; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.search) query.set('search', params.search);
    const qs = query.toString();
    return api.get<Paginated<BoothParticipant>>(`/participants${qs ? `?${qs}` : ''}`);
  },

  /** Update winner claim status (admin) */
  updateClaimStatus: (id: string, claimStatus: 'unclaimed' | 'claimed') =>
    api.put<ApiEnvelope<Winner>>(`/booth/winners/${id}/claim`, { claimStatus }),

  /** Delete a participant (admin, cascade) */
  deleteParticipant: (id: string, force?: boolean) =>
    api.delete<ApiEnvelope<{ message: string }>>(
      `/participants/${id}${force ? '?force=true' : ''}`,
    ),
};

export default boothApi;

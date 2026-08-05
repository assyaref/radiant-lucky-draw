/**
 * Booth DTOs
 *
 * DTOs for the Digital Lucky Draw Booth Enterprise flow.
 */

export interface BoothConfigResponse {
  eventName: string;
  eventDate?: string;
  theme: string;
  celebrationLevel: string;
  soundEnabled: boolean;
  prizes: PublicPrize[];
}

export interface PublicPrize {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  tier: string;
}

export interface CreateBoothParticipantRequest {
  name: string;
  company: string;
  whatsapp?: string;
}

export interface BoothParticipantResponse {
  id: string;
  name: string;
  company: string;
  whatsapp?: string;
  photoUrl?: string;
  registeredAt: string;
  hasPhoto: boolean;
}

export interface UploadPhotoRequest {
  participantId: string;
  photo: string; // base64 data URL
}

export interface UploadPhotoResponse {
  id: string;
  photoUrl: string;
}

export interface SpinRequest {
  participantId: string;
}

export interface SpinResponse {
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

export interface WinnerResponse {
  id: string;
  drawId: string;
  participantId: string;
  participantName: string;
  participantCompany: string;
  participantPhotoUrl?: string;
  prizeId: string;
  prizeName: string;
  prizeImageUrl?: string;
  prizeTier: string;
  prizeValue: number;
  claimStatus: string;
  announcedAt: string;
}

export interface UpdateClaimStatusRequest {
  claimStatus: 'unclaimed' | 'claimed';
}

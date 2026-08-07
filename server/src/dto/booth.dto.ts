export interface CreateBoothRequest {
  name: string;
  code: string;
  location?: string;
  eventId: string;
  operatorId?: string;
  theme?: string;
}

export interface UpdateBoothRequest {
  name?: string;
  code?: string;
  location?: string;
  status?: 'active' | 'inactive' | 'maintenance';
  operatorId?: string;
  theme?: string;
}

export interface BoothResponse {
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

export interface BoothConfigResponse {
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
  description?: string;
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
  company?: string;
  whatsapp?: string;
  photoUrl?: string;
  registeredAt: string;
  hasPhoto: boolean;
}

export interface UploadPhotoRequest {
  participantId: string;
  photo: string;
}

export interface UploadPhotoResponse {
  id: string;
  photoUrl: string;
  uploadedAt?: string;
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
  participantCompany?: string;
  participantPhone?: string;
  participantPhotoUrl?: string;
  prizeId: string;
  prizeName: string;
  prizeImageUrl?: string;
  prizeTier: string;
  prizeValue?: number;
  claimStatus: string;
  claimedAt?: string;
  claimedBy?: string;
  announcedAt: string;
}

export interface UpdateClaimStatusRequest {
  claimStatus: 'unclaimed' | 'claimed' | 'expired';
}

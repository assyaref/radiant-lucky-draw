/**
 * Settings DTOs
 */

export interface UpdateSettingsRequest {
  eventName?: string;
  eventDate?: string;
  eventLocation?: string;
  eventStatus?: 'upcoming' | 'active' | 'completed';
  eventDescription?: string;
  maxParticipants?: number;
  drawInterval?: number;
  celebrationLevel?: 'low' | 'medium' | 'high' | 'extreme';
  theme?: 'dark' | 'light' | 'luxury';
  soundEnabled?: boolean;
  autoAdvance?: boolean;
  logoUrl?: string;
  bannerUrl?: string;
  backgroundUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  sponsorIds?: string[];
}

export interface SettingsResponse {
  id: string;
  eventName: string;
  eventDate: string;
  eventLocation?: string;
  eventStatus: string;
  eventDescription?: string;
  maxParticipants: number;
  drawInterval: number;
  celebrationLevel: string;
  theme: string;
  soundEnabled: boolean;
  autoAdvance: boolean;
  logoUrl?: string;
  bannerUrl?: string;
  backgroundUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  sponsorIds?: string[];
  updatedAt: string;
}

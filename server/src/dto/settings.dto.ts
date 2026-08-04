/**
 * Settings DTOs
 */

export interface UpdateSettingsRequest {
  eventName?: string;
  eventDate?: string;
  maxParticipants?: number;
  drawInterval?: number;
  celebrationLevel?: 'low' | 'medium' | 'high' | 'extreme';
  theme?: 'dark' | 'light' | 'luxury';
  soundEnabled?: boolean;
  autoAdvance?: boolean;
}

export interface SettingsResponse {
  id: string;
  eventName: string;
  eventDate: string;
  maxParticipants: number;
  drawInterval: number;
  celebrationLevel: string;
  theme: string;
  soundEnabled: boolean;
  autoAdvance: boolean;
  updatedAt: string;
}

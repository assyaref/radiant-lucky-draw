/**
 * Settings Entity
 */

export interface AppSettings {
  id: string;
  eventName: string;
  eventDate: string;
  maxParticipants: number;
  drawInterval: number;
  celebrationLevel: 'low' | 'medium' | 'high' | 'extreme';
  theme: 'dark' | 'light' | 'luxury';
  soundEnabled: boolean;
  autoAdvance: boolean;
  updatedAt: string;
}

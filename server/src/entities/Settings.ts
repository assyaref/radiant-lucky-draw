/**
 * Settings Entity
 */

export interface AppSettings {
  id: string;
  eventName: string;
  eventDate: string;
  eventLocation?: string;
  eventStatus: 'upcoming' | 'active' | 'completed';
  eventDescription?: string;
  maxParticipants: number;
  drawInterval: number;
  celebrationLevel: 'low' | 'medium' | 'high' | 'extreme';
  theme: 'dark' | 'light' | 'luxury';
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

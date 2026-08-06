/**
 * Settings Service
 */

import { SettingsRepository } from '../repositories';
import type { UpdateSettingsRequest, SettingsResponse } from '../dto';

export class SettingsService {
  constructor(private settingsRepository: SettingsRepository) {}

  async get(): Promise<SettingsResponse> {
    const settings = await this.settingsRepository.getSettings();
    if (!settings) {
      return this.getDefaults();
    }
    return this.toResponse(settings);
  }

  async update(data: UpdateSettingsRequest): Promise<SettingsResponse> {
    const settings = await this.settingsRepository.upsert(data);
    return this.toResponse(settings);
  }

  private getDefaults(): SettingsResponse {
    return {
      id: 'default',
      eventName: 'Lucky Draw Event',
      eventDate: new Date().toISOString(),
      eventLocation: '',
      eventStatus: 'upcoming',
      eventDescription: '',
      maxParticipants: 100,
      drawInterval: 30,
      celebrationLevel: 'high',
      theme: 'dark',
      soundEnabled: true,
      autoAdvance: true,
      logoUrl: undefined,
      bannerUrl: undefined,
      backgroundUrl: undefined,
      primaryColor: '#3b82f6',
      secondaryColor: '#8b5cf6',
      sponsorIds: undefined,
      updatedAt: new Date().toISOString(),
    };
  }

  private toResponse(s: any): SettingsResponse {
    return {
      id: s.id,
      eventName: s.eventName,
      eventDate: s.eventDate,
      eventLocation: s.eventLocation,
      eventStatus: s.eventStatus,
      eventDescription: s.eventDescription,
      maxParticipants: s.maxParticipants,
      drawInterval: s.drawInterval,
      celebrationLevel: s.celebrationLevel,
      theme: s.theme,
      soundEnabled: s.soundEnabled,
      autoAdvance: s.autoAdvance,
      logoUrl: s.logoUrl,
      bannerUrl: s.bannerUrl,
      backgroundUrl: s.backgroundUrl,
      primaryColor: s.primaryColor,
      secondaryColor: s.secondaryColor,
      sponsorIds: s.sponsorIds,
      updatedAt: s.updatedAt,
    };
  }
}

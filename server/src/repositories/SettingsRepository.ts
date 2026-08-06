/**
 * Settings Repository
 *
 * PostgreSQL-backed repository for AppSettings entities.
 */

import { PrismaRepository } from './BaseRepository';
import { prisma } from '../lib/prisma';
import type { AppSettings } from '../entities';

export class SettingsRepository extends PrismaRepository<AppSettings> {
  protected get model() {
    return prisma.settings;
  }

  protected toEntity(record: any): AppSettings {
    return {
      id: record.id,
      eventName: record.eventName,
      eventDate: record.eventDate ? record.eventDate.toISOString() : new Date().toISOString(),
      eventLocation: record.eventLocation ?? undefined,
      eventStatus: record.eventStatus,
      eventDescription: record.eventDescription ?? undefined,
      maxParticipants: record.maxParticipants,
      drawInterval: record.drawInterval,
      celebrationLevel: record.celebrationLevel,
      theme: record.theme,
      soundEnabled: record.soundEnabled,
      autoAdvance: record.autoAdvance,
      logoUrl: record.logoUrl ?? undefined,
      bannerUrl: record.bannerUrl ?? undefined,
      backgroundUrl: record.backgroundUrl ?? undefined,
      primaryColor: record.primaryColor,
      secondaryColor: record.secondaryColor,
      sponsorIds: record.sponsorIds ?? undefined,
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  protected toPrisma(data: any): any {
    const prismaData: any = {};
    if (data.eventName !== undefined) prismaData.eventName = data.eventName;
    if (data.eventDate !== undefined) {
      prismaData.eventDate = data.eventDate ? new Date(data.eventDate) : null;
    }
    if (data.eventLocation !== undefined) prismaData.eventLocation = data.eventLocation;
    if (data.eventStatus !== undefined) prismaData.eventStatus = data.eventStatus;
    if (data.eventDescription !== undefined) prismaData.eventDescription = data.eventDescription;
    if (data.maxParticipants !== undefined) prismaData.maxParticipants = data.maxParticipants;
    if (data.drawInterval !== undefined) prismaData.drawInterval = data.drawInterval;
    if (data.celebrationLevel !== undefined) prismaData.celebrationLevel = data.celebrationLevel;
    if (data.theme !== undefined) prismaData.theme = data.theme;
    if (data.soundEnabled !== undefined) prismaData.soundEnabled = data.soundEnabled;
    if (data.autoAdvance !== undefined) prismaData.autoAdvance = data.autoAdvance;
    if (data.logoUrl !== undefined) prismaData.logoUrl = data.logoUrl;
    if (data.bannerUrl !== undefined) prismaData.bannerUrl = data.bannerUrl;
    if (data.backgroundUrl !== undefined) prismaData.backgroundUrl = data.backgroundUrl;
    if (data.primaryColor !== undefined) prismaData.primaryColor = data.primaryColor;
    if (data.secondaryColor !== undefined) prismaData.secondaryColor = data.secondaryColor;
    if (data.sponsorIds !== undefined) prismaData.sponsorIds = data.sponsorIds;
    return prismaData;
  }

  async getSettings(): Promise<AppSettings | null> {
    const record = await this.model.findFirst({
      where: { deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
    return record ? this.toEntity(record) : null;
  }

  async upsert(data: Partial<Omit<AppSettings, 'id'>>): Promise<AppSettings> {
    const existing = await this.model.findFirst({
      where: { deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });

    if (!existing) {
      const record = await this.model.create({
        data: this.toPrisma({
          eventName: 'Lucky Draw Event',
          eventDate: new Date().toISOString(),
          eventLocation: '',
          eventStatus: 'upcoming',
          maxParticipants: 100,
          drawInterval: 30,
          celebrationLevel: 'high',
          theme: 'dark',
          soundEnabled: true,
          autoAdvance: true,
          primaryColor: '#3b82f6',
          secondaryColor: '#8b5cf6',
          ...data,
        }),
      });
      return this.toEntity(record);
    }

    const record = await this.model.update({
      where: { id: existing.id },
      data: this.toPrisma(data),
    });
    return this.toEntity(record);
  }
}

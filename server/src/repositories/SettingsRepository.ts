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
    const toDate = (val: unknown): string => {
      if (val instanceof Date) return val.toISOString();
      if (typeof val === 'string') return val;
      return new Date().toISOString();
    };

    return {
      id: record.id,
      eventName: record.eventName ?? 'Lucky Draw',
      eventDate: record.eventDate ? toDate(record.eventDate) : new Date().toISOString(),
      eventLocation: record.eventLocation ?? undefined,
      eventStatus: record.eventStatus ?? 'upcoming',
      eventDescription: record.eventDescription ?? undefined,
      maxParticipants: record.maxParticipants ?? 100,
      drawInterval: record.drawInterval ?? 30,
      celebrationLevel: record.celebrationLevel ?? 'medium',
      theme: record.theme ?? 'dark',
      soundEnabled: record.soundEnabled ?? true,
      autoAdvance: record.autoAdvance ?? false,
      logoUrl: record.logoUrl ?? undefined,
      bannerUrl: record.bannerUrl ?? undefined,
      backgroundUrl: record.backgroundUrl ?? undefined,
      primaryColor: record.primaryColor ?? '#3b82f6',
      secondaryColor: record.secondaryColor ?? '#8b5cf6',
      sponsorIds: record.sponsorIds ?? undefined,
      updatedAt: record.updatedAt ? toDate(record.updatedAt) : new Date().toISOString(),
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

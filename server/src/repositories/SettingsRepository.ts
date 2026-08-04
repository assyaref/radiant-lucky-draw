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
      maxParticipants: record.maxParticipants,
      drawInterval: record.drawInterval,
      celebrationLevel: record.celebrationLevel,
      theme: record.theme,
      soundEnabled: record.soundEnabled,
      autoAdvance: record.autoAdvance,
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  protected toPrisma(data: any): any {
    const prismaData: any = {};
    if (data.eventName !== undefined) prismaData.eventName = data.eventName;
    if (data.eventDate !== undefined) {
      prismaData.eventDate = data.eventDate ? new Date(data.eventDate) : null;
    }
    if (data.maxParticipants !== undefined) prismaData.maxParticipants = data.maxParticipants;
    if (data.drawInterval !== undefined) prismaData.drawInterval = data.drawInterval;
    if (data.celebrationLevel !== undefined) prismaData.celebrationLevel = data.celebrationLevel;
    if (data.theme !== undefined) prismaData.theme = data.theme;
    if (data.soundEnabled !== undefined) prismaData.soundEnabled = data.soundEnabled;
    if (data.autoAdvance !== undefined) prismaData.autoAdvance = data.autoAdvance;
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
          maxParticipants: 100,
          drawInterval: 30,
          celebrationLevel: 'high',
          theme: 'dark',
          soundEnabled: true,
          autoAdvance: true,
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

/**
 * Session Repository
 *
 * PostgreSQL-backed repository for Session entities.
 */

import { PrismaRepository } from './BaseRepository';
import { prisma } from '../lib/prisma';
import type { Session } from '../entities';

export class SessionRepository extends PrismaRepository<Session> {
  protected get model() {
    return prisma.session;
  }

  protected toEntity(record: any): Session {
    return {
      id: record.id,
      userId: record.userId,
      refreshToken: record.refreshToken,
      userAgent: record.userAgent,
      ipAddress: record.ipAddress,
      createdAt: record.createdAt.toISOString(),
      expiresAt: record.expiresAt.toISOString(),
      lastUsedAt: record.lastUsedAt.toISOString(),
      revokedAt: record.revokedAt ? record.revokedAt.toISOString() : null,
      revokedReason: record.revokedReason ?? null,
    };
  }

  protected toPrisma(data: any): any {
    const prismaData: any = {};
    if (data.userId !== undefined) prismaData.userId = data.userId;
    if (data.refreshToken !== undefined) prismaData.refreshToken = data.refreshToken;
    if (data.userAgent !== undefined) prismaData.userAgent = data.userAgent;
    if (data.ipAddress !== undefined) prismaData.ipAddress = data.ipAddress;
    if (data.expiresAt !== undefined) prismaData.expiresAt = new Date(data.expiresAt);
    if (data.lastUsedAt !== undefined) prismaData.lastUsedAt = new Date(data.lastUsedAt);
    if (data.revokedAt !== undefined) {
      prismaData.revokedAt = data.revokedAt ? new Date(data.revokedAt) : null;
    }
    if (data.revokedReason !== undefined) prismaData.revokedReason = data.revokedReason;
    return prismaData;
  }

  async findByRefreshToken(refreshToken: string): Promise<Session | null> {
    const record = await this.model.findFirst({
      where: { refreshToken, deletedAt: null },
    });
    return record ? this.toEntity(record) : null;
  }

  async findActiveByUserId(userId: string): Promise<Session[]> {
    const records = await this.model.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
    return records.map((r: any) => this.toEntity(r));
  }

  async findAllByUserId(userId: string): Promise<Session[]> {
    const records = await this.model.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return records.map((r: any) => this.toEntity(r));
  }

  async revokeByUserId(userId: string, reason: string): Promise<number> {
    const result = await this.model.updateMany({
      where: { userId, revokedAt: null, deletedAt: null },
      data: { revokedAt: new Date(), revokedReason: reason },
    });
    return result.count;
  }

  async revokeById(id: string, reason: string): Promise<Session | null> {
    const existing = await this.model.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) return null;

    const record = await this.model.update({
      where: { id },
      data: { revokedAt: new Date(), revokedReason: reason },
    });
    return this.toEntity(record);
  }

  async cleanupExpired(): Promise<number> {
    const result = await this.model.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return result.count;
  }
}

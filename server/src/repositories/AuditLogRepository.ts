/**
 * AuditLog Repository
 *
 * PostgreSQL-backed repository for AuditLog entities.
 */

import { PrismaRepository } from './BaseRepository';
import { prisma } from '../lib/prisma';
import type { AuditLog } from '../entities';

export class AuditLogRepository extends PrismaRepository<AuditLog> {
  protected get model() {
    return prisma.auditLog;
  }

  protected toEntity(record: any): AuditLog {
    return {
      id: record.id,
      userId: record.userId ?? null,
      action: record.action,
      entity: record.entity,
      entityId: record.entityId ?? null,
      metadata: record.metadata ?? null,
      ipAddress: record.ipAddress ?? '',
      userAgent: record.userAgent ?? '',
      createdAt: record.createdAt.toISOString(),
    };
  }

  protected toPrisma(data: any): any {
    const prismaData: any = {};
    if (data.userId !== undefined) prismaData.userId = data.userId;
    if (data.action !== undefined) prismaData.action = data.action;
    if (data.entity !== undefined) prismaData.entity = data.entity;
    if (data.entityId !== undefined) prismaData.entityId = data.entityId;
    if (data.metadata !== undefined) prismaData.metadata = data.metadata;
    if (data.ipAddress !== undefined) prismaData.ipAddress = data.ipAddress;
    if (data.userAgent !== undefined) prismaData.userAgent = data.userAgent;
    return prismaData;
  }

  async findByUserId(userId: string): Promise<AuditLog[]> {
    const records = await this.model.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return records.map((r: any) => this.toEntity(r));
  }

  async findByAction(action: string): Promise<AuditLog[]> {
    const records = await this.model.findMany({
      where: { action },
      orderBy: { createdAt: 'desc' },
    });
    return records.map((r: any) => this.toEntity(r));
  }
}

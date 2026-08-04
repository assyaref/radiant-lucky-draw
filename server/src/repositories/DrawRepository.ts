/**
 * Draw Repository
 *
 * PostgreSQL-backed repository for Draw entities.
 */

import { PrismaRepository } from './BaseRepository';
import { prisma } from '../lib/prisma';
import type { Draw } from '../entities';

export class DrawRepository extends PrismaRepository<Draw> {
  protected get model() {
    return prisma.draw;
  }

  protected toEntity(record: any): Draw {
    return {
      id: record.id,
      name: record.name,
      prizeId: record.prizeId,
      prizeName: record.prizeName,
      status: record.status,
      participantIds: record.participants?.map((p: any) => p.participantId) ?? [],
      winnerId: record.winnerId ?? undefined,
      winnerName: record.winnerName ?? undefined,
      startedAt: record.startedAt ? record.startedAt.toISOString() : undefined,
      completedAt: record.completedAt ? record.completedAt.toISOString() : undefined,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  protected toPrisma(data: any): any {
    const prismaData: any = {};
    if (data.name !== undefined) prismaData.name = data.name;
    if (data.prizeId !== undefined) prismaData.prizeId = data.prizeId;
    if (data.prizeName !== undefined) prismaData.prizeName = data.prizeName;
    if (data.status !== undefined) prismaData.status = data.status;
    if (data.winnerId !== undefined) prismaData.winnerId = data.winnerId;
    if (data.winnerName !== undefined) prismaData.winnerName = data.winnerName;
    if (data.startedAt !== undefined) {
      prismaData.startedAt = data.startedAt ? new Date(data.startedAt) : null;
    }
    if (data.completedAt !== undefined) {
      prismaData.completedAt = data.completedAt ? new Date(data.completedAt) : null;
    }
    return prismaData;
  }

  async findByStatus(status: string): Promise<Draw[]> {
    const records = await this.model.findMany({
      where: { status, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: { participants: true },
    });
    return records.map((r: any) => this.toEntity(r));
  }

  async findRecent(limit: number = 10): Promise<Draw[]> {
    const records = await this.model.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { participants: true },
    });
    return records.map((r: any) => this.toEntity(r));
  }

  /** Override findAll to include participants relation */
  async findAll(): Promise<Draw[]> {
    const records = await this.model.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: { participants: true },
    });
    return records.map((r: any) => this.toEntity(r));
  }

  /** Override findById to include participants relation */
  async findById(id: string): Promise<Draw | null> {
    const record = await this.model.findUnique({
      where: { id },
      include: { participants: true },
    });
    if (!record || record.deletedAt) return null;
    return this.toEntity(record);
  }

  /** Override paginate to include participants relation */
  async paginate(page: number, limit: number): Promise<{ data: Draw[]; total: number }> {
    const skip = (page - 1) * limit;
    const [records, total] = await Promise.all([
      this.model.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { participants: true },
      }),
      this.model.count({ where: { deletedAt: null } }),
    ]);
    return {
      data: records.map((r: any) => this.toEntity(r)),
      total,
    };
  }
}

/**
 * Prize Repository
 *
 * PostgreSQL-backed repository for Prize entities.
 */

import { PrismaRepository } from './BaseRepository';
import { prisma } from '../lib/prisma';
import type { Prize } from '../entities';

export class PrizeRepository extends PrismaRepository<Prize> {
  protected get model() {
    return prisma.prize;
  }

  protected toEntity(record: any): Prize {
    return {
      id: record.id,
      name: record.name,
      description: record.description ?? '',
      value: record.value,
      currency: record.currency,
      quantity: record.quantity,
      remaining: record.remaining,
      imageUrl: record.imageUrl ?? undefined,
      sponsor: record.sponsor ?? undefined,
      tier: record.tier,
      probability: record.probability ?? 0,
      isActive: record.isActive,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  protected toPrisma(data: any): any {
    const prismaData: any = {};
    if (data.name !== undefined) prismaData.name = data.name;
    if (data.description !== undefined) prismaData.description = data.description;
    if (data.value !== undefined) prismaData.value = data.value;
    if (data.currency !== undefined) prismaData.currency = data.currency;
    if (data.quantity !== undefined) prismaData.quantity = data.quantity;
    if (data.remaining !== undefined) prismaData.remaining = data.remaining;
    if (data.imageUrl !== undefined) prismaData.imageUrl = data.imageUrl;
    if (data.sponsor !== undefined) prismaData.sponsor = data.sponsor;
    if (data.tier !== undefined) prismaData.tier = data.tier;
    if (data.probability !== undefined) prismaData.probability = data.probability;
    if (data.isActive !== undefined) prismaData.isActive = data.isActive;
    return prismaData;
  }

  async findActive(): Promise<Prize[]> {
    const records = await this.model.findMany({
      where: { isActive: true, remaining: { gt: 0 }, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return records.map((r: any) => this.toEntity(r));
  }

  async findByTier(tier: string): Promise<Prize[]> {
    const records = await this.model.findMany({
      where: { tier, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return records.map((r: any) => this.toEntity(r));
  }

  /**
   * Atomically decrement prize stock.
   * Prevents negative stock by only updating when remaining > 0.
   */
  async decrementRemaining(id: string): Promise<Prize | null> {
    const record = await this.model.updateMany({
      where: { id, remaining: { gt: 0 }, deletedAt: null },
      data: { remaining: { decrement: 1 } },
    });
    if (record.count === 0) return null;
    const updated = await this.model.findUnique({ where: { id } });
    return updated ? this.toEntity(updated) : null;
  }
}

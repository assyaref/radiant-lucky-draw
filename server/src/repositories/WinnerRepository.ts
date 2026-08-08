/**
 * Winner Repository
 *
 * PostgreSQL-backed repository for Winner entities.
 */

import { PrismaRepository } from './BaseRepository';
import { prisma } from '../lib/prisma';
import type { Winner } from '../entities';

export class WinnerRepository extends PrismaRepository<Winner> {
  protected get model() {
    return prisma.winner;
  }

  protected toEntity(record: any): Winner {
    return {
      id: record.id,
      drawId: record.drawId,
      participantId: record.participantId,
      prizeId: record.prizeId,
      prizeTier: record.prizeTier,
      prizeValue: record.prizeValue,
      claimStatus: record.claimStatus ?? 'unclaimed',
      claimedAt: record.claimedAt?.toISOString() ?? undefined,
      claimedBy: record.claimedBy ?? undefined,
      announcedAt: record.announcedAt.toISOString(),
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  protected toPrisma(data: any): any {
    const prismaData: any = {};
    if (data.drawId !== undefined) prismaData.drawId = data.drawId;
    if (data.participantId !== undefined) prismaData.participantId = data.participantId;
    if (data.prizeId !== undefined) prismaData.prizeId = data.prizeId;
    if (data.prizeTier !== undefined) prismaData.prizeTier = data.prizeTier;
    if (data.prizeValue !== undefined) prismaData.prizeValue = data.prizeValue;
    if (data.claimStatus !== undefined) prismaData.claimStatus = data.claimStatus;
    if (data.claimedAt !== undefined) {
      prismaData.claimedAt = data.claimedAt ? new Date(data.claimedAt) : null;
    }
    if (data.claimedBy !== undefined) prismaData.claimedBy = data.claimedBy;
    if (data.announcedAt !== undefined) {
      prismaData.announcedAt = data.announcedAt ? new Date(data.announcedAt) : null;
    }
    return prismaData;
  }

  /**
   * Find if a participant has already won any prize.
   */
  async findByParticipant(participantId: string): Promise<Winner | null> {
    const record = await this.model.findFirst({
      where: { participantId, deletedAt: null },
    });
    return record ? this.toEntity(record) : null;
  }

  /**
   * Find all winners with participant and prize details joined.
   * Used by the Pemenang (Winners) dashboard menu.
   */
  async findWithDetails(
    page: number = 1,
    limit: number = 20,
    claimStatus?: string,
  ): Promise<{ data: any[]; total: number }> {
    const skip = (page - 1) * limit;
    const where: any = { deletedAt: null };
    if (claimStatus) where.claimStatus = claimStatus;

    const [records, total] = await Promise.all([
      this.model.findMany({
        where,
        orderBy: { announcedAt: 'desc' },
        skip,
        take: limit,
        include: {
          participant: true,
          prize: true,
        },
      }),
      this.model.count({ where }),
    ]);

    return {
      data: records.map((r: any) => ({
        id: r.id,
        drawId: r.drawId,
        participantId: r.participantId,
        participantName: r.participant?.name ?? '',
        participantCompany: r.participant?.company ?? '',
        participantPhone: r.participant?.phone ?? '',
        participantPhotoUrl: r.participant?.photoUrl ?? undefined,
        prizeId: r.prizeId,
        prizeName: r.prize?.name ?? '',
        prizeImageUrl: r.prize?.imageUrl ?? undefined,
        prizeTier: r.prizeTier,
        prizeValue: r.prizeValue,
        claimStatus: r.claimStatus ?? 'unclaimed',
        claimedAt: r.claimedAt?.toISOString() ?? undefined,
        claimedBy: r.claimedBy ?? undefined,
        announcedAt: r.announcedAt.toISOString(),
      })),
      total,
    };
  }

  /**
   * Update the claim status of a winner.
   */
  async updateClaimStatus(
    id: string,
    claimStatus: 'unclaimed' | 'claimed',
    userId?: string,
  ): Promise<Winner | null> {
    const existing = await this.model.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) return null;

    const updateData: any = { claimStatus };
    if (claimStatus === 'claimed') {
      updateData.claimedAt = new Date();
      if (userId) updateData.claimedBy = userId;
    } else {
      updateData.claimedAt = null;
      updateData.claimedBy = null;
    }

    const record = await this.model.update({
      where: { id },
      data: updateData,
    });
    return this.toEntity(record);
  }
}

/**
 * Participant Repository
 *
 * PostgreSQL-backed repository for Participant entities.
 */

import { PrismaRepository } from './BaseRepository';
import { prisma } from '../lib/prisma';
import { logger } from '../utils';
import { normalizeWhatsApp } from '../utils';
import type { Participant } from '../entities';

export class ParticipantRepository extends PrismaRepository<Participant> {
  protected get model() {
    return prisma.participant;
  }

  protected toEntity(record: any): Participant {
    return {
      id: record.id,
      name: record.name,
      email: record.email ?? '',
      phone: record.phone ?? null,
      company: record.company ?? '',
      queueNumber: record.queueNumber ?? '',
      status: record.status,
      registeredAt:
        record.registeredAt instanceof Date
          ? record.registeredAt.toISOString()
          : new Date().toISOString(),
      calledAt: record.calledAt instanceof Date ? record.calledAt.toISOString() : undefined,
      completedAt:
        record.completedAt instanceof Date ? record.completedAt.toISOString() : undefined,
      photoUrl: record.photoUrl ?? undefined,
      prizeId: record.prizeId ?? undefined,
      claimStatus: record.claimStatus ?? 'unclaimed',
    };
  }

  protected toPrisma(data: any): any {
    const prismaData: any = {};
    if (data.name !== undefined) prismaData.name = data.name;
    if (data.email !== undefined) prismaData.email = data.email;
    if (data.phone !== undefined) prismaData.phone = data.phone;
    if (data.company !== undefined) prismaData.company = data.company;
    if (data.queueNumber !== undefined) prismaData.queueNumber = data.queueNumber;
    if (data.status !== undefined) prismaData.status = data.status;
    if (data.registeredAt !== undefined) prismaData.registeredAt = new Date(data.registeredAt);
    if (data.calledAt !== undefined) {
      prismaData.calledAt = data.calledAt ? new Date(data.calledAt) : null;
    }
    if (data.completedAt !== undefined) {
      prismaData.completedAt = data.completedAt ? new Date(data.completedAt) : null;
    }
    if (data.photoUrl !== undefined) prismaData.photoUrl = data.photoUrl;
    if (data.prizeId !== undefined) prismaData.prizeId = data.prizeId;
    if (data.claimStatus !== undefined) prismaData.claimStatus = data.claimStatus;
    return prismaData;
  }

  async findByQueueNumber(queueNumber: string): Promise<Participant | null> {
    const record = await this.model.findFirst({
      where: { queueNumber, deletedAt: null },
    });
    return record ? this.toEntity(record) : null;
  }

  async findByStatus(status: string): Promise<Participant[]> {
    const records = await this.model.findMany({
      where: { status, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return records.map((r: any) => this.toEntity(r));
  }

  async findByPhone(phone: string): Promise<Participant | null> {
    const normalized = normalizeWhatsApp(phone);
    if (!normalized) return null;
    const record = await this.model.findFirst({
      where: {
        deletedAt: null,
        phone: normalized,
      },
    });
    return record ? this.toEntity(record) : null;
  }

  async count(): Promise<number> {
    return this.model.count({ where: { deletedAt: null } });
  }

  /**
   * Cascade-delete a participant and all related records in a single transaction.
   *
   * Order matters — child records must be deleted before the parent:
   *   1. queue_entries   (FK → participants.id, ON DELETE CASCADE handles this)
   *   2. draw_participants (FK → participants.id, ON DELETE CASCADE handles this)
   *   3. winners          (FK → participants.id, ON DELETE CASCADE handles this)
   *   4. participant      (the parent record itself)
   *
   * Returns the deleted participant or null if not found.
   */
  async deleteCascade(id: string): Promise<Participant | null> {
    logger.info('[DeleteCascade] START', { participantId: id });

    return prisma
      .$transaction(async (tx) => {
        logger.info('[DeleteCascade] TX findUnique', { participantId: id });
        const participant = await tx.participant.findUnique({ where: { id } });
        if (!participant || participant.deletedAt) {
          logger.warn('[DeleteCascade] TX participant not found or already deleted', {
            participantId: id,
            found: !!participant,
          });
          return null;
        }
        logger.info('[DeleteCascade] TX participant found', {
          participantId: id,
          status: participant.status,
        });

        // Snapshot before deletion for return value
        let snapshot: Participant;
        try {
          snapshot = this.toEntity(participant);
          logger.info('[DeleteCascade] TX toEntity OK', { participantId: id });
        } catch (err: any) {
          logger.error('[DeleteCascade] TX toEntity FAILED', {
            participantId: id,
            error: err?.message,
          });
          throw err;
        }

        // Delete cascade: queue entries, draw participants, winners
        try {
          const qeResult = await tx.queueEntry.deleteMany({ where: { participantId: id } });
          logger.info('[DeleteCascade] TX queueEntry.deleteMany OK', {
            participantId: id,
            count: qeResult.count,
          });
        } catch (err: any) {
          logger.error('[DeleteCascade] TX queueEntry.deleteMany FAILED', {
            participantId: id,
            errorName: err?.name,
            errorMessage: err?.message,
            errorCode: err?.code,
          });
          throw err;
        }

        try {
          const dpResult = await tx.drawParticipant.deleteMany({ where: { participantId: id } });
          logger.info('[DeleteCascade] TX drawParticipant.deleteMany OK', {
            participantId: id,
            count: dpResult.count,
          });
        } catch (err: any) {
          logger.error('[DeleteCascade] TX drawParticipant.deleteMany FAILED', {
            participantId: id,
            errorName: err?.name,
            errorMessage: err?.message,
            errorCode: err?.code,
          });
          throw err;
        }

        try {
          const wResult = await tx.winner.deleteMany({ where: { participantId: id } });
          logger.info('[DeleteCascade] TX winner.deleteMany OK', {
            participantId: id,
            count: wResult.count,
          });
        } catch (err: any) {
          logger.error('[DeleteCascade] TX winner.deleteMany FAILED', {
            participantId: id,
            errorName: err?.name,
            errorMessage: err?.message,
            errorCode: err?.code,
          });
          throw err;
        }

        try {
          await tx.participant.update({
            where: { id },
            data: { deletedAt: new Date() },
          });
          logger.info('[DeleteCascade] TX participant.update (soft-delete) OK', {
            participantId: id,
          });
        } catch (err: any) {
          logger.error('[DeleteCascade] TX participant.update FAILED', {
            participantId: id,
            errorName: err?.name,
            errorMessage: err?.message,
            errorCode: err?.code,
          });
          throw err;
        }

        logger.info('[DeleteCascade] SUCCESS', { participantId: id });
        return snapshot;
      })
      .catch((err: any) => {
        logger.error('[DeleteCascade] TRANSACTION FAILED', {
          participantId: id,
          errorName: err?.name,
          errorMessage: err?.message,
          errorCode: err?.code,
          errorStack: err?.stack?.split('\n').slice(0, 4).join(' | '),
        });
        throw err;
      });
  }

  async getNextQueueNumber(): Promise<string> {
    const records = await this.model.findMany({
      where: { deletedAt: null },
      select: { queueNumber: true },
    });
    const max = records.reduce((max: number, r: any) => {
      const num = parseInt(r.queueNumber, 10);
      return isNaN(num) ? max : Math.max(max, num);
    }, 0);
    return String(max + 1).padStart(3, '0');
  }
}

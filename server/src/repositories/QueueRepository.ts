/**
 * Queue Repository
 *
 * PostgreSQL-backed repository for QueueEntry entities.
 */

import { PrismaRepository } from './BaseRepository';
import { prisma } from '../lib/prisma';
import type { QueueEntry } from '../entities';

export class QueueRepository extends PrismaRepository<QueueEntry> {
  protected get model() {
    return prisma.queueEntry;
  }

  protected toEntity(record: any): QueueEntry {
    return {
      id: record.id,
      participantId: record.participantId,
      participantName: record.participantName,
      queueNumber: record.queueNumber,
      status: record.status,
      calledAt: record.calledAt ? record.calledAt.toISOString() : undefined,
      completedAt: record.completedAt ? record.completedAt.toISOString() : undefined,
      drawId: record.drawId ?? undefined,
      createdAt: record.createdAt.toISOString(),
    };
  }

  protected toPrisma(data: any): any {
    const prismaData: any = {};
    if (data.participantId !== undefined) prismaData.participantId = data.participantId;
    if (data.participantName !== undefined) prismaData.participantName = data.participantName;
    if (data.queueNumber !== undefined) prismaData.queueNumber = data.queueNumber;
    if (data.status !== undefined) prismaData.status = data.status;
    if (data.calledAt !== undefined) {
      prismaData.calledAt = data.calledAt ? new Date(data.calledAt) : null;
    }
    if (data.completedAt !== undefined) {
      prismaData.completedAt = data.completedAt ? new Date(data.completedAt) : null;
    }
    if (data.drawId !== undefined) prismaData.drawId = data.drawId;
    return prismaData;
  }

  async findWaiting(): Promise<QueueEntry[]> {
    const records = await this.model.findMany({
      where: { status: 'waiting', deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
    return records.map((r: any) => this.toEntity(r));
  }

  async findCurrent(): Promise<QueueEntry | null> {
    const record = await this.model.findFirst({
      where: { status: 'called', deletedAt: null },
      orderBy: { calledAt: 'desc' },
    });
    return record ? this.toEntity(record) : null;
  }

  async getEstimatedWait(averageDrawTime: number = 2): Promise<number> {
    const waiting = await this.findWaiting();
    return waiting.length * averageDrawTime;
  }

  /**
   * Atomically claim the next waiting participant (GO LIVE HOTFIX).
   *
   * Protects `callNext` from concurrent execution. Uses a PostgreSQL
   * transaction with `FOR UPDATE SKIP LOCKED` row locking so that when two
   * operators trigger "call next" simultaneously, only ONE transaction claims
   * each waiting entry. The other transaction skips the locked row and picks
   * the next available one (or returns null if none remain).
   *
   * Returns the claimed entry (with its participant) or null if the queue is empty.
   */
  async callNextAtomic(): Promise<QueueEntry | null> {
    return prisma.$transaction(async (tx) => {
      // Lock the oldest waiting entry, skipping rows already locked by other
      // concurrent transactions. This is the core concurrency guard.
      const next = await tx.$queryRawUnsafe<
        Array<{
          id: string;
          participant_id: string;
          participant_name: string;
          queue_number: string;
          status: string;
          called_at: Date | null;
          completed_at: Date | null;
          draw_id: string | null;
          created_at: Date;
        }>
      >(
        `SELECT id, participant_id, participant_name, queue_number, status,
                called_at, completed_at, draw_id, created_at
         FROM queue_entries
         WHERE status = 'waiting' AND deleted_at IS NULL
         ORDER BY created_at ASC
         FOR UPDATE SKIP LOCKED
         LIMIT 1`,
      );

      if (!next || next.length === 0) return null;

      const entry = next[0];
      const now = new Date();

      // Claim the entry: transition waiting -> called.
      await tx.queueEntry.update({
        where: { id: entry.id },
        data: { status: 'called', calledAt: now },
      });

      // Mark the participant as called.
      await tx.participant.update({
        where: { id: entry.participant_id },
        data: { status: 'called', calledAt: now },
      });

      return {
        id: entry.id,
        participantId: entry.participant_id,
        participantName: entry.participant_name,
        queueNumber: entry.queue_number,
        status: 'called' as const,
        calledAt: now.toISOString(),
        completedAt: entry.completed_at ? entry.completed_at.toISOString() : undefined,
        drawId: entry.draw_id ?? undefined,
        createdAt: entry.created_at.toISOString(),
      };
    });
  }
}

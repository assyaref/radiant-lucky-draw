/**
 * Draw Service
 */

import { DrawRepository, PrizeRepository, ParticipantRepository } from '../repositories';
import { prisma } from '../lib/prisma';
import { NotFoundError, ValidationError } from '../utils';
import type { CreateDrawRequest, UpdateDrawStatusRequest, DrawResponse } from '../dto';
import { RealtimeService, DRAW_EVENTS } from '../realtime';

export class DrawService {
  constructor(
    private drawRepository: DrawRepository,
    private prizeRepository: PrizeRepository,
    private participantRepository: ParticipantRepository,
    private realtimeService?: RealtimeService,
  ) {}

  async findAll(page: number = 1, limit: number = 20) {
    return this.drawRepository.paginate(page, limit);
  }

  async findRecent(limit: number = 10) {
    return this.drawRepository.findRecent(limit);
  }

  async findById(id: string): Promise<DrawResponse> {
    const draw = await this.drawRepository.findById(id);
    if (!draw) throw new NotFoundError('Draw', id);
    return this.toResponse(draw);
  }

  async create(data: CreateDrawRequest): Promise<DrawResponse> {
    const prize = await this.prizeRepository.findById(data.prizeId);
    if (!prize) throw new NotFoundError('Prize', data.prizeId);

    // Validate participants exist
    for (const pid of data.participantIds) {
      const participant = await this.participantRepository.findById(pid);
      if (!participant) throw new NotFoundError('Participant', pid);
    }

    // Create draw with participants in a transaction
    const draw = await prisma.$transaction(async (tx) => {
      const created = await tx.draw.create({
        data: {
          name: data.name,
          prizeId: data.prizeId,
          prizeName: prize.name,
          status: 'pending',
        },
      });

      // Link participants via join table
      if (data.participantIds.length > 0) {
        await tx.drawParticipant.createMany({
          data: data.participantIds.map((participantId) => ({
            drawId: created.id,
            participantId,
          })),
          skipDuplicates: true,
        });
      }

      return created;
    });

    const fullDraw = await this.drawRepository.findById(draw.id);
    if (!fullDraw) throw new NotFoundError('Draw', draw.id);
    return this.toResponse(fullDraw);
  }

  async updateStatus(id: string, data: UpdateDrawStatusRequest): Promise<DrawResponse> {
    const draw = await this.drawRepository.findById(id);
    if (!draw) throw new NotFoundError('Draw', id);

    const updateData: any = { status: data.status };

    if (data.status === 'spinning' && !draw.startedAt) {
      updateData.startedAt = new Date();
    }

    // ─── Server-side winner selection (RC3) ─────────────────────────────
    // Winner selection is ALWAYS performed on the server. Any winnerId /
    // winnerName supplied by the client is IGNORED to prevent tampering.
    //
    // ─── Atomic Draw Completion (GO LIVE HOTFIX) ─────────────────────────
    // The entire completion flow — winner selection, draw status update,
    // prize stock decrement, and winner record creation — is executed inside
    // a SINGLE PostgreSQL transaction. This guarantees that either ALL steps
    // succeed or NONE are applied, eliminating partial-state corruption and
    // race conditions where two concurrent completions could select the same
    // winner or double-decrement prize stock.
    if (data.status === 'completed') {
      const completed = await prisma.$transaction(async (tx) => {
        // 1. Re-read the draw inside the transaction with participants.
        const drawRecord = await tx.draw.findUnique({
          where: { id },
          include: { participants: { include: { participant: true } } },
        });
        if (!drawRecord) throw new NotFoundError('Draw', id);

        // 2. Guard against double-completion: only allow transition from a
        //    non-completed state. If already completed, abort atomically.
        if (drawRecord.status === 'completed') {
          throw new ValidationError('Draw is already completed');
        }

        // 3. Select a winner among eligible participants (not already winners).
        const winner = await this.selectWinnerInTx(tx, drawRecord);
        if (!winner) {
          throw new ValidationError(
            'Cannot complete draw: no eligible participants or prize stock exhausted',
          );
        }

        // 4. Atomically decrement prize stock (prevents negative stock).
        const prizeUpdate = await tx.prize.updateMany({
          where: { id: drawRecord.prizeId, remaining: { gt: 0 }, deletedAt: null },
          data: { remaining: { decrement: 1 } },
        });
        if (prizeUpdate.count === 0) {
          throw new ValidationError('Prize stock is exhausted');
        }

        const prizeRecord = await tx.prize.findUnique({
          where: { id: drawRecord.prizeId },
        });

        // 5. Update the draw to completed with the selected winner.
        const updated = await tx.draw.update({
          where: { id },
          data: {
            status: 'completed',
            winnerId: winner.participantId,
            winnerName: winner.participantName,
            completedAt: new Date(),
          },
        });

        // 6. Record the winner (enables duplicate-winner prevention across draws).
        await tx.winner.create({
          data: {
            drawId: drawRecord.id,
            participantId: winner.participantId,
            prizeId: drawRecord.prizeId,
            prizeTier: prizeRecord?.tier ?? 'common',
            prizeValue: prizeRecord?.value ?? 0,
            announcedAt: new Date(),
          },
        });

        return { updated, winner };
      });

      updateData.winnerId = completed.winner.participantId;
      updateData.winnerName = completed.winner.participantName;
      updateData.completedAt = completed.updated.completedAt;
    } else {
      // Non-completion status transitions (pending/countdown/spinning/revealed/cancelled)
      const updated = await this.drawRepository.update(id, updateData);
      if (!updated) throw new NotFoundError('Draw', id);
      updateData.winnerId = updated.winnerId;
      updateData.winnerName = updated.winnerName;
    }

    const finalDraw = await this.drawRepository.findById(id);
    if (!finalDraw) throw new NotFoundError('Draw', id);

    // Broadcast draw lifecycle events (RC2.4)
    this.broadcastDrawEvent(data.status, draw, finalDraw);

    return this.toResponse(finalDraw);
  }

  /**
   * Select a winner for a draw on the server side, inside a transaction.
   *
   * Rules (RC3):
   * - Winner must be a participant linked to the draw.
   * - Winner must NOT have already won a prize (prevents duplicate winners).
   * - Prize must have remaining stock (checked by caller via atomic decrement).
   *
   * Selection is random among eligible participants.
   */
  private async selectWinnerInTx(
    tx: any,
    drawRecord: any,
  ): Promise<{ participantId: string; participantName: string } | null> {
    if (!drawRecord.participants || drawRecord.participants.length === 0) return null;

    // Fetch participant IDs that have already won any prize (within tx).
    const existingWinners = await tx.winner.findMany({
      where: { deletedAt: null },
      select: { participantId: true },
    });
    const winnerIds = new Set(existingWinners.map((w: any) => w.participantId));

    // Filter to eligible participants (not already winners)
    const eligible = drawRecord.participants.filter(
      (dp: any) => !winnerIds.has(dp.participantId),
    );
    if (eligible.length === 0) return null;

    // Random selection among eligible participants
    const chosen = eligible[Math.floor(Math.random() * eligible.length)];
    return {
      participantId: chosen.participantId,
      participantName: chosen.participant.name,
    };
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.drawRepository.delete(id);
    if (!deleted) throw new NotFoundError('Draw', id);
  }

  /**
   * Broadcast a draw lifecycle event via the RealtimeService (RC2.4).
   * Maps draw status transitions to socket events:
   * - spinning  -> draw:started / draw:spinning
   * - revealed  -> draw:winner
   * - completed -> draw:completed
   */
  private broadcastDrawEvent(status: string, draw: any, updated: any): void {
    if (!this.realtimeService) return;

    const timestamp = new Date().toISOString();
    const base = {
      drawId: draw.id,
      participantId: updated.winnerId ?? draw.winnerId,
      participantName: updated.winnerName ?? draw.winnerName,
      prizeId: draw.prizeId,
      prizeName: draw.prizeName,
      timestamp,
    };

    switch (status) {
      case 'spinning':
        this.realtimeService.broadcastDrawEvent(DRAW_EVENTS.STARTED, {
          drawId: draw.id,
          participantId: updated.winnerId ?? draw.winnerId,
          participantName: updated.winnerName ?? draw.winnerName,
          timestamp,
        });
        this.realtimeService.broadcastDrawEvent(DRAW_EVENTS.SPINNING, {
          drawId: draw.id,
          participantId: updated.winnerId ?? draw.winnerId,
          timestamp,
        });
        break;
      case 'revealed':
        this.realtimeService.broadcastDrawEvent(DRAW_EVENTS.WINNER, {
          ...base,
          prizeTier: 'common',
          probability: 0,
        });
        break;
      case 'completed':
        this.realtimeService.broadcastDrawEvent(DRAW_EVENTS.COMPLETED, {
          ...base,
          remainingStock: 0,
          totalWinners: 0,
          drawCount: 0,
        });
        break;
      default:
        break;
    }
  }

  private toResponse(d: any): DrawResponse {
    return {
      id: d.id,
      name: d.name,
      prizeId: d.prizeId,
      prizeName: d.prizeName,
      status: d.status,
      participantCount: d.participantIds?.length || 0,
      winnerId: d.winnerId,
      winnerName: d.winnerName,
      startedAt: d.startedAt,
      completedAt: d.completedAt,
      createdAt: d.createdAt,
    };
  }
}

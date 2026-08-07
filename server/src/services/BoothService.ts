/**
 * Booth Service
 *
 * Business logic for the Digital Lucky Draw Booth Enterprise flow.
 * Handles booth config, participant registration, photo upload,
 * weighted lucky draw spin, and winner management.
 */

import {
  ParticipantRepository,
  PrizeRepository,
  SettingsRepository,
  WinnerRepository,
} from '../repositories';
import { prisma } from '../lib/prisma';
import { NotFoundError, ValidationError, ConflictError } from '../utils';
import { RealtimeService, DRAW_EVENTS } from '../realtime';
import type {
  BoothConfigResponse,
  CreateBoothParticipantRequest,
  BoothParticipantResponse,
  UploadPhotoRequest,
  UploadPhotoResponse,
  SpinRequest,
  SpinResponse,
  WinnerResponse,
} from '../dto';

export class BoothService {
  constructor(
    private participantRepository: ParticipantRepository,
    private prizeRepository: PrizeRepository,
    private settingsRepository: SettingsRepository,
    private winnerRepository: WinnerRepository,
    private realtimeService?: RealtimeService,
  ) {}

  /**
   * Get the public booth configuration including active prizes.
   * Used by the Public Booth page on load.
   */
  async getBoothConfig(): Promise<BoothConfigResponse> {
    const [settings, prizes, totalParticipants] = await Promise.all([
      this.settingsRepository.getSettings(),
      this.prizeRepository.findActive(),
      this.participantRepository.count(),
    ]);

    return {
      eventName: settings?.eventName ?? 'Lucky Draw',
      eventDate: settings?.eventDate,
      theme: settings?.theme ?? 'dark',
      celebrationLevel: settings?.celebrationLevel ?? 'medium',
      soundEnabled: settings?.soundEnabled ?? true,
      totalParticipants,
      prizes: prizes.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        imageUrl: p.imageUrl,
        tier: p.tier,
      })),
    };
  }

  /**
   * Register a new booth participant.
   * Fields: name (required), company (required), whatsapp (optional).
   */
  async registerParticipant(
    data: CreateBoothParticipantRequest,
  ): Promise<BoothParticipantResponse> {
    // Validate duplicate whatsapp if provided
    if (data.whatsapp) {
      const existing = await this.participantRepository.findByPhone(data.whatsapp);
      if (existing) {
        throw new ConflictError('Nomor WhatsApp sudah terdaftar');
      }
    }

    const queueNumber = await this.participantRepository.getNextQueueNumber();
    const participant = await this.participantRepository.create({
      name: data.name,
      email: '',
      phone: data.whatsapp ?? '',
      company: data.company,
      queueNumber,
      status: 'registered',
      claimStatus: 'unclaimed',
      registeredAt: new Date().toISOString(),
    });

    return this.toParticipantResponse(participant);
  }

  /**
   * Upload a participant's face photo (base64 data URL).
   * The photo is stored as a data URL in the photoUrl field.
   */
  async uploadPhoto(data: UploadPhotoRequest): Promise<UploadPhotoResponse> {
    const participant = await this.participantRepository.findById(data.participantId);
    if (!participant) throw new NotFoundError('Participant', data.participantId);

    const updated = await this.participantRepository.update(data.participantId, {
      photoUrl: data.photo,
    });
    if (!updated) throw new NotFoundError('Participant', data.participantId);

    return {
      id: updated.id,
      photoUrl: updated.photoUrl ?? '',
    };
  }

  /**
   * Perform a lucky draw spin for a participant.
   *
   * Prize selection is WEIGHTED by each prize's `probability` field.
   * Only active prizes with remaining stock > 0 are eligible.
   * If a prize's stock is exhausted, it is automatically excluded.
   *
   * The entire flow (winner selection, prize stock decrement, winner
   * record creation, participant update) runs inside a single transaction
   * to guarantee atomicity and prevent race conditions.
   */
  async spin(data: SpinRequest): Promise<SpinResponse> {
    const participant = await this.participantRepository.findById(data.participantId);
    if (!participant) throw new NotFoundError('Participant', data.participantId);

    // Participant must have a photo before spinning
    if (!participant.photoUrl) {
      throw new ValidationError('Foto wajah wajib diambil sebelum memulai undian');
    }

    // Participant must not have already won
    if (participant.prizeId) {
      throw new ValidationError('Peserta sudah pernah mengikuti undian');
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch all eligible prizes (active, in stock) inside the transaction.
      const eligiblePrizes = await tx.prize.findMany({
        where: { isActive: true, remaining: { gt: 0 }, deletedAt: null },
      });
      if (eligiblePrizes.length === 0) {
        throw new ValidationError('Tidak ada hadiah yang tersedia');
      }

      // 2. Weighted random selection based on probability.
      const selected = this.selectWeightedPrize(eligiblePrizes);
      if (!selected) {
        throw new ValidationError('Tidak ada hadiah yang tersedia');
      }

      // 3. Atomically decrement prize stock (prevents negative stock).
      const prizeUpdate = await tx.prize.updateMany({
        where: { id: selected.id, remaining: { gt: 0 }, deletedAt: null },
        data: { remaining: { decrement: 1 } },
      });
      if (prizeUpdate.count === 0) {
        throw new ValidationError('Stok hadiah habis');
      }

      const prizeRecord = await tx.prize.findUnique({ where: { id: selected.id } });
      if (!prizeRecord) throw new NotFoundError('Prize', selected.id);

      // 4. Create a draw record.
      const draw = await tx.draw.create({
        data: {
          name: `Booth Draw - ${participant.name}`,
          prizeId: prizeRecord.id,
          prizeName: prizeRecord.name,
          status: 'completed',
          winnerId: participant.id,
          winnerName: participant.name,
          startedAt: new Date(),
          completedAt: new Date(),
        },
      });

      // 5. Record the winner.
      await tx.winner.create({
        data: {
          drawId: draw.id,
          participantId: participant.id,
          prizeId: prizeRecord.id,
          prizeTier: prizeRecord.tier,
          prizeValue: prizeRecord.value,
          claimStatus: 'unclaimed',
          announcedAt: new Date(),
        },
      });

      // 6. Update the participant with the won prize.
      await tx.participant.update({
        where: { id: participant.id },
        data: {
          prizeId: prizeRecord.id,
          status: 'completed',
          completedAt: new Date(),
        },
      });

      return { draw, prizeRecord };
    });

    // Broadcast realtime event so the admin dashboard updates automatically.
    this.broadcastWinner(result.draw, result.prizeRecord, participant);

    return {
      drawId: result.draw.id,
      participantId: participant.id,
      participantName: participant.name,
      prizeId: result.prizeRecord.id,
      prizeName: result.prizeRecord.name,
      prizeImageUrl: result.prizeRecord.imageUrl ?? undefined,
      prizeTier: result.prizeRecord.tier,
      remainingStock: result.prizeRecord.remaining - 1,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * List winners with participant and prize details.
   * Supports pagination and claim status filtering.
   */
  async listWinners(
    page: number = 1,
    limit: number = 20,
    claimStatus?: string,
  ): Promise<{ data: WinnerResponse[]; total: number }> {
    const result = await this.winnerRepository.findWithDetails(page, limit, claimStatus);
    return {
      data: result.data.map((w: any) => ({
        id: w.id,
        drawId: w.drawId,
        participantId: w.participantId,
        participantName: w.participantName,
        participantCompany: w.participantCompany,
        participantPhotoUrl: w.participantPhotoUrl,
        prizeId: w.prizeId,
        prizeName: w.prizeName,
        prizeImageUrl: w.prizeImageUrl,
        prizeTier: w.prizeTier,
        prizeValue: w.prizeValue,
        claimStatus: w.claimStatus,
        announcedAt: w.announcedAt,
      })),
      total: result.total,
    };
  }

  /**
   * Update the claim status of a winner.
   */
  async updateClaimStatus(
    id: string,
    claimStatus: 'unclaimed' | 'claimed',
    userId?: string,
  ): Promise<WinnerResponse> {
    const winner = await this.winnerRepository.updateClaimStatus(id, claimStatus, userId);
    if (!winner) throw new NotFoundError('Winner', id);

    // Also update the participant's claim status.
    await this.participantRepository.update(winner.participantId, { claimStatus });

    // Broadcast claim update via Socket.IO
    if (this.realtimeService) {
      const detail = await this.winnerRepository.findWithDetails(1, 1);
      const found = detail.data.find((w: any) => w.id === id);
      if (found) {
        this.realtimeService.broadcastDrawEvent(DRAW_EVENTS.WINNER, {
          drawId: found.drawId,
          participantId: found.participantId,
          participantName: found.participantName,
          prizeId: found.prizeId,
          prizeName: found.prizeName,
          prizeTier: found.prizeTier,
          claimStatus: found.claimStatus,
          claimedAt: found.claimedAt,
          claimedBy: found.claimedBy,
          timestamp: new Date().toISOString(),
        });

        return {
          id: found.id,
          drawId: found.drawId,
          participantId: found.participantId,
          participantName: found.participantName,
          participantCompany: found.participantCompany,
          participantPhone: found.participantPhone,
          participantPhotoUrl: found.participantPhotoUrl,
          prizeId: found.prizeId,
          prizeName: found.prizeName,
          prizeImageUrl: found.prizeImageUrl,
          prizeTier: found.prizeTier,
          prizeValue: found.prizeValue,
          claimStatus: found.claimStatus,
          claimedAt: found.claimedAt,
          claimedBy: found.claimedBy,
          announcedAt: found.announcedAt,
        };
      }
    }

    return {
      id: winner.id,
      drawId: winner.drawId,
      participantId: winner.participantId,
      participantName: '',
      participantCompany: '',
      participantPhotoUrl: undefined,
      prizeId: winner.prizeId,
      prizeName: '',
      prizeImageUrl: undefined,
      prizeTier: winner.prizeTier,
      prizeValue: winner.prizeValue,
      claimStatus: winner.claimStatus,
      claimedAt: winner.claimedAt,
      claimedBy: winner.claimedBy,
      announcedAt: winner.announcedAt,
    };
  }

  /**
   * Weighted random selection among eligible prizes.
   * Prizes with higher probability are more likely to be selected.
   * If all probabilities are 0, selection is uniform random.
   */
  private selectWeightedPrize(prizes: any[]): any {
    const totalProbability = prizes.reduce((sum, p) => sum + (p.probability ?? 0), 0);

    // If no probabilities set, fall back to uniform random selection.
    if (totalProbability <= 0) {
      return prizes[Math.floor(Math.random() * prizes.length)];
    }

    let random = Math.random() * totalProbability;
    for (const prize of prizes) {
      random -= prize.probability ?? 0;
      if (random <= 0) {
        return prize;
      }
    }
    // Fallback to last prize (floating point safety).
    return prizes[prizes.length - 1];
  }

  /**
   * Broadcast a winner event via Socket.IO so the admin dashboard,
   * winners list, and statistics update automatically in realtime.
   */
  private broadcastWinner(draw: any, prize: any, participant: any): void {
    if (!this.realtimeService) return;

    const timestamp = new Date().toISOString();
    this.realtimeService.broadcastDrawEvent(DRAW_EVENTS.WINNER, {
      drawId: draw.id,
      participantId: participant.id,
      participantName: participant.name,
      prizeId: prize.id,
      prizeName: prize.name,
      prizeTier: prize.tier,
      probability: prize.probability ?? 0,
      timestamp,
    });

    this.realtimeService.broadcastDrawEvent(DRAW_EVENTS.COMPLETED, {
      drawId: draw.id,
      participantId: participant.id,
      prizeId: prize.id,
      prizeName: prize.name,
      remainingStock: prize.remaining - 1,
      totalWinners: 0,
      drawCount: 0,
      timestamp,
    });
  }

  private toParticipantResponse(p: any): BoothParticipantResponse {
    return {
      id: p.id,
      name: p.name,
      company: p.company,
      whatsapp: p.phone || undefined,
      photoUrl: p.photoUrl,
      registeredAt: p.registeredAt,
      hasPhoto: Boolean(p.photoUrl),
    };
  }
}

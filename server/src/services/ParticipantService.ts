/**
 * Participant Service
 */

import { ParticipantRepository, SettingsRepository, QueueRepository } from '../repositories';
import { NotFoundError, ConflictError, ValidationError } from '../utils';
import type {
  CreateParticipantRequest,
  UpdateParticipantRequest,
  ParticipantResponse,
} from '../dto';

const MAX_QUEUE_NUMBER = 300;

export class ParticipantService {
  constructor(
    private participantRepository: ParticipantRepository,
    private settingsRepository: SettingsRepository,
    private queueRepository: QueueRepository,
  ) {}

  async findAll(page: number = 1, limit: number = 20) {
    return this.participantRepository.paginate(page, limit);
  }

  async findById(id: string): Promise<ParticipantResponse> {
    const participant = await this.participantRepository.findById(id);
    if (!participant) throw new NotFoundError('Participant', id);
    return this.toResponse(participant);
  }

  async create(data: CreateParticipantRequest): Promise<ParticipantResponse> {
    // Validate event is open for registration
    await this.assertEventOpen();

    // Validate duplicate phone
    const existing = await this.participantRepository.findByPhone(data.phone);
    if (existing) {
      throw new ConflictError('This phone number is already registered');
    }

    // Validate max participants / queue capacity
    const count = await this.participantRepository.count();
    if (count >= MAX_QUEUE_NUMBER) {
      throw new ValidationError('Registration is full. Maximum participants reached.');
    }

    const queueNumber = await this.participantRepository.getNextQueueNumber();
    const participant = await this.participantRepository.create({
      ...data,
      email: data.email ?? '',
      queueNumber,
      status: 'registered',
      claimStatus: 'unclaimed',
      registeredAt: new Date().toISOString(),
    });

    // Add to queue
    await this.queueRepository.create({
      participantId: participant.id,
      participantName: participant.name,
      queueNumber: participant.queueNumber,
      status: 'waiting',
      createdAt: new Date().toISOString(),
    });

    return this.toResponse(participant);
  }

  async update(id: string, data: UpdateParticipantRequest): Promise<ParticipantResponse> {
    const participant = await this.participantRepository.update(id, data);
    if (!participant) throw new NotFoundError('Participant', id);
    return this.toResponse(participant);
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.participantRepository.delete(id);
    if (!deleted) throw new NotFoundError('Participant', id);
  }

  private async assertEventOpen(): Promise<void> {
    const settings = await this.settingsRepository.getSettings();
    if (!settings) return;

    const eventDate = new Date(settings.eventDate);
    const now = new Date();

    // Registration closed if event date has passed
    if (eventDate.getTime() < now.getTime()) {
      throw new ValidationError('Registration is closed');
    }
  }

  private async getEstimatedWait(): Promise<number> {
    const waiting = await this.queueRepository.findWaiting();
    return waiting.length * 2; // 2 minutes per participant
  }

  private async getCurrentQueue(): Promise<number> {
    const current = await this.queueRepository.findCurrent();
    if (!current) return 0;
    const num = parseInt(current.queueNumber, 10);
    return isNaN(num) ? 0 : num;
  }

  private async toResponse(p: any): Promise<ParticipantResponse> {
    const estimatedWait = await this.getEstimatedWait();
    const currentQueue = await this.getCurrentQueue();

    return {
      id: p.id,
      name: p.name,
      email: p.email,
      phone: p.phone,
      company: p.company,
      queueNumber: p.queueNumber,
      status: p.status,
      registeredAt: p.registeredAt,
      photoUrl: p.photoUrl,
      prizeId: p.prizeId,
      claimStatus: p.claimStatus ?? 'unclaimed',
      estimatedWait,
      currentQueue,
    };
  }
}

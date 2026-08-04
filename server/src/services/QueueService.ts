/**
 * Queue Service
 *
 * Manages the queue lifecycle and broadcasts real-time updates
 * via the RealtimeService so that Operator Dashboard, Queue TV,
 * and Registration screens stay in sync.
 */

import { QueueRepository, ParticipantRepository } from '../repositories';
import { NotFoundError, ValidationError } from '../utils';
import type { QueueStateResponse, CallNextResponse } from '../dto';
import {
  RealtimeService,
  QUEUE_EVENTS,
  type QueueEntryPayload,
  type QueueStatePayload,
} from '../realtime';

export class QueueService {
  constructor(
    private queueRepository: QueueRepository,
    private participantRepository: ParticipantRepository,
    private realtimeService: RealtimeService,
  ) {}

  async getState(): Promise<QueueStateResponse> {
    const entries = await this.queueRepository.findAll();
    const waiting = await this.queueRepository.findWaiting();
    const current = await this.queueRepository.findCurrent();
    const estimatedWait = await this.queueRepository.getEstimatedWait();

    return {
      entries: entries.map((e) => ({
        id: e.id,
        participantId: e.participantId,
        participantName: e.participantName,
        queueNumber: e.queueNumber,
        status: e.status,
        createdAt: e.createdAt,
      })),
      currentNumber: current?.queueNumber,
      lastCalled: current?.calledAt,
      estimatedWait,
      totalWaiting: waiting.length,
    };
  }

  /** Build the full realtime state payload */
  private async buildStatePayload(): Promise<QueueStatePayload> {
    const entries = await this.queueRepository.findAll();
    const waiting = await this.queueRepository.findWaiting();
    const current = await this.queueRepository.findCurrent();
    const estimatedWait = await this.queueRepository.getEstimatedWait();

    const payloadEntries: QueueEntryPayload[] = entries.map((e) => ({
      id: e.id,
      participantId: e.participantId,
      participantName: e.participantName,
      queueNumber: e.queueNumber,
      status: e.status,
      isPriority: false,
      registeredAt: e.createdAt,
      calledAt: e.calledAt,
      completedAt: e.completedAt,
    }));

    return {
      entries: payloadEntries,
      currentNumber: current?.queueNumber,
      lastCalled: current?.calledAt,
      estimatedWait,
      totalWaiting: waiting.length,
      totalFinished: entries.filter((e) => e.status === 'completed').length,
      totalCancelled: entries.filter(
        (e) => e.status === 'cancelled' || e.status === 'skipped',
      ).length,
      timestamp: new Date().toISOString(),
    };
  }

  /** Broadcast the full queue state to all clients */
  private async broadcastState(): Promise<void> {
    const state = await this.buildStatePayload();
    this.realtimeService.broadcastQueueState(state);
  }

  async addToQueue(participantId: string): Promise<void> {
    const participant = await this.participantRepository.findById(participantId);
    if (!participant) throw new NotFoundError('Participant', participantId);

    const entry = await this.queueRepository.create({
      participantId: participant.id,
      participantName: participant.name,
      queueNumber: participant.queueNumber,
      status: 'waiting',
      createdAt: new Date().toISOString(),
    });

    // Broadcast created event + full state
    const state = await this.buildStatePayload();
    this.realtimeService.broadcastQueueEvent({
      type: QUEUE_EVENTS.CREATED,
      entry: {
        id: entry.id,
        participantId: entry.participantId,
        participantName: entry.participantName,
        queueNumber: entry.queueNumber,
        status: entry.status,
        isPriority: false,
        registeredAt: entry.createdAt,
      },
      state,
      timestamp: new Date().toISOString(),
    });
  }

  async callNext(): Promise<CallNextResponse> {
    // ─── Concurrency-safe callNext (GO LIVE HOTFIX) ─────────────────────
    // Uses an atomic transaction with `FOR UPDATE SKIP LOCKED` row locking so
    // that concurrent "call next" requests can never claim the same waiting
    // participant. Each transaction claims a distinct row (or none if the
    // queue is empty), eliminating double-call race conditions.
    const next = await this.queueRepository.callNextAtomic();
    if (!next) {
      throw new ValidationError('No participants in queue');
    }

    // Broadcast called event + full state
    const state = await this.buildStatePayload();
    this.realtimeService.broadcastQueueEvent({
      type: QUEUE_EVENTS.CALLED,
      entry: {
        id: next.id,
        participantId: next.participantId,
        participantName: next.participantName,
        queueNumber: next.queueNumber,
        status: 'called',
        isPriority: false,
        registeredAt: next.createdAt,
        calledAt: next.calledAt,
      },
      state,
      timestamp: new Date().toISOString(),
    });

    return {
      participantId: next.participantId,
      participantName: next.participantName,
      queueNumber: next.queueNumber,
      message: `Now calling: ${next.participantName} (${next.queueNumber})`,
    };
  }

  async completeCurrent(participantId: string): Promise<void> {
    const current = await this.queueRepository.findCurrent();
    if (!current) throw new ValidationError('No active participant');

    await this.queueRepository.update(current.id, {
      status: 'completed',
      completedAt: new Date().toISOString(),
    });

    await this.participantRepository.update(participantId, {
      status: 'completed',
      completedAt: new Date().toISOString(),
    });

    // Broadcast completed event + full state
    const state = await this.buildStatePayload();
    this.realtimeService.broadcastQueueEvent({
      type: QUEUE_EVENTS.COMPLETED,
      entry: {
        id: current.id,
        participantId: current.participantId,
        participantName: current.participantName,
        queueNumber: current.queueNumber,
        status: 'completed',
        isPriority: false,
        registeredAt: current.createdAt,
        calledAt: current.calledAt,
        completedAt: new Date().toISOString(),
      },
      state,
      timestamp: new Date().toISOString(),
    });
  }

  /** Skip a waiting participant (moves them out of the active queue) */
  async skip(participantId: string): Promise<void> {
    const entry = await this.findEntryByParticipant(participantId);
    if (!entry) throw new NotFoundError('Queue entry', participantId);

    if (entry.status !== 'waiting') {
      throw new ValidationError('Only waiting participants can be skipped');
    }

    await this.queueRepository.update(entry.id, {
      status: 'skipped',
      completedAt: new Date().toISOString(),
    });

    await this.participantRepository.update(participantId, {
      status: 'cancelled',
      completedAt: new Date().toISOString(),
    });

    const state = await this.buildStatePayload();
    this.realtimeService.broadcastQueueEvent({
      type: QUEUE_EVENTS.SKIPPED,
      entry: {
        id: entry.id,
        participantId: entry.participantId,
        participantName: entry.participantName,
        queueNumber: entry.queueNumber,
        status: 'skipped',
        isPriority: false,
        registeredAt: entry.createdAt,
        completedAt: new Date().toISOString(),
      },
      state,
      timestamp: new Date().toISOString(),
    });
  }

  /** Cancel a waiting participant */
  async cancel(participantId: string): Promise<void> {
    const entry = await this.findEntryByParticipant(participantId);
    if (!entry) throw new NotFoundError('Queue entry', participantId);

    if (entry.status !== 'waiting') {
      throw new ValidationError('Only waiting participants can be cancelled');
    }

    await this.queueRepository.update(entry.id, {
      status: 'cancelled',
      completedAt: new Date().toISOString(),
    });

    await this.participantRepository.update(participantId, {
      status: 'cancelled',
      completedAt: new Date().toISOString(),
    });

    const state = await this.buildStatePayload();
    this.realtimeService.broadcastQueueEvent({
      type: QUEUE_EVENTS.CANCELLED,
      entry: {
        id: entry.id,
        participantId: entry.participantId,
        participantName: entry.participantName,
        queueNumber: entry.queueNumber,
        status: 'cancelled',
        isPriority: false,
        registeredAt: entry.createdAt,
        completedAt: new Date().toISOString(),
      },
      state,
      timestamp: new Date().toISOString(),
    });
  }

  private async findEntryByParticipant(participantId: string) {
    const entries = await this.queueRepository.findWhere(
      (e) => e.participantId === participantId,
    );
    return entries[entries.length - 1] ?? null;
  }
}

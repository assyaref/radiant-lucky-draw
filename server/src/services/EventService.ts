import { EventRepository } from '../repositories';
import { AuditService } from './AuditService';
import type { CreateEventRequest, UpdateEventRequest, EventResponse } from '../dto';
import { NotFoundError } from '../utils';

export class EventService {
  constructor(
    private eventRepository: EventRepository,
    private auditService?: AuditService,
  ) {}

  async list(page = 1, limit = 20) {
    return this.eventRepository.findWithCounts(page, limit);
  }

  async getById(id: string): Promise<EventResponse> {
    const event = await this.eventRepository.findById(id);
    if (!event) throw new NotFoundError('Event', id);
    return this.toResponse(event);
  }

  async create(data: CreateEventRequest, userId?: string): Promise<EventResponse> {
    const event = await this.eventRepository.create({ ...data, createdBy: userId });
    await this.auditService?.log({ action: 'create', entity: 'event', entityId: event.id, userId });
    return this.toResponse(event);
  }

  async update(id: string, data: UpdateEventRequest, userId?: string): Promise<EventResponse> {
    const existing = await this.eventRepository.findById(id);
    if (!existing) throw new NotFoundError('Event', id);
    const updated = await this.eventRepository.update(id, data);
    if (!updated) throw new NotFoundError('Event', id);
    await this.auditService?.log({ action: 'update', entity: 'event', entityId: id, userId });
    return this.toResponse(updated);
  }

  async delete(id: string, userId?: string): Promise<void> {
    const existing = await this.eventRepository.findById(id);
    if (!existing) throw new NotFoundError('Event', id);
    await this.eventRepository.softDelete(id);
    await this.auditService?.log({ action: 'delete', entity: 'event', entityId: id, userId });
  }

  private toResponse(e: any): EventResponse {
    return {
      id: e.id,
      name: e.name,
      description: e.description,
      location: e.location,
      startDate: e.startDate,
      endDate: e.endDate,
      status: e.status,
      logoUrl: e.logoUrl,
      bannerUrl: e.bannerUrl,
      theme: e.theme,
      createdBy: e.createdBy,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    };
  }
}

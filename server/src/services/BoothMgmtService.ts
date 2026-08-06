import { BoothRepository } from '../repositories';
import { AuditService } from './AuditService';
import type { CreateBoothRequest, UpdateBoothRequest, BoothResponse } from '../dto';
import { NotFoundError, ValidationError } from '../utils';

export class BoothMgmtService {
  constructor(
    private boothRepository: BoothRepository,
    private auditService?: AuditService,
  ) {}

  async listByEvent(eventId: string) {
    const booths = await this.boothRepository.findByEvent(eventId);
    return booths.map((b: any) => this.toResponse(b));
  }

  async getById(id: string): Promise<BoothResponse> {
    const booth = await this.boothRepository.findById(id);
    if (!booth) throw new NotFoundError('Booth', id);
    return this.toResponse(booth);
  }

  async create(data: CreateBoothRequest, userId?: string): Promise<BoothResponse> {
    const existing = await this.boothRepository.findByCode(data.code);
    if (existing) throw new ValidationError('Booth code already exists');
    const booth = await this.boothRepository.create(data);
    await this.auditService?.log({ action: 'create', entity: 'booth', entityId: booth.id, userId });
    return this.toResponse(booth);
  }

  async update(id: string, data: UpdateBoothRequest, userId?: string): Promise<BoothResponse> {
    const existing = await this.boothRepository.findById(id);
    if (!existing) throw new NotFoundError('Booth', id);
    const updated = await this.boothRepository.update(id, data);
    if (!updated) throw new NotFoundError('Booth', id);
    await this.auditService?.log({ action: 'update', entity: 'booth', entityId: id, userId });
    return this.toResponse(updated);
  }

  async delete(id: string, userId?: string): Promise<void> {
    const existing = await this.boothRepository.findById(id);
    if (!existing) throw new NotFoundError('Booth', id);
    await this.boothRepository.softDelete(id);
    await this.auditService?.log({ action: 'delete', entity: 'booth', entityId: id, userId });
  }

  private toResponse(b: any): BoothResponse {
    return {
      id: b.id,
      name: b.name,
      code: b.code,
      location: b.location,
      status: b.status,
      eventId: b.eventId,
      operatorId: b.operatorId,
      theme: b.theme,
      qrCode: b.qrCode,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
    };
  }
}

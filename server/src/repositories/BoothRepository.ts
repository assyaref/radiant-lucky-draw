import { PrismaRepository } from './BaseRepository';
import { prisma } from '../lib/prisma';
import type { Booth } from '../entities';

export class BoothRepository extends PrismaRepository<Booth> {
  protected get model() {
    return prisma.booth;
  }

  protected toEntity(record: any): Booth {
    return {
      id: record.id,
      name: record.name,
      code: record.code,
      location: record.location ?? undefined,
      status: record.status,
      eventId: record.eventId,
      operatorId: record.operatorId ?? undefined,
      theme: record.theme ?? undefined,
      qrCode: record.qrCode ?? undefined,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  protected toPrisma(data: any): any {
    const p: any = {};
    if (data.name !== undefined) p.name = data.name;
    if (data.code !== undefined) p.code = data.code;
    if (data.location !== undefined) p.location = data.location;
    if (data.status !== undefined) p.status = data.status;
    if (data.eventId !== undefined) p.eventId = data.eventId;
    if (data.operatorId !== undefined) p.operatorId = data.operatorId;
    if (data.theme !== undefined) p.theme = data.theme;
    return p;
  }

  async findByEvent(eventId: string) {
    return this.model.findMany({
      where: { eventId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByCode(code: string) {
    return this.model.findFirst({ where: { code, deletedAt: null } });
  }
}

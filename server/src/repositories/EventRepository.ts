import { PrismaRepository } from './BaseRepository';
import { prisma } from '../lib/prisma';
import type { Event } from '../entities';

export class EventRepository extends PrismaRepository<Event> {
  protected get model() {
    return prisma.event;
  }

  protected toEntity(record: any): Event {
    return {
      id: record.id,
      name: record.name,
      description: record.description ?? undefined,
      location: record.location ?? undefined,
      startDate: record.startDate?.toISOString(),
      endDate: record.endDate?.toISOString(),
      status: record.status,
      logoUrl: record.logoUrl ?? undefined,
      bannerUrl: record.bannerUrl ?? undefined,
      theme: record.theme ?? undefined,
      createdBy: record.createdBy ?? undefined,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  protected toPrisma(data: any): any {
    const p: any = {};
    if (data.name !== undefined) p.name = data.name;
    if (data.description !== undefined) p.description = data.description;
    if (data.location !== undefined) p.location = data.location;
    if (data.startDate !== undefined)
      p.startDate = data.startDate ? new Date(data.startDate) : null;
    if (data.endDate !== undefined) p.endDate = data.endDate ? new Date(data.endDate) : null;
    if (data.status !== undefined) p.status = data.status;
    if (data.logoUrl !== undefined) p.logoUrl = data.logoUrl;
    if (data.bannerUrl !== undefined) p.bannerUrl = data.bannerUrl;
    if (data.theme !== undefined) p.theme = data.theme;
    if (data.createdBy !== undefined) p.createdBy = data.createdBy;
    return p;
  }

  async findWithCounts(page = 1, limit = 20) {
    const [data, total] = await Promise.all([
      this.model.findMany({
        where: { deletedAt: null },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { participants: true, prizes: true, winners: true, booths: true } },
        },
      }),
      this.model.count({ where: { deletedAt: null } }),
    ]);
    return {
      data: data.map((r: any) => ({ ...this.toEntity(r), _count: r._count })),
      total,
      page,
      limit,
    };
  }

  async findByStatus(status: string) {
    return this.model.findMany({
      where: { status, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }
}

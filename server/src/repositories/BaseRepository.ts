/**
 * Base Repository
 *
 * Generic PostgreSQL repository implementing the Repository Pattern.
 * Uses Prisma for database access.
 */

import { prisma } from '../lib/prisma';

export interface Repository<T extends { id: string }> {
  findAll(): Promise<T[]>;
  findById(id: string): Promise<T | null>;
  findWhere(predicate: (item: T) => boolean): Promise<T[]>;
  create(data: Omit<T, 'id'>): Promise<T>;
  update(id: string, data: Partial<Omit<T, 'id'>>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
  paginate(page: number, limit: number): Promise<{ data: T[]; total: number }>;
}

/**
 * Prisma-backed repository base.
 * Each concrete repository provides a `model` delegate and mapping functions.
 */
export abstract class PrismaRepository<T extends { id: string }> implements Repository<T> {
  protected abstract get model(): any;

  /** Map a Prisma record to the entity shape */
  protected abstract toEntity(record: any): T;

  /** Map entity data to Prisma create/update input */
  protected abstract toPrisma(data: any): any;

  async findAll(): Promise<T[]> {
    const records = await this.model.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return records.map((r: any) => this.toEntity(r));
  }

  async findById(id: string): Promise<T | null> {
    const record = await this.model.findUnique({
      where: { id },
    });
    if (!record || record.deletedAt) return null;
    return this.toEntity(record);
  }

  async findWhere(predicate: (item: T) => boolean): Promise<T[]> {
    const all = await this.findAll();
    return all.filter(predicate);
  }

  async create(data: Omit<T, 'id'>): Promise<T> {
    const record = await this.model.create({
      data: this.toPrisma(data),
    });
    return this.toEntity(record);
  }

  async update(id: string, data: Partial<Omit<T, 'id'>>): Promise<T | null> {
    const existing = await this.model.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) return null;

    const record = await this.model.update({
      where: { id },
      data: this.toPrisma(data),
    });
    return this.toEntity(record);
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.model.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) return false;

    // Soft delete
    await this.model.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return true;
  }

  async paginate(page: number, limit: number): Promise<{ data: T[]; total: number }> {
    const skip = (page - 1) * limit;
    const [records, total] = await Promise.all([
      this.model.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.model.count({ where: { deletedAt: null } }),
    ]);
    return {
      data: records.map((r: any) => this.toEntity(r)),
      total,
    };
  }
}

// Re-export prisma for convenience
export { prisma };

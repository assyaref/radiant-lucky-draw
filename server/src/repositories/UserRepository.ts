/**
 * User Repository
 *
 * PostgreSQL-backed repository for User entities.
 */

import { PrismaRepository } from './BaseRepository';
import { prisma } from '../lib/prisma';
import type { User } from '../entities';

export class UserRepository extends PrismaRepository<User> {
  protected get model() {
    return prisma.user;
  }

  protected toEntity(record: any): User {
    return {
      id: record.id,
      username: record.username,
      email: record.email,
      password: record.password,
      role: record.role,
      isActive: record.isActive,
      lastLoginAt: record.lastLoginAt ? record.lastLoginAt.toISOString() : null,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  protected toPrisma(data: any): any {
    const prismaData: any = {};
    if (data.username !== undefined) prismaData.username = data.username;
    if (data.email !== undefined) prismaData.email = data.email;
    if (data.password !== undefined) prismaData.password = data.password;
    if (data.role !== undefined) prismaData.role = data.role;
    if (data.isActive !== undefined) prismaData.isActive = data.isActive;
    if (data.lastLoginAt !== undefined) {
      prismaData.lastLoginAt = data.lastLoginAt ? new Date(data.lastLoginAt) : null;
    }
    return prismaData;
  }

  async findByUsername(username: string): Promise<User | null> {
    const record = await this.model.findFirst({
      where: { username, deletedAt: null },
    });
    return record ? this.toEntity(record) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const record = await this.model.findFirst({
      where: { email, deletedAt: null },
    });
    return record ? this.toEntity(record) : null;
  }

  /** Paginated, filtered listing for user management (excludes soft-deleted users). */
  async search(params: {
    page: number;
    limit: number;
    search?: string;
    role?: string;
    isActive?: boolean;
  }): Promise<{ data: User[]; total: number }> {
    const where: any = { deletedAt: null };
    if (params.role) where.role = params.role;
    if (params.isActive !== undefined) where.isActive = params.isActive;
    if (params.search) {
      where.OR = [
        { username: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    const [records, total] = await Promise.all([
      this.model.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      this.model.count({ where }),
    ]);
    return { data: records.map((r: any) => this.toEntity(r)), total };
  }

  /** Number of active, non-deleted users with the given role. */
  async countActiveByRole(role: string): Promise<number> {
    return this.model.count({ where: { role, isActive: true, deletedAt: null } });
  }
}

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
}

/**
 * Audit Service
 *
 * Records security-relevant events for compliance and auditing.
 */

import { randomUUID } from 'crypto';
import { AuditLogRepository } from '../repositories';
import type { AuditAction, AuditLog } from '../entities';

export interface AuditInput {
  userId: string | null;
  action: AuditAction;
  entity: string;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditService {
  constructor(private auditLogRepository: AuditLogRepository) {}

  async log(input: AuditInput): Promise<AuditLog> {
    const entry: AuditLog = {
      id: randomUUID(),
      userId: input.userId,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId ?? null,
      metadata: input.metadata ?? null,
      ipAddress: input.ipAddress ?? '',
      userAgent: input.userAgent ?? '',
      createdAt: new Date().toISOString(),
    };
    return this.auditLogRepository.create(entry);
  }

  async findByUserId(userId: string): Promise<AuditLog[]> {
    return this.auditLogRepository.findByUserId(userId);
  }

  async findByAction(action: string): Promise<AuditLog[]> {
    return this.auditLogRepository.findByAction(action);
  }
}

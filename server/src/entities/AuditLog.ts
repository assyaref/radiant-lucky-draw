/**
 * AuditLog Entity
 *
 * Records security-relevant events for compliance and auditing.
 */

export type AuditAction =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'REFRESH_TOKEN'
  | 'TOKEN_REVOKED'
  | 'SESSION_REVOKED'
  | 'PASSWORD_CHANGED'
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_DELETED'
  | 'ROLE_CHANGED'
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'SPIN'
  | 'CLAIM'
  | 'EXPORT'
  | 'UPLOAD'
  | 'DOWNLOAD'
  | 'SETTINGS_CHANGE';

export interface AuditLog {
  id: string;
  userId: string | null;
  action: AuditAction;
  entity: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

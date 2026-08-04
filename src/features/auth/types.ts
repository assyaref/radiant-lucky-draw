/**
 * Auth Types
 *
 * Mirrors the enterprise RBAC roles and permissions defined on the
 * server so the client can enforce route-level guards consistently.
 */

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  OPERATOR: 'operator',
  REGISTRATION_STAFF: 'registration_staff',
  VIEWER: 'viewer',
  EVENT_MANAGER: 'event_manager',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS: Record<Role, string> = {
  [ROLES.SUPER_ADMIN]: 'Super Admin',
  [ROLES.OPERATOR]: 'Operator',
  [ROLES.REGISTRATION_STAFF]: 'Registration Staff',
  [ROLES.VIEWER]: 'Viewer',
  [ROLES.EVENT_MANAGER]: 'Event Manager',
};

export const PERMISSIONS = {
  USER_READ: 'user:read',
  USER_WRITE: 'user:write',
  USER_DELETE: 'user:delete',
  ROLE_MANAGE: 'role:manage',
  SESSION_MANAGE: 'session:manage',
  AUDIT_READ: 'audit:read',
  DRAW_READ: 'draw:read',
  DRAW_WRITE: 'draw:write',
  DRAW_EXECUTE: 'draw:execute',
  PRIZE_READ: 'prize:read',
  PRIZE_WRITE: 'prize:write',
  PARTICIPANT_READ: 'participant:read',
  PARTICIPANT_WRITE: 'participant:write',
  QUEUE_READ: 'queue:read',
  QUEUE_WRITE: 'queue:write',
  SETTINGS_READ: 'settings:read',
  SETTINGS_WRITE: 'settings:write',
  ANALYTICS_READ: 'analytics:read',
  SPONSOR_WRITE: 'sponsor:write',
  ANNOUNCEMENT_WRITE: 'announcement:write',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: Role;
  permissions?: Permission[];
  lastLoginAt?: string | null;
}


export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthSession {
  id: string;
  userAgent: string;
  ipAddress: string;
  createdAt: string;
  lastActiveAt: string;
  expiresAt: string;
  isCurrent: boolean;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  expiresIn: number;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

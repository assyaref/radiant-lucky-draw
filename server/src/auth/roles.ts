/**
 * Enterprise Roles & Permissions
 *
 * Defines the five enterprise roles and a permission matrix
 * used for Role-Based Access Control (RBAC).
 */

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  OPERATOR: 'operator',
  REGISTRATION_STAFF: 'registration_staff',
  VIEWER: 'viewer',
  EVENT_MANAGER: 'event_manager',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LIST: Role[] = Object.values(ROLES);

export const ROLE_LABELS: Record<Role, string> = {
  [ROLES.SUPER_ADMIN]: 'Super Admin',
  [ROLES.OPERATOR]: 'Operator',
  [ROLES.REGISTRATION_STAFF]: 'Registration Staff',
  [ROLES.VIEWER]: 'Viewer',
  [ROLES.EVENT_MANAGER]: 'Event Manager',
};

/**
 * Permission keys. Each maps to a granular capability.
 */
export const PERMISSIONS = {
  // Auth & Users
  USER_READ: 'user:read',
  USER_WRITE: 'user:write',
  USER_DELETE: 'user:delete',
  ROLE_MANAGE: 'role:manage',
  SESSION_MANAGE: 'session:manage',
  AUDIT_READ: 'audit:read',

  // Draws
  DRAW_READ: 'draw:read',
  DRAW_WRITE: 'draw:write',
  DRAW_EXECUTE: 'draw:execute',

  // Prizes
  PRIZE_READ: 'prize:read',
  PRIZE_WRITE: 'prize:write',

  // Participants
  PARTICIPANT_READ: 'participant:read',
  PARTICIPANT_WRITE: 'participant:write',

  // Queue
  QUEUE_READ: 'queue:read',
  QUEUE_WRITE: 'queue:write',

  // Settings
  SETTINGS_READ: 'settings:read',
  SETTINGS_WRITE: 'settings:write',

  // Analytics
  ANALYTICS_READ: 'analytics:read',

  // Sponsors & Announcements
  SPONSOR_WRITE: 'sponsor:write',
  ANNOUNCEMENT_WRITE: 'announcement:write',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/**
 * Permission matrix: role -> allowed permissions.
 */
export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),

  [ROLES.OPERATOR]: [
    PERMISSIONS.DRAW_READ,
    PERMISSIONS.DRAW_WRITE,
    PERMISSIONS.DRAW_EXECUTE,
    PERMISSIONS.PRIZE_READ,
    PERMISSIONS.PRIZE_WRITE,
    PERMISSIONS.PARTICIPANT_READ,
    PERMISSIONS.PARTICIPANT_WRITE,
    PERMISSIONS.QUEUE_READ,
    PERMISSIONS.QUEUE_WRITE,
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.ANALYTICS_READ,
    PERMISSIONS.SPONSOR_WRITE,
    PERMISSIONS.ANNOUNCEMENT_WRITE,
  ],

  [ROLES.REGISTRATION_STAFF]: [
    PERMISSIONS.PARTICIPANT_READ,
    PERMISSIONS.PARTICIPANT_WRITE,
    PERMISSIONS.QUEUE_READ,
    PERMISSIONS.QUEUE_WRITE,
    PERMISSIONS.DRAW_READ,
    PERMISSIONS.PRIZE_READ,
  ],

  [ROLES.VIEWER]: [
    PERMISSIONS.DRAW_READ,
    PERMISSIONS.PRIZE_READ,
    PERMISSIONS.PARTICIPANT_READ,
    PERMISSIONS.QUEUE_READ,
    PERMISSIONS.ANALYTICS_READ,
  ],

  [ROLES.EVENT_MANAGER]: [
    PERMISSIONS.DRAW_READ,
    PERMISSIONS.DRAW_WRITE,
    PERMISSIONS.DRAW_EXECUTE,
    PERMISSIONS.PRIZE_READ,
    PERMISSIONS.PRIZE_WRITE,
    PERMISSIONS.PARTICIPANT_READ,
    PERMISSIONS.QUEUE_READ,
    PERMISSIONS.QUEUE_WRITE,
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.ANALYTICS_READ,
    PERMISSIONS.SPONSOR_WRITE,
    PERMISSIONS.ANNOUNCEMENT_WRITE,
  ],
};

/**
 * Check whether a role has a given permission.
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Check whether a role has ALL of the given permissions.
 */
export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

/**
 * Check whether a role has ANY of the given permissions.
 */
export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

/**
 * Role hierarchy for fallback checks (higher roles inherit lower).
 */
export const ROLE_HIERARCHY: Record<Role, number> = {
  [ROLES.SUPER_ADMIN]: 5,
  [ROLES.EVENT_MANAGER]: 4,
  [ROLES.OPERATOR]: 3,
  [ROLES.REGISTRATION_STAFF]: 2,
  [ROLES.VIEWER]: 1,
};

export function isRoleAtLeast(role: Role, minimum: Role): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[minimum];
}

/**
 * Session Entity
 *
 * Represents an active authentication session for a user.
 * Used for session management, refresh token rotation, and revocation.
 */

export interface Session {
  id: string;
  userId: string;
  refreshToken: string;
  userAgent: string;
  ipAddress: string;
  createdAt: string;
  expiresAt: string;
  lastUsedAt: string;
  revokedAt: string | null;
  revokedReason: string | null;
}

export type PublicSession = Omit<Session, 'refreshToken'>;

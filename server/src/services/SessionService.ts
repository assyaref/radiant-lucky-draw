/**
 * Session Service
 *
 * Manages user sessions: creation, validation, rotation, and revocation.
 */

import { randomUUID } from 'crypto';
import { SessionRepository } from '../repositories';
import { TokenService } from './TokenService';
import { env } from '../config';
import type { Session, PublicSession } from '../entities';
import { UnauthorizedError } from '../utils';

export interface CreateSessionInput {
  userId: string;
  userAgent: string;
  ipAddress: string;
}

export class SessionService {
  constructor(
    private sessionRepository: SessionRepository,
    private tokenService: TokenService,
  ) {}

  async createSession(input: CreateSessionInput): Promise<{
    session: Session;
    refreshToken: string;
  }> {
    const refreshToken = this.tokenService.generateRefreshToken();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + env.COOKIE_MAX_AGE_MS);

    const session: Session = {
      id: randomUUID(),
      userId: input.userId,
      refreshToken: this.tokenService.hashRefreshToken(refreshToken),
      userAgent: input.userAgent,
      ipAddress: input.ipAddress,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      lastUsedAt: now.toISOString(),
      revokedAt: null,
      revokedReason: null,
    };

    await this.sessionRepository.create(session);
    return { session, refreshToken };
  }

  async validateRefreshToken(refreshToken: string): Promise<Session> {
    const hashed = this.tokenService.hashRefreshToken(refreshToken);
    const session = await this.sessionRepository.findByRefreshToken(hashed);

    if (!session) {
      throw new UnauthorizedError('Invalid refresh token');
    }
    if (session.revokedAt) {
      throw new UnauthorizedError('Session has been revoked');
    }
    if (new Date(session.expiresAt) < new Date()) {
      throw new UnauthorizedError('Session has expired');
    }

    // Update last used
    session.lastUsedAt = new Date().toISOString();
    return session;
  }

  async revokeSession(sessionId: string, reason: string): Promise<boolean> {
    const session = await this.sessionRepository.revokeById(sessionId, reason);
    return !!session;
  }

  async revokeAllUserSessions(userId: string, reason: string): Promise<number> {
    return this.sessionRepository.revokeByUserId(userId, reason);
  }

  async listUserSessions(userId: string): Promise<PublicSession[]> {
    const sessions = await this.sessionRepository.findAllByUserId(userId);
    return sessions.map(({ refreshToken: _rt, ...rest }) => rest);
  }

  async cleanupExpired(): Promise<number> {
    return this.sessionRepository.cleanupExpired();
  }
}

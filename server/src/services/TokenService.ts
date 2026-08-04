/**
 * Token Service
 *
 * Handles JWT access token generation/verification and
 * refresh token generation with rotation support.
 */

import jwt from 'jsonwebtoken';
import { randomBytes, createHash } from 'crypto';
import { env } from '../config';
import type { Role } from '../auth';


export interface AccessTokenPayload {
  userId: string;
  username: string;
  role: Role;
  type: 'access';
}

export interface RefreshTokenPayload {
  userId: string;
  sessionId: string;
  type: 'refresh';
}

export class TokenService {
  signAccessToken(user: { id: string; username: string; role: Role }): string {
    const payload: AccessTokenPayload = {
      userId: user.id,
      username: user.username,
      role: user.role,
      type: 'access',
    };
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    } as jwt.SignOptions) as string;
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;
    if (decoded.type !== 'access') {
      throw new Error('Invalid token type');
    }
    return decoded;
  }

  /**
   * Generate an opaque refresh token (cryptographically random).
   * Stored hashed in the session record.
   */
  generateRefreshToken(): string {
    return randomBytes(48).toString('hex');
  }

  /**
   * Hash a refresh token for storage.
   */
  hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }


  /**
   * Sign a JWT refresh token (used for rotation validation).
   */
  signRefreshToken(payload: { userId: string; sessionId: string }): string {
    const tokenPayload: RefreshTokenPayload = {
      ...payload,
      type: 'refresh',
    };
    return jwt.sign(tokenPayload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    } as jwt.SignOptions) as string;
  }

  verifyRefreshToken(token: string): RefreshTokenPayload {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }
    return decoded;
  }
}

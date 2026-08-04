/**
 * Authentication Service
 *
 * Handles login, refresh, logout, session management, and audit logging.
 * DI-ready: receives repositories and services via constructor.
 */

import bcrypt from 'bcryptjs';
import { UserRepository } from '../repositories';
import { TokenService } from './TokenService';
import { SessionService } from './SessionService';
import { AuditService } from './AuditService';
import { ConflictError, UnauthorizedError } from '../utils';
import { env } from '../config';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  RefreshResponse,
  MeResponse,
  SessionListResponse,
  RevokeSessionResponse,
  LogoutResponse,
  AuthUser,
} from '../dto';
import type { PublicSession } from '../entities';

export interface RequestContext {
  ipAddress: string;
  userAgent: string;
}

export class AuthService {
  constructor(
    private userRepository: UserRepository,
    private tokenService: TokenService,
    private sessionService: SessionService,
    private auditService: AuditService,
  ) {}

  private toAuthUser(user: {
    id: string;
    username: string;
    email: string;
    role: AuthUser['role'];
  }): AuthUser {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };
  }

  private accessTokenExpiresIn(): number {
    // JWT_EXPIRES_IN is a string like '15m'; convert to seconds for the client.
    const raw = env.JWT_EXPIRES_IN;
    const match = /^(\d+)([smhd])$/.exec(raw);
    if (!match) return 900;
    const value = parseInt(match[1], 10);
    const unit = match[2];
    const seconds = unit === 's' ? value : unit === 'm' ? value * 60 : unit === 'h' ? value * 3600 : value * 86400;
    return seconds;
  }

  async login(
    data: LoginRequest,
    ctx: RequestContext,
  ): Promise<LoginResponse & { refreshToken: string }> {
    const user = await this.userRepository.findByEmail(data.email);
    if (!user) {
      await this.auditService.log({
        userId: null,
        action: 'LOGIN_FAILED',
        entity: 'user',
        metadata: { email: data.email },
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      });
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is disabled');
    }

    const isValid = await bcrypt.compare(data.password, user.password);
    if (!isValid) {
      await this.auditService.log({
        userId: user.id,
        action: 'LOGIN_FAILED',
        entity: 'user',
        entityId: user.id,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      });
      throw new UnauthorizedError('Invalid email or password');
    }

    const { refreshToken } = await this.sessionService.createSession({
      userId: user.id,
      userAgent: ctx.userAgent,
      ipAddress: ctx.ipAddress,
    });

    const accessToken = this.tokenService.signAccessToken(user);

    await this.userRepository.update(user.id, {
      lastLoginAt: new Date().toISOString(),
    });

    await this.auditService.log({
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      entity: 'user',
      entityId: user.id,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    return {
      accessToken,
      expiresIn: this.accessTokenExpiresIn(),
      user: this.toAuthUser(user),
      refreshToken,
    };
  }

  async refresh(refreshToken: string, ctx: RequestContext): Promise<RefreshResponse> {

    const session = await this.sessionService.validateRefreshToken(refreshToken);
    const user = await this.userRepository.findById(session.userId);

    if (!user) {
      throw new UnauthorizedError('User not found');
    }
    if (!user.isActive) {
      throw new UnauthorizedError('Account is disabled');
    }

    const accessToken = this.tokenService.signAccessToken(user);

    await this.auditService.log({
      userId: user.id,
      action: 'REFRESH_TOKEN',
      entity: 'session',
      entityId: session.id,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    return {
      accessToken,
      expiresIn: this.accessTokenExpiresIn(),
      user: this.toAuthUser(user),
    };
  }

  async logout(refreshToken: string, ctx: RequestContext): Promise<LogoutResponse> {
    const session = await this.sessionService.validateRefreshToken(refreshToken);
    await this.sessionService.revokeSession(session.id, 'logout');

    await this.auditService.log({
      userId: session.userId,
      action: 'LOGOUT',
      entity: 'session',
      entityId: session.id,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    return { success: true, message: 'Logged out successfully' };
  }

  async me(userId: string): Promise<MeResponse> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }
    return { user: this.toAuthUser(user) };
  }

  async listSessions(userId: string): Promise<SessionListResponse> {
    const sessions: PublicSession[] = await this.sessionService.listUserSessions(userId);
    return { sessions };
  }

  async revokeSession(
    userId: string,
    sessionId: string,
    ctx: RequestContext,
  ): Promise<RevokeSessionResponse> {
    const sessions = await this.sessionService.listUserSessions(userId);
    const ownsSession = sessions.some((s) => s.id === sessionId);
    if (!ownsSession) {
      throw new UnauthorizedError('Session not found');
    }

    const revoked = await this.sessionService.revokeSession(sessionId, 'user_revoked');

    await this.auditService.log({
      userId,
      action: 'SESSION_REVOKED',
      entity: 'session',
      entityId: sessionId,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    return { revoked, sessionId };
  }

  async register(data: RegisterRequest): Promise<RegisterResponse> {
    const existingUsername = await this.userRepository.findByUsername(data.username);
    if (existingUsername) {
      throw new ConflictError('Username already exists');
    }

    const existingEmail = await this.userRepository.findByEmail(data.email);
    if (existingEmail) {
      throw new ConflictError('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await this.userRepository.create({
      username: data.username,
      email: data.email,
      password: hashedPassword,
      role: data.role || 'operator',
      isActive: true,
      lastLoginAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      message: 'User registered successfully',
    };
  }
}

/**
 * Authentication Controller
 *
 * Handles login, refresh, logout, current user, and session management.
 * The refresh token is stored in an httpOnly cookie and never exposed
 * in the JSON response body.
 */

import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services';
import { sendSuccess } from '../utils';
import { env } from '../config';

function getRequestContext(req: Request): { ipAddress: string; userAgent: string } {
  return {
    ipAddress: req.ip || req.socket?.remoteAddress || '',
    userAgent: req.headers['user-agent'] || '',
  };
}

function getRefreshToken(req: Request): string {
  return req.cookies?.[env.COOKIE_NAME] ?? '';
}

function setRefreshCookie(res: Response, refreshToken: string): void {
  res.cookie(env.COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAME_SITE,
    maxAge: env.COOKIE_MAX_AGE_MS,
    path: '/',
  });
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(env.COOKIE_NAME, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAME_SITE,
    path: '/',
  });
}

export class AuthController {
  constructor(private authService: AuthService) {}

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authService.login(req.body, getRequestContext(req));
      setRefreshCookie(res, result.refreshToken);
      sendSuccess(res, {
        accessToken: result.accessToken,
        expiresIn: result.expiresIn,
        user: result.user,
      });
    } catch (error) {
      next(error);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const refreshToken = getRefreshToken(req);
      const result = await this.authService.refresh(refreshToken, getRequestContext(req));
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const refreshToken = getRefreshToken(req);
      const result = await this.authService.logout(refreshToken, getRequestContext(req));
      clearRefreshCookie(res);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authService.me(req.user!.userId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  listSessions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authService.listSessions(req.user!.userId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  revokeSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authService.revokeSession(
        req.user!.userId,
        req.params.sessionId,
        getRequestContext(req),
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authService.register(req.body);
      sendSuccess(res, result, undefined, 201);
    } catch (error) {
      next(error);
    }
  };
}

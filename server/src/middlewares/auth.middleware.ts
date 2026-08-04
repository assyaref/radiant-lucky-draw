/**
 * Authentication & Authorization Middleware
 *
 * - authenticate: verifies JWT access token and attaches user to request.
 * - requireRole: restricts access to specific roles.
 * - requirePermission: restricts access to specific permissions (RBAC).
 */

import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../services';
import { UnauthorizedError, ForbiddenError } from '../utils';
import { hasPermission, hasAnyPermission } from '../auth';
import type { Role, Permission } from '../auth';

export interface AuthUser {
  userId: string;
  username: string;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function createAuthenticate(tokenService: TokenService) {
  return function authenticate(req: Request, _res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid authorization header');
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = tokenService.verifyAccessToken(token);
      req.user = {
        userId: decoded.userId,
        username: decoded.username,
        role: decoded.role,
      };
      next();
    } catch {
      throw new UnauthorizedError('Invalid or expired token');
    }
  };
}

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError('Insufficient permissions');
    }
    next();
  };
}

export function requirePermission(...permissions: Permission[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    if (!hasAnyPermission(req.user.role, permissions)) {
      throw new ForbiddenError('Insufficient permissions');
    }
    next();
  };
}

export function requireAllPermissions(...permissions: Permission[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    const allGranted = permissions.every((p) => hasPermission(req.user!.role, p));
    if (!allGranted) {
      throw new ForbiddenError('Insufficient permissions');
    }
    next();
  };
}

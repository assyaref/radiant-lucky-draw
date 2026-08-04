/**
 * Authentication DTOs
 */

import type { Role } from '../auth';
import type { PublicSession } from '../entities';

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: Role;
}

export interface LoginResponse {
  accessToken: string;
  expiresIn: number;
  user: AuthUser;
}

export interface RefreshResponse {
  accessToken: string;
  expiresIn: number;
  user: AuthUser;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  role?: Role;
}

export interface RegisterResponse {
  id: string;
  username: string;
  email: string;
  role: Role;
  message: string;
}

export interface MeResponse {
  user: AuthUser;
}

export interface SessionListResponse {
  sessions: PublicSession[];
}

export interface RevokeSessionResponse {
  revoked: boolean;
  sessionId: string;
}

export interface LogoutResponse {
  success: boolean;
  message: string;
}

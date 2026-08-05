/**
 * Auth API
 *
 * Client-side calls to the enterprise auth endpoints. The refresh
 * token is stored in an httpOnly cookie, so credentials are included
 * automatically on every request.
 */

import { api } from '@api/client';
import { setAccessToken, clearAccessToken } from '@api/tokenStore';
import type { ApiEnvelope, AuthSession, AuthUser, LoginCredentials } from './types';

export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
  expiresIn: number;
}

export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  const res = await api.post<ApiEnvelope<LoginResponse>>('/auth/login', credentials);
  setAccessToken(res.data.accessToken);
  return res.data;
}

export async function refresh(): Promise<LoginResponse> {
  const res = await api.post<ApiEnvelope<LoginResponse>>('/auth/refresh');
  setAccessToken(res.data.accessToken);
  return res.data;
}

export async function logout(): Promise<void> {
  try {
    await api.post<ApiEnvelope<null>>('/auth/logout');
  } finally {
    clearAccessToken();
  }
}

export async function getMe(): Promise<AuthUser> {
  const res = await api.get<ApiEnvelope<AuthUser>>('/auth/me');
  return res.data;
}

export async function listSessions(): Promise<AuthSession[]> {
  const res = await api.get<ApiEnvelope<AuthSession[]>>('/auth/sessions');
  return res.data;
}

export async function revokeSession(sessionId: string): Promise<void> {
  await api.delete<ApiEnvelope<null>>(`/auth/sessions/${sessionId}`);
}

export async function revokeAllSessions(): Promise<void> {
  await api.delete<ApiEnvelope<null>>('/auth/sessions');
}

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
  // The API answers { data: { user } }; older code read `data` as the user,
  // which lost role/permissions after every page reload.
  const res = await api.get<ApiEnvelope<{ user: AuthUser } | AuthUser>>('/auth/me');
  const data = res.data as { user?: AuthUser } & Partial<AuthUser>;
  return (data.user ?? data) as AuthUser;
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

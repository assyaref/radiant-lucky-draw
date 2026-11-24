/**
 * User Management API Client — /api/users
 */

import api from './client';
import type { Role } from '@features/auth';

export interface ManagedUser {
  id: string;
  username: string;
  email: string;
  role: Role;
  roleLabel: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserListParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: Role | '';
  status?: 'active' | 'inactive' | '';
}

export interface UserListResponse {
  success: boolean;
  data: ManagedUser[];
  meta?: { page: number; limit: number; total: number; totalPages: number };
}

export interface CreateUserPayload {
  username: string;
  email: string;
  password: string;
  role: Role;
  isActive?: boolean;
}

export interface UpdateUserPayload {
  username?: string;
  email?: string;
  role?: Role;
  isActive?: boolean;
}

type Envelope<T> = { success: boolean; data: T };

export const userApi = {
  list: (params: UserListParams = {}) => {
    const q = new URLSearchParams();
    if (params.page) q.set('page', String(params.page));
    if (params.limit) q.set('limit', String(params.limit));
    if (params.search) q.set('search', params.search);
    if (params.role) q.set('role', params.role);
    if (params.status) q.set('status', params.status);
    const qs = q.toString();
    return api.get<UserListResponse>(`/users${qs ? `?${qs}` : ''}`);
  },

  create: (payload: CreateUserPayload) => api.post<Envelope<ManagedUser>>('/users', payload),

  update: (id: string, payload: UpdateUserPayload) =>
    api.put<Envelope<ManagedUser>>(`/users/${id}`, payload),

  resetPassword: (id: string, password: string) =>
    api.post<Envelope<{ message: string }>>(`/users/${id}/reset-password`, { password }),

  remove: (id: string) => api.delete<Envelope<{ message: string }>>(`/users/${id}`),

  changeOwnPassword: (currentPassword: string, newPassword: string) =>
    api.post<Envelope<{ message: string }>>('/users/me/password', { currentPassword, newPassword }),
};

export default userApi;

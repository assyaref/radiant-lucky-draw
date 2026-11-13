/**
 * User Management DTOs
 */

import type { Role } from '../auth';

export interface UserResponse {
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

export interface ListUsersQuery {
  page: number;
  limit: number;
  search?: string;
  role?: Role;
  status?: 'active' | 'inactive';
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  role: Role;
  isActive?: boolean;
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  role?: Role;
  isActive?: boolean;
}

export interface ResetPasswordRequest {
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

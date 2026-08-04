/**
 * User Entity
 */

import type { Role } from '../auth';

export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  role: Role;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type PublicUser = Omit<User, 'password'>;

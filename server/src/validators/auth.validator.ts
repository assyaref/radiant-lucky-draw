/**
 * Auth Validators
 *
 * Zod schemas for request validation.
 */

import { z } from 'zod';
import { ROLE_LIST } from '../auth';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    rememberMe: z.boolean().optional(),
  }),
});

export const registerSchema = z.object({
  body: z.object({
    username: z.string().min(3, 'Username must be at least 3 characters'),
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(ROLE_LIST as [string, ...string[]]).optional(),
  }),
});

export const refreshSchema = z.object({
  body: z.object({}).optional(),
});

export const revokeSessionSchema = z.object({
  params: z.object({
    sessionId: z.string().min(1, 'Session id is required'),
  }),
});

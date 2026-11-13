/**
 * User Management Validators
 */

import { z } from 'zod';
import { ROLE_LIST } from '../auth';

const roleEnum = z.enum(ROLE_LIST as [string, ...string[]]);

const password = z
  .string()
  .min(8, 'Password minimal 8 karakter')
  .max(128, 'Password maksimal 128 karakter')
  .regex(/[A-Za-z]/, 'Password harus mengandung huruf')
  .regex(/\d/, 'Password harus mengandung angka')
  .refine((v) => v === v.trim(), 'Password tidak boleh diawali atau diakhiri spasi');

const username = z
  .string()
  .trim()
  .min(3, 'Username minimal 3 karakter')
  .max(50, 'Username maksimal 50 karakter')
  .regex(/^[a-zA-Z0-9._-]+$/, 'Username hanya boleh huruf, angka, titik, garis bawah, atau strip');

const email = z.string().trim().toLowerCase().email('Format email tidak valid').max(255);

export const listUsersSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    search: z.string().trim().max(100).optional(),
    role: roleEnum.optional(),
    status: z.enum(['active', 'inactive']).optional(),
  }),
});

export const createUserSchema = z.object({
  body: z.object({
    username,
    email,
    password,
    role: roleEnum,
    isActive: z.boolean().optional(),
  }),
});

export const updateUserSchema = z.object({
  body: z
    .object({
      username: username.optional(),
      email: email.optional(),
      role: roleEnum.optional(),
      isActive: z.boolean().optional(),
    })
    .refine((b) => Object.values(b).some((v) => v !== undefined), 'Tidak ada perubahan'),
});

export const resetPasswordSchema = z.object({
  body: z.object({ password }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Password lama wajib diisi'),
    newPassword: password,
  }),
});

export const userIdParamSchema = z.object({
  params: z.object({ id: z.string().uuid('ID pengguna tidak valid') }),
});

/**
 * Participant Validators
 */

import { z } from 'zod';

export const createParticipantSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must be at most 100 characters'),
    email: z.string().email('Invalid email format').optional().or(z.literal('')),
    phone: z
      .string()
      .min(8, 'Phone must be at least 8 characters')
      .max(15, 'Phone must be at most 15 characters')
      .regex(/^[+]?[\d\s()-]+$/, 'Invalid phone number format'),
    company: z
      .string()
      .min(1, 'Company is required')
      .max(100, 'Company must be at most 100 characters'),
  }),
});

export const updateParticipantSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    email: z.string().email().optional(),
    phone: z.string().min(8).max(15).optional(),
    company: z.string().min(1).max(100).optional(),
    status: z.enum(['registered', 'called', 'completed', 'cancelled']).optional(),
  }),
});

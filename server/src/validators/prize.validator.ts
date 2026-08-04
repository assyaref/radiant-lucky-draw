/**
 * Prize Validators
 */

import { z } from 'zod';

export const createPrizeSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().min(1, 'Description is required'),
    value: z.number().positive('Value must be positive'),
    currency: z.string().length(3).optional(),
    quantity: z.number().int().positive('Quantity must be positive'),
    imageUrl: z.string().url().optional(),
    sponsor: z.string().optional(),
    tier: z.enum(['bronze', 'silver', 'gold', 'platinum', 'diamond']),
  }),
});

export const updatePrizeSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    value: z.number().positive().optional(),
    currency: z.string().length(3).optional(),
    quantity: z.number().int().positive().optional(),
    imageUrl: z.string().url().optional(),
    sponsor: z.string().optional(),
    tier: z.enum(['bronze', 'silver', 'gold', 'platinum', 'diamond']).optional(),
    isActive: z.boolean().optional(),
  }),
});

/**
 * Name Spin Validator
 */

import { z } from 'zod';

export const nameSpinSchema = z.object({
  body: z
    .object({
      names: z
        .array(z.string().max(100, 'Nama maksimal 100 karakter'))
        .min(2, 'Masukkan minimal 2 nama')
        .max(5000, 'Maksimal 5000 nama'),
      prizeId: z.string().uuid('ID hadiah tidak valid').optional(),
      prizeName: z.string().trim().max(200).optional(),
      title: z.string().trim().max(120).optional(),
    }),
});

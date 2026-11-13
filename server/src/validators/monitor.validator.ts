/**
 * Monitor State Validator
 */

import { z } from 'zod';

export const updateMonitorStateSchema = z.object({
  body: z
    .object({
      mode: z.enum(['event', 'namespin']).optional(),
      wheel: z
        .object({
          names: z.array(z.string().max(100)).max(5000).optional(),
          title: z.string().trim().max(120).nullable().optional(),
          prizeId: z.string().uuid().nullable().optional(),
          prizeName: z.string().trim().max(200).nullable().optional(),
        })
        .optional(),
    })
    .refine((b) => b.mode !== undefined || b.wheel !== undefined, 'Tidak ada perubahan'),
});

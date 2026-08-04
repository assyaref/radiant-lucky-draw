/**
 * Draw Validators
 */

import { z } from 'zod';

export const createDrawSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    prizeId: z.string().uuid('Invalid prize ID'),
    participantIds: z.array(z.string().uuid()).min(1, 'At least one participant required'),
  }),
});

export const updateDrawStatusSchema = z.object({
  body: z.object({
    status: z.enum(['pending', 'countdown', 'spinning', 'revealed', 'completed', 'cancelled']),
    // NOTE (RC3): winnerId / winnerName are intentionally NOT accepted from the
    // client. Winner selection is performed exclusively on the server side.
  }),
});



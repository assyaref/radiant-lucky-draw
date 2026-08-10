/**
 * Booth Validators
 *
 * Zod schemas for the Digital Lucky Draw Booth Enterprise flow.
 */

import { z } from 'zod';

export const createBoothParticipantSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, 'Nama lengkap wajib diisi (minimal 2 karakter)')
      .max(100, 'Nama maksimal 100 karakter'),
    company: z
      .string()
      .min(1, 'PT / Perusahaan wajib diisi')
      .max(100, 'Perusahaan maksimal 100 karakter'),
    whatsapp: z
      .string()
      .transform((val) => val.trim())
      .pipe(
        z.union([
          z.string().length(0),
          z
            .string()
            .min(8, 'Nomor WhatsApp minimal 8 karakter')
            .max(20, 'Nomor WhatsApp maksimal 20 karakter')
            .regex(/^[+]?[\d\s()-]+$/, 'Format nomor WhatsApp tidak valid'),
        ]),
      )
      .optional(),
  }),
});

export const uploadPhotoSchema = z.object({
  body: z.object({
    participantId: z.string().uuid('Participant ID tidak valid'),
    photo: z
      .string()
      .min(1, 'Foto wajib diisi')
      .refine((val) => val.startsWith('data:image/'), 'Foto harus berupa data URL gambar'),
  }),
});

export const spinSchema = z.object({
  body: z.object({
    participantId: z.string().uuid('Participant ID tidak valid'),
  }),
});

export const updateClaimStatusSchema = z.object({
  body: z.object({
    claimStatus: z.enum(['unclaimed', 'claimed']),
  }),
});

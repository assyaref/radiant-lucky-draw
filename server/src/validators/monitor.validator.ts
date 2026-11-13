/**
 * Monitor State Validator
 */

import { z } from 'zod';

/** Link to an image/sound: http(s) URL only (empty string clears it). */
const assetUrl = z
  .string()
  .trim()
  .max(2000)
  .refine((v) => v === '' || /^https?:\/\/\S+$/i.test(v), 'Link harus diawali http:// atau https://');

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
      theme: z
        .object({
          logoUrl: assetUrl.nullable().optional(),
          eventLabel: z.string().trim().max(60).nullable().optional(),
          spinSoundUrl: assetUrl.nullable().optional(),
          winSoundUrl: assetUrl.nullable().optional(),
          soundEnabled: z.boolean().optional(),
        })
        .optional(),
    })
    .refine(
      (b) => b.mode !== undefined || b.wheel !== undefined || b.theme !== undefined,
      'Tidak ada perubahan',
    ),
});

/** Upload of a logo or sound file, sent as a data URL. */
export const uploadMonitorAssetSchema = z.object({
  body: z.object({
    kind: z.enum(['logo', 'sound']),
    fileName: z.string().trim().max(200).optional(),
    dataUrl: z.string().max(8_000_000).regex(/^data:[\w.+-]+\/[\w.+-]+;base64,/, 'Format file tidak valid'),
  }),
});

/**
 * Settings Validators
 */

import { z } from 'zod';

export const updateSettingsSchema = z.object({
  body: z.object({
    eventName: z.string().min(1).optional(),
    eventDate: z.string().optional(),
    eventLocation: z.string().optional(),
    eventStatus: z.enum(['upcoming', 'active', 'completed']).optional(),
    eventDescription: z.string().optional(),
    maxParticipants: z.number().int().positive().optional(),
    drawInterval: z.number().int().positive().optional(),
    celebrationLevel: z.enum(['low', 'medium', 'high', 'extreme']).optional(),
    theme: z.enum(['dark', 'light', 'luxury']).optional(),
    soundEnabled: z.boolean().optional(),
    autoAdvance: z.boolean().optional(),
    logoUrl: z.string().optional(),
    bannerUrl: z.string().optional(),
    backgroundUrl: z.string().optional(),
    primaryColor: z.string().optional(),
    secondaryColor: z.string().optional(),
    sponsorIds: z.array(z.string()).optional(),
  }),
});

import { z } from 'zod';

export const venueTypeValues = ['club', 'open-air', 'warehouse', 'festival'] as const;

export const venueDraftSchema = z.object({
  name: z.string().trim().min(2).max(80),
  district: z.string().trim().min(2).max(80),
  type: z.enum(venueTypeValues),
  rules: z.string().trim().max(280),
});

export type VenueDraft = z.infer<typeof venueDraftSchema>;

import { z } from 'zod';

export const LocationSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.literal('location'),
  adjacent_locations: z.array(z.string().min(1)).default([]),
  acoustic_damping_factor: z.number().int().min(0).max(10000).default(1000),
  lighting_level: z.enum(['pitch_black', 'dim_crevice', 'dappled', 'exposed']).default('dim_crevice'),
});

export const PossessionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.literal('possession'),
  weight_class: z.enum(['scrap', 'shine', 'weight']).default('scrap'),
  mass_grams: z.number().int().min(0).default(10),
  is_contested: z.boolean().default(false),
});

export type Location = z.infer<typeof LocationSchema>;
export type Possession = z.infer<typeof PossessionSchema>;

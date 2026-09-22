import { z } from 'zod';

export const LocomotionBaselineEnum = z.enum([
  'bipedal_standard',
  'bipedal_hunched',
  'quadrupedal',
  'slithering',
  'brachiation',
  'sessile',
  'limping',
]);

export const SomaticVectorSchema = z.object({
  locomotion_baseline: LocomotionBaselineEnum,
  banned_kinetic_verbs: z.array(z.string().min(1)).default([]),
  motor_limitations: z.array(z.string().min(1)).default([]),
  conditions: z.array(z.string().min(1)).default([]),
  signature_tics: z.array(z.string().min(1)).default([]),
});

export const LogisticalVectorSchema = z.object({
  worn: z.array(z.string().min(1)).default([]),
  held: z.array(z.string().min(1)).default([]),
  carried: z.array(z.string().min(1)).default([]),
  cached: z.array(z.string().min(1)).default([]),
});

export const EpistemicVectorSchema = z.object({
  escalation_ceiling: z.number().int().min(1).max(5).default(3),
  leverage_strings: z.record(z.string(), z.number().int()).default({}),
  relationship_defaults: z.record(z.string(), z.string()).default({}),
  strings_held_over: z.array(z.string().min(1)).default([]),
});

export const AgentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.literal('character'),
  location: z.string().min(1).optional(),
  somatic: SomaticVectorSchema,
  logistical: LogisticalVectorSchema,
  epistemic: EpistemicVectorSchema,
  historical_reference: z.boolean().default(false),
  retirement_reason: z.string().optional(),
});

export type Agent = z.infer<typeof AgentSchema>;

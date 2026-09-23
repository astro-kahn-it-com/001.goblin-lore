import { z } from 'zod'

export const RuleSeverityClassEnum = z.enum([
  'FORMAT',
  'STYLE',
  'RELATIONAL',
  'ONTOLOGY',
  'EPISTEMIC',
  'PHYSICAL_SOMATIC',
])
export type RuleSeverityClass = z.infer<typeof RuleSeverityClassEnum>

export const AuthorizerRoleEnum = z.enum([
  'LEAD_ARCHITECT',
  'SHOWRUNNER',
  'SCENE_DIRECTOR',
  'SYSTEM_ADMIN',
])
export type AuthorizerRole = z.infer<typeof AuthorizerRoleEnum>

export const AuthorizerSchema = z.object({
  id: z
    .string()
    .regex(
      /^auth_[a-z0-9_]+$/,
      'Authorizer ID must follow snake_case prefixed with auth_',
    ),
  name: z.string().min(1),
  role: AuthorizerRoleEnum,
  permitted_severity_classes: z.array(RuleSeverityClassEnum).min(1),
})
export type Authorizer = z.infer<typeof AuthorizerSchema>

export const RuleSchema = z
  .object({
    id: z
      .string()
      .regex(
        /^rule_[a-z0-9_]+$/,
        'Rule ID must follow snake_case prefixed with rule_',
      ),
    description: z.string().min(10),
    pardonable: z.boolean().default(false),
    severity_class: RuleSeverityClassEnum,
    owning_entity_types: z
      .array(
        z.enum(['character', 'location', 'possession', 'grievance', 'scene']),
      )
      .min(1),
    max_tolerated_pardon_frequency: z.number().int().min(1).default(10),
  })
  .refine(
    (rule) => {
      const isHardTier = ['PHYSICAL_SOMATIC', 'EPISTEMIC'].includes(
        rule.severity_class,
      )
      if (isHardTier && rule.pardonable === true) {
        return false
      }
      return true
    },
    {
      message:
        'Rules classified as PHYSICAL_SOMATIC or EPISTEMIC must declare pardonable: false.',
      path: ['pardonable'],
    },
  )
export type Rule = z.infer<typeof RuleSchema>

export const SomaticMutationPayloadSchema = z.object({
  condition_added: z.string().min(1).optional(),
  temporary_motor_mask_relief: z.string().min(1).optional(),
  exhaustion_increment: z.number().int().min(0).max(10000).optional(),
})

export const LogisticalMutationPayloadSchema = z.object({
  capacity_override_grams: z.number().int().min(0).optional(),
  slot_borrow: z
    .object({
      source_slot: z.enum(['worn', 'held', 'carried', 'cached']),
      target_slot: z.enum(['worn', 'held', 'carried', 'cached']),
    })
    .optional(),
})

export const EpistemicMutationPayloadSchema = z.object({
  leverage_delta: z.record(z.string(), z.number().int()).optional(),
  temporary_blind_spot: z.string().min(1).optional(),
})

export const InjectedStateMutationSchema = z.discriminatedUnion('vector', [
  z.object({
    vector: z.literal('somatic'),
    payload: SomaticMutationPayloadSchema,
  }),
  z.object({
    vector: z.literal('logistical'),
    payload: LogisticalMutationPayloadSchema,
  }),
  z.object({
    vector: z.literal('epistemic'),
    payload: EpistemicMutationPayloadSchema,
  }),
])
export type InjectedStateMutation = z.infer<typeof InjectedStateMutationSchema>

export const PardonScopeSchema = z.object({
  series_id: z.string().min(1),
  episode_id: z.string().min(1),
  scene_id: z.string().min(1),
  shot_id: z.string().min(1).optional(),
  entity_id: z.string().min(1),
})

export const PardonRecordSchema = z.object({
  id: z
    .string()
    .regex(
      /^pardon_[a-z0-9_]+$/,
      'Pardon ID must follow snake_case prefixed with pardon_',
    ),
  target: PardonScopeSchema,
  rule_id: z.string().regex(/^rule_[a-z0-9_]+$/),
  authorizer_id: z.string().regex(/^auth_[a-z0-9_]+$/),
  reason: z
    .string()
    .min(
      20,
      'Pardon reason must be descriptive (at least 20 chars) to ensure principled review',
    ),
  granted_against_entity_hash: z
    .string()
    .regex(
      /^[0-9a-f]{64}$/,
      'Must be a 64-character lowercase hex SHA-256 hash',
    ),
  granted_against_canon_root: z
    .string()
    .regex(
      /^[0-9a-f]{64}$/,
      'Must be a 64-character lowercase hex SHA-256 hash',
    ),
  injected_state_mutation: InjectedStateMutationSchema.optional(),
})
export type PardonRecord = z.infer<typeof PardonRecordSchema>

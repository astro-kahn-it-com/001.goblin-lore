import { z } from 'zod'

export const WorldEpistemicStatusEnum = z.enum([
    'KNOWN_TRUE',
    'KNOWN_FALSE',
    'DISPUTED',
    'UNRESOLVED_BY_CANON',
])
export type WorldEpistemicStatus = z.infer<typeof WorldEpistemicStatusEnum>

export const EpistemicHorizonEnum = z.enum([
    'TOTAL_IGNORANCE',
    'RUMOR_ONLY',
    'FALSE_BELIEF',
    'PARTIAL_FACT',
    'WITHHELD',
])
export type EpistemicHorizon = z.infer<typeof EpistemicHorizonEnum>

export const TriStateStandingEnum = z.enum([
    'ACTIVE_ENDORSED',
    'FLAGGED_FOR_REVIEW',
    'DEPRECATED_ARCHIVED',
])
export type TriStateStanding = z.infer<typeof TriStateStandingEnum>

export const ForbiddenPropositionSchema = z.object({
    statement: z
        .string()
        .min(
            10,
            'Forbidden proposition statement must be descriptive (>= 10 chars)',
        )
        .max(300, 'Forbidden proposition statement must not exceed 300 chars'),
    trigger_lemma_sets: z
        .array(
            z
                .array(
                    z
                        .string()
                        .min(1)
                        .regex(
                            /^[a-z0-9_]+$/,
                            'Lemmas must be alphanumeric snake_case',
                        ),
                )
                .min(2),
        )
        .min(1),
})
export type ForbiddenProposition = z.infer<typeof ForbiddenPropositionSchema>

export const DistortedBeliefStringSchema = z
    .string()
    .min(5, 'Authored distorted belief must be descriptive (>= 5 chars)')
    .max(
        500,
        'Authored distorted belief must not exceed 500 chars to avoid context saturation',
    )
    .refine((val) => !/[\[\]]/.test(val), {
        message:
            'Distorted belief text cannot contain square brackets ("[" or "]") to prevent prompt delimiter collisions.',
    })

export const UnresolvedCanonSchema = z
    .object({
        topic_id: z
            .string()
            .regex(
                /^mystery_[a-z0-9_]+$/,
                'Topic ID must follow snake_case prefixed with mystery_',
            ),
        title: z.string().min(1).max(100),
        world_status: WorldEpistemicStatusEnum.default('UNRESOLVED_BY_CANON'),
        standing: TriStateStandingEnum.default('ACTIVE_ENDORSED'),
        last_reconsidered_at: z.number().int().default(0),
        forbidden_propositions: z.array(ForbiddenPropositionSchema).min(1),
        permitted_clue_tokens: z
            .array(
                z
                    .string()
                    .min(1)
                    .regex(
                        /^[a-z0-9_]+$/,
                        'Clue tokens must be alphanumeric snake_case',
                    ),
            )
            .default([]),
        epistemic_horizons: z.record(
            z
                .string()
                .regex(/^char_[a-z0-9_]+$/, 'Keys must be valid character IDs'),
            EpistemicHorizonEnum,
        ),
        distorted_beliefs: z
            .record(
                z.string().regex(/^char_[a-z0-9_]+$/),
                DistortedBeliefStringSchema,
            )
            .default({}),
        human_promotion_condition: z
            .string()
            .min(20, 'Promotion condition must be at least 20 chars'),
    })
    .refine(
        (data) => {
            for (const [charId, horizon] of Object.entries(
                data.epistemic_horizons,
            )) {
                if (['RUMOR_ONLY', 'FALSE_BELIEF'].includes(horizon)) {
                    if (
                        !data.distorted_beliefs[charId] ||
                        data.distorted_beliefs[charId].trim().length === 0
                    ) {
                        return false
                    }
                }
            }
            return true
        },
        {
            message:
                'Characters assigned RUMOR_ONLY or FALSE_BELIEF must have an explicit entry in distorted_beliefs.',
            path: ['distorted_beliefs'],
        },
    )
    .refine(
        (data) => {
            const clueSet = new Set(
                data.permitted_clue_tokens.map((t) => t.toLowerCase()),
            )
            for (const prop of data.forbidden_propositions) {
                for (const lemmaSet of prop.trigger_lemma_sets) {
                    for (const lemma of lemmaSet) {
                        if (clueSet.has(lemma.toLowerCase())) {
                            return false
                        }
                    }
                }
            }
            return true
        },
        {
            message:
                'permitted_clue_tokens cannot intersect with any members of trigger_lemma_sets.',
            path: ['permitted_clue_tokens'],
        },
    )

export type UnresolvedCanon = z.infer<typeof UnresolvedCanonSchema>

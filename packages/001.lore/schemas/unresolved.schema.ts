import { z } from 'zod'

export const UnresolvedMysterySchema = z.object({
    id: z.string().min(1),
    type: z.literal('unresolved_mystery'),
    trigger_lemmas: z.array(z.string().min(1)),
    ignorance_contract: z.string().min(1),
    permitted_metaphors: z.array(z.string().min(1)).default([]),
})

export type UnresolvedMystery = z.infer<typeof UnresolvedMysterySchema>

import { z } from 'zod'

export const GrievanceSchema = z.object({
    id: z.string().min(1),
    type: z.literal('grievance'),
    participants_primary: z.array(z.string().min(1)).min(1),
    participants_can_involve: z.array(z.string().min(1)).default([]),
    intensity_envelope: z.tuple([
        z.number().int().min(0).max(10000),
        z.number().int().min(0).max(10000),
    ]),
    cooldown_cycles: z.number().int().min(0).default(0),
    spawns_on_max_escalation: z.array(z.string().min(1)).default([]),
    resolved: z.boolean().default(false),
})

export type Grievance = z.infer<typeof GrievanceSchema>

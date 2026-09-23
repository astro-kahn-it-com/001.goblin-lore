export interface SomaticCapabilitySpec {
    locomotion_baseline: string
    conditions?: string[]
    motor_limitations?: string[]
    banned_kinetic_verbs?: string[]
    held_items?: Array<{ id: string; occupies_hands?: number }>
    escalation_ceiling?: number
}

export interface SATEvaluationResult {
    satisfiable: boolean
    armsAvailable: number
    armsRequired: number
    violations: string[]
}

const SEVERE_ARM_CONDITIONS = new Set([
    'braxial_plexus_severed',
    'severed_right_arm',
    'severed_left_arm',
    'paralyzed_arm',
    'amputated_limb',
])

export function evaluateSomaticSAT(
    spec: SomaticCapabilitySpec,
): SATEvaluationResult {
    const violations: string[] = []

    let armsAvailable = 2.0
    if (
        spec.locomotion_baseline === 'sessile' ||
        spec.locomotion_baseline === 'slithering'
    ) {
        armsAvailable = 0.0
    }

    const conditions = spec.conditions || []
    for (const cond of conditions) {
        if (SEVERE_ARM_CONDITIONS.has(cond.toLowerCase())) {
            armsAvailable = Math.max(0.0, armsAvailable - 1.0)
        }
    }

    let armsRequired = 0.0
    const held = spec.held_items || []
    for (const item of held) {
        const hands =
            typeof item.occupies_hands === 'number' ? item.occupies_hands : 1.0
        armsRequired += hands
    }

    if (armsRequired > armsAvailable) {
        violations.push(
            `Somatic limb violation: Entity requires ${armsRequired} hand(s) but has only ${armsAvailable} available hand(s).`,
        )
    }

    if (spec.escalation_ceiling !== undefined) {
        if (
            !Number.isInteger(spec.escalation_ceiling) ||
            spec.escalation_ceiling < 1 ||
            spec.escalation_ceiling > 5
        ) {
            violations.push(
                `Escalation ceiling out of bounds: must be an integer between 1 and 5 (got ${spec.escalation_ceiling}).`,
            )
        }
    }

    const motorLimitations = spec.motor_limitations || []
    const bannedVerbs = new Set(
        (spec.banned_kinetic_verbs || []).map((v) => v.toLowerCase()),
    )

    if (
        motorLimitations.includes('NO_SPRINT') &&
        !bannedVerbs.has('sprint') &&
        !bannedVerbs.has('run')
    ) {
        violations.push(
            "Motor limitation 'NO_SPRINT' requires 'sprint' or 'run' in banned_kinetic_verbs.",
        )
    }

    return {
        satisfiable: violations.length === 0,
        armsAvailable,
        armsRequired,
        violations,
    }
}

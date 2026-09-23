import type { UnresolvedCanon } from '../../schemas/unresolved.schema.js'

export interface AssembledCharacterContext {
    characterId: string
    injectedDirectives: string[]
    omittedTopicIds: string[]
}

function sanitizePromptText(text: string): string {
    return text
        .replace(/[\[\]]/g, '')
        .replace(/["\\]/g, '')
        .trim()
}

/**
 * Builds isolated context for character turns applying Ignorance by Omission.
 */
export function buildCharacterEpistemicPrompt(
    characterId: string,
    activeMysteries: UnresolvedCanon[],
): AssembledCharacterContext {
    const directives: string[] = []
    const omittedTopics: string[] = []

    for (const mystery of activeMysteries) {
        if (mystery.standing === 'DEPRECATED_ARCHIVED') continue

        const horizon =
            mystery.epistemic_horizons[characterId] || 'TOTAL_IGNORANCE'
        const cleanTitle = sanitizePromptText(mystery.title)

        switch (horizon) {
            case 'TOTAL_IGNORANCE':
                omittedTopics.push(mystery.topic_id)
                break

            case 'RUMOR_ONLY': {
                const rawBelief = mystery.distorted_beliefs[characterId] || ''
                const cleanBelief = sanitizePromptText(rawBelief)
                directives.push(
                    `[UNVERIFIED HEARSAY] You have heard whispers regarding ${cleanTitle}: "${cleanBelief}"`,
                )
                break
            }

            case 'FALSE_BELIEF': {
                const rawBelief = mystery.distorted_beliefs[characterId] || ''
                const cleanBelief = sanitizePromptText(rawBelief)
                directives.push(
                    `[SUBJECTIVE CONVICTION] You are convinced of the following regarding ${cleanTitle}: "${cleanBelief}"`,
                )
                break
            }

            case 'PARTIAL_FACT': {
                if (mystery.permitted_clue_tokens.length > 0) {
                    const formattedClues = mystery.permitted_clue_tokens
                        .map((t: string) => `"${sanitizePromptText(t)}"`)
                        .join(', ')
                    directives.push(
                        `[PERCEPTUAL EVIDENCE] You are aware of specific physical traces regarding ${cleanTitle}: ${formattedClues}`,
                    )
                }
                break
            }

            case 'WITHHELD':
                directives.push(
                    `[RESTRAINED KNOWLEDGE] You possess direct knowledge of ${cleanTitle}, but are constrained from disclosing it under current dramatic stakes.`,
                )
                break
        }
    }

    return {
        characterId,
        injectedDirectives: directives,
        omittedTopicIds: omittedTopics,
    }
}

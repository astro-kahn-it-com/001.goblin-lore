import type { UnresolvedCanon } from '../../schemas/unresolved.schema.js'

export interface EpistemicLeakFinding {
    topicId: string
    statement: string
    matchedLemmas: string[]
    excerpt: string
    line: number
    speakerId?: string
    sourceUnitIndex: number
}

export interface LogicalEpistemicUnit {
    text: string
    startLine: number
    speakerId?: string
}

export class EpistemicLinter {
    /**
     * Normalizes raw Markdown into Logical Epistemic Units (LEUs),
     * collapsing soft-wrapped lines into coherent paragraphs while
     * resetting boundaries on headings, blank lines, and speaker turns.
     */
    public normalizeToLEUs(prose: string): LogicalEpistemicUnit[] {
        const units: LogicalEpistemicUnit[] = []
        const lines = prose.split('\n')

        let currentLines: string[] = []
        let unitStartLine = 1
        let currentSpeaker: string | undefined = undefined

        const flushUnit = () => {
            if (currentLines.length > 0) {
                const text = currentLines.join(' ').trim()
                if (text.length > 0) {
                    units.push({
                        text,
                        startLine: unitStartLine,
                        speakerId: currentSpeaker,
                    })
                }
                currentLines = []
            }
        }

        lines.forEach((rawLine, index) => {
            const lineNum = index + 1
            const trimmed = rawLine.trim()

            // 1. Structural Boundary: Scene Header or Thematic Divider
            if (
                trimmed.startsWith('#') ||
                trimmed === '---' ||
                trimmed === '***'
            ) {
                flushUnit()
                currentSpeaker = undefined
                return
            }

            // 2. Structural Boundary: Paragraph Break (Empty Line)
            if (trimmed.length === 0) {
                flushUnit()
                return
            }

            // 3. Structural Boundary: Speaker Dialogue Turn
            const speakerMatch = trimmed.match(
                /^\[(char_[a-z0-9_]+)\]:\s*(.*)$/,
            )
            if (speakerMatch) {
                flushUnit()
                currentSpeaker = speakerMatch[1]
                unitStartLine = lineNum
                if (speakerMatch[2].trim().length > 0) {
                    currentLines.push(speakerMatch[2].trim())
                }
                return
            }

            // 4. Continuation: Soft-wrapped line
            if (currentLines.length === 0) {
                unitStartLine = lineNum
            }
            currentLines.push(trimmed)
        })

        flushUnit()
        return units
    }

    /**
     * Scans narrative prose against active unresolved mysteries
     * using an exact bounded sliding window (W = 20).
     */
    public scanProse(
        prose: string,
        unresolvedTopics: UnresolvedCanon[],
        windowSize = 20,
    ): EpistemicLeakFinding[] {
        const findings: EpistemicLeakFinding[] = []
        const units = this.normalizeToLEUs(prose)

        units.forEach((unit, unitIdx) => {
            const tokens = unit.text
                .toLowerCase()
                .replace(/[^a-z0-9_\s]/g, ' ')
                .split(/\s+/)
                .filter(Boolean)

            if (tokens.length < 2) return

            for (const topic of unresolvedTopics) {
                if (topic.standing === 'DEPRECATED_ARCHIVED') continue

                for (const prop of topic.forbidden_propositions) {
                    for (const lemmaSet of prop.trigger_lemma_sets) {
                        const lowerLemmas = lemmaSet.map((l) => l.toLowerCase())

                        const maxIterations = Math.max(
                            0,
                            tokens.length - windowSize,
                        )
                        let matched = false

                        for (let i = 0; i <= maxIterations; i++) {
                            const windowSlice = tokens.slice(
                                i,
                                Math.min(i + windowSize, tokens.length),
                            )
                            const windowTokenSet = new Set(windowSlice)

                            const allMatched = lowerLemmas.every((lemma) =>
                                windowTokenSet.has(lemma),
                            )

                            if (allMatched) {
                                matched = true
                                break // Cease sliding for this specific lemmaSet within this LEU
                            }
                        }

                        if (matched) {
                            findings.push({
                                topicId: topic.topic_id,
                                statement: prop.statement,
                                matchedLemmas: lemmaSet,
                                excerpt: unit.text,
                                line: unit.startLine,
                                speakerId: unit.speakerId,
                                sourceUnitIndex: unitIdx,
                            })
                            break // Break out of the sliding window loop for this lemmaSet
                        }
                    }
                }
            }
        })

        return findings
    }
}

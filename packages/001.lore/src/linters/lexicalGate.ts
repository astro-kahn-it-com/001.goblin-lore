import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'

export interface LexicalViolation {
  file: string
  line: number
  characterId: string
  verb: string
  family: string
  sentence: string
  confidence: number
  isAmbiguous: boolean
}

export interface LintProseResult {
  passed: boolean
  violations: LexicalViolation[]
  quarantinedCount: number
}

export interface VerbFamilyDefinition {
  capability_required: string
  banned_if_conditions: string[]
  verbs: string[]
  contextual_abstract_whitelist?: string[]
}

export interface VerbOntology {
  families: Record<string, VerbFamilyDefinition>
}

const MODAL_NEGATIONS = new Set([
  'not',
  "n't",
  'never',
  'unable',
  'failed',
  'cannot',
  "couldn't",
  "wouldn't",
  "can't",
  'without',
  'refused',
])

export class LexicalVerbGate {
  private ontology: VerbOntology

  constructor(ontologyPath?: string) {
    const resolvedPath =
      ontologyPath ||
      path.resolve(
        process.cwd(),
        'packages/001.lore/schemas/ontology/verb_families.json',
      )
    if (fs.existsSync(resolvedPath)) {
      this.ontology = JSON.parse(fs.readFileSync(resolvedPath, 'utf-8'))
    } else {
      this.ontology = {
        families: {
          LOCOMOTION_RAPID: {
            capability_required: 'bipedal_sprint',
            banned_if_conditions: ['famished', 'stiff_left_knee', 'broken_leg'],
            verbs: [
              'sprint',
              'dash',
              'vault',
              'scramble',
              'scurry',
              'bound',
              'leap',
            ],
            contextual_abstract_whitelist: ['mind', 'thoughts', 'memory'],
          },
          BIMANUAL_GRIP: {
            capability_required: 'two_functional_arms',
            banned_if_conditions: ['withered_left_arm', 'severed_left_arm'],
            verbs: [
              'clutch',
              'grip',
              'climb',
              'hoist',
              'wield_two_handed',
              'embrace',
            ],
            contextual_abstract_whitelist: [
              'fate',
              'destiny',
              'memory',
              'silence',
              'terror',
            ],
          },
        },
      }
    }
  }

  public lintCharacterDossier(filePath: string): LintProseResult {
    const raw = fs.readFileSync(filePath, 'utf-8')
    const parsed = matter(raw)
    const character = parsed.data
    const body = parsed.content

    const bannedVerbs = new Set<string>(
      character.somatic?.banned_kinetic_verbs || [],
    )

    for (const condition of character.somatic?.conditions || []) {
      for (const familyDef of Object.values(this.ontology.families)) {
        if (familyDef.banned_if_conditions.includes(condition)) {
          familyDef.verbs.forEach((v) => bannedVerbs.add(v))
        }
      }
    }

    if (bannedVerbs.size === 0) {
      return { passed: true, violations: [], quarantinedCount: 0 }
    }

    return this.lintText(body, character.id, bannedVerbs, filePath)
  }

  public lintText(
    prose: string,
    characterId: string,
    bannedVerbs: Set<string>,
    filePath = 'unknown.md',
  ): LintProseResult {
    const violations: LexicalViolation[] = []
    let quarantinedCount = 0

    const lines = prose.split('\n')
    lines.forEach((lineText, lineIdx) => {
      const sentences = lineText.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || []

      for (const sentence of sentences) {
        const cleanSentence = sentence.trim()
        if (!cleanSentence || cleanSentence.startsWith('#')) continue

        for (const bannedVerb of bannedVerbs) {
          const base = bannedVerb;
          const dropE = base.endsWith('e') ? base.slice(0, -1) : base;
          const doubleConsonant = base + base.slice(-1);
          const verbRegex = new RegExp(
            `\\b(${base}|${base}s|${base}ed|${base}ing|${dropE}ed|${dropE}ing|${doubleConsonant}ed|${doubleConsonant}ing)\\b`,
            'i',
          )
          const match = cleanSentence.match(verbRegex)

          if (match) {
            const isNegated = this.evaluateNegation(cleanSentence, match[1])
            const isAbstract = this.evaluateAbstraction(
              cleanSentence,
              bannedVerb,
            )

            if (isAbstract || isNegated) {
              continue
            }

            const isAmbiguous = this.checkAmbiguity(cleanSentence)
            if (isAmbiguous) quarantinedCount++

            violations.push({
              file: filePath,
              line: lineIdx + 1,
              characterId,
              verb: bannedVerb,
              family: this.resolveFamily(bannedVerb),
              sentence: cleanSentence,
              confidence: isAmbiguous ? 0.7 : 0.95,
              isAmbiguous,
            })
          }
        }
      }
    })

    return {
      passed: violations.filter((v) => !v.isAmbiguous).length === 0,
      violations,
      quarantinedCount,
    }
  }

  public validateActionProseAST(
    prose: string,
    selfReportedActions: string[],
    characterId: string,
    bannedVerbs: Set<string>,
  ): { valid: boolean; fatalBreaches: string[] } {
    const fatalBreaches: string[] = []

    for (const declared of selfReportedActions) {
      const lower = declared.toLowerCase()
      if (bannedVerbs.has(lower)) {
        fatalBreaches.push(
          `Self-reported action violation: '${declared}' is banned for ${characterId}`,
        )
      }
    }

    const proseResult = this.lintText(prose, characterId, bannedVerbs)
    for (const v of proseResult.violations) {
      if (!v.isAmbiguous) {
        fatalBreaches.push(
          `Prose action violation: '${v.verb}' detected affirmatively on line ${v.line}`,
        )
      }
    }

    return {
      valid: fatalBreaches.length === 0,
      fatalBreaches,
    }
  }

  private evaluateNegation(sentence: string, matchedToken: string): boolean {
    const tokens = sentence.toLowerCase().replace(/[,;:]/g, ' ').split(/\s+/)
    const tokenIdx = tokens.findIndex((t) =>
      t.includes(matchedToken.toLowerCase()),
    )
    if (tokenIdx === -1) return false

    const windowStart = Math.max(0, tokenIdx - 6)
    for (let i = windowStart; i < tokenIdx; i++) {
      if (MODAL_NEGATIONS.has(tokens[i])) {
        return true
      }
    }
    return false
  }

  private evaluateAbstraction(sentence: string, verb: string): boolean {
    const familyName = this.resolveFamily(verb)
    const whitelist =
      this.ontology.families[familyName]?.contextual_abstract_whitelist || []
    const lowerSentence = sentence.toLowerCase()

    return whitelist.some((abstractToken) =>
      lowerSentence.includes(abstractToken),
    )
  }

  private checkAmbiguity(sentence: string): boolean {
    const ambiguousTokens = [
      'him',
      'her',
      'they',
      'them',
      "'im",
      "ain't",
      'someone',
      'figure',
    ]
    const lower = sentence.toLowerCase()
    return ambiguousTokens.some((t) =>
      new RegExp(`\\b${t}\\b`, 'i').test(lower),
    )
  }

  private resolveFamily(verb: string): string {
    for (const [familyName, familyDef] of Object.entries(
      this.ontology.families,
    )) {
      if (familyDef.verbs.includes(verb.toLowerCase())) return familyName
    }
    return 'CUSTOM_UNGROUPED'
  }
}

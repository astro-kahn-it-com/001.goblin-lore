import { describe, it, expect, beforeAll } from 'vitest'
import path from 'node:path'
import fs from 'node:fs'
import { LexicalVerbGate } from '../../src/linters/lexicalGate.js'

interface EvalCase {
    id: string
    category:
        | 'negation'
        | 'affirmative'
        | 'passive_causative'
        | 'coreference'
        | 'idiom'
    text: string
    character: string
    banned_family: string
    banned_verb: string
    expected_verdict: 'PASS' | 'FAIL'
    rationale: string
}

function calculateWilsonLowerBound(
    successes: number,
    trials: number,
    z = 1.96,
): number {
    if (trials === 0) return 0
    const p = successes / trials
    const denominator = 1 + (z * z) / trials
    const center = p + (z * z) / (2 * trials)
    const spread =
        z * Math.sqrt((p * (1 - p)) / trials + (z * z) / (4 * trials * trials))
    return (center - spread) / denominator
}

describe('Lexical Verb Gate Statistical Calibration (evalSet.json)', () => {
    const evalSetPath = fs.existsSync(
        path.resolve(process.cwd(), 'packages/001.lore/linters/evalSet.json'),
    )
        ? path.resolve(process.cwd(), 'packages/001.lore/linters/evalSet.json')
        : path.resolve(process.cwd(), 'linters/evalSet.json')

    const ontologyPath = fs.existsSync(
        path.resolve(
            process.cwd(),
            'packages/001.lore/schemas/ontology/verb_families.json',
        ),
    )
        ? path.resolve(
              process.cwd(),
              'packages/001.lore/schemas/ontology/verb_families.json',
          )
        : path.resolve(process.cwd(), 'schemas/ontology/verb_families.json')

    let evalCases: EvalCase[] = []
    const gate = new LexicalVerbGate(ontologyPath)

    beforeAll(() => {
        expect(fs.existsSync(evalSetPath)).toBe(true)
        // Read strictly from the static physical dataset on disk
        evalCases = JSON.parse(fs.readFileSync(evalSetPath, 'utf-8'))
    })

    it('enforces physical sample allocations across benchmark pools (N >= 200 on disk)', () => {
        const negations = evalCases.filter((c) => c.category === 'negation')
        const affirmatives = evalCases.filter(
            (c) => c.category === 'affirmative',
        )
        const idioms = evalCases.filter((c) => c.category === 'idiom')
        const corefs = evalCases.filter(
            (c) =>
                c.category === 'coreference' ||
                c.category === 'passive_causative',
        )

        // Verify statistical sample requirements
        expect(evalCases.length).toBeGreaterThanOrEqual(200)
        expect(negations.length).toBeGreaterThanOrEqual(50)
        expect(affirmatives.length).toBeGreaterThanOrEqual(75)
        expect(idioms.length).toBeGreaterThanOrEqual(40)
        expect(corefs.length).toBeGreaterThanOrEqual(25)
    })

    it('proves aggregate non-breach precision lower bound satisfies Wilson >= 0.95', () => {
        const nonBreachCases = evalCases.filter(
            (c) => c.expected_verdict === 'PASS',
        )
        let correct = 0

        for (const testCase of nonBreachCases) {
            const res = gate.lintText(
                testCase.text,
                testCase.character,
                new Set([testCase.banned_verb]),
            )
            if (res.passed) correct++
        }

        const lowerBound = calculateWilsonLowerBound(
            correct,
            nonBreachCases.length,
        )
        expect(lowerBound).toBeGreaterThanOrEqual(0.95)
    })

    it('proves affirmative breach recall lower bound satisfies Wilson >= 0.90', () => {
        const breachCases = evalCases.filter(
            (c) => c.expected_verdict === 'FAIL',
        )
        let caught = 0

        for (const testCase of breachCases) {
            const res = gate.lintText(
                testCase.text,
                testCase.character,
                new Set([testCase.banned_verb]),
            )
            if (!res.passed || res.violations.length > 0) caught++
        }

        const lowerBound = calculateWilsonLowerBound(caught, breachCases.length)
        expect(lowerBound).toBeGreaterThanOrEqual(0.9)
    })
})

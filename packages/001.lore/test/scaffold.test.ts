import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import path from 'node:path'
import fs from 'node:fs'
import { evaluateSomaticSAT } from '../src/scaffolder/satSolver.js'
import { reconcileReciprocalSpatialLinks } from '../src/scaffolder/reciprocalLinker.js'
import { buildByteZeroDossier } from '../src/scaffolder/entityBuilder.js'
import { reducer as loreReducer } from '../00.lore.unit/lore.reduce.js'
import { LoreModel } from '../00.lore.unit/lore.model.js'
import * as ActLor from '../00.lore.unit/lore.action.js'

describe('Track C: Interactive Entity Scaffolder Engine', () => {
    const fixtureDir = path.resolve(
        process.cwd(),
        'test/fixtures/scaffold_test_series',
    )

    beforeEach(() => {
        if (fs.existsSync(fixtureDir)) {
            fs.rmSync(fixtureDir, { recursive: true, force: true })
        }
        fs.mkdirSync(path.join(fixtureDir, 'characters'), { recursive: true })
        fs.mkdirSync(path.join(fixtureDir, 'locations'), { recursive: true })
        fs.mkdirSync(path.join(fixtureDir, 'possessions'), { recursive: true })
        fs.mkdirSync(path.join(fixtureDir, 'grievances'), { recursive: true })

        fs.writeFileSync(
            path.join(fixtureDir, 'characters', 'bog.md'),
            `---
id: char_bog
name: Bog
type: character
somatic:
  locomotion_baseline: bipedal_standard
  banned_kinetic_verbs: []
  motor_limitations: []
  conditions: []
  signature_tics: []
logistical:
  worn: []
  held: []
  carried: []
  cached: []
epistemic:
  escalation_ceiling: 3
  leverage_strings: {}
  relationship_defaults: {}
  strings_held_over: []
---
# Bog
Bog spends his evenings inspecting the copper conduits.
`,
        )
    })

    afterEach(() => {
        if (fs.existsSync(fixtureDir)) {
            fs.rmSync(fixtureDir, { recursive: true, force: true })
        }
    })

    it('Somatic SAT solver rejects hand allocation exceeding available limbs', () => {
        const res = evaluateSomaticSAT({
            locomotion_baseline: 'bipedal_hunched',
            conditions: ['severed_right_arm'],
            held_items: [{ id: 'item_two_handed_rake', occupies_hands: 2 }],
        })

        expect(res.satisfiable).toBe(false)
        expect(res.armsAvailable).toBe(1.0)
        expect(res.armsRequired).toBe(2.0)
        expect(res.violations[0]).toContain('Somatic limb violation')
    })

    it('Somatic SAT solver rejects invalid escalation ceilings outside 1-5', () => {
        const res = evaluateSomaticSAT({
            locomotion_baseline: 'bipedal_standard',
            escalation_ceiling: 9,
        })

        expect(res.satisfiable).toBe(false)
        expect(res.violations[0]).toContain('Escalation ceiling out of bounds')
    })

    it('buildByteZeroDossier guarantees frontmatter starts strictly at byte 0', () => {
        const markdown = buildByteZeroDossier('character', {
            id: 'char_wart',
            name: 'Wart',
            type: 'character',
            somatic: {
                locomotion_baseline: 'bipedal_hunched',
                banned_kinetic_verbs: ['sprint'],
                conditions: [],
                motor_limitations: [],
                signature_tics: [],
            },
            logistical: { worn: [], held: [], carried: [], cached: [] },
            epistemic: {
                escalation_ceiling: 3,
                leverage_strings: {},
                relationship_defaults: {},
                strings_held_over: [],
            },
        })

        expect(markdown.startsWith('---')).toBe(true)
        expect(markdown.indexOf('---')).toBe(0)
        expect(markdown).toContain('## Wants (surface)')
        expect(markdown).toContain('## Blind spot')
    })

    it('reconcileReciprocalSpatialLinks establishes mutual adjacency links at byte 0', () => {
        const locationsDir = path.join(fixtureDir, 'locations')
        fs.writeFileSync(
            path.join(locationsDir, 'the_warm_pipe.md'),
            `---
id: loc_the_warm_pipe
name: The Warm Pipe
type: location
adjacent_locations: []
acoustic_damping_factor: 2500
lighting_level: dim_crevice
---
# The Warm Pipe
Heat conduit running along the wall base.
`,
        )

        const updated = reconcileReciprocalSpatialLinks(
            'loc_the_pantry_wall',
            ['loc_the_warm_pipe'],
            locationsDir,
        )

        expect(updated).toContain('loc_the_warm_pipe')
        const fileContent = fs.readFileSync(
            path.join(locationsDir, 'the_warm_pipe.md'),
            'utf-8',
        )
        expect(fileContent.indexOf('---')).toBe(0)
        expect(fileContent).toContain('- loc_the_pantry_wall')
    })

    it('scaffoldEntity via loreReducer validates, persists, and reseals canonical state', async () => {
        const model = new LoreModel()
        let response: any = null

        const action = new ActLor.ScaffoldEntity({
            idx: 'test-scaffold',
            src: 'scaffold_test_series',
            dat: {
                entityType: 'location',
                data: {
                    id: 'loc_pantry_notch',
                    name: 'Pantry Notch',
                    type: 'location',
                    adjacent_locations: [],
                    acoustic_damping_factor: 1800,
                    lighting_level: 'pitch_black',
                },
            },
            slv: (res: any) => {
                response = res
            },
        })

        const nextModel = await loreReducer(model, action)
        expect(nextModel.lastCompileStatus).toBe('SEALED')
        expect(response?.lorBit?.val).toBe(1)
        expect(response?.lorBit?.dat?.scaffold?.entityId).toBe(
            'loc_pantry_notch',
        )

        const generatedFile = path.join(
            fixtureDir,
            'locations',
            'pantry_notch.md',
        )
        expect(fs.existsSync(generatedFile)).toBe(true)
        const content = fs.readFileSync(generatedFile, 'utf-8')
        expect(content.indexOf('---')).toBe(0)
        expect(content).toContain('id: loc_pantry_notch')
    })

    it('scaffoldEntity fails gracefully and logs error on pre-flight SAT violation', async () => {
        const model = new LoreModel()
        let response: any = null

        const action = new ActLor.ScaffoldEntity({
            idx: 'test-scaffold-fail',
            src: 'scaffold_test_series',
            dat: {
                entityType: 'character',
                data: {
                    id: 'char_broken',
                    name: 'Broken',
                    type: 'character',
                    somatic: {
                        locomotion_baseline: 'sessile', // 0 hands available
                        conditions: [],
                        motor_limitations: [],
                        banned_kinetic_verbs: [],
                    },
                    logistical: {
                        worn: [],
                        held: ['item_shovel'], // 1 hand required
                        carried: [],
                        cached: [],
                    },
                    epistemic: {
                        escalation_ceiling: 3,
                        leverage_strings: {},
                        relationship_defaults: {},
                        strings_held_over: [],
                    },
                },
            },
            slv: (res: any) => {
                response = res
            },
        })

        const nextModel = await loreReducer(model, action)
        expect(nextModel.lastCompileStatus).toBe('ERROR')
        expect(response?.lorBit?.val).toBe(0)
        expect(response?.lorBit?.dat?.error).toContain(
            '[SCAFFOLDER PRE-FLIGHT UNSAT]',
        )
    })
})

import { describe, it, expect } from 'vitest'
import {
  loadBibleState,
  getCharacterSomaticMask,
  getEpistemicDirectives,
  getStaticSpatialGraph,
  getActiveGrievanceDAG,
  resolveRepoRoot,
} from '../src/client.js'
import { LoreModel } from '../00.lore.unit/lore.model.js'
import { reducer as loreReducer } from '../00.lore.unit/lore.reduce.js'
import * as ActLor from '../00.lore.unit/lore.action.js'

describe('Typed Downstream Ingestion Client & Somatic Projection Engine', () => {
  it('resolves the monorepo root directory containing packages and series', () => {
    const root = resolveRepoRoot()
    expect(root).toBeDefined()
    expect(typeof root).toBe('string')
  })

  it('loads canonical under-the-floorboards state with valid SHA-256 seal', () => {
    const state = loadBibleState('under-the-floorboards')
    expect(state._meta.state_hash).toMatch(/^[a-f0-9]{64}$/)
    expect(
      Object.keys(state.entities.characters).length,
    ).toBeGreaterThanOrEqual(4)
    expect(Object.keys(state.entities.locations).length).toBeGreaterThanOrEqual(
      4,
    )
    expect(
      Object.keys(state.entities.grievances).length,
    ).toBeGreaterThanOrEqual(7)
  })

  it('enforces deep-freeze immutability against downstream mutation attempts', () => {
    const state = loadBibleState('under-the-floorboards')

    expect(() => {
      ;(state.entities.characters.char_bog as any).name = 'MUTATED'
    }).toThrow(TypeError)

    expect(() => {
      ;(state.entities.characters.char_bog.logistical.held as any).push(
        'item_injected',
      )
    }).toThrow(TypeError)

    expect(() => {
      ;(state._meta as any).state_hash = 'tampered_hash'
    }).toThrow(TypeError)
  })

  it('calculates net upper-limb capacity and kinetic bans for amputated character (char_wart)', () => {
    const state = loadBibleState('under-the-floorboards')
    const wartMask = getCharacterSomaticMask(state, 'char_wart')

    expect(wartMask.characterId).toBe('char_wart')
    expect(wartMask.locomotionBaseline).toBe('bipedal_hunched')
    expect(wartMask.availableArms).toBe(1.0)
    expect(wartMask.conditions).toContain('severed_left_arm')
    expect(wartMask.bannedKineticVerbs).toContain('sprint')
    expect(wartMask.bannedKineticVerbs).toContain('vault')
    expect(wartMask.bannedKineticVerbs).toContain('climb')
    expect(wartMask.bannedKineticVerbs).toContain('embrace')
    expect(wartMask.motorLimitations).toContain('UNSTEADY_GAIT')
    expect(wartMask.motorLimitations).toContain('NO_HEAVY_LIFT')

    expect(() => {
      ;(wartMask as any).availableArms = 2.0
    }).toThrow(TypeError)
  })

  it('calculates somatic capacity for limping character with institutional brake (char_mum_grissel)', () => {
    const state = loadBibleState('under-the-floorboards')
    const grisselMask = getCharacterSomaticMask(state, 'char_mum_grissel')

    expect(grisselMask.characterId).toBe('char_mum_grissel')
    expect(grisselMask.locomotionBaseline).toBe('limping')
    expect(grisselMask.availableArms).toBe(2.0)
    expect(grisselMask.conditions).toContain('stiff_left_knee')
    expect(grisselMask.bannedKineticVerbs).toContain('sprint')
    expect(grisselMask.bannedKineticVerbs).toContain('leap')
    expect(grisselMask.bannedKineticVerbs).toContain('vault')
    expect(grisselMask.bannedKineticVerbs).toContain('scramble')
  })

  it('calculates somatic capacity for standard character (char_bog)', () => {
    const state = loadBibleState('under-the-floorboards')
    const bogMask = getCharacterSomaticMask(state, 'char_bog')

    expect(bogMask.characterId).toBe('char_bog')
    expect(bogMask.availableArms).toBe(2.0)
  })

  it('fails closed when queried with an unindexed character ID', () => {
    const state = loadBibleState('under-the-floorboards')
    expect(() => getCharacterSomaticMask(state, 'char_ghost')).toThrow(
      /\[LORE CLIENT\] Unknown character ID: 'char_ghost'/,
    )
  })

  it('extracts mutual spatial topology graphs with acoustic damping factors', () => {
    const state = loadBibleState('under-the-floorboards')
    const spatialGraph = getStaticSpatialGraph(state)

    expect(spatialGraph['loc_the_warm_pipe']).toBeDefined()
    expect(spatialGraph['loc_the_warm_pipe'].adjacentLocations).toContain(
      'loc_the_pantry_wall',
    )
    expect(spatialGraph['loc_the_warm_pipe'].acousticDampingFactor).toBe(2500)
    expect(spatialGraph['loc_the_attic_stair']).toBeDefined()
    expect(spatialGraph['loc_the_attic_stair'].acousticDampingFactor).toBe(1200)
  })

  it('extracts grievance escalation DAG reflecting multi-tier causal links', () => {
    const state = loadBibleState('under-the-floorboards')
    const dag = getActiveGrievanceDAG(state)

    expect(dag['resource_hoarding']).toBeDefined()
    expect(dag['resource_hoarding']).toContain('hoarding_reveal')
    expect(dag['hoarding_reveal']).toContain('generational_famine_feud')
    expect(dag['generational_famine_feud']).toEqual([])
  })

  it('resolves epistemic prompt directives applying Ignorance by Omission', () => {
    const state = loadBibleState('under-the-floorboards')
    const testMystery = {
      topic_id: 'mystery_the_famine',
      title: 'The Great Winter Famine',
      standing: 'ACTIVE_ENDORSED',
      epistemic_horizons: {
        char_bog: 'TOTAL_IGNORANCE',
        char_spleen: 'RUMOR_ONLY',
      },
      distorted_beliefs: {
        char_spleen: 'Heard that a killing draft entered through a vent.',
      },
      permitted_clue_tokens: [],
    }

    const bogDirectives = getEpistemicDirectives(state, 'char_bog', [
      testMystery,
    ])
    expect(bogDirectives.characterId).toBe('char_bog')
    expect(bogDirectives.omittedTopicIds).toContain('mystery_the_famine')
    expect(bogDirectives.injectedDirectives.length).toBe(0)

    const spleenDirectives = getEpistemicDirectives(state, 'char_spleen', [
      testMystery,
    ])
    expect(spleenDirectives.characterId).toBe('char_spleen')
    expect(spleenDirectives.injectedDirectives[0]).toContain(
      '[UNVERIFIED HEARSAY]',
    )
  })

  it('handles INSPECT_SOMATIC action via loreReducer in headless mode', async () => {
    const model = new LoreModel()
    let response: any = null

    const action = new ActLor.InspectSomatic({
      idx: 'test-somatic-inspect',
      src: 'under-the-floorboards',
      dat: { characterId: 'char_wart' },
      slv: (res: any) => {
        response = res
      },
    })

    await loreReducer(model, action)
    expect(response?.lorBit?.val).toBe(1)
    expect(response?.lorBit?.dat?.characterId).toBe('char_wart')
    expect(response?.lorBit?.dat?.availableArms).toBe(1.0)
  })
})

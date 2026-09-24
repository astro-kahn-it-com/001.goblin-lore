import { describe, it, expect } from 'vitest'
import {
  loadBibleState,
  getCharacterSomaticMask,
  getEpistemicDirectives,
  getStaticSpatialGraph,
  getActiveGrievanceDAG,
  resolveRepoRoot,
} from '../src/client.js'

describe('Typed Downstream Ingestion Client (src/client.ts)', () => {
  it('resolves the monorepo root directory accurately', () => {
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

    // Attempting to mutate a top-level character property must throw TypeError
    expect(() => {
      ;(state.entities.characters.char_bog as any).name = 'MUTATED'
    }).toThrow(TypeError)

    // Attempting to mutate nested inventory arrays must throw TypeError
    expect(() => {
      ;(state.entities.characters.char_bog.logistical.held as any).push(
        'item_illegal_weapon',
      )
    }).toThrow(TypeError)

    // Attempting to mutate metadata must throw TypeError
    expect(() => {
      ;(state._meta as any).state_hash = 'tampered_hash'
    }).toThrow(TypeError)
  })

  it('correctly calculates net upper-limb capacity for amputated characters', () => {
    const state = loadBibleState('under-the-floorboards')
    const wartMask = getCharacterSomaticMask(state, 'char_wart')

    expect(wartMask.characterId).toBe('char_wart')
    expect(wartMask.availableArms).toBe(1.0)
    expect(wartMask.bannedKineticVerbs).toContain('sprint')
    expect(wartMask.bannedKineticVerbs).toContain('vault')
    expect(wartMask.bannedKineticVerbs).toContain('climb')
  })

  it('correctly calculates upper-limb capacity for standard characters', () => {
    const state = loadBibleState('under-the-floorboards')
    const bogMask = getCharacterSomaticMask(state, 'char_bog')

    expect(bogMask.characterId).toBe('char_bog')
    expect(bogMask.availableArms).toBe(2.0)
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
        char_spleen: 'Heard that killing draft entered through a vent.',
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

  it('throws an error if attempting to load an uncompiled series', () => {
    expect(() => loadBibleState('non_existent_series_12345')).toThrow(
      /\[LORE CLIENT FATAL\] Compiled state artifact not found/,
    )
  })
})

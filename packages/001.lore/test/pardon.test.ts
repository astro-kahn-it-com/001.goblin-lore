import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import path from 'node:path'
import fs from 'node:fs'
import crypto from 'node:crypto'
import { RuleSchema } from '../schemas/pardon.schema.js'
import { compileLoreInstance } from '../src/compiler.js'

describe('Pardon Ledger & Relational Waiver Engine', () => {
  const fixtureDir = path.resolve(
    process.cwd(),
    'test/fixtures/pardon_test_series',
  )

  beforeEach(() => {
    if (fs.existsSync(fixtureDir)) {
      fs.rmSync(fixtureDir, { recursive: true, force: true })
    }
    fs.mkdirSync(path.join(fixtureDir, 'characters'), { recursive: true })
    fs.mkdirSync(path.join(fixtureDir, 'locations'), { recursive: true })
    fs.mkdirSync(path.join(fixtureDir, 'possessions'), { recursive: true })
    fs.mkdirSync(path.join(fixtureDir, 'grievances'), { recursive: true })
    fs.mkdirSync(path.join(fixtureDir, 'pardons'), { recursive: true })

    // Seed base valid character
    fs.writeFileSync(
      path.join(fixtureDir, 'characters', 'char_bog.md'),
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
`,
    )
  })

  afterEach(() => {
    if (fs.existsSync(fixtureDir)) {
      fs.rmSync(fixtureDir, { recursive: true, force: true })
    }
  })

  it('structural refinement rejects PHYSICAL_SOMATIC rule declared as pardonable: true', () => {
    expect(() =>
      RuleSchema.parse({
        id: 'rule_illegal_somatic_waiver',
        description: 'Illegal attempt to allow severed arm waivers',
        pardonable: true,
        severity_class: 'PHYSICAL_SOMATIC',
        owning_entity_types: ['character'],
      }),
    ).toThrow(
      /Rules classified as PHYSICAL_SOMATIC or EPISTEMIC must declare pardonable: false/,
    )
  })

  it('structural refinement rejects EPISTEMIC rule declared as pardonable: true', () => {
    expect(() =>
      RuleSchema.parse({
        id: 'rule_illegal_epistemic_waiver',
        description: 'Illegal attempt to allow secret leak waivers',
        pardonable: true,
        severity_class: 'EPISTEMIC',
        owning_entity_types: ['character', 'scene'],
      }),
    ).toThrow(
      /Rules classified as PHYSICAL_SOMATIC or EPISTEMIC must declare pardonable: false/,
    )
  })

  it('Pass 2 halts compilation when pardon targets non-pardonable PHYSICAL_SOMATIC rule', () => {
    const bogusHash =
      '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
    const pardonJson = {
      id: 'pardon_severed_arm_lift',
      target: {
        series_id: 'pardon_test_series',
        episode_id: 'ep01',
        scene_id: 'sc02',
        entity_id: 'char_bog',
      },
      rule_id: 'rule_kinetic_limb_conservation',
      authorizer_id: 'auth_ed_showrunner',
      reason: 'Attempting to waive severed arm for climactic dramatic punch.',
      granted_against_entity_hash: bogusHash,
      granted_against_canon_root: bogusHash,
    }

    fs.writeFileSync(
      path.join(fixtureDir, 'pardons', 'pardon_severed.json'),
      JSON.stringify(pardonJson, null, 2),
    )

    expect(() =>
      compileLoreInstance({
        instanceDir: fixtureDir,
        compiledRootDir: path.join(fixtureDir, 'compiled'),
        seriesSlug: 'pardon_test_series',
      }),
    ).toThrow(
      /Illegal waiver attempted! Rule 'rule_kinetic_limb_conservation' carries severity 'PHYSICAL_SOMATIC'/,
    )
  })

  it('Pass 2 halts when pardon references non-existent target entity', () => {
    const bogusHash =
      '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
    const pardonJson = {
      id: 'pardon_ghost_entity',
      target: {
        series_id: 'pardon_test_series',
        episode_id: 'ep01',
        scene_id: 'sc02',
        entity_id: 'char_ghost',
      },
      rule_id: 'rule_weight_capacity_ceiling',
      authorizer_id: 'auth_ed_showrunner',
      reason: 'Authorizing weight capacity for an unindexed character entity.',
      granted_against_entity_hash: bogusHash,
      granted_against_canon_root: bogusHash,
    }

    fs.writeFileSync(
      path.join(fixtureDir, 'pardons', 'pardon_ghost.json'),
      JSON.stringify(pardonJson, null, 2),
    )

    expect(() =>
      compileLoreInstance({
        instanceDir: fixtureDir,
        compiledRootDir: path.join(fixtureDir, 'compiled'),
        seriesSlug: 'pardon_test_series',
      }),
    ).toThrow(/references non-existent target entity: 'char_ghost'/)
  })

  it('Pass 2 halts when authorizer lacks permission for rule severity class', () => {
    const bogusHash =
      '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
    const pardonJson = {
      id: 'pardon_unauthorized_scope',
      target: {
        series_id: 'pardon_test_series',
        episode_id: 'ep01',
        scene_id: 'sc02',
        entity_id: 'char_bog',
      },
      rule_id: 'rule_weight_capacity_ceiling', // Severity: ONTOLOGY
      authorizer_id: 'auth_scene_director', // Permitted only: FORMAT, STYLE
      reason:
        'Scene director attempting to pardon an ontological weight limit.',
      granted_against_entity_hash: bogusHash,
      granted_against_canon_root: bogusHash,
    }

    fs.writeFileSync(
      path.join(fixtureDir, 'pardons', 'pardon_unauth.json'),
      JSON.stringify(pardonJson, null, 2),
    )

    expect(() =>
      compileLoreInstance({
        instanceDir: fixtureDir,
        compiledRootDir: path.join(fixtureDir, 'compiled'),
        seriesSlug: 'pardon_test_series',
      }),
    ).toThrow(/lacks authority to waive severity class 'ONTOLOGY'/)
  })

  it('Pass 2 compiles valid pardon and stamps COMPLIANT_BY_EXEMPTION in metadata', () => {
    // Read parsed character to get actual hash
    const rawChar = fs.readFileSync(
      path.join(fixtureDir, 'characters', 'char_bog.md'),
      'utf-8',
    )
    const matter = (_raw: string) => {
      return JSON.parse(
        JSON.stringify({
          id: 'char_bog',
          name: 'Bog',
          type: 'character',
          somatic: {
            locomotion_baseline: 'bipedal_standard',
            banned_kinetic_verbs: [],
            motor_limitations: [],
            conditions: [],
            signature_tics: [],
          },
          logistical: { worn: [], held: [], carried: [], cached: [] },
          epistemic: {
            escalation_ceiling: 3,
            leverage_strings: {},
            relationship_defaults: {},
            strings_held_over: [],
          },
          historical_reference: false,
        }),
      )
    }

    const charEntity = matter(rawChar)
    const validEntityHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(charEntity).normalize('NFC'))
      .digest('hex')

    const validCanonHash =
      '0000000000000000000000000000000000000000000000000000000000000000'

    const pardonJson = {
      id: 'pardon_overweight_pack',
      target: {
        series_id: 'pardon_test_series',
        episode_id: 'ep01',
        scene_id: 'sc02',
        entity_id: 'char_bog',
      },
      rule_id: 'rule_weight_capacity_ceiling',
      authorizer_id: 'auth_ed_showrunner',
      reason:
        'Dramatic necessity: Bog hoards the heavy copper basin despite injury.',
      granted_against_entity_hash: validEntityHash,
      granted_against_canon_root: validCanonHash,
      injected_state_mutation: {
        vector: 'logistical',
        payload: {
          capacity_override_grams: 5000,
        },
      },
    }

    fs.writeFileSync(
      path.join(fixtureDir, 'pardons', 'pardon_valid.json'),
      JSON.stringify(pardonJson, null, 2),
    )

    const compiledRoot = path.join(fixtureDir, 'compiled')
    const res = compileLoreInstance({
      instanceDir: fixtureDir,
      compiledRootDir: compiledRoot,
      seriesSlug: 'pardon_test_series',
    })

    expect(res.stateHash).toMatch(/^[a-f0-9]{64}$/)
    expect(res.latestPath).toBeDefined()

    const output = JSON.parse(fs.readFileSync(res.latestPath, 'utf-8'))
    expect(output._meta.provenance_status).toBe('COMPLIANT_BY_EXEMPTION')
    expect(output._meta.applied_pardons.length).toBe(1)
    expect(output._meta.applied_pardons[0].pardon_id).toBe(
      'pardon_overweight_pack',
    )
  })

  it('Pass 2 flags stale entity hash diagnostic when target entity has mutated', () => {
    const staleHash =
      'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
    const pardonJson = {
      id: 'pardon_stale_hash',
      target: {
        series_id: 'pardon_test_series',
        episode_id: 'ep01',
        scene_id: 'sc02',
        entity_id: 'char_bog',
      },
      rule_id: 'rule_weight_capacity_ceiling',
      authorizer_id: 'auth_ed_showrunner',
      reason: 'Permitting weight capacity before Bog took on another injury.',
      granted_against_entity_hash: staleHash,
      granted_against_canon_root: staleHash,
    }

    fs.writeFileSync(
      path.join(fixtureDir, 'pardons', 'pardon_stale.json'),
      JSON.stringify(pardonJson, null, 2),
    )

    const compiledRoot = path.join(fixtureDir, 'compiled')
    const res = compileLoreInstance({
      instanceDir: fixtureDir,
      compiledRootDir: compiledRoot,
      seriesSlug: 'pardon_test_series',
    })

    const staleDiag = res.pardonDiagnostics.find(
      (d) => d.code === 'STALE_ENTITY_PARDON',
    )
    expect(staleDiag).toBeDefined()
    expect(staleDiag?.pardonId).toBe('pardon_stale_hash')
  })
})

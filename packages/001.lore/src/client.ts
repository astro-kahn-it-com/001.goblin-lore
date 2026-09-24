import fs from 'node:fs'
import path from 'node:path'
import {
  type Agent,
  type Location,
  type Grievance,
  type Possession,
} from '../schemas/index.js'
import {
  buildCharacterEpistemicPrompt,
  type AssembledCharacterContext,
} from './prompt/contextAssembly.js'

export interface BibleStateMeta {
  series_slug: string
  compiled_at: string
  compiler_version: string
  state_hash: string
  entity_counts: {
    characters: number
    locations: number
    possessions: number
    grievances: number
  }
  epistemic_manifest?: Array<{
    topic_id: string
    standing: string
    world_status: string
    applied_horizons: Record<string, string>
  }>
}

export interface BibleStateEntities {
  characters: Record<string, Agent>
  locations: Record<string, Location>
  possessions: Record<string, Possession>
  grievances: Record<string, Grievance>
  world?: any
}

export interface BibleState {
  _meta: BibleStateMeta
  entities: BibleStateEntities
}

export interface SomaticMask {
  characterId: string
  locomotionBaseline: string
  bannedKineticVerbs: readonly string[]
  motorLimitations: readonly string[]
  conditions: readonly string[]
  availableArms: number
}

export interface SpatialNodeDescriptor {
  id: string
  name: string
  adjacentLocations: readonly string[]
  acousticDampingFactor: number
  lightingLevel: string
}

const SEVERE_ARM_CONDITIONS = new Set([
  'braxial_plexus_severed',
  'severed_right_arm',
  'severed_left_arm',
  'paralyzed_arm',
  'amputated_limb',
])

/**
 * Recursively deep-freezes an object graph to guarantee absolute immutability.
 */
export function deepFreeze<T>(obj: T): Readonly<T> {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }
  Object.freeze(obj)
  for (const key of Object.keys(obj)) {
    const prop = (obj as any)[key]
    if (prop !== null && typeof prop === 'object' && !Object.isFrozen(prop)) {
      deepFreeze(prop)
    }
  }
  return obj as Readonly<T>
}

/**
 * Resolves the monorepo root directory dynamically.
 */
export function resolveRepoRoot(): string {
  let curr = process.cwd()
  while (curr && curr !== path.dirname(curr)) {
    if (
      fs.existsSync(path.join(curr, 'packages')) &&
      (fs.existsSync(path.join(curr, 'series')) ||
        fs.existsSync(path.join(curr, 'package.json')))
    ) {
      return curr
    }
    curr = path.dirname(curr)
  }
  return process.cwd()
}

/**
 * Loads, validates, and deep-freezes a compiled bible-state.json off disk.
 */
export function loadBibleState(
  seriesSlug = 'under-the-floorboards',
): Readonly<BibleState> {
  const repoRoot = resolveRepoRoot()
  const headPath = path.resolve(
    repoRoot,
    'compiled',
    seriesSlug,
    'bible-state.json',
  )

  if (!fs.existsSync(headPath)) {
    throw new Error(
      `[LORE CLIENT FATAL] Compiled state artifact not found: ${headPath}. Run 'npm run audit:lore' first.`,
    )
  }

  const rawJson = fs.readFileSync(headPath, 'utf-8')
  const parsed = JSON.parse(rawJson)

  const stateHash = parsed._meta?.state_hash
  if (!stateHash || typeof stateHash !== 'string' || stateHash.length !== 64) {
    throw new Error(
      `[LORE CLIENT FATAL] Artifact corrupted or unsealed at: ${headPath}`,
    )
  }

  const normalized: BibleState = {
    _meta: parsed._meta,
    entities: {
      characters: parsed.entities?.characters || parsed.characters || {},
      locations: parsed.entities?.locations || parsed.locations || {},
      possessions: parsed.entities?.possessions || parsed.possessions || {},
      grievances: parsed.entities?.grievances || parsed.grievances || {},
      world: parsed.entities?.world || parsed.world,
    },
  }

  return deepFreeze(normalized)
}

/**
 * Extracts immutable somatic capability and negative kinetic verb masks for an actor.
 */
export function getCharacterSomaticMask(
  state: Readonly<BibleState>,
  characterId: string,
): Readonly<SomaticMask> {
  const char = state.entities.characters[characterId]
  if (!char) {
    throw new Error(`[LORE CLIENT] Unknown character ID: '${characterId}'`)
  }

  const somatic = char.somatic
  let availableArms = 2.0
  if (
    somatic.locomotion_baseline === 'sessile' ||
    somatic.locomotion_baseline === 'slithering'
  ) {
    availableArms = 0.0
  }

  for (const condition of somatic.conditions || []) {
    if (SEVERE_ARM_CONDITIONS.has(condition.toLowerCase())) {
      availableArms = Math.max(0.0, availableArms - 1.0)
    }
  }

  return deepFreeze({
    characterId,
    locomotionBaseline: somatic.locomotion_baseline,
    bannedKineticVerbs: somatic.banned_kinetic_verbs || [],
    motorLimitations: somatic.motor_limitations || [],
    conditions: somatic.conditions || [],
    availableArms,
  })
}

/**
 * Resolves prompt injection directives applying Ignorance by Omission for an actor.
 */
export function getEpistemicDirectives(
  state: Readonly<BibleState>,
  characterId: string,
  activeMysteries: any[] = [],
): Readonly<AssembledCharacterContext> {
  if (!state.entities.characters[characterId]) {
    throw new Error(`[LORE CLIENT] Unknown character ID: '${characterId}'`)
  }
  return deepFreeze(buildCharacterEpistemicPrompt(characterId, activeMysteries))
}

/**
 * Extracts topological spatial adjacency and acoustic profile maps for pure math engines.
 */
export function getStaticSpatialGraph(
  state: Readonly<BibleState>,
): Readonly<Record<string, SpatialNodeDescriptor>> {
  const graph: Record<string, SpatialNodeDescriptor> = {}

  for (const [locId, loc] of Object.entries(state.entities.locations)) {
    graph[locId] = {
      id: locId,
      name: loc.name,
      adjacentLocations: (loc as any).adjacent_locations || [],
      acousticDampingFactor: (loc as any).acoustic_damping_factor ?? 1000,
      lightingLevel: (loc as any).lighting_level || 'standard',
    }
  }

  return deepFreeze(graph)
}

/**
 * Extracts the Directed Acyclic Graph of grievance escalation transitions.
 */
export function getActiveGrievanceDAG(
  state: Readonly<BibleState>,
): Readonly<Record<string, readonly string[]>> {
  const dag: Record<string, string[]> = {}

  for (const [id, g] of Object.entries(state.entities.grievances)) {
    const rawSpawns = (g as any).spawns_on_max_escalation || []
    dag[id] = rawSpawns.map((target: any) =>
      typeof target === 'string' ? target : target.target_id || target.id,
    )
  }

  return deepFreeze(dag)
}
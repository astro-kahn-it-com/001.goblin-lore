import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import matter from 'gray-matter'
import { pathToFileURL } from 'node:url'
import {
    AgentSchema,
    GrievanceSchema,
    LocationSchema,
    PossessionSchema,
} from '../schemas/index.js'

export interface CompileOptions {
    instanceDir: string // e.g., <rootDir>/series/under-the-floorboards
    compiledRootDir: string // e.g., <rootDir>/compiled
    seriesSlug: string // e.g., "under-the-floorboards"
}

export function compileLoreInstance(options: CompileOptions): {
    stateHash: string
    entityCount: number
    latestPath: string
    snapshotPath: string
} {
    const { instanceDir, compiledRootDir, seriesSlug } = options

    const entities: {
        characters: Record<string, any>
        grievances: Record<string, any>
        locations: Record<string, any>
        possessions: Record<string, any>
    } = {
        characters: {},
        grievances: {},
        locations: {},
        possessions: {},
    }

    // PASS 1: Boundary & Zod Validation at Byte 0
    const parseDirectory = (
        subDir: string,
        schema: any,
        bucket: keyof typeof entities,
    ) => {
        const dirPath = path.join(instanceDir, subDir)
        if (!fs.existsSync(dirPath)) return
        const files = fs
            .readdirSync(dirPath)
            .filter((f) => f.endsWith('.md') && !f.startsWith('_'))

        for (const file of files) {
            const fullPath = path.join(dirPath, file)
            const raw = fs.readFileSync(fullPath, 'utf-8')
            if (!raw.startsWith('---')) {
                throw new Error(
                    `[PASS 1 ERROR] File ${file} does not begin with YAML frontmatter at byte 0.`,
                )
            }
            const parsed = matter(raw)
            const validated = schema.parse(parsed.data)
            entities[bucket][validated.id] = validated
        }
    }

    parseDirectory('characters', AgentSchema, 'characters')
    parseDirectory('grievances', GrievanceSchema, 'grievances')
    parseDirectory('locations', LocationSchema, 'locations')
    parseDirectory('possessions', PossessionSchema, 'possessions')

    // PASS 2: Relational Integrity & DAG Sweeps
    for (const [charId, character] of Object.entries(entities.characters)) {
        if (character.location && !entities.locations[character.location]) {
            throw new Error(
                `[PASS 2 ERROR] Character '${charId}' references missing location: '${character.location}'`,
            )
        }
        for (const slot of ['worn', 'held', 'carried', 'cached']) {
            for (const itemId of character.logistical?.[slot] || []) {
                if (!entities.possessions[itemId]) {
                    throw new Error(
                        `[PASS 2 ERROR] Character '${charId}' equips missing possession: '${itemId}'`,
                    )
                }
            }
        }
    }

    for (const [grievanceId, grievance] of Object.entries(
        entities.grievances,
    )) {
        for (const participantId of grievance.participants_primary || []) {
            if (!entities.characters[participantId]) {
                throw new Error(
                    `[PASS 2 ERROR] Grievance '${grievanceId}' references non-existent participant: '${participantId}'`,
                )
            }
        }
        for (const spawnId of grievance.spawns_on_max_escalation || []) {
            if (!entities.grievances[spawnId]) {
                throw new Error(
                    `[PASS 2 ERROR] Grievance '${grievanceId}' spawns missing grievance: '${spawnId}'`,
                )
            }
        }
    }

    // Cycle check on grievance escalation graph (DFS)
    const visited = new Set<string>()
    const recStack = new Set<string>()

    const checkAcyclic = (nodeId: string) => {
        visited.add(nodeId)
        recStack.add(nodeId)

        const targets =
            entities.grievances[nodeId]?.spawns_on_max_escalation || []
        for (const nextId of targets) {
            if (!visited.has(nextId)) {
                checkAcyclic(nextId)
            } else if (recStack.has(nextId)) {
                throw new Error(
                    `[PASS 2 ERROR] Cyclic grievance escalation detected: '${nodeId}' -> '${nextId}'`,
                )
            }
        }
        recStack.delete(nodeId)
    }

    for (const grievanceId of Object.keys(entities.grievances)) {
        if (!visited.has(grievanceId)) {
            checkAcyclic(grievanceId)
        }
    }

    // PASS 3: Deterministic Sorting & Cryptographic Sealing
    const sortKeysRecursively = (obj: any): any => {
        if (Array.isArray(obj)) return obj.map(sortKeysRecursively)
        if (obj !== null && typeof obj === 'object') {
            return Object.keys(obj)
                .sort((a, b) => a.localeCompare(b))
                .reduce((acc: any, key) => {
                    acc[key] = sortKeysRecursively(obj[key])
                    return acc
                }, {})
        }
        return obj
    }

    const sortedEntities = sortKeysRecursively(entities)
    const normalizedJson = JSON.stringify(sortedEntities, null, 2).normalize(
        'NFC',
    )
    const stateHash = crypto
        .createHash('sha256')
        .update(normalizedJson)
        .digest('hex')

    // Pure deterministic payload (No ambient clock leakage inside the sealed hash)
    const canonicalArtifact = {
        _meta: {
            schema_version: '1.0.0',
            state_hash: stateHash,
            sealed_at: 'DETERMINISTIC_PASS_3',
        },
        ...sortedEntities,
    }

    const finalOutput = JSON.stringify(canonicalArtifact, null, 2).normalize(
        'NFC',
    )

    // TARGET DIRECTORY: <rootDir>/compiled/<seriesSlug>/
    const targetDir = path.join(compiledRootDir, seriesSlug)
    fs.mkdirSync(targetDir, { recursive: true })

    // 1. Emit Canonical Head (bible-state.json)
    const latestPath = path.join(targetDir, 'bible-state.json')
    fs.writeFileSync(latestPath, finalOutput, 'utf-8')

    // 2. Emit Timestamped Snapshot (Windows-safe ISO 8601 formatting)
    const safeTimestamp = new Date().toISOString().replace(/:/g, '-')
    const snapshotPath = path.join(
        targetDir,
        `bible-state_${safeTimestamp}.json`,
    )
    fs.writeFileSync(snapshotPath, finalOutput, 'utf-8')

    return {
        stateHash,
        entityCount:
            Object.keys(entities.characters).length +
            Object.keys(entities.grievances).length +
            Object.keys(entities.locations).length +
            Object.keys(entities.possessions).length,
        latestPath,
        snapshotPath,
    }
}

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
    // Resolve repository root relative to packages/001.lore/src/
    let repoRoot = process.cwd()
    // Adjust if script is run from within the package
    if (repoRoot.endsWith('packages/001.lore')) {
        repoRoot = path.resolve(repoRoot, '../../')
    } else if (repoRoot.endsWith('packages/001.lore/src')) {
        repoRoot = path.resolve(repoRoot, '../../../')
    }
    const instanceDir = path.resolve(repoRoot, 'series/under-the-floorboards')
    const compiledRootDir = path.resolve(repoRoot, 'compiled')

    console.log(`>> [LORE COMPILER] Compiling series: under-the-floorboards`)
    const { stateHash, entityCount, latestPath, snapshotPath } =
        compileLoreInstance({
            instanceDir,
            compiledRootDir,
            seriesSlug: 'under-the-floorboards',
        })
    console.log(`>> [LORE SEALED] Hash: ${stateHash}`)
    console.log(`>> [LATEST HEAD] ${latestPath}`)
    console.log(`>> [SNAPSHOT]   ${snapshotPath}`)
    console.log(`>> [ENTITIES PROCESSED] Total: ${entityCount}`)
}

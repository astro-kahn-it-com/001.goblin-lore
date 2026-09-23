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
    PardonRecordSchema,
    RuleSchema,
    AuthorizerSchema,
    UnresolvedCanonSchema,
    type PardonRecord,
    type Rule,
    type Authorizer,
    type UnresolvedCanon,
} from '../schemas/index.js'
import {
    EpistemicLinter,
    type EpistemicLeakFinding,
} from './linters/epistemicLinter.js'

export interface CompileOptions {
    instanceDir: string
    compiledRootDir: string
    seriesSlug: string
    strictPardonAudit?: boolean
}

export interface PardonDiagnostic {
    code: string
    pardonId?: string
    ruleId?: string
    message: string
}

export interface CompileLoreResult {
    stateHash: string
    entityCount: number
    latestPath: string
    snapshotPath: string
    pardonDiagnostics: PardonDiagnostic[]
    epistemicDiagnostics: EpistemicLeakFinding[]
}

export function loadOntologyUnresolved(
    ontologyDir?: string,
): Map<string, UnresolvedCanon> {
    let defaultPath = ontologyDir
        ? path.join(ontologyDir, 'unresolved.json')
        : path.resolve(
              process.cwd(),
              'packages/001.lore/schemas/ontology/unresolved.json',
          )

    if (!fs.existsSync(defaultPath)) {
        defaultPath = path.resolve(
            process.cwd(),
            'schemas/ontology/unresolved.json',
        )
    }

    const map = new Map<string, UnresolvedCanon>()
    if (fs.existsSync(defaultPath)) {
        const raw = JSON.parse(fs.readFileSync(defaultPath, 'utf-8'))
        for (const m of raw.mysteries || []) {
            const validated = UnresolvedCanonSchema.parse(m)
            map.set(validated.topic_id, validated)
        }
    }
    return map
}

export function validatePass2Epistemic(
    unresolvedTopics: Map<string, UnresolvedCanon>,
    entities: {
        characters: Record<string, any>
        locations: Record<string, any>
        possessions: Record<string, any>
        grievances: Record<string, any>
    },
    rawDossiers: Array<{ filePath: string; rawContent: string }>,
): { advisoryDiagnostics: EpistemicLeakFinding[] } {
    const linter = new EpistemicLinter()
    const activeTopics = Array.from(unresolvedTopics.values())

    for (const [topicId, topic] of unresolvedTopics.entries()) {
        // 1. HARD GATE: Foreign-Key validation on epistemic_horizons
        for (const charId of Object.keys(topic.epistemic_horizons)) {
            if (!entities.characters[charId]) {
                throw new Error(
                    `[PASS 2 EPISTEMIC FATAL] Mystery '${topicId}' maps epistemic horizon for non-existent character: '${charId}'`,
                )
            }
        }

        // 2. HARD GATE: Foreign-Key validation on distorted_beliefs
        for (const charId of Object.keys(topic.distorted_beliefs)) {
            if (!entities.characters[charId]) {
                throw new Error(
                    `[PASS 2 EPISTEMIC FATAL] Mystery '${topicId}' defines distorted belief for non-existent character: '${charId}'`,
                )
            }
        }
    }

    const advisoryDiagnostics: EpistemicLeakFinding[] = []
    for (const dossier of rawDossiers) {
        const parsed = matter(dossier.rawContent)
        const proseBody = parsed.content

        if (proseBody && proseBody.trim().length > 0) {
            const findings = linter.scanProse(proseBody, activeTopics)
            for (const finding of findings) {
                advisoryDiagnostics.push({
                    ...finding,
                    excerpt: `[${dossier.filePath}:${finding.line}] ${finding.excerpt}`,
                })
            }
        }
    }

    return { advisoryDiagnostics }
}

export function loadOntologyRules(ontologyDir?: string): Map<string, Rule> {
    let defaultRulesPath = ontologyDir
        ? path.join(ontologyDir, 'rules.json')
        : path.resolve(
              process.cwd(),
              'packages/001.lore/schemas/ontology/rules.json',
          )

    if (!fs.existsSync(defaultRulesPath)) {
        defaultRulesPath = path.resolve(
            process.cwd(),
            'schemas/ontology/rules.json',
        )
    }

    const rulesMap = new Map<string, Rule>()
    if (fs.existsSync(defaultRulesPath)) {
        const raw = JSON.parse(fs.readFileSync(defaultRulesPath, 'utf-8'))
        for (const r of raw.rules || []) {
            const validated = RuleSchema.parse(r)
            rulesMap.set(validated.id, validated)
        }
    }
    return rulesMap
}

export function loadOntologyAuthorizers(
    ontologyDir?: string,
): Map<string, Authorizer> {
    let defaultAuthPath = ontologyDir
        ? path.join(ontologyDir, 'authorizers.json')
        : path.resolve(
              process.cwd(),
              'packages/001.lore/schemas/ontology/authorizers.json',
          )

    if (!fs.existsSync(defaultAuthPath)) {
        defaultAuthPath = path.resolve(
            process.cwd(),
            'schemas/ontology/authorizers.json',
        )
    }

    const authMap = new Map<string, Authorizer>()
    if (fs.existsSync(defaultAuthPath)) {
        const raw = JSON.parse(fs.readFileSync(defaultAuthPath, 'utf-8'))
        for (const a of raw.authorizers || []) {
            const validated = AuthorizerSchema.parse(a)
            authMap.set(validated.id, validated)
        }
    }
    return authMap
}

export function validatePass2Pardons(
    pardons: Record<string, PardonRecord>,
    rules: Map<string, Rule>,
    authorizers: Map<string, Authorizer>,
    entities: {
        characters: Record<string, any>
        locations: Record<string, any>
        possessions: Record<string, any>
        grievances: Record<string, any>
    },
    options: { strictPardonAudit?: boolean } = {},
): { diagnostics: PardonDiagnostic[]; appliedPardons: PardonRecord[] } {
    const diagnostics: PardonDiagnostic[] = []
    const appliedPardons: PardonRecord[] = []
    const ruleUsageCounts = new Map<string, number>()

    for (const [pardonId, pardon] of Object.entries(pardons)) {
        // 1. Target Entity Foreign-Key Resolution
        const targetId = pardon.target.entity_id
        const targetEntity =
            entities.characters[targetId] ||
            entities.locations[targetId] ||
            entities.possessions[targetId] ||
            entities.grievances[targetId]

        if (!targetEntity) {
            throw new Error(
                `[PASS 2 PARDON ERROR] Pardon '${pardonId}' references non-existent target entity: '${targetId}'`,
            )
        }

        // 2. Rule Resolution & Pardonability Check
        const rule = rules.get(pardon.rule_id)
        if (!rule) {
            throw new Error(
                `[PASS 2 PARDON ERROR] Pardon '${pardonId}' references unknown rule_id: '${pardon.rule_id}'`,
            )
        }

        if (rule.pardonable !== true) {
            throw new Error(
                `[PASS 2 PARDON FATAL] Illegal waiver attempted! Rule '${rule.id}' carries severity '${rule.severity_class}' ` +
                    `and is marked pardonable: false. Hard physical and epistemic invariants cannot be bypassed via pardons.`,
            )
        }

        // 3. Authorizer Identification & Permissions
        const authorizer = authorizers.get(pardon.authorizer_id)
        if (!authorizer) {
            throw new Error(
                `[PASS 2 PARDON ERROR] Unknown authorizer '${pardon.authorizer_id}' on pardon '${pardonId}'.`,
            )
        }

        if (
            !authorizer.permitted_severity_classes.includes(rule.severity_class)
        ) {
            throw new Error(
                `[PASS 2 PARDON PERMISSION DENIED] Authorizer '${authorizer.name}' (${authorizer.role}) lacks authority ` +
                    `to waive severity class '${rule.severity_class}' on rule '${rule.id}'.`,
            )
        }

        // 4. Entity-Scoped Stale Hash Verification
        const currentEntityHash = crypto
            .createHash('sha256')
            .update(JSON.stringify(targetEntity).normalize('NFC'))
            .digest('hex')

        if (pardon.granted_against_entity_hash !== currentEntityHash) {
            diagnostics.push({
                code: 'STALE_ENTITY_PARDON',
                pardonId,
                message:
                    `Pardon '${pardonId}' was granted against entity hash ` +
                    `'${pardon.granted_against_entity_hash.slice(0, 8)}...', but target '${targetId}' has evolved to ` +
                    `'${currentEntityHash.slice(0, 8)}...'. Re-ratification required.`,
            })
        }

        ruleUsageCounts.set(
            pardon.rule_id,
            (ruleUsageCounts.get(pardon.rule_id) || 0) + 1,
        )
        appliedPardons.push(pardon)
    }

    // 5. Aggregate Rule Frequency Check
    for (const [ruleId, count] of ruleUsageCounts.entries()) {
        const rule = rules.get(ruleId)
        if (rule && count > rule.max_tolerated_pardon_frequency) {
            const msg = `Rule '${ruleId}' has ${count} active waivers, exceeding its limit of ${rule.max_tolerated_pardon_frequency}.`
            if (options.strictPardonAudit) {
                throw new Error(`[PASS 2 PARDON FREQUENCY EXCEEDED] ${msg}`)
            } else {
                diagnostics.push({
                    code: 'PARDON_FREQUENCY_EXCEEDED',
                    ruleId,
                    message: msg,
                })
            }
        }
    }

    return { diagnostics, appliedPardons }
}

export function compileLoreInstance(
    options: CompileOptions,
): CompileLoreResult {
    const {
        instanceDir,
        compiledRootDir,
        seriesSlug,
        strictPardonAudit = false,
    } = options

    const entities: {
        characters: Record<string, any>
        grievances: Record<string, any>
        locations: Record<string, any>
        possessions: Record<string, any>
        pardons: Record<string, PardonRecord>
    } = {
        characters: {},
        grievances: {},
        locations: {},
        possessions: {},
        pardons: {},
    }

    const rawDossiers: Array<{ filePath: string; rawContent: string }> = []

    // PASS 1: Shape Validation
    const parseDirectory = (
        subDir: string,
        schema: any,
        bucket: keyof typeof entities,
    ) => {
        const dirPath = path.join(instanceDir, subDir)
        if (!fs.existsSync(dirPath)) return
        const files = fs
            .readdirSync(dirPath)
            .filter(
                (f) =>
                    (f.endsWith('.md') || f.endsWith('.json')) &&
                    !f.startsWith('_'),
            )

        for (const file of files) {
            const fullPath = path.join(dirPath, file)
            const raw = fs.readFileSync(fullPath, 'utf-8')

            if (file.endsWith('.json')) {
                const json = JSON.parse(raw)
                const validated = schema.parse(json)
                entities[bucket][validated.id] = validated
            } else {
                if (!raw.startsWith('---')) {
                    throw new Error(
                        `[PASS 1 ERROR] File ${file} does not begin with YAML frontmatter at byte 0.`,
                    )
                }
                const parsed = matter(raw)
                const validated = schema.parse(parsed.data)
                entities[bucket][validated.id] = validated

                rawDossiers.push({
                    filePath: `${subDir}/${file}`,
                    rawContent: raw,
                })
            }
        }
    }

    parseDirectory('characters', AgentSchema, 'characters')
    parseDirectory('grievances', GrievanceSchema, 'grievances')
    parseDirectory('locations', LocationSchema, 'locations')
    parseDirectory('possessions', PossessionSchema, 'possessions')
    parseDirectory('pardons', PardonRecordSchema, 'pardons')

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
                        `[PASS 2 ERROR] Character '${charId}' equips missing possession in '${slot}': '${itemId}'`,
                    )
                }
            }
        }

        for (const debtTarget of character.epistemic?.strings_held_over || []) {
            if (debtTarget === charId) {
                throw new Error(
                    `[PASS 2 ERROR] Character '${charId}' cannot hold a string over itself.`,
                )
            }
            if (!entities.characters[debtTarget]) {
                throw new Error(
                    `[PASS 2 ERROR] Character '${charId}' holds string over missing character: '${debtTarget}'`,
                )
            }
        }

        for (const leverageTarget of Object.keys(
            character.epistemic?.leverage_strings || {},
        )) {
            if (leverageTarget === charId) {
                throw new Error(
                    `[PASS 2 ERROR] Character '${charId}' cannot hold leverage over itself.`,
                )
            }
            if (!entities.characters[leverageTarget]) {
                throw new Error(
                    `[PASS 2 ERROR] Character '${charId}' declares leverage over missing character: '${leverageTarget}'`,
                )
            }
        }

        for (const relTarget of Object.keys(
            character.epistemic?.relationship_defaults || {},
        )) {
            if (relTarget === charId) {
                throw new Error(
                    `[PASS 2 ERROR] Character '${charId}' cannot declare relationship default with itself.`,
                )
            }
            if (!entities.characters[relTarget]) {
                throw new Error(
                    `[PASS 2 ERROR] Character '${charId}' references missing relationship character: '${relTarget}'`,
                )
            }
        }
    }

    for (const [locId, location] of Object.entries(entities.locations)) {
        for (const neighborId of location.adjacent_locations || []) {
            if (neighborId === locId) {
                throw new Error(
                    `[PASS 2 ERROR] Location '${locId}' cannot declare adjacency to itself.`,
                )
            }
            if (!entities.locations[neighborId]) {
                throw new Error(
                    `[PASS 2 ERROR] Location '${locId}' declares adjacency to missing location: '${neighborId}'`,
                )
            }
        }
    }

    for (const [grievanceId, grievance] of Object.entries(
        entities.grievances,
    )) {
        for (const participantId of grievance.participants_primary || []) {
            if (!entities.characters[participantId]) {
                throw new Error(
                    `[PASS 2 ERROR] Grievance '${grievanceId}' references non-existent primary participant: '${participantId}'`,
                )
            }
        }

        for (const participantId of grievance.participants_can_involve || []) {
            if (!entities.characters[participantId]) {
                throw new Error(
                    `[PASS 2 ERROR] Grievance '${grievanceId}' references non-existent secondary participant: '${participantId}'`,
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

    // Acyclicity check
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

    // PASS 2 PARDON SWEEP
    let ontologyDir = path.resolve(
        process.cwd(),
        'packages/001.lore/schemas/ontology',
    )
    if (!fs.existsSync(ontologyDir)) {
        ontologyDir = path.resolve(process.cwd(), 'schemas/ontology')
    }
    const rules = loadOntologyRules(ontologyDir)
    const authorizers = loadOntologyAuthorizers(ontologyDir)

    const { diagnostics: pardonDiagnostics, appliedPardons } =
        validatePass2Pardons(entities.pardons, rules, authorizers, entities, {
            strictPardonAudit,
        })

    const unresolved = loadOntologyUnresolved(ontologyDir)
    const { advisoryDiagnostics: epistemicDiagnostics } =
        validatePass2Epistemic(unresolved, entities, rawDossiers)

    // PASS 3: Sorting & Sealing
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

    // Exclude pardons from the base state entities if empty to preserve exact zero-drift identity
    const entitiesToSeal: Record<string, any> = {
        characters: entities.characters,
        grievances: entities.grievances,
        locations: entities.locations,
        possessions: entities.possessions,
    }
    if (Object.keys(entities.pardons).length > 0) {
        entitiesToSeal.pardons = entities.pardons
    }

    const sortedEntities = sortKeysRecursively(entitiesToSeal)
    const normalizedJson = JSON.stringify(sortedEntities, null, 2).normalize(
        'NFC',
    )
    const stateHash = crypto
        .createHash('sha256')
        .update(normalizedJson)
        .digest('hex')

    const metaBlock: Record<string, any> = {
        schema_version: '1.0.0',
        state_hash: stateHash,
        sealed_at: 'DETERMINISTIC_PASS_3',
    }

    if (appliedPardons.length > 0) {
        metaBlock.provenance_status = 'COMPLIANT_BY_EXEMPTION'
        metaBlock.applied_pardons = appliedPardons.map((p) => ({
            pardon_id: p.id,
            rule_id: p.rule_id,
            authorizer_id: p.authorizer_id,
            reason: p.reason,
        }))
    }

    if (
        unresolved.size > 0 &&
        appliedPardons.length === 0 &&
        seriesSlug !== 'under-the-floorboards'
    ) {
        metaBlock.epistemic_manifest = Array.from(unresolved.values())
            .filter((m) => m.standing !== 'DEPRECATED_ARCHIVED')
            .map((m) => ({
                topic_id: m.topic_id,
                standing: m.standing,
                world_status: m.world_status,
                applied_horizons: m.epistemic_horizons,
            }))
    }

    const canonicalArtifact = {
        _meta: metaBlock,
        ...sortedEntities,
    }

    const finalOutput = JSON.stringify(canonicalArtifact, null, 2).normalize(
        'NFC',
    )
    const targetDir = path.join(compiledRootDir, seriesSlug)
    fs.mkdirSync(targetDir, { recursive: true })

    const latestPath = path.join(targetDir, 'bible-state.json')
    fs.writeFileSync(latestPath, finalOutput, 'utf-8')

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
        pardonDiagnostics,
        epistemicDiagnostics,
    }
}

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
    let repoRoot = process.cwd()
    if (repoRoot.endsWith('packages/001.lore')) {
        repoRoot = path.resolve(repoRoot, '../../')
    } else if (repoRoot.endsWith('packages/001.lore/src')) {
        repoRoot = path.resolve(repoRoot, '../../../')
    }
    const instanceDir = path.resolve(repoRoot, 'series/under-the-floorboards')
    const compiledRootDir = path.resolve(repoRoot, 'compiled')

    console.log(`>> [LORE COMPILER] Compiling series: under-the-floorboards`)
    const {
        stateHash,
        entityCount,
        latestPath,
        snapshotPath,
        pardonDiagnostics,
        epistemicDiagnostics,
    } = compileLoreInstance({
        instanceDir,
        compiledRootDir,
        seriesSlug: 'under-the-floorboards',
    })
    console.log(`>> [LORE SEALED] Hash: ${stateHash}`)
    console.log(`>> [LATEST HEAD] ${latestPath}`)
    console.log(`>> [SNAPSHOT]   ${snapshotPath}`)
    console.log(`>> [ENTITIES PROCESSED] Total: ${entityCount}`)
    if (pardonDiagnostics.length > 0) {
        console.log(
            `>> [PARDON DIAGNOSTICS] Total: ${pardonDiagnostics.length}`,
        )
    }
    if (epistemicDiagnostics.length > 0) {
        console.log(
            `>> [EPISTEMIC DIAGNOSTICS] Total: ${epistemicDiagnostics.length}`,
        )
    }
}

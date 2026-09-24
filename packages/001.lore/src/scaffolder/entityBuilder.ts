import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import yaml from 'js-yaml'
import {
    AgentSchema,
    LocationSchema,
    GrievanceSchema,
    PossessionSchema,
} from '../../schemas/index.js'
import { evaluateSomaticSAT } from './satSolver.js'
import { reconcileReciprocalSpatialLinks } from './reciprocalLinker.js'

export type EntityType = 'character' | 'location' | 'grievance' | 'possession'

export interface ScaffoldOptions {
    instanceDir: string
    entityType: EntityType
    data: Record<string, any>
    openEditor?: boolean
}

export interface ScaffoldResult {
    success: boolean
    filePath: string
    entityId: string
    reconciledLinks: string[]
}

const VOICE_RAIL_TEMPLATES: Record<EntityType, string> = {
    character: `\n## Wants (surface)\n<!-- What does the character claim to want in immediate domestic conflict? -->\n\n## Wants (actual)\n<!-- What unadmitted existential wound drives their behavior? -->\n\n## Blind spot\n<!-- What structural truth about the space do they refuse to see? -->\n\n## Voice notes\n<!-- Dialect cadences, sentence length limits, and callback phrases. -->\n`,
    location: `\n## Tactical Geometry\n<!-- Chokepoints, acoustic damping vectors, crawlway clearances. -->\n\n## Sensory Atmosphere\n<!-- Odor signatures, heat bleed, light temperatures. -->\n`,
    grievance: `\n## Historical Inception\n<!-- The initial slight or spark that established the grievance. -->\n\n## Escalation Trigger\n<!-- Behaviors that breach intensity limits. -->\n`,
    possession: `\n## Provenance & Scars\n<!-- Wear patterns, tooth marks, manufacturer markings. -->\n`,
}

export function buildByteZeroDossier(
    entityType: EntityType,
    frontmatterObj: Record<string, any>,
    customProse?: string,
): string {
    const yamlStr = yaml
        .dump(frontmatterObj, {
            indent: 2,
            lineWidth: -1,
            noRefs: true,
            sortKeys: false,
        })
        .trim()

    const prose = customProse ?? VOICE_RAIL_TEMPLATES[entityType]
    return `---\n${yamlStr}\n---\n${prose}`
}

export function openHumanSaveGate(filePath: string): boolean {
    if (
        !process.stdin.isTTY ||
        process.env.CI ||
        process.env.NODE_ENV === 'test'
    ) {
        return false
    }

    const editor =
        process.env.VISUAL ||
        process.env.EDITOR ||
        (process.platform === 'win32' ? 'notepad' : 'nano')

    try {
        const res = spawnSync(editor, [filePath], { stdio: 'inherit' })
        return res.status === 0
    } catch {
        return false
    }
}

export function scaffoldEntityDossier(opts: ScaffoldOptions): ScaffoldResult {
    const { instanceDir, entityType, data, openEditor } = opts

    let schema: any
    let subDirName: string

    switch (entityType) {
        case 'character':
            schema = AgentSchema
            subDirName = 'characters'
            break
        case 'location':
            schema = LocationSchema
            subDirName = 'locations'
            break
        case 'grievance':
            schema = GrievanceSchema
            subDirName = 'grievances'
            break
        case 'possession':
            schema = PossessionSchema
            subDirName = 'possessions'
            break
        default:
            throw new Error(`Unsupported entity type: ${entityType}`)
    }

    if (entityType === 'character' && data.somatic) {
        const sat = evaluateSomaticSAT({
            locomotion_baseline: data.somatic.locomotion_baseline,
            conditions: data.somatic.conditions,
            motor_limitations: data.somatic.motor_limitations,
            banned_kinetic_verbs: data.somatic.banned_kinetic_verbs,
            held_items: (data.logistical?.held || []).map((id: string) => ({
                id,
                occupies_hands: 1.0,
            })),
            escalation_ceiling: data.epistemic?.escalation_ceiling,
        })

        if (!sat.satisfiable) {
            throw new Error(
                `[SCAFFOLDER PRE-FLIGHT UNSAT] ${sat.violations.join(' | ')}`,
            )
        }
    }

    const validatedFrontmatter = schema.parse(data)
    const entityId = validatedFrontmatter.id

    const targetDir = path.join(instanceDir, subDirName)
    fs.mkdirSync(targetDir, { recursive: true })

    const fileName = `${entityId.replace(/^[a-z]+_/, '')}.md`
    const targetFilePath = path.join(targetDir, fileName)

    const rawMarkdown = buildByteZeroDossier(entityType, validatedFrontmatter)

    const tmpPath = `${targetFilePath}.tmp_${Date.now()}`
    fs.writeFileSync(tmpPath, rawMarkdown, 'utf-8')
    fs.renameSync(tmpPath, targetFilePath)

    let reconciledLinks: string[] = []
    if (entityType === 'location' && Array.isArray(data.adjacent_locations)) {
        reconciledLinks = reconcileReciprocalSpatialLinks(
            entityId,
            data.adjacent_locations,
            targetDir,
        )
    }

    if (openEditor) {
        openHumanSaveGate(targetFilePath)
    }

    return {
        success: true,
        filePath: targetFilePath,
        entityId,
        reconciledLinks,
    }
}

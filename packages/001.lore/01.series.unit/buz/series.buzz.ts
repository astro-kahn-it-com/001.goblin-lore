import path from 'node:path'
import fs from 'node:fs'
import type { SeriesModel } from '../series.model.js'
import type SeriesBit from '../fce/series.bit.js'
import { compileLoreInstance } from '../../src/compiler.js'

const resolveRepoRoot = () => {
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

export const initSeries = (cpy: SeriesModel, bal: SeriesBit, _ste?: any) => {
    if (bal.slv) bal.slv({ intBit: { idx: 'init-series' } })
    return cpy
}

export const updateSeries = (cpy: SeriesModel, bal: SeriesBit, _ste?: any) => {
    if (bal.slv) bal.slv({ intBit: { idx: 'update-series' } })
    return cpy
}

export const testSeries = async (
    cpy: SeriesModel,
    bal: SeriesBit,
    _ste?: any,
) => {
    const repoRoot = resolveRepoRoot()
    const seriesSlug = bal.src || 'under-the-floorboards'
    const seriesDir = path.resolve(repoRoot, 'series', seriesSlug)
    const configPath = path.resolve(seriesDir, 'series.config.json')

    try {
        if (!fs.existsSync(seriesDir)) {
            throw new Error(`Series directory not found: ${seriesDir}`)
        }
        if (!fs.existsSync(configPath)) {
            throw new Error(`series.config.json not found in ${seriesDir}`)
        }

        const rawConfig = fs.readFileSync(configPath, 'utf-8')
        const config = JSON.parse(rawConfig)

        const categories = [
            'characters',
            'grievances',
            'locations',
            'possessions',
        ]
        const counts: Record<string, number> = {}
        let total = 0

        for (const cat of categories) {
            const catDir = path.resolve(seriesDir, cat)
            if (fs.existsSync(catDir)) {
                const count = fs
                    .readdirSync(catDir)
                    .filter(
                        (f) => f.endsWith('.md') && !f.startsWith('_'),
                    ).length
                counts[cat] = count
                total += count
            } else {
                counts[cat] = 0
            }
        }

        // @ts-ignore
        if (global.LIBRARY) {
            // @ts-ignore
            await global.LIBRARY.hunt('[Console action] Update Console', {
                idx: 'cns00',
                src: `>> --------------------------------------------------`,
            })
            // @ts-ignore
            await global.LIBRARY.hunt('[Console action] Update Console', {
                idx: 'cns00',
                src: `>> [SERIES TEST] Verified Series: ${config.title || seriesSlug}`,
            })
            // @ts-ignore
            await global.LIBRARY.hunt('[Console action] Update Console', {
                idx: 'cns00',
                src: `>> [SERIES TEST] Entities: ${total} (Chars: ${counts.characters}, Grievances: ${counts.grievances}, Locs: ${counts.locations}, Poss: ${counts.possessions})`,
            })
            // @ts-ignore
            await global.LIBRARY.hunt('[Console action] Update Console', {
                idx: 'cns00',
                src: `>> [SERIES TEST] Status: [OK] :: INTEGRITY CHECK PASSED`,
            })
            // @ts-ignore
            await global.LIBRARY.hunt('[Console action] Update Console', {
                idx: 'cns00',
                src: `>> --------------------------------------------------`,
            })
        }

        if (bal.slv) {
            bal.slv({
                serBit: {
                    idx: 'test-series-success',
                    val: 1,
                    dat: { config, counts, total },
                },
            })
        }
    } catch (err: any) {
        // @ts-ignore
        if (global.LIBRARY) {
            // @ts-ignore
            await global.LIBRARY.hunt('[Console action] Update Console', {
                idx: 'cns00',
                src: `>> [SERIES TEST ERROR] ${err.message}`,
            })
        }
        if (bal.slv) {
            bal.slv({
                serBit: {
                    idx: 'test-series-error',
                    val: 0,
                    dat: { error: err.message },
                },
            })
        }
    }

    return cpy
}

export const createSeries = async (
    cpy: SeriesModel,
    bal: SeriesBit,
    _ste?: any,
) => {
    const repoRoot = resolveRepoRoot()
    const rawName = (bal.src || 'new-series').trim()

    // Generate safe slug and title
    const slug =
        rawName
            .toLowerCase()
            .replace(/[^a-z0-9-_ ]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '') || 'custom-series'

    const title = rawName
        .split(/[-_ ]+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')

    const targetSeriesDir = path.resolve(repoRoot, 'series', slug)

    try {
        if (fs.existsSync(targetSeriesDir)) {
            throw new Error(`Series directory already exists: series/${slug}`)
        }

        // 1. Create directory hierarchy
        fs.mkdirSync(path.join(targetSeriesDir, 'characters'), {
            recursive: true,
        })
        fs.mkdirSync(path.join(targetSeriesDir, 'grievances'), {
            recursive: true,
        })
        fs.mkdirSync(path.join(targetSeriesDir, 'locations'), {
            recursive: true,
        })
        fs.mkdirSync(path.join(targetSeriesDir, 'possessions'), {
            recursive: true,
        })

        // 2. series.config.json
        const config = {
            series_id: slug,
            title,
            version: '1.0.0',
            modal_parameters: {
                scarcity_index: 5000,
                paranoia_baseline: 5000,
            },
        }
        fs.writeFileSync(
            path.join(targetSeriesDir, 'series.config.json'),
            JSON.stringify(config, null, 2),
            'utf-8',
        )

        // 3. Example Location (Byte-0 frontmatter)
        const locationDoc = `---
id: loc_${slug}_hub
name: "${title} Central Hub"
type: location
adjacent_locations: []
acoustic_damping_factor: 1500
lighting_level: dim_crevice
---

# ${title} Central Hub

The primary spatial threshold and assembly area for ${title}.
`
        fs.writeFileSync(
            path.join(targetSeriesDir, 'locations', 'central_hub.md'),
            locationDoc,
            'utf-8',
        )

        // 4. Example Possession (Byte-0 frontmatter)
        const possessionDoc = `---
id: item_${slug}_token
name: "Founder's Token"
type: possession
weight_class: scrap
mass_grams: 35
is_contested: false
---

# Founder's Token

A functional material anchor carried as proof of authority.
`
        fs.writeFileSync(
            path.join(targetSeriesDir, 'possessions', 'founders_token.md'),
            possessionDoc,
            'utf-8',
        )

        // 5. Example Character (Byte-0 frontmatter)
        const characterDoc = `---
id: char_${slug}_protagonist
name: "Protagonist"
type: character
location: loc_${slug}_hub
somatic:
  locomotion_baseline: bipedal_standard
  banned_kinetic_verbs: []
  motor_limitations: []
  conditions: []
  signature_tics: ["checks_pockets_frequently"]
logistical:
  worn: []
  held: ["item_${slug}_token"]
  carried: []
  cached: []
epistemic:
  escalation_ceiling: 3
  leverage_strings: {}
  relationship_defaults: {}
  strings_held_over: []
historical_reference: false
---

## Wants (surface)
To maintain security within the immediate territory.

## Wants (actual)
To establish permanent independence from outside factions.

## Blind spot
Assumes silence from peers equals full agreement.
`
        fs.writeFileSync(
            path.join(targetSeriesDir, 'characters', 'protagonist.md'),
            characterDoc,
            'utf-8',
        )

        // 6. Example Grievance (Byte-0 frontmatter)
        const grievanceDoc = `---
id: grv_${slug}_territorial_claim
type: grievance
participants_primary: ["char_${slug}_protagonist"]
participants_can_involve: []
intensity_envelope: [1000, 4000]
cooldown_cycles: 2
spawns_on_max_escalation: []
resolved: false
---

## Surface Argument
Dispute over who oversees storage access in the central hub.

## The Underneath
Deep anxiety that any distributed control compromises group survival.
`
        fs.writeFileSync(
            path.join(targetSeriesDir, 'grievances', 'territorial_claim.md'),
            grievanceDoc,
            'utf-8',
        )

        // 7. Immediate Zero-Defect Pre-compilation Pass ($T0 = $0.00)
        const compiledRootDir = path.resolve(repoRoot, 'compiled')
        const preCompile = compileLoreInstance({
            instanceDir: targetSeriesDir,
            compiledRootDir,
            seriesSlug: slug,
        })

        // @ts-ignore
        if (global.LIBRARY) {
            // @ts-ignore
            await global.LIBRARY.hunt('[Console action] Update Console', {
                idx: 'cns00',
                src: `>> [SERIES CREATED] Scaffolded series/${slug}/ with verified examples`,
            })
            // @ts-ignore
            await global.LIBRARY.hunt('[Console action] Update Console', {
                idx: 'cns00',
                src: `>> [PRE-COMPILED] Hash: ${preCompile.stateHash.slice(0, 16)}...`,
            })
        }

        if (bal.slv) {
            bal.slv({
                serBit: {
                    idx: 'create-series-success',
                    val: 1,
                    src: slug,
                    dat: { slug, title, dir: targetSeriesDir, preCompile },
                },
            })
        }
    } catch (err: any) {
        // @ts-ignore
        if (global.LIBRARY) {
            // @ts-ignore
            await global.LIBRARY.hunt('[Console action] Update Console', {
                idx: 'cns00',
                src: `>> [CREATE SERIES ERROR] ${err.message}`,
            })
        }
        if (bal.slv) {
            bal.slv({
                serBit: {
                    idx: 'create-series-error',
                    val: 0,
                    dat: { error: err.message },
                },
            })
        }
    }

    return cpy
}

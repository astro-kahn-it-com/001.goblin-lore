import path from 'node:path'
import fs from 'node:fs'
import type { SeriesModel } from '../series.model.js'
import type SeriesBit from '../fce/series.bit.js'

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
    let repoRoot = process.cwd()
    if (
        !fs.existsSync(path.resolve(repoRoot, 'series')) &&
        fs.existsSync(path.resolve(repoRoot, '../../series'))
    ) {
        repoRoot = path.resolve(repoRoot, '../../')
    }

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
                src: `>> [SERIES TEST] Slug: ${config.series_id || seriesSlug} | Version: ${config.version || 'unknown'}`,
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

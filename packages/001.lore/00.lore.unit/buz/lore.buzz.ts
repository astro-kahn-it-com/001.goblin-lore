import path from 'node:path'
import fs from 'node:fs'
import { compileLoreInstance } from '../../src/compiler.js'
import type { LoreModel } from '../lore.model.js'
import type LoreBit from '../fce/lore.bit.js'
import type State from '../lore.unit.js'

export const resolveRepoRoot = (): string => {
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

export const initLore = (cpy: LoreModel, bal: LoreBit, _ste?: State) => {
    cpy.lastCompileStatus = 'INITIALIZED'
    if (bal?.slv) bal.slv({ lorBit: { idx: 'init-lore-success', val: 1 } })
    return cpy
}

export const compileLore = async (
    cpy: LoreModel,
    bal: LoreBit,
    _ste?: State,
) => {
    const repoRoot = resolveRepoRoot()
    const seriesSlug = (bal?.src || 'under-the-floorboards').trim()
    const instanceDir = path.resolve(repoRoot, 'series', seriesSlug)
    const compiledRootDir = path.resolve(repoRoot, 'compiled')

    try {
        if (!fs.existsSync(instanceDir)) {
            throw new Error(
                `Target series directory not found: series/${seriesSlug}`,
            )
        }

        const res = compileLoreInstance({
            instanceDir,
            compiledRootDir,
            seriesSlug,
        })

        cpy.lastStateHash = res.stateHash
        cpy.lastEntityCount = res.entityCount
        cpy.lastCompileStatus = 'SEALED'

        const lib = (global as any).LIBRARY
        if (lib && typeof lib.hunt === 'function') {
            await lib.hunt('[Console action] Update Console', {
                idx: 'cns00',
                src: `>> [LORE SEALED] Series: ${seriesSlug} | Hash: ${res.stateHash.slice(0, 16)}...`,
            })
            await lib.hunt('[Console action] Update Console', {
                idx: 'cns00',
                src: `>> [LATEST HEAD] ${res.latestPath}`,
            })
            await lib.hunt('[Console action] Update Console', {
                idx: 'cns00',
                src: `>> [ENTITIES PROCESSED] Total: ${res.entityCount}`,
            })
            if (res.pardonDiagnostics?.length > 0) {
                await lib.hunt('[Console action] Update Console', {
                    idx: 'cns00',
                    src: `>> [PARDONS] Active waivers applied: ${res.pardonDiagnostics.length}`,
                })
            }
            if (res.epistemicDiagnostics?.length > 0) {
                await lib.hunt('[Console action] Update Console', {
                    idx: 'cns00',
                    src: `>> [EPISTEMIC ADVISORY] Prose findings: ${res.epistemicDiagnostics.length}`,
                })
            }
        }

        if (bal?.slv) {
            bal.slv({
                lorBit: {
                    idx: 'compile-lore-success',
                    val: 1,
                    dat: res,
                },
            })
        }
    } catch (err: any) {
        cpy.lastCompileStatus = 'ERROR'
        const lib = (global as any).LIBRARY
        if (lib && typeof lib.hunt === 'function') {
            await lib.hunt('[Console action] Update Console', {
                idx: 'cns00',
                src: `>> [LORE COMPILE ERROR] ${err.message}`,
            })
        }

        if (bal?.slv) {
            bal.slv({
                lorBit: {
                    idx: 'compile-lore-error',
                    val: 0,
                    dat: { error: err.message },
                },
            })
        }
    }

    return cpy
}

export const auditLore = async (cpy: LoreModel, bal: LoreBit, _ste?: State) => {
    const repoRoot = resolveRepoRoot()
    const seriesSlug = (bal?.src || 'under-the-floorboards').trim()
    const latestPath = path.resolve(
        repoRoot,
        'compiled',
        seriesSlug,
        'bible-state.json',
    )

    try {
        if (!fs.existsSync(latestPath)) {
            throw new Error(`Sealed bible state not found at: ${latestPath}`)
        }

        const raw = fs.readFileSync(latestPath, 'utf-8')
        const parsed = JSON.parse(raw)
        const stateHash = parsed?._meta?.state_hash || 'UNKNOWN'

        const lib = (global as any).LIBRARY
        if (lib && typeof lib.hunt === 'function') {
            await lib.hunt('[Console action] Update Console', {
                idx: 'cns00',
                src: `>> [AUDIT PASS] Series: ${seriesSlug} verified on disk.`,
            })
            await lib.hunt('[Console action] Update Console', {
                idx: 'cns00',
                src: `>> [CANONICAL HASH] ${stateHash}`,
            })
        }

        if (bal?.slv) {
            bal.slv({
                lorBit: {
                    idx: 'audit-lore-success',
                    val: 1,
                    dat: { stateHash, parsed },
                },
            })
        }
    } catch (err: any) {
        const lib = (global as any).LIBRARY
        if (lib && typeof lib.hunt === 'function') {
            await lib.hunt('[Console action] Update Console', {
                idx: 'cns00',
                src: `>> [AUDIT FAIL] ${err.message}`,
            })
        }

        if (bal?.slv) {
            bal.slv({
                lorBit: {
                    idx: 'audit-lore-error',
                    val: 0,
                    dat: { error: err.message },
                },
            })
        }
    }

    return cpy
}

import path from 'node:path'
import fs from 'node:fs'
import * as ActMnu from '../menu.action.js'
import * as ActLor from '../../00.lore.unit/lore.action.js'
import { resolveRepoRoot } from '../../00.lore.unit/buz/lore.buzz.js'
import type { MenuModel } from '../menu.model.js'
import type MenuBit from '../fce/menu.bit.js'

let rootSlv: any

const UPDATE_GRID = '[Grid action] Update Grid'
const WRITE_CONSOLE = '[Write action] Write Console'
const UPDATE_CONSOLE = '[Console action] Update Console'
const OPEN_CHOICE = '[Open action] Open Choice'

export const initMenu = async (cpy: MenuModel, bal: MenuBit, ste: any) => {
    if (bal?.slv != null) rootSlv = bal.slv

    const lib = (global as any).LIBRARY
    if (lib && typeof lib.hunt === 'function') {
        const bit = await lib.hunt(UPDATE_GRID, {
            x: 4,
            y: 0,
            xSpan: 8,
            ySpan: 12,
        })
        await lib.hunt(WRITE_CONSOLE, {
            idx: 'cns00',
            src: '',
            dat: { net: bit?.grdBit?.dat, src: 'lore0' },
        })

        await lib.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: '--------------------------------------------------',
        })
        await lib.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: '>> GOBLIN-LORE LEGISLATIVE CONTROL DECK [ONLINE]',
        })
        await lib.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: '>> T0 Invariant Enforcement & Epistemic Protection',
        })
        await lib.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: '--------------------------------------------------',
        })
    }

    await updateMenu(cpy, bal, ste)
    return cpy
}

export const updateMenu = async (cpy: MenuModel, bal: MenuBit, ste: any) => {
    const lst = [
        'COMPILE LORE INSTANCE',
        'INSPECT CANON BIBLE',
        'AUDIT CORPUS INTEGRITY',
        'ROOT MENU',
    ]

    const lib = (global as any).LIBRARY
    if (!lib || typeof lib.hunt !== 'function') {
        if (bal?.slv) bal.slv({ mnuBit: { idx: 'update-menu-headless' } })
        return cpy
    }

    const gridBit = await lib.hunt(UPDATE_GRID, {
        x: 0,
        y: 4,
        xSpan: 4,
        ySpan: 8,
    })

    const choiceBit = await lib.hunt(OPEN_CHOICE, {
        dat: { clr0: 'black', clr1: 'yellow' },
        src: 'vertical',
        lst,
        net: gridBit?.grdBit?.dat,
    })

    const selection = choiceBit?.chcBit?.src

    switch (selection) {
        case 'COMPILE LORE INSTANCE': {
            const repoRoot = resolveRepoRoot()
            const seriesRoot = path.join(repoRoot, 'series')

            const seriesDirs = fs.existsSync(seriesRoot)
                ? fs
                      .readdirSync(seriesRoot, { withFileTypes: true })
                      .filter((d) => d.isDirectory() && !d.name.startsWith('.'))
                      .map((d) => d.name)
                : ['under-the-floorboards']

            const subChoices = [...seriesDirs, 'CANCEL']

            const subGrid = await lib.hunt(UPDATE_GRID, {
                x: 0,
                y: 4,
                xSpan: 4,
                ySpan: Math.min(12, Math.max(6, subChoices.length + 2)),
            })

            const seriesChoice = await lib.hunt(OPEN_CHOICE, {
                dat: { clr0: 'black', clr1: 'green' },
                src: 'vertical',
                lst: subChoices,
                net: subGrid?.grdBit?.dat,
            })

            const chosenSlug = seriesChoice?.chcBit?.src
            if (chosenSlug && chosenSlug !== 'CANCEL') {
                await ste.hunt(ActLor.COMPILE_LORE, { src: chosenSlug })
            }
            break
        }

        case 'INSPECT CANON BIBLE': {
            const repoRoot = resolveRepoRoot()
            const headFile = path.resolve(
                repoRoot,
                'compiled',
                'under-the-floorboards',
                'bible-state.json',
            )

            if (fs.existsSync(headFile)) {
                const raw = JSON.parse(fs.readFileSync(headFile, 'utf-8'))
                const hash = raw?._meta?.state_hash || 'MISSING'
                const entities =
                    Object.keys(raw?.entities?.characters || {}).length +
                    Object.keys(raw?.entities?.locations || {}).length +
                    Object.keys(raw?.entities?.possessions || {}).length +
                    Object.keys(raw?.entities?.grievances || {}).length

                await lib.hunt(UPDATE_CONSOLE, {
                    idx: 'cns00',
                    src: `>> [INSPECT] under-the-floorboards HEAD: ${hash.slice(0, 16)}...`,
                })
                await lib.hunt(UPDATE_CONSOLE, {
                    idx: 'cns00',
                    src: `>> [ENTITIES] Total Indexed: ${entities}`,
                })
            } else {
                await lib.hunt(UPDATE_CONSOLE, {
                    idx: 'cns00',
                    src: '>> [INSPECT ERROR] Canonical bible-state.json not compiled yet.',
                })
            }
            break
        }

        case 'AUDIT CORPUS INTEGRITY': {
            await ste.hunt(ActLor.AUDIT_LORE, { src: 'under-the-floorboards' })
            break
        }

        case 'ROOT MENU': {
            if (rootSlv != null) rootSlv({ mnuBit: { idx: 'root-menu' } })
            return cpy
        }
    }

    setTimeout(async () => {
        await ste.hunt(ActMnu.UPDATE_MENU, {})
    }, 333)

    return cpy
}

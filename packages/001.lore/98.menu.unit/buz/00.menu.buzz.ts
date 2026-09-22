import fs from 'node:fs'
import path from 'node:path'
import * as ActLor from '../../00.lore.unit/lore.action.js'
import * as ActSer from '../../01.series.unit/series.action.js'
import type { MenuModel } from '../menu.model.js'
import type MenuBit from '../fce/menu.bit.js'

let rootSlv: any

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

export const initMenu = async (cpy: MenuModel, bal: MenuBit, ste: any) => {
  if (bal.slv) rootSlv = bal.slv

  // @ts-ignore
  if (global.LIBRARY) {
    // @ts-ignore
    await global.LIBRARY.hunt('[Grid action] Update Grid', {
      x: 4,
      y: 0,
      xSpan: 8,
      ySpan: 12,
    })
    // @ts-ignore
    await global.LIBRARY.hunt('[Console action] Update Console', {
      idx: 'cns00',
      src: '-----------',
    })
    // @ts-ignore
    await global.LIBRARY.hunt('[Console action] Update Console', {
      idx: 'cns00',
      src: 'LORE SYSTEM MENU',
    })
    // @ts-ignore
    await global.LIBRARY.hunt('[Console action] Update Console', {
      idx: 'cns00',
      src: '-----------',
    })
  }

  await updateMenu(cpy, bal, ste)
  return cpy
}

export const updateMenu = async (cpy: MenuModel, bal: MenuBit, ste: any) => {
  const lst = [
    'COMPILE LORE INSTANCE',
    'CREATE SERIES',
    'TEST SERIES',
    'ROOT MENU',
  ]

  // @ts-ignore
  let bit = await global.LIBRARY.hunt('[Grid action] Update Grid', {
    x: 0,
    y: 4,
    xSpan: 4,
    ySpan: 8,
  })
  // @ts-ignore
  const choice = await global.LIBRARY.hunt('[Open action] Open Choice', {
    dat: { clr0: 'black', clr1: 'yellow' },
    src: 'vertical',
    lst,
    net: bit.grdBit.dat,
  })

  const src = choice.chcBit.src

  switch (src) {
    case 'COMPILE LORE INSTANCE': {
      const repoRoot = resolveRepoRoot()
      const seriesRootDir = path.resolve(repoRoot, 'series')
      let seriesList: string[] = []

      if (fs.existsSync(seriesRootDir)) {
        seriesList = fs
          .readdirSync(seriesRootDir, { withFileTypes: true })
          .filter(
            (d) =>
              d.isDirectory() &&
              !d.name.startsWith('.') &&
              !d.name.startsWith('_'),
          )
          .map((d) => d.name)
      }

      if (seriesList.length === 0) {
        // @ts-ignore
        if (global.LIBRARY) {
          // @ts-ignore
          await global.LIBRARY.hunt('[Console action] Update Console', {
            idx: 'cns00',
            src: '>> [WARN] No series found in series/. Create one first.',
          })
        }
        break
      }

      seriesList.push('CANCEL')
      // @ts-ignore
      bit = await global.LIBRARY.hunt('[Grid action] Update Grid', {
        x: 0,
        y: 4,
        xSpan: 4,
        ySpan: Math.min(12, Math.max(6, seriesList.length + 2)),
      })
      // @ts-ignore
      const seriesChoice = await global.LIBRARY.hunt(
        '[Open action] Open Choice',
        {
          dat: { clr0: 'black', clr1: 'yellow' },
          src: 'vertical',
          lst: seriesList,
          net: bit.grdBit.dat,
        },
      )

      const selectedSeries = seriesChoice.chcBit.src
      if (selectedSeries && selectedSeries !== 'CANCEL') {
        await ste.hunt(ActLor.COMPILE_LORE, { src: selectedSeries })
      }
      break
    }

    case 'CREATE SERIES': {
      // @ts-ignore
      bit = await global.LIBRARY.hunt('[Grid action] Update Grid', {
        x: 0,
        y: 4,
        xSpan: 4,
        ySpan: 6,
      })
      // @ts-ignore
      const inputBit = await global.LIBRARY.hunt('[Open action] Open Input', {
        dat: { clr0: 'black', clr1: 'yellow' },
        src: 'vertical',
        lst: [],
        txt: 'Enter Series Name (e.g. wiregrass-basin)',
        net: bit.grdBit.dat,
      })

      const seriesName = inputBit.putBit.src
      if (seriesName && seriesName.trim().length > 0) {
        await ste.hunt(ActSer.CREATE_SERIES, { src: seriesName.trim() })
      }
      break
    }

    case 'TEST SERIES': {
      const repoRoot = resolveRepoRoot()
      const seriesRootDir = path.resolve(repoRoot, 'series')
      let seriesList: string[] = []

      if (fs.existsSync(seriesRootDir)) {
        seriesList = fs
          .readdirSync(seriesRootDir, { withFileTypes: true })
          .filter(
            (d) =>
              d.isDirectory() &&
              !d.name.startsWith('.') &&
              !d.name.startsWith('_'),
          )
          .map((d) => d.name)
      }

      if (seriesList.length > 0) {
        seriesList.push('CANCEL')
        // @ts-ignore
        bit = await global.LIBRARY.hunt('[Grid action] Update Grid', {
          x: 0,
          y: 4,
          xSpan: 4,
          ySpan: Math.min(12, Math.max(6, seriesList.length + 2)),
        })
        // @ts-ignore
        const seriesChoice = await global.LIBRARY.hunt(
          '[Open action] Open Choice',
          {
            dat: { clr0: 'black', clr1: 'yellow' },
            src: 'vertical',
            lst: seriesList,
            net: bit.grdBit.dat,
          },
        )
        const selectedSeries = seriesChoice.chcBit.src
        if (selectedSeries && selectedSeries !== 'CANCEL') {
          await ste.hunt(ActSer.TEST_SERIES, { src: selectedSeries })
        }
      } else {
        await ste.hunt(ActSer.TEST_SERIES, {})
      }
      break
    }

    case 'ROOT MENU':
      if (rootSlv) rootSlv({ mnuBit: { idx: 'root-menu' } })
      return cpy

    default:
      break
  }

  setTimeout(async () => {
    await updateMenu(cpy, bal, ste)
  }, 333)

  return cpy
}

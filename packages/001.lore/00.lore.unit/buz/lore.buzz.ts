import path from 'node:path'
import fs from 'node:fs'
import { compileLoreInstance } from '../../src/compiler.js'
import type { LoreModel } from '../lore.model.js'
import type LoreBit from '../fce/lore.bit.js'

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

export const initLore = (cpy: LoreModel, bal: LoreBit) => {
  if (bal.slv) bal.slv({ intBit: { idx: 'init-lore' } })
  return cpy
}

export const compileLore = async (cpy: LoreModel, bal: LoreBit) => {
  const repoRoot = resolveRepoRoot()
  const seriesSlug = (bal.src || 'under-the-floorboards').trim()
  const instanceDir = path.resolve(repoRoot, 'series', seriesSlug)
  const compiledRootDir = path.resolve(repoRoot, 'compiled')

  try {
    if (!fs.existsSync(instanceDir)) {
      throw new Error(`Target series directory not found: series/${seriesSlug}`)
    }

    const res = compileLoreInstance({
      instanceDir,
      compiledRootDir,
      seriesSlug,
    })
    cpy.lastStateHash = res.stateHash
    cpy.lastEntityCount = res.entityCount

    // @ts-ignore
    if (global.LIBRARY) {
      // @ts-ignore
      await global.LIBRARY.hunt('[Console action] Update Console', {
        idx: 'cns00',
        src: `>> [LORE SEALED] Series: ${seriesSlug} | Hash: ${res.stateHash.slice(0, 16)}...`,
      })
      // @ts-ignore
      await global.LIBRARY.hunt('[Console action] Update Console', {
        idx: 'cns00',
        src: `>> [EMITTED HEAD] ${res.latestPath}`,
      })
      // @ts-ignore
      await global.LIBRARY.hunt('[Console action] Update Console', {
        idx: 'cns00',
        src: `>> [EMITTED SNAPSHOT] ${res.snapshotPath}`,
      })
    }

    if (bal.slv)
      bal.slv({ lorBit: { idx: 'compile-lore-success', val: 1, dat: res } })
  } catch (err: any) {
    // @ts-ignore
    if (global.LIBRARY) {
      // @ts-ignore
      await global.LIBRARY.hunt('[Console action] Update Console', {
        idx: 'cns00',
        src: `>> [LORE COMPILE ERROR] ${err.message}`,
      })
    }
    if (bal.slv)
      bal.slv({
        lorBit: {
          idx: 'compile-lore-error',
          val: 0,
          dat: { error: err.message },
        },
      })
  }

  return cpy
}

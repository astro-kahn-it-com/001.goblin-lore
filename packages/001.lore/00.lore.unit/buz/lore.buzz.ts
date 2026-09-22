import path from 'node:path'
import { compileLoreInstance } from '../../src/compiler.js'
import type { LoreModel } from '../lore.model.js'
import type LoreBit from '../fce/lore.bit.js'

export const initLore = (cpy: LoreModel, bal: LoreBit) => {
  if (bal.slv) bal.slv({ intBit: { idx: 'init-lore' } })
  return cpy
}

export const compileLore = async (cpy: LoreModel, bal: LoreBit) => {
  const repoRoot = process.cwd()
  const instanceDir = path.resolve(repoRoot, 'series/under-the-floorboards')
  const compiledRootDir = path.resolve(repoRoot, 'compiled')

  try {
    const res = compileLoreInstance({
      instanceDir,
      compiledRootDir,
      seriesSlug: 'under-the-floorboards',
    })
    cpy.lastStateHash = res.stateHash
    cpy.lastEntityCount = res.entityCount

    // @ts-ignore
    if (global.LIBRARY) {
      // @ts-ignore
      await global.LIBRARY.hunt('[Console action] Update Console', {
        idx: 'cns00',
        src: `>> [LORE SEALED] Hash: ${res.stateHash.slice(0, 16)}... | Entities: ${res.entityCount}`,
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

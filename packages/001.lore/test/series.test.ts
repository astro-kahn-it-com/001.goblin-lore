import { describe, it, expect, afterAll } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import sim from '../hunt.js'
import * as ActSer from '../01.series.unit/series.action.js'
import * as ActLor from '../00.lore.unit/lore.action.js'

describe('01.series.unit Series Lifecycle', () => {
  const repoRoot = path.resolve(process.cwd(), '../../')
  const testSlug = 'sandbox-scaffold-test'
  const testSeriesDir = path.resolve(repoRoot, 'series', testSlug)
  const testCompiledDir = path.resolve(repoRoot, 'compiled', testSlug)

  afterAll(() => {
    if (fs.existsSync(testSeriesDir)) {
      fs.rmSync(testSeriesDir, { recursive: true, force: true })
    }
    if (fs.existsSync(testCompiledDir)) {
      fs.rmSync(testCompiledDir, { recursive: true, force: true })
    }
  })

  it('creates a new series directory pre-populated with compliant examples', async () => {
    const res: any = await sim.hunt(ActSer.CREATE_SERIES, {
      src: 'Sandbox Scaffold Test',
    })

    expect(res.serBit).toBeDefined()
    expect(res.serBit.idx).toBe('create-series-success')
    expect(res.serBit.val).toBe(1)
    expect(res.serBit.src).toBe(testSlug)

    // Verify filesystem presence
    expect(fs.existsSync(path.join(testSeriesDir, 'series.config.json'))).toBe(
      true,
    )
    expect(
      fs.existsSync(path.join(testSeriesDir, 'characters', 'protagonist.md')),
    ).toBe(true)
    expect(
      fs.existsSync(path.join(testSeriesDir, 'locations', 'central_hub.md')),
    ).toBe(true)
    expect(
      fs.existsSync(
        path.join(testSeriesDir, 'possessions', 'founders_token.md'),
      ),
    ).toBe(true)
    expect(
      fs.existsSync(
        path.join(testSeriesDir, 'grievances', 'territorial_claim.md'),
      ),
    ).toBe(true)

    // Assert Byte-0 compliance
    const charRaw = fs.readFileSync(
      path.join(testSeriesDir, 'characters', 'protagonist.md'),
      'utf-8',
    )
    expect(charRaw.startsWith('---')).toBe(true)
  })

  it('compiles the newly scaffolded series on demand via COMPILE_LORE', async () => {
    const compileRes: any = await sim.hunt(ActLor.COMPILE_LORE, {
      src: testSlug,
    })

    expect(compileRes.lorBit).toBeDefined()
    expect(compileRes.lorBit.idx).toBe('compile-lore-success')
    expect(compileRes.lorBit.val).toBe(1)

    // Assert dual-emission output in root compiled/<testSlug>/
    expect(fs.existsSync(path.join(testCompiledDir, 'bible-state.json'))).toBe(
      true,
    )
    const files = fs.readdirSync(testCompiledDir)
    const hasTimestampFile = files.some((f) =>
      /^bible-state_\d{4}-\d{2}-\d{2}/.test(f),
    )
    expect(hasTimestampFile).toBe(true)
  })
})

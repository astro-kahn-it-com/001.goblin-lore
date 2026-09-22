import { describe, it, expect } from 'vitest'
import path from 'node:path'
import fs from 'node:fs'
import { compileLoreInstance } from '../src/compiler.js'

describe('001.lore Referential Integrity & Compiler Gauntlet', () => {
  const repoRoot = path.resolve(process.cwd(), '../../')
  const instanceDir = path.resolve(repoRoot, 'series/under-the-floorboards')
  const compiledRootDir = path.resolve(repoRoot, 'compiled')
  const seriesSlug = 'under-the-floorboards'

  it('compiles canonical under-the-floorboards canon without throwing', () => {
    const res = compileLoreInstance({
      instanceDir,
      compiledRootDir,
      seriesSlug,
    })

    expect(res.stateHash).toMatch(/^[a-f0-9]{64}$/)
    expect(res.entityCount).toBeGreaterThanOrEqual(4)

    expect(fs.existsSync(res.latestPath)).toBe(true)
    const latestContent = JSON.parse(fs.readFileSync(res.latestPath, 'utf-8'))
    expect(latestContent._meta.state_hash).toBe(res.stateHash)
    expect(latestContent.characters.char_bog).toBeDefined()
    expect(latestContent.characters.char_spleen).toBeDefined()
  })

  // Helper to create disposable test environments
  const withFixture = (
    fixtureName: string,
    setup: (dir: string) => void,
    testFn: (dir: string) => void,
  ) => {
    const fixtureDir = path.resolve(
      process.cwd(),
      `test/fixtures/${fixtureName}`,
    )
    if (fs.existsSync(fixtureDir)) {
      fs.rmSync(fixtureDir, { recursive: true, force: true })
    }
    fs.mkdirSync(path.join(fixtureDir, 'characters'), { recursive: true })
    fs.mkdirSync(path.join(fixtureDir, 'grievances'), { recursive: true })
    fs.mkdirSync(path.join(fixtureDir, 'locations'), { recursive: true })
    fs.mkdirSync(path.join(fixtureDir, 'possessions'), { recursive: true })

    setup(fixtureDir)

    try {
      testFn(fixtureDir)
    } finally {
      if (fs.existsSync(fixtureDir)) {
        fs.rmSync(fixtureDir, { recursive: true, force: true })
      }
    }
  }

  it('rejects characters referencing missing locations', () => {
    withFixture(
      'dangling-location',
      (dir) => {
        fs.writeFileSync(
          path.join(dir, 'characters', 'char_orphan.md'),
          `---
id: char_orphan
name: Orphan
type: character
location: loc_missing_abyss
somatic:
  locomotion_baseline: bipedal_standard
logistical: {}
epistemic: {}
---
`,
        )
      },
      (dir) => {
        expect(() =>
          compileLoreInstance({
            instanceDir: dir,
            compiledRootDir: path.join(dir, 'compiled'),
            seriesSlug: 'test',
          }),
        ).toThrow(/references missing location: 'loc_missing_abyss'/)
      },
    )
  })

  it('rejects characters equipping missing possessions', () => {
    withFixture(
      'dangling-item',
      (dir) => {
        fs.writeFileSync(
          path.join(dir, 'characters', 'char_thief.md'),
          `---
id: char_thief
name: Thief
type: character
somatic:
  locomotion_baseline: bipedal_standard
logistical:
  held: ["item_ghost_blade"]
epistemic: {}
---
`,
        )
      },
      (dir) => {
        expect(() =>
          compileLoreInstance({
            instanceDir: dir,
            compiledRootDir: path.join(dir, 'compiled'),
            seriesSlug: 'test',
          }),
        ).toThrow(/equips missing possession in 'held': 'item_ghost_blade'/)
      },
    )
  })

  it('rejects characters holding strings over missing characters', () => {
    withFixture(
      'dangling-string-held',
      (dir) => {
        fs.writeFileSync(
          path.join(dir, 'characters', 'char_creditor.md'),
          `---
id: char_creditor
name: Creditor
type: character
somatic:
  locomotion_baseline: bipedal_standard
logistical: {}
epistemic:
  strings_held_over: ["char_nonexistent"]
---
`,
        )
      },
      (dir) => {
        expect(() =>
          compileLoreInstance({
            instanceDir: dir,
            compiledRootDir: path.join(dir, 'compiled'),
            seriesSlug: 'test',
          }),
        ).toThrow(/holds string over missing character: 'char_nonexistent'/)
      },
    )
  })

  it('rejects characters declaring leverage over missing characters', () => {
    withFixture(
      'dangling-leverage',
      (dir) => {
        fs.writeFileSync(
          path.join(dir, 'characters', 'char_blackmailer.md'),
          `---
id: char_blackmailer
name: Blackmailer
type: character
somatic:
  locomotion_baseline: bipedal_standard
logistical: {}
epistemic:
  leverage_strings: { "char_ghost": 3 }
---
`,
        )
      },
      (dir) => {
        expect(() =>
          compileLoreInstance({
            instanceDir: dir,
            compiledRootDir: path.join(dir, 'compiled'),
            seriesSlug: 'test',
          }),
        ).toThrow(/declares leverage over missing character: 'char_ghost'/)
      },
    )
  })

  it('rejects characters declaring relationship defaults with missing characters', () => {
    withFixture(
      'dangling-relationship',
      (dir) => {
        fs.writeFileSync(
          path.join(dir, 'characters', 'char_lover.md'),
          `---
id: char_lover
name: Lover
type: character
somatic:
  locomotion_baseline: bipedal_standard
logistical: {}
epistemic:
  relationship_defaults: { "char_phantom": "adoration" }
---
`,
        )
      },
      (dir) => {
        expect(() =>
          compileLoreInstance({
            instanceDir: dir,
            compiledRootDir: path.join(dir, 'compiled'),
            seriesSlug: 'test',
          }),
        ).toThrow(/references missing relationship character: 'char_phantom'/)
      },
    )
  })

  it('rejects locations declaring adjacency to missing locations', () => {
    withFixture(
      'dangling-adjacency',
      (dir) => {
        fs.writeFileSync(
          path.join(dir, 'locations', 'loc_cellar.md'),
          `---
id: loc_cellar
name: Cellar
type: location
adjacent_locations: ["loc_portal_to_nowhere"]
---
`,
        )
      },
      (dir) => {
        expect(() =>
          compileLoreInstance({
            instanceDir: dir,
            compiledRootDir: path.join(dir, 'compiled'),
            seriesSlug: 'test',
          }),
        ).toThrow(
          /declares adjacency to missing location: 'loc_portal_to_nowhere'/,
        )
      },
    )
  })

  it('rejects grievances referencing missing secondary participants (can_involve)', () => {
    withFixture(
      'dangling-can-involve',
      (dir) => {
        fs.writeFileSync(
          path.join(dir, 'characters', 'char_instigator.md'),
          `---
id: char_instigator
name: Instigator
type: character
somatic:
  locomotion_baseline: bipedal_standard
logistical: {}
epistemic: {}
---
`,
        )
        fs.writeFileSync(
          path.join(dir, 'grievances', 'grv_feud.md'),
          `---
id: grv_feud
type: grievance
participants_primary: ["char_instigator"]
participants_can_involve: ["char_absent_witness"]
intensity_envelope: [1000, 3000]
---
`,
        )
      },
      (dir) => {
        expect(() =>
          compileLoreInstance({
            instanceDir: dir,
            compiledRootDir: path.join(dir, 'compiled'),
            seriesSlug: 'test',
          }),
        ).toThrow(
          /references non-existent secondary participant: 'char_absent_witness'/,
        )
      },
    )
  })

  it('halts on cyclic grievance escalation graphs (DFS)', () => {
    withFixture(
      'cyclic-grievance',
      (dir) => {
        fs.writeFileSync(
          path.join(dir, 'characters', 'char_a.md'),
          `---
id: char_a
name: A
type: character
somatic:
  locomotion_baseline: bipedal_standard
logistical: {}
epistemic: {}
---
`,
        )
        fs.writeFileSync(
          path.join(dir, 'grievances', 'g1.md'),
          `---
id: g1
type: grievance
participants_primary: ["char_a"]
intensity_envelope: [0, 1000]
spawns_on_max_escalation: ["g2"]
---
`,
        )
        fs.writeFileSync(
          path.join(dir, 'grievances', 'g2.md'),
          `---
id: g2
type: grievance
participants_primary: ["char_a"]
intensity_envelope: [0, 1000]
spawns_on_max_escalation: ["g1"]
---
`,
        )
      },
      (dir) => {
        expect(() =>
          compileLoreInstance({
            instanceDir: dir,
            compiledRootDir: path.join(dir, 'compiled'),
            seriesSlug: 'cyclic-test',
          }),
        ).toThrow(/Cyclic grievance escalation detected: '(g1|g2)' -> '(g1|g2)'/)
      },
    )
  })
})

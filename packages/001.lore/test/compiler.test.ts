import { describe, it, expect } from 'vitest'
import path from 'node:path'
import fs from 'node:fs'
import { compileLoreInstance } from '../src/compiler.js'

describe('001.lore Dual-Emission Compiler', () => {
    const repoRoot = path.resolve(process.cwd(), '../../')
    const instanceDir = path.resolve(repoRoot, 'series/under-the-floorboards')
    const compiledRootDir = path.resolve(repoRoot, 'compiled')
    const seriesSlug = 'under-the-floorboards'

    it('compiles and outputs both latest head and timestamped snapshot to top-level compiled/', () => {
        const res = compileLoreInstance({
            instanceDir,
            compiledRootDir,
            seriesSlug,
        })

        expect(res.stateHash).toMatch(/^[a-f0-9]{64}$/)
        expect(res.entityCount).toBeGreaterThanOrEqual(4)

        // 1. Verify latest head file exists
        expect(fs.existsSync(res.latestPath)).toBe(true)
        const latestContent = JSON.parse(
            fs.readFileSync(res.latestPath, 'utf-8'),
        )
        expect(latestContent._meta.state_hash).toBe(res.stateHash)
        expect(latestContent.characters.char_bog).toBeDefined()

        // 2. Verify timestamped snapshot exists and matches
        expect(fs.existsSync(res.snapshotPath)).toBe(true)
        expect(res.snapshotPath).toMatch(
            /bible-state_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}/,
        )
        const snapshotContent = JSON.parse(
            fs.readFileSync(res.snapshotPath, 'utf-8'),
        )
        expect(snapshotContent._meta.state_hash).toBe(res.stateHash)
    })

    it('halts on cyclic grievance graphs without creating compiled outputs', () => {
        const dummyDir = path.resolve(process.cwd(), 'test/fixtures/cyclic')
        fs.mkdirSync(path.join(dummyDir, 'grievances'), { recursive: true })
        fs.mkdirSync(path.join(dummyDir, 'characters'), { recursive: true })

        fs.writeFileSync(
            path.join(dummyDir, 'characters', 'a.md'),
            '---\nid: char_a\nname: A\ntype: character\nsomatic:\n  locomotion_baseline: bipedal_standard\nlogistical: {}\nepistemic: {}\n---\n',
        )
        fs.writeFileSync(
            path.join(dummyDir, 'grievances', 'g1.md'),
            '---\nid: g1\ntype: grievance\nparticipants_primary: ["char_a"]\nintensity_envelope: [0, 1000]\nspawns_on_max_escalation: ["g2"]\n---\n',
        )
        fs.writeFileSync(
            path.join(dummyDir, 'grievances', 'g2.md'),
            '---\nid: g2\ntype: grievance\nparticipants_primary: ["char_a"]\nintensity_envelope: [0, 1000]\nspawns_on_max_escalation: ["g1"]\n---\n',
        )

        expect(() =>
            compileLoreInstance({
                instanceDir: dummyDir,
                compiledRootDir: path.join(dummyDir, 'compiled'),
                seriesSlug: 'cyclic-test',
            }),
        ).toThrow(/Cyclic grievance escalation/)

        fs.rmSync(dummyDir, { recursive: true, force: true })
    })
})

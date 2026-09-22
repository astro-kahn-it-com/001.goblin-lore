import { describe, it, expect } from 'vitest'
import path from 'path'
import fs from 'fs'
import { compileLoreInstance } from '../src/compiler.js'

describe('001.lore Compiler Integrity', () => {
    const instanceDir = path.resolve(
        process.cwd(),
        '../../series/under-the-floorboards',
    )
    const outputFile = path.join(instanceDir, 'compiled', 'bible-state.json')

    it('compiles under-the-floorboards canon without throwing', () => {
        const result = compileLoreInstance({ instanceDir, outputFile })
        expect(result.stateHash).toMatch(/^[a-f0-9]{64}$/)
        expect(result.entityCount).toBeGreaterThanOrEqual(4)
        expect(fs.existsSync(outputFile)).toBe(true)

        const data = JSON.parse(fs.readFileSync(outputFile, 'utf-8'))
        expect(data._meta.state_hash).toBe(result.stateHash)
        expect(data.characters.char_bog).toBeDefined()
        expect(data.characters.char_spleen).toBeDefined()
    })

    it('detects cyclic grievance graphs and halts', () => {
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
                outputFile: path.join(dummyDir, 'compiled', 'out.json'),
            }),
        ).toThrow(/Cyclic grievance escalation/)

        fs.rmSync(dummyDir, { recursive: true, force: true })
    })
})

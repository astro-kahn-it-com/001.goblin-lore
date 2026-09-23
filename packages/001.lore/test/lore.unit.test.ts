import { describe, it, expect } from 'vitest'
import { LoreModel } from '../00.lore.unit/lore.model.js'
import { reducer as loreReducer } from '../00.lore.unit/lore.reduce.js'
import * as ActLor from '../00.lore.unit/lore.action.js'
import { resolveRepoRoot } from '../00.lore.unit/buz/lore.buzz.js'

describe('00.lore.unit - Terminal Harness Engine Unit', () => {
    it('resolves the monorepo root directory containing packages and series', () => {
        const root = resolveRepoRoot()
        expect(root).toBeDefined()
        expect(typeof root).toBe('string')
    })

    it('handles INIT_LORE and sets state to INITIALIZED', async () => {
        const model = new LoreModel()
        let response: any = null

        const action = new ActLor.InitLore({
            idx: 'test-init',
            slv: (res: any) => {
                response = res
            },
        })

        const nextModel = await loreReducer(model, action)
        expect(nextModel.lastCompileStatus).toBe('INITIALIZED')
        expect(response?.lorBit?.idx).toBe('init-lore-success')
        expect(response?.lorBit?.val).toBe(1)
    })

    it('compiles canonical under-the-floorboards series headlessly without throwing', async () => {
        const model = new LoreModel()
        let response: any = null

        const action = new ActLor.CompileLore({
            idx: 'test-compile',
            src: 'under-the-floorboards',
            slv: (res: any) => {
                response = res
            },
        })

        const nextModel = await loreReducer(model, action)
        expect(nextModel.lastCompileStatus).toBe('SEALED')
        expect(nextModel.lastStateHash).toMatch(/^[a-f0-9]{64}$/)
        expect(nextModel.lastEntityCount).toBeGreaterThan(0)
        expect(response?.lorBit?.val).toBe(1)
        expect(response?.lorBit?.dat?.stateHash).toBe(nextModel.lastStateHash)
    })

    it('fails gracefully with val: 0 when compiling non-existent series', async () => {
        const model = new LoreModel()
        let response: any = null

        const action = new ActLor.CompileLore({
            idx: 'test-compile-invalid',
            src: 'non-existent-series-xyz',
            slv: (res: any) => {
                response = res
            },
        })

        const nextModel = await loreReducer(model, action)
        expect(nextModel.lastCompileStatus).toBe('ERROR')
        expect(response?.lorBit?.val).toBe(0)
        expect(response?.lorBit?.dat?.error).toContain(
            'Target series directory not found',
        )
    })

    it('audits compiled canonical state hash on disk', async () => {
        const model = new LoreModel()
        let response: any = null

        const action = new ActLor.AuditLore({
            idx: 'test-audit',
            src: 'under-the-floorboards',
            slv: (res: any) => {
                response = res
            },
        })

        await loreReducer(model, action)
        expect(response?.lorBit?.val).toBe(1)
        expect(response?.lorBit?.dat?.stateHash).toMatch(/^[a-f0-9]{64}$/)
    })
})

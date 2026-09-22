import { describe, it, expect } from 'vitest'
import sim from '../hunt.js'
import * as ActSer from '../01.series.unit/series.action.js'

describe('01.series.unit testSeries', () => {
    it('dispatches TEST_SERIES and validates the active series instance', async () => {
        const res: any = await sim.hunt(ActSer.TEST_SERIES, {
            src: 'under-the-floorboards',
        })

        expect(res.serBit).toBeDefined()
        expect(res.serBit.idx).toBe('test-series-success')
        expect(res.serBit.val).toBe(1)
        expect(res.serBit.dat.config.series_id).toBe('under-the-floorboards')
        expect(res.serBit.dat.total).toBeGreaterThanOrEqual(4)
        expect(res.serBit.dat.counts.characters).toBeGreaterThan(0)
    })
})

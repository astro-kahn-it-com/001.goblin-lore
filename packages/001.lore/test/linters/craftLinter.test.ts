import { describe, it, expect } from 'vitest'
import { CraftLinter } from '../../src/linters/craftLinter.js'

describe('CraftLinter Advisory Battery', () => {
  const linter = new CraftLinter()

  it('flags Swain Motivation-Reaction Unit (MRU) inversions as advisory alerts', () => {
    const invertedProse =
      'Bog struck the creature with his wooden mallet before he saw its teeth.'
    const res = linter.auditProse(invertedProse)
    expect(res.swainMruInversions.length).toBe(1)
    expect(res.swainMruInversions[0].message).toContain('Swain MRU Inversion')
  })

  it('measures sentence length standard deviation to flag flat cadence', () => {
    const flatProse =
      'Bog walked slowly. Spleen sat quietly. The pipe was cold. Darkness felt heavy.'
    const res = linter.auditProse(flatProse)
    expect(res.sentenceLengthVariance).toBeLessThan(4.0)
  })

  it('tracks density of gesture crutches and identifies line coordinates', () => {
    const crutchProse =
      'Bog nodded.\nSpleen nodded too.\nGrissel nodded in return.'
    const res = linter.auditProse(crutchProse)
    const crutch = res.crutchDensity.find((c) => c.token === 'nodded')
    expect(crutch).toBeDefined()
    expect(crutch?.count).toBe(3)
    expect(crutch?.lineCoordinates).toEqual([1, 2, 3])
  })

  it('flags RLHF slop tokens with concrete editorial replacements', () => {
    const slopProse =
      'The silence was palpable as Bog began to delve into the past.'
    const res = linter.auditProse(slopProse)
    expect(res.slopTokens.length).toBe(2)
    expect(res.slopTokens[0].token).toBe('palpable')
    expect(res.slopTokens[0].suggestion).toContain('concrete')
    expect(res.slopTokens[1].token).toBe('delve')
  })
})

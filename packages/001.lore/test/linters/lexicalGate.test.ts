import { describe, it, expect } from 'vitest'
import { LexicalVerbGate } from '../../src/linters/lexicalGate.js'

describe('LexicalVerbGate Unit Suite', () => {
  const gate = new LexicalVerbGate()
  const banned = new Set(['sprint', 'vault', 'climb', 'grip', 'embrace'])

  it('permits valid descriptions of motor impairment with modal negations', () => {
    const text = 'Bog reached for the ladder but could not climb up.'
    const res = gate.lintText(text, 'char_bog', banned)
    expect(res.passed).toBe(true)
    expect(res.violations.length).toBe(0)
  })

  it('permits abstract cognitive direct objects via whitelist', () => {
    const text = 'Bog embraced his terrible fate and stared into the dark.'
    const res = gate.lintText(text, 'char_bog', banned)
    expect(res.passed).toBe(true)
    expect(res.violations.length).toBe(0)
  })

  it('flags physical execution of banned verbs affirmatively', () => {
    const text = 'Bog gripped the heavy brass spoon with both hands.'
    const res = gate.lintText(text, 'char_bog', banned)
    expect(res.passed).toBe(false)
    expect(res.violations.length).toBe(1)
    expect(res.violations[0].verb).toBe('grip')
  })

  it('fails closed on ambiguous coreferences', () => {
    const text = 'Someone vaulted across the copper pipe in silence.'
    const res = gate.lintText(text, 'char_spleen', banned)
    expect(res.violations.length).toBe(1)
    expect(res.violations[0].isAmbiguous).toBe(true)
    expect(res.quarantinedCount).toBe(1)
  })

  it('evaluates dual-field AST sets against somatic masks', () => {
    const astActions = ['LOOK', 'VAULT']
    const prose = 'Bog looked around calmly.'
    const res = gate.validateActionProseAST(
      prose,
      astActions,
      'char_bog',
      banned,
    )
    expect(res.valid).toBe(false)
    expect(res.fatalBreaches[0]).toContain(
      "Self-reported action violation: 'VAULT'",
    )
  })
})

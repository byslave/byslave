import { describe, expect, it } from 'vitest'
import { comboPattern } from './haptics'

describe('comboPattern', () => {
  it('stays a short tap on a single clear', () => {
    expect(comboPattern(1)).toEqual([18])
  })

  it('pulses harder from 5x and rumbles at 10x', () => {
    expect(comboPattern(5).length).toBeGreaterThan(comboPattern(1).length)
    expect(comboPattern(10).length).toBeGreaterThan(comboPattern(5).length)
    const inferno = comboPattern(10).reduce((a, b) => a + b, 0)
    const ember = comboPattern(5).reduce((a, b) => a + b, 0)
    expect(inferno).toBeGreaterThan(ember)
  })

  it('adds extra kick on a 10x perfect clear', () => {
    const perfect = comboPattern(12, true).reduce((a, b) => a + b, 0)
    const inferno = comboPattern(12, false).reduce((a, b) => a + b, 0)
    expect(perfect).toBeGreaterThan(inferno)
  })
})

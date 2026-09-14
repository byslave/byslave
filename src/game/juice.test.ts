import { describe, expect, it } from 'vitest'
import { clearStamp, heatTier } from './juice'

describe('clearStamp', () => {
  it('uses PERFECT when the board empties', () => {
    expect(clearStamp(1, true)).toBe('PERFECT')
  })

  it('names multi-line blasts', () => {
    expect(clearStamp(1, false)).toBe('BLAST!')
    expect(clearStamp(2, false)).toBe('DOUBLE')
    expect(clearStamp(3, false)).toBe('TRIPLE')
    expect(clearStamp(4, false)).toBe('QUAD')
  })
})

describe('heatTier', () => {
  it('keeps low combos neon', () => {
    expect(heatTier(0)).toBe('none')
    expect(heatTier(2)).toBe('none')
    expect(heatTier(3)).toBe('none')
    expect(heatTier(4)).toBe('none')
  })

  it('starts embers after a real streak', () => {
    expect(heatTier(5)).toBe('ember')
    expect(heatTier(6)).toBe('ember')
    expect(heatTier(7)).toBe('flame')
    expect(heatTier(9)).toBe('flame')
  })

  it('ignites the screen at 10x', () => {
    expect(heatTier(10)).toBe('inferno')
    expect(heatTier(14)).toBe('inferno')
  })
})

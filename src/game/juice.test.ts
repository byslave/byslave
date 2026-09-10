import { describe, expect, it } from 'vitest'
import { clearStamp } from './juice'

describe('clearStamp', () => {
  it('uses PERFECT when the board empties', () => {
    expect(clearStamp(1, true)).toBe('PERFECT')
  })

  it('names multi-line blasts', () => {
    expect(clearStamp(1, false)).toBe('PATLAT!')
    expect(clearStamp(2, false)).toBe('DOUBLE')
    expect(clearStamp(3, false)).toBe('TRIPLE')
    expect(clearStamp(4, false)).toBe('QUAD')
  })
})

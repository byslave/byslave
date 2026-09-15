import { describe, expect, it } from 'vitest'
import { validEmail, normalizeEmail } from './auth'

describe('email auth', () => {
  it('accepts a normal address', () => {
    expect(validEmail('Nova@Game.COM')).toBe(true)
    expect(normalizeEmail('Nova@Game.COM')).toBe('nova@game.com')
  })

  it('rejects junk', () => {
    expect(validEmail('')).toBe(false)
    expect(validEmail('nova')).toBe(false)
    expect(validEmail('nova@kabin')).toBe(false)
  })
})

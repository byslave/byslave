import { describe, expect, it } from 'vitest'
import { DEFAULT } from './progress'
import { BOX_COST, DUPLICATE_REFUND, coinsFromGain, openMysteryBox } from './shop'

describe('shop', () => {
  it('converts score gain into neon coins', () => {
    expect(coinsFromGain(7)).toBe(0)
    expect(coinsFromGain(8)).toBe(1)
    expect(coinsFromGain(110)).toBe(13)
  })

  it('refuses a box when the wallet is short', () => {
    const result = openMysteryBox({ ...DEFAULT, coins: BOX_COST - 1 })
    expect(result.ok).toBe(false)
  })

  it('unlocks a new skin and auto-equips it', () => {
    const result = openMysteryBox({ ...DEFAULT, coins: BOX_COST, skins: ['neon'] }, () => 0)
    expect(result.ok).toBe(true)
    if (result.ok === false) return
    expect(result.duplicate).toBe(false)
    expect(result.progress.coins).toBe(0)
    expect(result.progress.skins).toContain(result.drop.id)
    expect(result.progress.equippedSkin).toBe(result.drop.id)
  })

  it('blocks a second open after the wallet is spent', () => {
    const first = openMysteryBox({ ...DEFAULT, coins: BOX_COST, skins: ['neon'] }, () => 0)
    expect(first.ok).toBe(true)
    if (first.ok === false) return
    const second = openMysteryBox(first.progress, () => 0)
    expect(second.ok).toBe(false)
  })

  it('refunds coins when every skin is already owned', () => {
    const skins = [
      'neon',
      'meyve',
      'altin',
      'gumus',
      'rgb',
      'jelibon',
      'pixel',
      'magma',
      'buz',
      'yildiz',
      'disko',
    ] as const
    const result = openMysteryBox({ ...DEFAULT, coins: BOX_COST, skins: [...skins] })
    expect(result.ok).toBe(true)
    if (result.ok === false) return
    expect(result.duplicate).toBe(true)
    expect(result.progress.coins).toBe(DUPLICATE_REFUND)
    expect(result.progress.skins).toHaveLength(skins.length)
  })

  it('drops a collectible type such as gold or fruit', () => {
    const result = openMysteryBox({ ...DEFAULT, coins: BOX_COST, skins: ['neon'] }, () => 0)
    expect(result.ok).toBe(true)
    if (result.ok === false) return
    expect(result.drop.id).not.toBe('neon')
  })
})

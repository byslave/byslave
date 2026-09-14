import { BLAST_SETS, getBlastSet } from './pieces'
import type { BlastSet, Progress } from './types'

export const BOX_COST = 80
export const DUPLICATE_REFUND = 35

export function coinsFromGain(scoreGain: number): number {
  return Math.max(0, Math.floor(scoreGain / 8))
}

export type BoxResult =
  | { ok: true; progress: Progress; drop: BlastSet; duplicate: boolean }
  | { ok: false; error: string }

export function openMysteryBox(progress: Progress, rng: () => number = Math.random): BoxResult {
  if (progress.coins < BOX_COST) {
    return { ok: false, error: `Kutu ${BOX_COST}⚡ ister. Biraz daha patlat.` }
  }

  const owned = new Set(progress.unlocked)
  const pool = BLAST_SETS.filter((set) => !owned.has(set.id))
  let coins = progress.coins - BOX_COST

  if (pool.length === 0) {
    coins += DUPLICATE_REFUND
    return {
      ok: true,
      duplicate: true,
      drop: getBlastSet(progress.equipped),
      progress: { ...progress, coins },
    }
  }

  const drop = pool[Math.floor(rng() * pool.length)] ?? pool[0]!
  return {
    ok: true,
    duplicate: false,
    drop,
    progress: {
      ...progress,
      coins,
      unlocked: [...progress.unlocked, drop.id],
      equipped: drop.id,
    },
  }
}

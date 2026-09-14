export function clearStamp(lines: number, perfect: boolean): string {
  if (perfect) return 'PERFECT'
  if (lines >= 4) return 'QUAD'
  if (lines >= 3) return 'TRIPLE'
  if (lines >= 2) return 'DOUBLE'
  return 'PATLAT!'
}

export type HeatTier = 'none' | 'ember' | 'flame' | 'inferno'

/** 2–4x stays neon. Fire starts later; 10x ignites the screen. */
export function heatTier(combo: number): HeatTier {
  if (combo >= 10) return 'inferno'
  if (combo >= 7) return 'flame'
  if (combo >= 5) return 'ember'
  return 'none'
}

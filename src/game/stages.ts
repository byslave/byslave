import type { Grid, Piece } from './types'

export type ArcadeStage = {
  id: string
  level: number
  name: string
  tagline: string
  minScore: number
  palette: string[]
}

export const STAGES: ArcadeStage[] = [
  {
    id: 'neon',
    level: 1,
    name: 'NEON SOKAK',
    tagline: 'Arcade açılış',
    minScore: 0,
    palette: ['#00C8FF', '#FF2EC8', '#FF8A1F', '#7CFF4A', '#FFE14A', '#A855FF', '#FF5C8A'],
  },
  {
    id: 'jelly',
    level: 2,
    name: 'JELİBON CABİN',
    tagline: 'Tatlı kabin',
    minScore: 800,
    palette: ['#FF4DA6', '#FF8AD4', '#7CFFB2', '#FFE566', '#FF6B6B', '#C77DFF', '#4D9FFF'],
  },
  {
    id: 'magma',
    level: 3,
    name: 'MAGMA CABİN',
    tagline: 'Lav salonu',
    minScore: 2200,
    palette: ['#FF3B1F', '#FF7A18', '#FFE14A', '#FF5C00', '#FF9F1C', '#D72638', '#FFD93D'],
  },
  {
    id: 'cosmo',
    level: 4,
    name: 'KOZMİK CORE',
    tagline: 'Galaksi kabini',
    minScore: 5000,
    palette: ['#7B61FF', '#00E5FF', '#C77DFF', '#4D7CFF', '#E0E7FF', '#9D4EDD', '#48CAE4'],
  },
  {
    id: 'disco',
    level: 5,
    name: 'DİSKO OVERDRIVE',
    tagline: 'Işık fırtınası',
    minScore: 9000,
    palette: ['#FFD60A', '#FF006E', '#8338EC', '#3A86FF', '#FB5607', '#06D6A0', '#FFBE0B'],
  },
  {
    id: 'ultra',
    level: 6,
    name: 'ULTRA REAKTÖR',
    tagline: 'Max kademe',
    minScore: 15000,
    palette: ['#F8F7FF', '#FF2BD6', '#00FFF0', '#C8FF00', '#FF4D00', '#7A5CFF', '#FFE14A'],
  },
]

export function stageForScore(score: number): ArcadeStage {
  let current = STAGES[0]!
  for (const stage of STAGES) {
    if (score >= stage.minScore) current = stage
  }
  return current
}

export function nextStage(stage: ArcadeStage): ArcadeStage | null {
  return STAGES.find((s) => s.level === stage.level + 1) ?? null
}

export function remapColor(color: string, from: string[], to: string[]): string {
  const index = from.findIndex((c) => c.toLowerCase() === color.toLowerCase())
  if (index >= 0) return to[index % to.length] ?? to[0]!
  let hash = 0
  for (let i = 0; i < color.length; i++) hash = (hash + color.charCodeAt(i) * (i + 1)) % to.length
  return to[hash] ?? to[0]!
}

export function remapGrid(grid: Grid, from: string[], to: string[]): Grid {
  return grid.map((row) => row.map((cell) => (cell ? remapColor(cell, from, to) : null)))
}

export function remapPiece(piece: Piece, from: string[], to: string[]): Piece {
  return { ...piece, color: remapColor(piece.color, from, to) }
}

export function stageProgress(score: number, stage: ArcadeStage): number {
  const upcoming = nextStage(stage)
  if (!upcoming) return 1
  const span = upcoming.minScore - stage.minScore
  if (span <= 0) return 1
  return Math.min(1, (score - stage.minScore) / span)
}

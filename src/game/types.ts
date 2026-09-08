export const GRID_SIZE = 8

export type CellColor = string | null
export type Grid = CellColor[][]

export type Piece = {
  id: string
  color: string
  cells: Array<[number, number]>
  rows: number
  cols: number
}

export type ClearResult = {
  grid: Grid
  clearedRows: number[]
  clearedCols: number[]
  lines: number
}

export type PlaceResult = {
  grid: Grid
  placedCells: number
  clear: ClearResult
  scoreGain: number
  combo: number
}

export type TabId = 'play' | 'ranks' | 'crate'

export type BlastSetId =
  | 'neon-yagmuru'
  | 'jelibon-firtinasi'
  | 'kozmik-kupler'
  | 'disko-simsegi'
  | 'magma-cekirdek'
  | 'aurora-dalgasi'

export type BlastSet = {
  id: BlastSetId
  name: string
  tagline: string
  unlock: string
  requiresCombo?: number
  requiresBest?: number
  colors: string[]
  kind: 'rain' | 'jelly' | 'cubes' | 'lightning' | 'magma' | 'aurora'
}

export type Progress = {
  best: number
  maxCombo: number
  gamesPlayed: number
  playerName: string
  equipped: BlastSetId
  unlocked: BlastSetId[]
}

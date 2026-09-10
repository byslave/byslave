export const GRID_SIZE = 8

export type Occupied = {
  color: string
  skin: BlockSkinId
}

export type Cell = Occupied | null
export type Grid = Cell[][]

export type Piece = {
  id: string
  color: string
  skin: BlockSkinId
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

export type FallMove = {
  fromR: number
  fromC: number
  toR: number
  toC: number
  color: string
}

export type BlastEvent =
  | {
      type: 'clear'
      rows: number[]
      cols: number[]
      grid: Grid
      combo: number
      lines: number
    }
  | {
      type: 'fall'
      grid: Grid
      moves: FallMove[]
    }

export type PlaceResult = {
  grid: Grid
  placedGrid: Grid
  placedCells: number
  events: BlastEvent[]
  lines: number
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

export type BlockSkinId =
  | 'neon'
  | 'meyve'
  | 'altin'
  | 'gumus'
  | 'rgb'
  | 'jelibon'
  | 'pixel'
  | 'magma'
  | 'buz'
  | 'yildiz'
  | 'disko'

export type BlockSkin = {
  id: BlockSkinId
  name: string
  tagline: string
  rarity: 'common' | 'rare' | 'epic'
  emoji: string
  motion: boolean
}

export type Progress = {
  best: number
  maxCombo: number
  gamesPlayed: number
  playerName: string
  equipped: BlastSetId
  unlocked: BlastSetId[]
  muted: boolean
  coins: number
  skins: BlockSkinId[]
  equippedSkin: BlockSkinId
}

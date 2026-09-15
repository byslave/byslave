import type { BlastSet, BlockSkinId, Piece } from './types'

export const PALETTE = [
  '#00C8FF',
  '#FF2EC8',
  '#FF8A1F',
  '#7CFF4A',
  '#FFE14A',
  '#A855FF',
  '#FF5C8A',
]

const SHAPES: number[][][] = [
  [[1]],
  [[1, 1]],
  [[1, 1, 1]],
  [[1, 1, 1, 1]],
  [[1, 1, 1, 1, 1]],
  [[1], [1]],
  [[1], [1], [1]],
  [[1], [1], [1], [1]],
  [
    [1, 1],
    [1, 1],
  ],
  [
    [1, 1, 1],
    [1, 1, 1],
  ],
  [
    [1, 1],
    [1, 1],
    [1, 1],
  ],
  [
    [1, 1, 1],
    [1, 1, 1],
    [1, 1, 1],
  ],
  [
    [1, 0],
    [1, 0],
    [1, 1],
  ],
  [
    [0, 1],
    [0, 1],
    [1, 1],
  ],
  [
    [1, 1],
    [1, 0],
    [1, 0],
  ],
  [
    [1, 1],
    [0, 1],
    [0, 1],
  ],
  [
    [1, 0, 0],
    [1, 1, 1],
  ],
  [
    [0, 0, 1],
    [1, 1, 1],
  ],
  [
    [1, 1, 1],
    [1, 0, 0],
  ],
  [
    [1, 1, 1],
    [0, 0, 1],
  ],
  [
    [1, 1, 1],
    [0, 1, 0],
  ],
  [
    [0, 1],
    [1, 1],
    [0, 1],
  ],
  [
    [1, 1, 0],
    [0, 1, 1],
  ],
  [
    [0, 1, 1],
    [1, 1, 0],
  ],
  [
    [1, 0],
    [1, 1],
  ],
  [
    [0, 1],
    [1, 1],
  ],
]

let pieceSeq = 0

export function matrixToPiece(
  matrix: number[][],
  color: string,
  id?: string,
  skin: BlockSkinId = 'neon',
): Piece {
  const cells: Array<[number, number]> = []
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      if (matrix[r][c]) cells.push([r, c])
    }
  }
  return {
    id: id ?? `p-${++pieceSeq}`,
    color,
    skin,
    cells,
    rows: matrix.length,
    cols: matrix[0]?.length ?? 0,
  }
}

export function randomPiece(
  rng: () => number = Math.random,
  palette: string[] = PALETTE,
  skin: BlockSkinId = 'neon',
): Piece {
  const shape = SHAPES[Math.floor(rng() * SHAPES.length)] ?? SHAPES[0]
  const color = palette[Math.floor(rng() * palette.length)] ?? palette[0] ?? PALETTE[0]
  return matrixToPiece(shape, color, undefined, skin)
}

export const BLAST_SETS: BlastSet[] = [
  {
    id: 'neon-yagmuru',
    name: 'Neon Rain',
    tagline: 'Color rain on a 4x combo',
    unlock: 'Starter set',
    colors: ['#00C8FF', '#FF2EC8', '#7CFF4A'],
    kind: 'rain',
  },
  {
    id: 'jelibon-firtinasi',
    name: 'Jelly Storm',
    tagline: 'Candy-dust blasts',
    unlock: 'Unlocks at combo x12',
    requiresCombo: 12,
    colors: ['#FF5C8A', '#FFE14A', '#A855FF', '#7CFF4A'],
    kind: 'jelly',
  },
  {
    id: 'kozmik-kupler',
    name: 'Cosmic Cubes',
    tagline: 'Galaxy shards',
    unlock: 'Starter set',
    colors: ['#A855FF', '#00C8FF', '#E8F1FF'],
    kind: 'cubes',
  },
  {
    id: 'disko-simsegi',
    name: 'Disco Bolt',
    tagline: 'Lightning down the lines',
    unlock: 'Starter set',
    colors: ['#FF8A1F', '#FFE14A', '#FF2EC8'],
    kind: 'lightning',
  },
  {
    id: 'magma-cekirdek',
    name: 'Magma Core',
    tagline: 'Lava splash blast',
    unlock: 'Unlocks at combo x8',
    requiresCombo: 8,
    colors: ['#FF4D1A', '#FF8A1F', '#FFE14A'],
    kind: 'magma',
  },
  {
    id: 'aurora-dalgasi',
    name: 'Aurora Wave',
    tagline: 'Northern-light wave',
    unlock: 'Best score 40,000',
    requiresBest: 40000,
    colors: ['#7CFF4A', '#00C8FF', '#A855FF'],
    kind: 'aurora',
  },
]

export function getBlastSet(id: string): BlastSet {
  return BLAST_SETS.find((s) => s.id === id) ?? BLAST_SETS[0]
}

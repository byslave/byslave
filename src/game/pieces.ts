import type { BlastSet, Piece } from './types'

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

export function matrixToPiece(matrix: number[][], color: string, id?: string): Piece {
  const cells: Array<[number, number]> = []
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      if (matrix[r][c]) cells.push([r, c])
    }
  }
  return {
    id: id ?? `p-${++pieceSeq}`,
    color,
    cells,
    rows: matrix.length,
    cols: matrix[0]?.length ?? 0,
  }
}

export function randomPiece(rng: () => number = Math.random): Piece {
  const shape = SHAPES[Math.floor(rng() * SHAPES.length)] ?? SHAPES[0]
  const color = PALETTE[Math.floor(rng() * PALETTE.length)] ?? PALETTE[0]
  return matrixToPiece(shape, color)
}

export const BLAST_SETS: BlastSet[] = [
  {
    id: 'neon-yagmuru',
    name: 'Neon Yağmuru',
    tagline: 'x4 komboda renk yağmuru',
    unlock: 'Başlangıç seti',
    colors: ['#00C8FF', '#FF2EC8', '#7CFF4A'],
    kind: 'rain',
  },
  {
    id: 'jelibon-firtinasi',
    name: 'Jelibon Fırtınası',
    tagline: 'Tatlı patlamalar, şeker tozu',
    unlock: 'Kombo x12 ile açılır',
    requiresCombo: 12,
    colors: ['#FF5C8A', '#FFE14A', '#A855FF', '#7CFF4A'],
    kind: 'jelly',
  },
  {
    id: 'kozmik-kupler',
    name: 'Kozmik Küpler',
    tagline: 'Galaksi kırıntıları',
    unlock: 'Başlangıç seti',
    colors: ['#A855FF', '#00C8FF', '#E8F1FF'],
    kind: 'cubes',
  },
  {
    id: 'disko-simsegi',
    name: 'Disko Şimşeği',
    tagline: 'Satırları şimşekle yak',
    unlock: 'Başlangıç seti',
    colors: ['#FF8A1F', '#FFE14A', '#FF2EC8'],
    kind: 'lightning',
  },
  {
    id: 'magma-cekirdek',
    name: 'Magma Çekirdek',
    tagline: 'Lav sıçratan patlama',
    unlock: 'Kombo x8 ile açılır',
    requiresCombo: 8,
    colors: ['#FF4D1A', '#FF8A1F', '#FFE14A'],
    kind: 'magma',
  },
  {
    id: 'aurora-dalgasi',
    name: 'Aurora Dalgası',
    tagline: 'Kuzey ışığı dalgası',
    unlock: 'En iyi skor 40.000',
    requiresBest: 40000,
    colors: ['#7CFF4A', '#00C8FF', '#A855FF'],
    kind: 'aurora',
  },
]

export function getBlastSet(id: string): BlastSet {
  return BLAST_SETS.find((s) => s.id === id) ?? BLAST_SETS[0]
}

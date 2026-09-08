import { GRID_SIZE, type Grid, type Piece, type ClearResult, type PlaceResult } from './types'
import { matrixToPiece, randomPiece } from './pieces'

export function emptyGrid(): Grid {
  return Array.from({ length: GRID_SIZE }, () => Array.from({ length: GRID_SIZE }, () => null))
}

export function cloneGrid(grid: Grid): Grid {
  return grid.map((row) => row.slice())
}

export function canPlace(grid: Grid, piece: Piece, row: number, col: number): boolean {
  for (const [pr, pc] of piece.cells) {
    const r = row + pr
    const c = col + pc
    if (r < 0 || c < 0 || r >= GRID_SIZE || c >= GRID_SIZE) return false
    if (grid[r][c]) return false
  }
  return true
}

export function canPlaceAnywhere(grid: Grid, piece: Piece): boolean {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (canPlace(grid, piece, r, c)) return true
    }
  }
  return false
}

export function anyTrayFits(grid: Grid, tray: Array<Piece | null>): boolean {
  return tray.some((piece) => piece !== null && canPlaceAnywhere(grid, piece))
}

export function applyPiece(grid: Grid, piece: Piece, row: number, col: number): Grid {
  const next = cloneGrid(grid)
  for (const [pr, pc] of piece.cells) {
    next[row + pr][col + pc] = piece.color
  }
  return next
}

export function clearCompleted(grid: Grid): ClearResult {
  const fullRows: number[] = []
  const fullCols: number[] = []

  for (let r = 0; r < GRID_SIZE; r++) {
    if (grid[r].every((cell) => cell !== null)) fullRows.push(r)
  }
  for (let c = 0; c < GRID_SIZE; c++) {
    let full = true
    for (let r = 0; r < GRID_SIZE; r++) {
      if (grid[r][c] === null) {
        full = false
        break
      }
    }
    if (full) fullCols.push(c)
  }

  const next = cloneGrid(grid)
  for (const r of fullRows) {
    for (let c = 0; c < GRID_SIZE; c++) next[r][c] = null
  }
  for (const c of fullCols) {
    for (let r = 0; r < GRID_SIZE; r++) next[r][c] = null
  }

  return {
    grid: next,
    clearedRows: fullRows,
    clearedCols: fullCols,
    lines: fullRows.length + fullCols.length,
  }
}

export function scoreForMove(placedCells: number, lines: number, combo: number): number {
  const place = placedCells * 10
  if (lines <= 0) return place
  const lineBonus = lines * lines * 100
  const comboMul = Math.max(1, combo)
  return place + lineBonus * comboMul
}

export function placePiece(
  grid: Grid,
  piece: Piece,
  row: number,
  col: number,
  combo: number,
): PlaceResult | null {
  if (!canPlace(grid, piece, row, col)) return null
  const filled = applyPiece(grid, piece, row, col)
  const clear = clearCompleted(filled)
  const nextCombo = clear.lines > 0 ? combo + 1 : 0
  return {
    grid: clear.grid,
    placedCells: piece.cells.length,
    clear,
    combo: nextCombo,
    scoreGain: scoreForMove(piece.cells.length, clear.lines, nextCombo),
  }
}

export function demoNearClear(): { grid: Grid; tray: Piece[] } {
  const grid = emptyGrid()
  for (let c = 0; c < GRID_SIZE - 1; c++) grid[GRID_SIZE - 1][c] = '#00C8FF'
  grid[4][1] = '#A855FF'
  grid[5][1] = '#A855FF'
  grid[6][1] = '#A855FF'
  grid[6][2] = '#FF8A1F'
  grid[6][3] = '#FF8A1F'
  const tray = [
    matrixToPiece([[1]], '#FFE14A'),
    matrixToPiece(
      [
        [1, 1],
        [1, 1],
      ],
      '#7CFF4A',
    ),
    matrixToPiece([[1], [1], [1], [1]], '#FF2EC8'),
  ]
  return { grid, tray }
}

export function rollTray(rng: () => number = Math.random, attempts = 12, grid?: Grid): Piece[] {
  let best: Piece[] = [randomPiece(rng), randomPiece(rng), randomPiece(rng)]
  if (!grid) return best
  for (let i = 0; i < attempts; i++) {
    const tray = [randomPiece(rng), randomPiece(rng), randomPiece(rng)]
    if (anyTrayFits(grid, tray)) return tray
    best = tray
  }
  return best
}

export function formatScore(n: number): string {
  return n.toLocaleString('tr-TR')
}

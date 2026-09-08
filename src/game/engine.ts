import { GRID_SIZE, type BlastEvent, type FallMove, type Grid, type Piece, type ClearResult, type PlaceResult } from './types'
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

export function applyGravity(grid: Grid): { grid: Grid; moves: FallMove[] } {
  const next = emptyGrid()
  const moves: FallMove[] = []
  for (let c = 0; c < GRID_SIZE; c++) {
    const stack: Array<{ r: number; color: string }> = []
    for (let r = GRID_SIZE - 1; r >= 0; r--) {
      const color = grid[r][c]
      if (color) stack.push({ r, color })
    }
    let dest = GRID_SIZE - 1
    for (const cell of stack) {
      next[dest][c] = cell.color
      if (cell.r !== dest) {
        moves.push({ fromR: cell.r, fromC: c, toR: dest, toC: c, color: cell.color })
      }
      dest -= 1
    }
  }
  return { grid: next, moves }
}

export function resolveBlasts(start: Grid, combo: number): {
  grid: Grid
  events: BlastEvent[]
  combo: number
  lines: number
  scoreGain: number
} {
  let grid = start
  let nextCombo = combo
  let lines = 0
  let scoreGain = 0
  const events: BlastEvent[] = []

  for (let wave = 0; wave < 12; wave++) {
    const clear = clearCompleted(grid)
    if (clear.lines <= 0) break
    nextCombo += 1
    lines += clear.lines
    scoreGain += clear.lines * clear.lines * 100 * nextCombo
    events.push({
      type: 'clear',
      rows: clear.clearedRows,
      cols: clear.clearedCols,
      grid: clear.grid,
      combo: nextCombo,
      lines: clear.lines,
    })
    grid = clear.grid
    const fall = applyGravity(grid)
    if (fall.moves.length === 0) continue
    events.push({ type: 'fall', grid: fall.grid, moves: fall.moves })
    grid = fall.grid
  }

  return { grid, events, combo: events.length ? nextCombo : 0, lines, scoreGain }
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
  const placedGrid = applyPiece(grid, piece, row, col)
  const blast = resolveBlasts(placedGrid, combo)
  return {
    grid: blast.grid,
    placedGrid,
    placedCells: piece.cells.length,
    events: blast.events,
    lines: blast.lines,
    combo: blast.combo,
    scoreGain: piece.cells.length * 10 + blast.scoreGain,
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

export function rollTray(
  rng: () => number = Math.random,
  attempts = 12,
  grid?: Grid,
  palette?: string[],
): Piece[] {
  const paint = palette ?? undefined
  let best: Piece[] = [randomPiece(rng, paint), randomPiece(rng, paint), randomPiece(rng, paint)]
  if (!grid) return best
  for (let i = 0; i < attempts; i++) {
    const tray = [randomPiece(rng, paint), randomPiece(rng, paint), randomPiece(rng, paint)]
    if (anyTrayFits(grid, tray)) return tray
    best = tray
  }
  return best
}

export function formatScore(n: number): string {
  return n.toLocaleString('tr-TR')
}

export function gridEmpty(grid: Grid): boolean {
  return grid.every((row) => row.every((cell) => cell === null))
}

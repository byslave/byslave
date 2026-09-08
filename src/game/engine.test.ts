import { describe, expect, it } from 'vitest'
import { applyPiece, canPlace, clearCompleted, demoNearClear, emptyGrid, placePiece, scoreForMove } from './engine'
import { matrixToPiece } from './pieces'

const cyan = '#00C8FF'

function fillRow(grid: ReturnType<typeof emptyGrid>, row: number, skipCol?: number) {
  for (let c = 0; c < 8; c++) {
    if (c === skipCol) continue
    grid[row][c] = cyan
  }
}

function fillCol(grid: ReturnType<typeof emptyGrid>, col: number, skipRow?: number) {
  for (let r = 0; r < 8; r++) {
    if (r === skipRow) continue
    grid[r][col] = cyan
  }
}

describe('engine', () => {
  it('places a 2x2 square', () => {
    const piece = matrixToPiece(
      [
        [1, 1],
        [1, 1],
      ],
      cyan,
      'sq',
    )
    const grid = emptyGrid()
    expect(canPlace(grid, piece, 0, 0)).toBe(true)
    const next = applyPiece(grid, piece, 0, 0)
    expect(next[0][0]).toBe(cyan)
    expect(next[1][1]).toBe(cyan)
    expect(canPlace(next, piece, 0, 0)).toBe(false)
  })

  it('rejects out of bounds placement', () => {
    const line = matrixToPiece([[1, 1, 1, 1]], cyan, 'line')
    const grid = emptyGrid()
    expect(canPlace(grid, line, 0, 5)).toBe(false)
  })

  it('clears a full row', () => {
    const grid = emptyGrid()
    fillRow(grid, 3, 7)
    const dot = matrixToPiece([[1]], cyan, 'dot')
    const placed = applyPiece(grid, dot, 3, 7)
    const result = clearCompleted(placed)
    expect(result.clearedRows).toEqual([3])
    expect(result.lines).toBe(1)
    expect(result.grid[3].every((c) => c === null)).toBe(true)
  })

  it('clears a full column', () => {
    const grid = emptyGrid()
    fillCol(grid, 2, 0)
    const dot = matrixToPiece([[1]], cyan, 'dot')
    const placed = applyPiece(grid, dot, 0, 2)
    const result = clearCompleted(placed)
    expect(result.clearedCols).toEqual([2])
    expect(result.grid.every((row) => row[2] === null)).toBe(true)
  })

  it('clears row and column together without double-counting lines incorrectly', () => {
    const grid = emptyGrid()
    fillRow(grid, 0, 0)
    fillCol(grid, 0, 0)
    const dot = matrixToPiece([[1]], cyan, 'dot')
    const placed = applyPiece(grid, dot, 0, 0)
    const result = clearCompleted(placed)
    expect(result.clearedRows).toEqual([0])
    expect(result.clearedCols).toEqual([0])
    expect(result.lines).toBe(2)
  })

  it('increments combo only when lines clear', () => {
    const grid = emptyGrid()
    fillRow(grid, 7, 7)
    const dot = matrixToPiece([[1]], cyan, 'dot')
    const hit = placePiece(grid, dot, 7, 7, 2)
    expect(hit?.combo).toBe(3)
    expect(hit?.clear.lines).toBe(1)

    const miss = placePiece(emptyGrid(), dot, 0, 0, 2)
    expect(miss?.combo).toBe(0)
    expect(miss?.scoreGain).toBe(10)
  })

  it('scores multi-line clears with combo multiplier', () => {
    expect(scoreForMove(1, 2, 3)).toBe(10 + 2 * 2 * 100 * 3)
  })

  it('demo board clears the bottom row with a single block', () => {
    const { grid, tray } = demoNearClear()
    const dot = tray[0]!
    const result = placePiece(grid, dot, 7, 7, 0)
    expect(result?.clear.clearedRows).toEqual([7])
    expect(result?.combo).toBe(1)
  })
})

import { describe, expect, it } from 'vitest'
import {
  applyGravity,
  applyPiece,
  canPlace,
  clearCompleted,
  demoNearClear,
  emptyGrid,
  placePiece,
  scoreForMove,
} from './engine'
import { hashPin } from './auth'
import { matrixToPiece } from './pieces'

const cyan = '#00C8FF'
const purple = '#A855FF'

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
    expect(hit?.lines).toBe(1)

    const miss = placePiece(emptyGrid(), dot, 0, 0, 2)
    expect(miss?.combo).toBe(0)
    expect(miss?.scoreGain).toBe(10)
  })

  it('scores multi-line clears with combo multiplier', () => {
    expect(scoreForMove(1, 2, 3)).toBe(10 + 2 * 2 * 100 * 3)
  })

  it('packs floating blocks to the bottom of each column', () => {
    const grid = emptyGrid()
    grid[1][3] = purple
    grid[2][3] = cyan
    const { grid: packed, moves } = applyGravity(grid)
    expect(packed[6][3]).toBe(purple)
    expect(packed[7][3]).toBe(cyan)
    expect(packed[1][3]).toBe(null)
    expect(moves.some((m) => m.fromR === 2 && m.toR === 7)).toBe(true)
  })

  it('drops leftover blocks after a row blast', () => {
    const { grid, tray } = demoNearClear()
    const dot = tray[0]!
    const result = placePiece(grid, dot, 7, 7, 0)
    expect(result?.events[0]?.type).toBe('clear')
    expect(result?.combo).toBe(1)
    expect(result?.grid[7][1]).toBe('#A855FF')
    expect(result?.grid[4][1]).toBe(null)
  })

  it('chains a second blast when fallen blocks refill a row', () => {
    const grid = emptyGrid()
    fillRow(grid, 7, 7)
    for (let c = 0; c < 8; c++) grid[c % 2 === 0 ? 2 : 3][c] = purple
    const dot = matrixToPiece([[1]], cyan, 'dot')
    const result = placePiece(grid, dot, 7, 7, 0)
    expect(result?.lines).toBe(2)
    expect(result?.combo).toBe(2)
    expect(result?.events.filter((e) => e.type === 'clear')).toHaveLength(2)
    expect(result?.grid[7].every((c) => c === null)).toBe(true)
  })
})

describe('auth pin hash', () => {
  it('is stable and name-scoped', () => {
    expect(hashPin('Deniz', '1234')).toBe(hashPin('Deniz', '1234'))
    expect(hashPin('Deniz', '1234')).not.toBe(hashPin('Deniz', '0000'))
    expect(hashPin('Deniz', '1234')).not.toBe(hashPin('Nova', '1234'))
  })
})

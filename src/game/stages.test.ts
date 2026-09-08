import { describe, expect, it } from 'vitest'
import { remapColor, remapGrid, stageForScore, stageProgress, STAGES } from './stages'
import { emptyGrid } from './engine'

describe('arcade stages', () => {
  it('starts on neon street', () => {
    expect(stageForScore(0).id).toBe('neon')
    expect(stageForScore(799).id).toBe('neon')
  })

  it('promotes at score thresholds', () => {
    expect(stageForScore(800).id).toBe('jelly')
    expect(stageForScore(2200).id).toBe('magma')
    expect(stageForScore(5000).id).toBe('cosmo')
    expect(stageForScore(9000).id).toBe('disco')
    expect(stageForScore(15000).id).toBe('ultra')
  })

  it('remaps a block into the next cabinet palette', () => {
    const from = STAGES[0]!.palette
    const to = STAGES[1]!.palette
    expect(remapColor(from[0]!, from, to)).toBe(to[0])
    const grid = emptyGrid()
    grid[0][0] = from[2]!
    expect(remapGrid(grid, from, to)[0][0]).toBe(to[2])
  })

  it('fills the stage bar between thresholds', () => {
    const neon = stageForScore(0)
    expect(stageProgress(0, neon)).toBe(0)
    expect(stageProgress(400, neon)).toBe(0.5)
  })
})

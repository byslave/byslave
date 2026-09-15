import { describe, expect, it } from 'vitest'
import { remapColor, remapGrid, nextMapOnPerfectClear, stageForScore, stageProgress, STAGES } from './stages'
import { emptyGrid, occ } from './engine'

describe('arcade stages', () => {
  it('starts on neon street', () => {
    expect(stageForScore(0).id).toBe('neon')
    expect(stageForScore(1499).id).toBe('neon')
  })

  it('promotes at harder score thresholds', () => {
    expect(stageForScore(1500).id).toBe('jelly')
    expect(stageForScore(4000).id).toBe('magma')
    expect(stageForScore(9000).id).toBe('cosmo')
    expect(stageForScore(16000).id).toBe('disco')
    expect(stageForScore(28000).id).toBe('ultra')
  })

  it('remaps a neon block into the next cabinet palette', () => {
    const from = STAGES[0]!.palette
    const to = STAGES[1]!.palette
    expect(remapColor(from[0]!, from, to)).toBe(to[0])
    const grid = emptyGrid()
    grid[0][0] = occ(from[2]!)
    expect(remapGrid(grid, from, to)[0][0]?.color).toBe(to[2])
    expect(remapGrid(grid, from, to)[0][0]?.skin).toBe('neon')
  })

  it('fills the stage bar between thresholds', () => {
    const neon = stageForScore(0)
    expect(stageProgress(0, neon)).toBe(0)
    expect(stageProgress(750, neon)).toBe(0.5)
  })

  it('only advances the map after a perfect clear and enough score', () => {
    const neon = STAGES[0]!
    expect(nextMapOnPerfectClear(neon, 200)).toBeNull()
    expect(nextMapOnPerfectClear(neon, 1500)?.id).toBe('jelly')
    expect(nextMapOnPerfectClear(STAGES[1]!, 9000)?.id).toBe('magma')
  })
})

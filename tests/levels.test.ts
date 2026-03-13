import { describe, expect, it } from 'vitest'
import { levels } from '../src/engine/levels'
import { BRICK_COLS, BRICK_ROWS } from '../src/engine/types'

describe('levels', () => {
  it('has exactly 20 levels', () => {
    expect(levels).toHaveLength(20)
  })

  it('each level has the correct grid dimensions', () => {
    for (const level of levels) {
      expect(level.grid).toHaveLength(BRICK_ROWS)
      for (const row of level.grid) {
        expect(row).toHaveLength(BRICK_COLS)
      }
    }
  })

  it('each level has at least one destructible brick', () => {
    for (const level of levels) {
      const hasDestructible = level.grid.some((row) =>
        row.some(
          (cell) => cell === 'single' || cell === 'multi2' || cell === 'multi3',
        ),
      )
      expect(
        hasDestructible,
        `level ${level.id} has no destructible bricks`,
      ).toBe(true)
    }
  })

  it('level ids are sequential 1–20', () => {
    for (let i = 0; i < levels.length; i++) {
      expect(levels[i].id).toBe(i + 1)
    }
  })

  it('ballSpeedMultiplier is between 1.0 and 1.8', () => {
    for (const level of levels) {
      expect(level.ballSpeedMultiplier).toBeGreaterThanOrEqual(1.0)
      expect(level.ballSpeedMultiplier).toBeLessThanOrEqual(1.8)
    }
  })
})

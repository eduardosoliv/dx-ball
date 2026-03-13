import { describe, expect, it } from 'vitest'
import {
  applyWidePaddle,
  createActivePowerUp,
  getSlowBallMultiplier,
  isExpired,
  isFireballActive,
  isWidePaddleActive,
  refreshOrAddPowerUp,
  removePowerUp,
} from '../src/engine/powerups'
import type { ActivePowerUp, Paddle } from '../src/engine/types'

const NOW = 1000

describe('createActivePowerUp', () => {
  it('creates widePaddle with 15s expiry', () => {
    const p = createActivePowerUp('widePaddle', NOW)
    expect(p.kind).toBe('widePaddle')
    expect(p.expiresAt).toBe(NOW + 15000)
  })

  it('creates extraLife with expiresAt -1', () => {
    const p = createActivePowerUp('extraLife', NOW)
    expect(p.expiresAt).toBe(-1)
  })
})

describe('isExpired', () => {
  it('returns false for instant power-ups (expiresAt -1)', () => {
    const p: ActivePowerUp = { kind: 'extraLife', expiresAt: -1 }
    expect(isExpired(p, NOW + 99999)).toBe(false)
  })

  it('returns true when current time is past expiresAt', () => {
    const p: ActivePowerUp = { kind: 'widePaddle', expiresAt: NOW + 1000 }
    expect(isExpired(p, NOW + 1001)).toBe(true)
    expect(isExpired(p, NOW + 999)).toBe(false)
  })
})

describe('applyWidePaddle', () => {
  it('sets paddle width to 1.75× base, capped at 2× base', () => {
    const paddle: Paddle = {
      x: 0,
      y: 440,
      width: 80,
      height: 12,
      baseWidth: 80,
    }
    const result = applyWidePaddle(paddle)
    expect(result.width).toBe(80 * 1.75)
  })

  it('caps at 2× base width', () => {
    const paddle: Paddle = {
      x: 0,
      y: 440,
      width: 80,
      height: 12,
      baseWidth: 80,
    }
    const result = applyWidePaddle(paddle)
    expect(result.width).toBeLessThanOrEqual(paddle.baseWidth * 2)
  })
})

describe('getSlowBallMultiplier', () => {
  it('returns 0.6 multiplier when slow ball is active', () => {
    expect(getSlowBallMultiplier(true)).toBe(0.6)
  })

  it('returns 1.0 multiplier when slow ball is not active', () => {
    expect(getSlowBallMultiplier(false)).toBe(1.0)
  })
})

describe('isFireballActive / isWidePaddleActive', () => {
  const active: ActivePowerUp[] = [
    { kind: 'fireball', expiresAt: NOW + 5000 },
    { kind: 'widePaddle', expiresAt: NOW + 5000 },
  ]

  it('detects fireball in active list', () => {
    expect(isFireballActive(active)).toBe(true)
    expect(isFireballActive([])).toBe(false)
  })

  it('detects widePaddle in active list', () => {
    expect(isWidePaddleActive(active)).toBe(true)
    expect(isWidePaddleActive([])).toBe(false)
  })
})

describe('refreshOrAddPowerUp', () => {
  it('resets timer on duplicate widePaddle', () => {
    const existing: ActivePowerUp[] = [
      { kind: 'widePaddle', expiresAt: NOW + 5000 },
    ]
    const result = refreshOrAddPowerUp(existing, 'widePaddle', NOW + 1000)
    expect(result).toHaveLength(1)
    expect(result[0].expiresAt).toBe(NOW + 1000 + 15000)
  })

  it('adds new power-up if not present', () => {
    const result = refreshOrAddPowerUp([], 'fireball', NOW)
    expect(result).toHaveLength(1)
    expect(result[0].kind).toBe('fireball')
  })

  it('adds more multiBall balls instead of replacing', () => {
    const existing: ActivePowerUp[] = [{ kind: 'multiBall', expiresAt: -1 }]
    const result = refreshOrAddPowerUp(existing, 'multiBall', NOW)
    expect(result.filter((p) => p.kind === 'multiBall')).toHaveLength(2)
  })
})

describe('removePowerUp', () => {
  it('removes first matching power-up', () => {
    const list: ActivePowerUp[] = [
      { kind: 'fireball', expiresAt: 999 },
      { kind: 'widePaddle', expiresAt: 999 },
    ]
    const result = removePowerUp(list, 'fireball')
    expect(result.find((p) => p.kind === 'fireball')).toBeUndefined()
    expect(result.find((p) => p.kind === 'widePaddle')).toBeDefined()
  })

  it('returns the same list when kind is not present', () => {
    const list: ActivePowerUp[] = [{ kind: 'widePaddle', expiresAt: 999 }]
    const result = removePowerUp(list, 'fireball')
    expect(result).toBe(list)
  })
})

describe('refreshOrAddPowerUp with multiple items', () => {
  it('refreshes only the matching entry, leaving others unchanged', () => {
    const existing: ActivePowerUp[] = [
      { kind: 'fireball', expiresAt: NOW + 3000 },
      { kind: 'widePaddle', expiresAt: NOW + 5000 },
    ]
    const result = refreshOrAddPowerUp(existing, 'widePaddle', NOW + 1000)
    expect(result).toHaveLength(2)
    expect(result.find((p) => p.kind === 'widePaddle')?.expiresAt).toBe(
      NOW + 1000 + 15000,
    )
    expect(result.find((p) => p.kind === 'fireball')?.expiresAt).toBe(
      NOW + 3000,
    )
  })
})

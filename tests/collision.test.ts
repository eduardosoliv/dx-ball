import { describe, expect, it } from 'vitest'
import {
  ballExitsBottom,
  ballHitsBrick,
  ballHitsCeiling,
  ballHitsLeftWall,
  ballHitsPaddle,
  ballHitsRightWall,
  computePaddleBounceAngle,
  reflectBallWall,
} from '../src/engine/collision'
import type { Ball, Brick, Paddle } from '../src/engine/types'
import { BALL_RADIUS, GAME_HEIGHT, GAME_WIDTH } from '../src/engine/types'

function makeBall(overrides: Partial<Ball> = {}): Ball {
  return {
    x: 320,
    y: 240,
    vx: 100,
    vy: -200,
    radius: BALL_RADIUS,
    isOriginal: true,
    ...overrides,
  }
}

function makeBrick(overrides: Partial<Brick> = {}): Brick {
  return {
    row: 0,
    col: 0,
    type: 'single',
    hitsRemaining: 1,
    destroyed: false,
    x: 100,
    y: 50,
    width: 40,
    height: 16,
    ...overrides,
  }
}

function makePaddle(overrides: Partial<Paddle> = {}): Paddle {
  return { x: 280, y: 440, width: 80, height: 12, baseWidth: 80, ...overrides }
}

describe('wall collisions', () => {
  it('detects left wall hit', () => {
    expect(ballHitsLeftWall(makeBall({ x: BALL_RADIUS }))).toBe(true)
    expect(ballHitsLeftWall(makeBall({ x: BALL_RADIUS + 1 }))).toBe(false)
  })

  it('detects right wall hit', () => {
    expect(ballHitsRightWall(makeBall({ x: GAME_WIDTH - BALL_RADIUS }))).toBe(
      true,
    )
    expect(
      ballHitsRightWall(makeBall({ x: GAME_WIDTH - BALL_RADIUS - 1 })),
    ).toBe(false)
  })

  it('detects ceiling hit', () => {
    expect(ballHitsCeiling(makeBall({ y: BALL_RADIUS }))).toBe(true)
    expect(ballHitsCeiling(makeBall({ y: BALL_RADIUS + 1 }))).toBe(false)
  })

  it('detects bottom exit', () => {
    // ball bottom edge exactly at boundary = exit
    expect(ballExitsBottom(makeBall({ y: GAME_HEIGHT - BALL_RADIUS }))).toBe(
      true,
    )
    // ball bottom edge just above boundary = no exit
    expect(
      ballExitsBottom(makeBall({ y: GAME_HEIGHT - BALL_RADIUS - 1 })),
    ).toBe(false)
  })
})

describe('reflectBallWall', () => {
  it('reflects vx on left/right wall', () => {
    const ball = makeBall({ vx: -100 })
    const result = reflectBallWall(ball, 'x')
    expect(result.vx).toBe(100)
    expect(result.vy).toBe(ball.vy)
  })

  it('reflects vy on ceiling', () => {
    const ball = makeBall({ vy: -200 })
    const result = reflectBallWall(ball, 'y')
    expect(result.vy).toBe(200)
    expect(result.vx).toBe(ball.vx)
  })
})

describe('ballHitsBrick', () => {
  it('detects overlap between ball and brick', () => {
    const ball = makeBall({ x: 120, y: 58 })
    const brick = makeBrick({ x: 100, y: 50, width: 40, height: 16 })
    expect(ballHitsBrick(ball, brick)).not.toBe(false)
  })

  it('returns false when no overlap', () => {
    const ball = makeBall({ x: 300, y: 300 })
    const brick = makeBrick({ x: 100, y: 50, width: 40, height: 16 })
    expect(ballHitsBrick(ball, brick)).toBe(false)
  })

  it('determines horizontal vs vertical collision side — y axis (top/bottom hit)', () => {
    const ball = makeBall({ x: 120, y: 67, vy: -200 })
    const brick = makeBrick({ x: 100, y: 50, width: 40, height: 16 })
    const result = ballHitsBrick(ball, brick)
    expect(result).not.toBe(false)
    if (result !== false) {
      expect(result.axis).toBe('y')
    }
  })

  it('determines x axis for side collision (overlapX < overlapY)', () => {
    // Ball at x=102, y=58 (center of brick): overlapX=10, overlapY=16 → axis='x'
    const ball = makeBall({ x: 102, y: 58 })
    const brick = makeBrick({ x: 100, y: 50, width: 40, height: 16 })
    const result = ballHitsBrick(ball, brick)
    expect(result).not.toBe(false)
    if (result !== false) {
      expect(result.axis).toBe('x')
    }
  })
})

describe('ballHitsPaddle', () => {
  it('detects ball touching paddle from above', () => {
    const paddle = makePaddle({ x: 280, y: 440, width: 80, height: 12 })
    const ball = makeBall({ x: 320, y: 440 - BALL_RADIUS, vy: 200 })
    expect(ballHitsPaddle(ball, paddle)).toBe(true)
  })

  it('returns false when ball is above paddle x range', () => {
    const paddle = makePaddle({ x: 280, y: 440 })
    const ball = makeBall({ x: 100, y: 440, vy: 200 })
    expect(ballHitsPaddle(ball, paddle)).toBe(false)
  })
})

describe('computePaddleBounceAngle', () => {
  it('returns near-vertical angle for center hit', () => {
    const paddle = makePaddle({ x: 280, width: 80 })
    const angle = computePaddleBounceAngle(320, paddle)
    expect(angle).toBeGreaterThan(Math.PI / 2 - 0.15)
    expect(angle).toBeLessThan(Math.PI / 2 + 0.15)
  })

  it('returns shallow angle for edge hit', () => {
    const paddle = makePaddle({ x: 280, width: 80 })
    const angle = computePaddleBounceAngle(282, paddle)
    expect(angle).toBeGreaterThan(Math.PI * 0.8)
  })
})

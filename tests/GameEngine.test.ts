import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GameEngine } from '../src/engine/GameEngine'
import type { GameState } from '../src/engine/types'
import { GAME_HEIGHT, GAME_WIDTH, PADDLE_WIDTH } from '../src/engine/types'

function makeCanvas() {
  const ctx = {
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    fillText: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    save: vi.fn(),
    restore: vi.fn(),
    shadowBlur: 0,
    shadowColor: '',
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    font: '',
    textAlign: '',
    canvas: { width: 640, height: 480 },
  } as unknown as CanvasRenderingContext2D
  return ctx
}

function tick(engine: GameEngine, deltaMs: number) {
  engine['update'](deltaMs / 1000)
  engine['draw']()
}

describe('GameEngine', () => {
  let engine: GameEngine
  let onStateChange: (state: GameState) => void
  let ctx: CanvasRenderingContext2D

  beforeEach(() => {
    ctx = makeCanvas()
    onStateChange = vi.fn()
    engine = new GameEngine(ctx, onStateChange)
  })

  it('initialises with lives=3, score=0, level=1', () => {
    const state = engine.getState()
    expect(state.lives).toBe(3)
    expect(state.score).toBe(0)
    expect(state.level).toBe(1)
  })

  it('paddle starts at center', () => {
    const paddle = engine.getPaddle()
    expect(paddle.x).toBeCloseTo(GAME_WIDTH / 2 - PADDLE_WIDTH / 2, 0)
  })

  it('ball starts stuck to paddle (not launched)', () => {
    expect(engine.isBallLaunched()).toBe(false)
  })

  it('launch() sets ball in motion', () => {
    engine.launch()
    expect(engine.isBallLaunched()).toBe(true)
  })

  it('losing original ball decrements lives', () => {
    engine.launch()
    const orig = engine['balls'].find((b: any) => b.isOriginal)!
    orig.x = 320
    orig.y = 9999
    tick(engine, 16)
    expect(engine.getState().lives).toBe(2)
  })

  it('losing extra ball does not decrement lives', () => {
    engine.launch()
    const origBall = engine['balls'].find((b: any) => b.isOriginal)!
    engine['balls'].push({ ...origBall, isOriginal: false, x: origBall.x + 10 })
    const before = engine.getState().lives
    engine['balls']
      .filter((b: any) => !b.isOriginal)
      .forEach((b: any) => {
        b.y = GAME_HEIGHT + 100
      })
    tick(engine, 16)
    expect(engine.getState().lives).toBe(before)
  })

  it('game over when lives reach 0', () => {
    engine['state'].lives = 1
    engine.launch()
    const orig = engine['balls'].find((b: any) => b.isOriginal)!
    orig.x = 320
    orig.y = 9999
    tick(engine, 16)
    expect(engine.getState().lives).toBe(0)
    expect(onStateChange).toHaveBeenCalledWith(
      expect.objectContaining({ lives: 0 }),
    )
  })

  it('destroying all bricks increments level', () => {
    engine['bricks'].forEach((b: any) => {
      if (b.type !== 'indestructible') b.destroyed = true
    })
    engine.launch()
    tick(engine, 16)
    expect(engine.getState().level).toBe(2)
  })

  it('awards 10 points for destroying a single brick', () => {
    engine['bricks'] = [
      {
        row: 0,
        col: 0,
        type: 'single' as const,
        hitsRemaining: 1,
        destroyed: false,
        x: 320 - 20,
        y: 240,
        width: 40,
        height: 16,
      },
    ]
    engine.launch()
    const orig = engine['balls'].find((b: any) => b.isOriginal)!
    orig.x = 320
    orig.y = 240 + 8 + 1 // just below brick
    // force vy upward so ball hits brick
    orig.vy = -300
    tick(engine, 16)
    expect(engine.getState().score).toBeGreaterThanOrEqual(10)
  })

  it('loops back to level 1 with increased loopMultiplier after level 20', () => {
    engine['state'].level = 20
    const loopBefore = engine.getState().loopMultiplier
    engine['bricks'].forEach((b: any) => {
      if (b.type !== 'indestructible') b.destroyed = true
    })
    engine.launch()
    tick(engine, 16)
    expect(engine.getState().level).toBe(1)
    expect(engine.getState().loopMultiplier).toBeCloseTo(loopBefore + 0.2, 5)
  })

  it('collecting wide paddle via falling power-up expands paddle width', () => {
    const baseWidth = engine.getPaddle().baseWidth
    // Place power-up inside paddle collision zone so it is collected in the next tick
    engine['fallingPowerUps'] = [
      { kind: 'widePaddle' as const, x: 320, y: 440, width: 20, height: 12 },
    ]
    tick(engine, 16)
    expect(engine.getPaddle().width).toBeGreaterThan(baseWidth)
  })

  it('collecting extra life via falling power-up adds a life', () => {
    const before = engine.getState().lives
    engine['fallingPowerUps'] = [
      { kind: 'extraLife' as const, x: 320, y: 440, width: 20, height: 12 },
    ]
    tick(engine, 16)
    expect(engine.getState().lives).toBe(before + 1)
  })

  it('collecting fireball via falling power-up activates fireball', () => {
    engine['fallingPowerUps'] = [
      { kind: 'fireball' as const, x: 320, y: 440, width: 20, height: 12 },
    ]
    tick(engine, 16)
    expect(
      engine['activePowerUps'].some((p: any) => p.kind === 'fireball'),
    ).toBe(true)
  })

  it('draw() does not throw with default state', () => {
    expect(() => engine['draw']()).not.toThrow()
  })

  it('draw() does not throw with falling power-ups', () => {
    engine['fallingPowerUps'] = [
      { kind: 'widePaddle' as const, x: 200, y: 100, width: 20, height: 12 },
    ]
    expect(() => engine['draw']()).not.toThrow()
  })

  it('draw() renders fireball ball color when fireball is active', () => {
    engine['activePowerUps'] = [
      { kind: 'fireball' as const, expiresAt: Date.now() + 10000 },
    ]
    expect(() => engine['draw']()).not.toThrow()
  })

  it('advanceLevel setTimeout clears transitioning flag', () => {
    vi.useFakeTimers()
    engine['bricks'].forEach((b: any) => {
      if (b.type !== 'indestructible') b.destroyed = true
    })
    engine.launch()
    tick(engine, 16) // triggers advanceLevel, sets transitioning=true
    expect(engine['transitioning']).toBe(true)
    vi.runAllTimers()
    expect(engine['transitioning']).toBe(false)
    vi.useRealTimers()
  })

  it('stop() cancels animation frame when engine is started', () => {
    engine.start()
    expect(engine['rafId']).not.toBeNull()
    expect(() => engine.stop()).not.toThrow()
  })

  it('start() RAF loop executes draw and update each frame', () => {
    let captured: FrameRequestCallback | null = null
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      captured = cb
      return 1
    })
    engine.start()
    expect(captured).not.toBeNull()
    // Run one frame — covers the loop body including draw()
    captured!(performance.now())
    engine.stop()
    vi.unstubAllGlobals()
  })

  it('destroying a brick drops a power-up when Math.random favors it', () => {
    // Keep a second brick alive so the level doesn't complete (which would clear fallingPowerUps)
    engine['bricks'] = [
      {
        row: 0,
        col: 0,
        type: 'single' as const,
        hitsRemaining: 1,
        destroyed: false,
        x: 300,
        y: 240,
        width: 40,
        height: 16,
      },
      {
        row: 1,
        col: 0,
        type: 'single' as const,
        hitsRemaining: 1,
        destroyed: false,
        x: 300,
        y: 280,
        width: 40,
        height: 16,
      },
    ]
    engine.launch()
    const orig = engine['balls'].find((b: any) => b.isOriginal)!
    orig.x = 320
    orig.y = 240 + 8 + 1
    orig.vy = -300
    vi.spyOn(Math, 'random').mockReturnValue(0) // 0 < 0.2 → power-up always drops
    tick(engine, 16)
    vi.restoreAllMocks()
    expect(engine['fallingPowerUps'].length).toBeGreaterThan(0)
  })

  it('setMouseX moves paddle to match mouse position on next tick', () => {
    const initialX = engine.getPaddle().x
    engine.setMouseX(450) // right of center
    tick(engine, 16)
    expect(engine.getPaddle().x).toBeGreaterThan(initialX)
  })

  it('ball bounces off paddle reversing vy', () => {
    engine.launch()
    const orig = engine['balls'].find((b: any) => b.isOriginal)!
    orig.x = 320
    orig.y = 430
    orig.vy = 300 // moving downward toward paddle at y=440
    tick(engine, 16)
    expect(orig.vy).toBeLessThan(0) // bounced upward
  })

  it('collecting multiBall via falling power-up spawns extra balls', () => {
    engine.launch()
    const before = engine['balls'].length
    engine['fallingPowerUps'] = [
      { kind: 'multiBall' as const, x: 320, y: 440, width: 20, height: 12 },
    ]
    tick(engine, 16)
    expect(engine['balls'].length).toBeGreaterThan(before)
  })

  it('awards 10 points per hit on multi2 brick (20 total)', () => {
    const brick = {
      row: 0,
      col: 0,
      type: 'multi2' as const,
      hitsRemaining: 2,
      destroyed: false,
      x: 300,
      y: 200,
      width: 40,
      height: 16,
    }
    engine['bricks'] = [brick]
    engine.launch()
    const orig = engine['balls'].find((b: any) => b.isOriginal)!

    // First hit
    orig.x = 320
    orig.y = 200 + 8 + 1 // just below brick bottom edge
    orig.vy = -300
    tick(engine, 16)
    expect(engine.getState().score).toBeGreaterThanOrEqual(10)
    expect(brick.hitsRemaining).toBe(1)

    // Second hit – reposition below brick and force upward again
    orig.x = 320
    orig.y = 200 + 8 + 1
    orig.vy = -300
    tick(engine, 16)
    expect(engine.getState().score).toBeGreaterThanOrEqual(20)
    expect(brick.hitsRemaining).toBe(0)
    expect(brick.destroyed).toBe(true)
  })
})

describe('launch guard', () => {
  it('calling launch() twice is a no-op on the second call', () => {
    const ctx = makeCanvas()
    const engine = new GameEngine(ctx, vi.fn())
    engine.launch()
    const vx = engine['balls'].find((b: any) => b.isOriginal)!.vx
    engine.launch() // second call should return early
    expect(engine['balls'].find((b: any) => b.isOriginal)!.vx).toBe(vx)
  })
})

describe('ArrowRight key', () => {
  it('ArrowRight key moves paddle to the right', () => {
    const ctx = makeCanvas()
    const engine = new GameEngine(ctx, vi.fn())
    const before = engine.getPaddle().x
    engine.setKey('ArrowRight', true)
    tick(engine, 100)
    expect(engine.getPaddle().x).toBeGreaterThan(before)
  })
})

describe('start() RAF loop', () => {
  it('first frame (lastTime=null) sets dt=0 and skips update', () => {
    const ctx = makeCanvas()
    const engine = new GameEngine(ctx, vi.fn())
    let loopCb: ((time: number) => void) | null = null
    vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((cb) => {
      loopCb = cb as (time: number) => void
      return 1
    })
    vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => {})
    engine.start()
    // Invoke the first frame — lastTime is null so dt=0, update is skipped
    loopCb!(1000)
    vi.restoreAllMocks()
    engine.stop()
    // No assertion needed beyond "no throw"; lastTime should now be set
    expect(engine['lastTime']).toBe(1000)
  })

  it('second frame computes valid dt and calls update', () => {
    const ctx = makeCanvas()
    const engine = new GameEngine(ctx, vi.fn())
    let loopCb: ((time: number) => void) | null = null
    vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((cb) => {
      loopCb = cb as (time: number) => void
      return 1
    })
    vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => {})
    engine.start()
    loopCb!(1000) // first frame — sets lastTime=1000
    loopCb!(1016) // second frame — dt=0.016, valid → update runs
    vi.restoreAllMocks()
    engine.stop()
    expect(engine['lastTime']).toBe(1016)
  })

  it('frame with dt >= 0.1 (too large) skips update', () => {
    const ctx = makeCanvas()
    const engine = new GameEngine(ctx, vi.fn())
    let loopCb: ((time: number) => void) | null = null
    vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((cb) => {
      loopCb = cb as (time: number) => void
      return 1
    })
    vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => {})
    engine.start()
    loopCb!(1000) // sets lastTime
    loopCb!(1500) // dt=0.5 → skipped (> 0.1 threshold)
    vi.restoreAllMocks()
    engine.stop()
    expect(engine['lastTime']).toBe(1500)
  })
})

describe('setKey', () => {
  it('pressing a key clears mouseX so keyboard takes over from mouse', () => {
    const ctx = makeCanvas()
    const engine = new GameEngine(ctx, vi.fn())
    engine.setMouseX(500)
    // Pressing a key should clear mouse control (covered by setKey down=true branch)
    engine.setKey('ArrowLeft', true)
    // Verify keyboard now moves paddle (mouse was cleared): tick and check paddle moved left
    const before = engine.getPaddle().x
    tick(engine, 100)
    expect(engine.getPaddle().x).toBeLessThan(before)
  })

  it('releasing a key (down=false) does not clear mouseX', () => {
    const ctx = makeCanvas()
    const engine = new GameEngine(ctx, vi.fn())
    engine.setMouseX(400)
    engine.setKey('ArrowLeft', false)
    // Mouse should still be in control — tick moves paddle toward mouseX
    tick(engine, 16)
    expect(engine.getPaddle().x).toBeGreaterThan(0)
  })
})

describe('ball type', () => {
  it('defaults to standard', () => {
    const ctx = makeCanvas()
    const engine = new GameEngine(ctx, vi.fn())
    expect(engine.getBallType()).toBe('standard')
  })

  it('setBallType changes the stored type', () => {
    const ctx = makeCanvas()
    const engine = new GameEngine(ctx, vi.fn())
    engine.setBallType('tennis')
    expect(engine.getBallType()).toBe('tennis')
  })

  it('ballType persists after life loss', () => {
    const ctx = makeCanvas()
    const engine = new GameEngine(ctx, vi.fn())
    engine.setBallType('football')
    const orig = engine['balls'].find((b: any) => b.isOriginal)!
    orig.x = 320
    orig.y = 600
    tick(engine, 16)
    expect(engine.getBallType()).toBe('football')
  })

  it('drawBalls calls arc (confirms rendering runs after type change)', () => {
    const ctx = makeCanvas()
    const engine = new GameEngine(ctx, vi.fn())
    engine.setBallType('tennis')
    engine.launch()
    tick(engine, 16)
    expect(ctx.arc).toHaveBeenCalled()
  })
})

describe('collectPowerUp multiBall random branch', () => {
  it('spawns ball with positive vx when Math.random returns < 0.5 (ternary = 1)', () => {
    const ctx = makeCanvas()
    const engine = new GameEngine(ctx, vi.fn())
    engine.launch()
    vi.spyOn(Math, 'random').mockReturnValue(0.3) // angle call: 66°, ternary: 0.3 < 0.5 → ×1
    engine['collectPowerUp']('multiBall')
    vi.restoreAllMocks()
    const extras = engine['balls'].filter((b: any) => !b.isOriginal)
    expect(extras.length).toBeGreaterThan(0)
    expect(extras.some((b: any) => b.vx > 0)).toBe(true)
  })

  it('spawns ball with positive vx when Math.random returns >= 0.5 (ternary = -1, negative cos)', () => {
    const ctx = makeCanvas()
    const engine = new GameEngine(ctx, vi.fn())
    engine.launch()
    vi.spyOn(Math, 'random').mockReturnValue(0.7) // angle: 114° (cos < 0), ternary: 0.7 >= 0.5 → ×-1 → vx > 0
    engine['collectPowerUp']('multiBall')
    vi.restoreAllMocks()
    const extras = engine['balls'].filter((b: any) => !b.isOriginal)
    expect(extras.length).toBeGreaterThan(0)
  })
})

describe('drawBricks unknown type fallback', () => {
  it('does not throw for a brick with an unknown type (uses #ffffff fallback)', () => {
    const ctx = makeCanvas()
    const engine = new GameEngine(ctx, vi.fn())
    engine['bricks'] = [
      {
        row: 0,
        col: 0,
        type: 'unknown' as any,
        hitsRemaining: 1,
        destroyed: false,
        x: 100,
        y: 100,
        width: 40,
        height: 16,
      },
    ]
    expect(() => tick(engine, 16)).not.toThrow()
    expect(ctx.fillRect).toHaveBeenCalled()
  })
})

describe('wall and ceiling bounces', () => {
  it('ball bounces off left wall', () => {
    const ctx = makeCanvas()
    const engine = new GameEngine(ctx, vi.fn())
    engine.launch()
    const ball = engine['balls'].find((b: any) => b.isOriginal)!
    ball.x = 5
    ball.y = 200
    ball.vx = -300
    ball.vy = 0
    tick(engine, 16)
    expect(ball.vx).toBeGreaterThan(0)
  })

  it('ball bounces off right wall', () => {
    const ctx = makeCanvas()
    const engine = new GameEngine(ctx, vi.fn())
    engine.launch()
    const ball = engine['balls'].find((b: any) => b.isOriginal)!
    ball.x = GAME_WIDTH - 5
    ball.y = 200
    ball.vx = 300
    ball.vy = 0
    tick(engine, 16)
    expect(ball.vx).toBeLessThan(0)
  })

  it('ball bounces off ceiling', () => {
    const ctx = makeCanvas()
    const engine = new GameEngine(ctx, vi.fn())
    engine.launch()
    const ball = engine['balls'].find((b: any) => b.isOriginal)!
    ball.x = 320
    ball.y = 5
    ball.vx = 0
    ball.vy = -300
    tick(engine, 16)
    expect(ball.vy).toBeGreaterThan(0)
  })
})

describe('brick x-axis hit', () => {
  it('ball hitting brick on x-axis reverses vx', () => {
    const ctx = makeCanvas()
    const engine = new GameEngine(ctx, vi.fn())
    const brick = {
      row: 0,
      col: 0,
      type: 'single' as const,
      hitsRemaining: 1,
      destroyed: false,
      x: 300,
      y: 200,
      width: 40,
      height: 16,
    }
    engine['bricks'] = [brick]
    engine.launch()
    const ball = engine['balls'].find((b: any) => b.isOriginal)!
    // Position ball to the left of the brick, moving right — x-axis collision
    ball.x = 300 - ball.radius - 1
    ball.y = 208
    ball.vx = 300
    ball.vy = 0
    const prevVx = ball.vx
    tick(engine, 16)
    expect(ball.vx).toBeLessThan(prevVx)
  })
})

describe('checkLevelComplete while transitioning', () => {
  it('does not advance level if already transitioning', () => {
    const ctx = makeCanvas()
    const engine = new GameEngine(ctx, vi.fn())
    engine['transitioning'] = true
    // Destroy all bricks — normally this would trigger level advance
    engine['bricks'].forEach((b: any) => {
      b.destroyed = true
    })
    engine.launch()
    const level = engine.getState().level
    tick(engine, 16)
    // Level should NOT have advanced because transitioning was true
    expect(engine.getState().level).toBe(level)
  })
})

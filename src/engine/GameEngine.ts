import type { BallType } from './ballRenderers'
import { drawBall } from './ballRenderers'
import {
  ballExitsBottom,
  ballHitsBrick,
  ballHitsCeiling,
  ballHitsLeftWall,
  ballHitsPaddle,
  ballHitsRightWall,
  computePaddleBounceAngle,
  reflectBallWall,
} from './collision'
import { levels } from './levels'
import {
  applyWidePaddle,
  filterExpired,
  getSlowBallMultiplier,
  isFireballActive,
  isSlowBallActive,
  isWidePaddleActive,
  refreshOrAddPowerUp,
} from './powerups'
import type {
  ActivePowerUp,
  Ball,
  Brick,
  FallingPowerUp,
  GameState,
  Paddle,
  PowerUpKind,
} from './types'
import {
  BALL_RADIUS,
  BASE_SPEED,
  BRICK_COLS,
  BRICK_HEIGHT,
  BRICK_OFFSET_LEFT,
  BRICK_OFFSET_TOP,
  BRICK_PADDING,
  BRICK_ROWS,
  BRICK_WIDTH,
  GAME_HEIGHT,
  GAME_WIDTH,
  PADDLE_HEIGHT,
  PADDLE_KEYBOARD_SPEED,
  PADDLE_WIDTH,
  PADDLE_Y,
  POWERUP_FALL_SPEED,
} from './types'

const POWERUP_DROP_CHANCE = 0.2
const MAX_BALLS = 6

const POWERUP_KINDS: PowerUpKind[] = [
  'widePaddle',
  'multiBall',
  'slowBall',
  'extraLife',
  'fireball',
]

function randomPowerUpKind(): PowerUpKind {
  return POWERUP_KINDS[Math.floor(Math.random() * POWERUP_KINDS.length)]
}

function buildBricks(levelIndex: number): Brick[] {
  const level = levels[levelIndex]
  const bricks: Brick[] = []
  for (let row = 0; row < BRICK_ROWS; row++) {
    for (let col = 0; col < BRICK_COLS; col++) {
      const type = level.grid[row][col]
      if (type === 'empty') continue
      const hitsMap: Record<string, number> = {
        single: 1,
        multi2: 2,
        multi3: 3,
        indestructible: Infinity,
      }
      bricks.push({
        row,
        col,
        type,
        hitsRemaining: hitsMap[type],
        destroyed: false,
        x: BRICK_OFFSET_LEFT + col * (BRICK_WIDTH + BRICK_PADDING),
        y: BRICK_OFFSET_TOP + row * (BRICK_HEIGHT + BRICK_PADDING),
        width: BRICK_WIDTH,
        height: BRICK_HEIGHT,
      })
    }
  }
  return bricks
}

function makeBallOnPaddle(paddle: Paddle): Ball {
  return {
    x: paddle.x + paddle.width / 2,
    y: paddle.y - BALL_RADIUS - 1,
    vx: 0,
    vy: 0,
    radius: BALL_RADIUS,
    isOriginal: true,
  }
}

export class GameEngine {
  private ctx: CanvasRenderingContext2D
  private onStateChange: (state: GameState) => void

  private state: GameState = {
    screen: 'game',
    score: 0,
    lives: 3,
    level: 1,
    loopMultiplier: 1.0,
  }
  private paddle: Paddle
  private balls: Ball[] = []
  private bricks: Brick[] = []
  private fallingPowerUps: FallingPowerUp[] = []
  private activePowerUps: ActivePowerUp[] = []
  private ballLaunched = false
  private rafId: number | null = null
  private lastTime: number | null = null
  private keys: { ArrowLeft: boolean; ArrowRight: boolean } = {
    ArrowLeft: false,
    ArrowRight: false,
  }
  private mouseX: number | null = null
  private paused = false
  private ballType: BallType = 'standard'
  private transitioning = false

  constructor(
    ctx: CanvasRenderingContext2D,
    onStateChange: (state: GameState) => void,
  ) {
    this.ctx = ctx
    this.onStateChange = onStateChange
    this.paddle = this.makePaddle()
    this.balls = [makeBallOnPaddle(this.paddle)]
    this.bricks = buildBricks(0)
  }

  private makePaddle(): Paddle {
    return {
      x: GAME_WIDTH / 2 - PADDLE_WIDTH / 2,
      y: PADDLE_Y,
      width: PADDLE_WIDTH,
      height: PADDLE_HEIGHT,
      baseWidth: PADDLE_WIDTH,
    }
  }

  getState(): GameState {
    return { ...this.state }
  }
  getPaddle(): Paddle {
    return { ...this.paddle }
  }
  isBallLaunched(): boolean {
    return this.ballLaunched
  }

  // --- Input ---
  setMouseX(canvasX: number) {
    this.mouseX = canvasX
  }
  setKey(key: 'ArrowLeft' | 'ArrowRight', down: boolean) {
    this.keys[key] = down
    if (down) this.mouseX = null
  }
  setPaused(p: boolean) {
    this.paused = p
  }
  setBallType(type: BallType) {
    this.ballType = type
  }
  getBallType(): BallType {
    return this.ballType
  }

  launch() {
    if (this.ballLaunched) return
    this.ballLaunched = true
    const angleDeg = 75 + Math.random() * 30
    const angle = (angleDeg * Math.PI) / 180
    const speed = this.computeEffectiveSpeed()
    const orig = this.balls.find((b) => b.isOriginal)!
    orig.vx = Math.cos(angle) * speed * (Math.random() < 0.5 ? 1 : -1)
    orig.vy = -Math.sin(angle) * speed
  }

  private computeEffectiveSpeed(): number {
    const level = levels[this.state.level - 1]
    const slowMult = getSlowBallMultiplier(
      isSlowBallActive(this.activePowerUps),
    )
    return (
      BASE_SPEED *
      level.ballSpeedMultiplier *
      this.state.loopMultiplier *
      slowMult
    )
  }

  // --- Main loop ---
  start() {
    const loop = (time: number) => {
      if (!this.paused && !this.transitioning) {
        const dt = this.lastTime == null ? 0 : (time - this.lastTime) / 1000
        this.lastTime = time
        if (dt > 0 && dt < 0.1) this.update(dt)
      }
      this.draw()
      this.rafId = requestAnimationFrame(loop)
    }
    this.rafId = requestAnimationFrame(loop)
  }

  stop() {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId)
  }

  private update(dt: number) {
    this.updatePaddle(dt)
    this.updateBalls(dt)
    this.updateFallingPowerUps(dt)
    this.activePowerUps = filterExpired(this.activePowerUps, Date.now())
    this.syncPaddleWidth()
  }

  private updatePaddle(dt: number) {
    if (this.mouseX !== null) {
      this.paddle.x = Math.max(
        0,
        Math.min(
          GAME_WIDTH - this.paddle.width,
          this.mouseX - this.paddle.width / 2,
        ),
      )
    } else {
      if (this.keys.ArrowLeft)
        this.paddle.x = Math.max(0, this.paddle.x - PADDLE_KEYBOARD_SPEED * dt)
      if (this.keys.ArrowRight)
        this.paddle.x = Math.min(
          GAME_WIDTH - this.paddle.width,
          this.paddle.x + PADDLE_KEYBOARD_SPEED * dt,
        )
    }
    if (!this.ballLaunched) {
      const orig = this.balls.find((b) => b.isOriginal)!
      orig.x = this.paddle.x + this.paddle.width / 2
      orig.y = this.paddle.y - BALL_RADIUS - 1
    }
  }

  private updateBalls(dt: number) {
    const fireball = isFireballActive(this.activePowerUps)
    const toRemove: Ball[] = []

    for (const ball of this.balls) {
      if (!this.ballLaunched && ball.isOriginal) continue

      ball.x += ball.vx * dt
      ball.y += ball.vy * dt

      if (ballHitsLeftWall(ball)) {
        const b = reflectBallWall(ball, 'x')
        ball.vx = b.vx
        ball.x = ball.radius
      }
      if (ballHitsRightWall(ball)) {
        const b = reflectBallWall(ball, 'x')
        ball.vx = b.vx
        ball.x = GAME_WIDTH - ball.radius
      }
      if (ballHitsCeiling(ball)) {
        const b = reflectBallWall(ball, 'y')
        ball.vy = b.vy
        ball.y = ball.radius
      }

      if (ballExitsBottom(ball)) {
        toRemove.push(ball)
        if (ball.isOriginal) this.handleLifeLost()
        continue
      }

      if (ballHitsPaddle(ball, this.paddle)) {
        const angle = computePaddleBounceAngle(ball.x, this.paddle)
        const speed = this.computeEffectiveSpeed()
        ball.vx = Math.cos(angle) * speed
        ball.vy = -Math.sin(angle) * speed
        ball.y = this.paddle.y - ball.radius - 1
        continue
      }

      for (const brick of this.bricks) {
        if (brick.destroyed) continue
        const hit = ballHitsBrick(ball, brick)
        if (!hit) continue

        if (!fireball) {
          if (hit.axis === 'x') ball.vx = -ball.vx
          else ball.vy = -ball.vy
        }

        if (brick.type !== 'indestructible') {
          brick.hitsRemaining--
          this.state.score += 10
          this.onStateChange({ ...this.state })

          if (brick.hitsRemaining === 0) {
            brick.destroyed = true
            if (Math.random() < POWERUP_DROP_CHANCE) {
              this.fallingPowerUps.push({
                kind: randomPowerUpKind(),
                x: brick.x + brick.width / 2,
                y: brick.y,
                width: 20,
                height: 12,
              })
            }
          }
        }

        if (!fireball) break
      }
    }

    this.balls = this.balls.filter((b) => !toRemove.includes(b))
    this.checkLevelComplete()
  }

  private handleLifeLost() {
    this.state.lives--
    this.activePowerUps = []
    this.fallingPowerUps = []
    this.ballLaunched = false
    this.paddle = this.makePaddle()

    if (this.state.lives <= 0) {
      this.onStateChange({ ...this.state, screen: 'gameover' })
      this.state.screen = 'gameover'
    } else {
      // Original ball was already removed from this.balls by updateBalls; spawn fresh one.
      this.balls = [makeBallOnPaddle(this.paddle)]
      this.onStateChange({ ...this.state })
    }
  }

  private checkLevelComplete() {
    if (this.transitioning) return
    const hasDestructible = this.bricks.some(
      (b) => !b.destroyed && b.type !== 'indestructible',
    )
    if (!hasDestructible) this.advanceLevel()
  }

  private advanceLevel() {
    this.transitioning = true

    let nextLevel = this.state.level + 1
    let loopMultiplier = this.state.loopMultiplier
    if (nextLevel > 20) {
      nextLevel = 1
      loopMultiplier += 0.2
    }

    this.state.level = nextLevel
    this.state.loopMultiplier = loopMultiplier
    this.activePowerUps = []
    this.fallingPowerUps = []
    this.bricks = buildBricks(nextLevel - 1)
    this.paddle = this.makePaddle()
    this.balls = [makeBallOnPaddle(this.paddle)]
    this.ballLaunched = false

    this.onStateChange({ ...this.state, screen: 'levelComplete' })

    setTimeout(() => {
      this.transitioning = false
      this.onStateChange({ ...this.state })
    }, 2000)
  }

  private updateFallingPowerUps(dt: number) {
    for (const pu of this.fallingPowerUps) {
      pu.y += POWERUP_FALL_SPEED * dt

      const puLeft = pu.x - pu.width / 2
      const puRight = pu.x + pu.width / 2
      const puBottom = pu.y + pu.height

      if (
        puBottom >= this.paddle.y &&
        pu.y <= this.paddle.y + this.paddle.height &&
        puRight >= this.paddle.x &&
        puLeft <= this.paddle.x + this.paddle.width
      ) {
        this.collectPowerUp(pu.kind)
        pu.y = GAME_HEIGHT + 100
      }
    }
    this.fallingPowerUps = this.fallingPowerUps.filter(
      (p) => p.y < GAME_HEIGHT + 50,
    )
  }

  private collectPowerUp(kind: PowerUpKind) {
    if (kind === 'extraLife') {
      this.state.lives++
      this.onStateChange({ ...this.state })
      return
    }
    if (kind === 'multiBall') {
      const canAdd = Math.min(2, MAX_BALLS - this.balls.length)
      for (let i = 0; i < canAdd; i++) {
        const orig = this.balls.find((b) => b.isOriginal)!
        const angle = ((30 + Math.random() * 120) * Math.PI) / 180
        const speed = this.computeEffectiveSpeed()
        this.balls.push({
          x: orig.x + (i + 1) * 15,
          y: orig.y,
          vx: Math.cos(angle) * speed * (Math.random() < 0.5 ? 1 : -1),
          vy: -Math.sin(angle) * speed,
          radius: BALL_RADIUS,
          isOriginal: false,
        })
      }
      this.activePowerUps = refreshOrAddPowerUp(
        this.activePowerUps,
        kind,
        Date.now(),
      )
      return
    }
    this.activePowerUps = refreshOrAddPowerUp(
      this.activePowerUps,
      kind,
      Date.now(),
    )
  }

  private syncPaddleWidth() {
    if (isWidePaddleActive(this.activePowerUps)) {
      this.paddle = applyWidePaddle({
        ...this.paddle,
        width: this.paddle.baseWidth,
      })
    } else {
      this.paddle.width = this.paddle.baseWidth
    }
  }

  // --- Drawing ---
  private draw() {
    const ctx = this.ctx
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

    const grad = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT)
    grad.addColorStop(0, '#0d0d1a')
    grad.addColorStop(1, '#0a0a14')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

    this.drawBricks()
    this.drawPaddle()
    this.drawBalls()
    this.drawFallingPowerUps()
  }

  private readonly brickColors: Record<string, string[]> = {
    single: ['#00ccff'],
    multi2: ['#00ff99', '#007744'],
    multi3: ['#ffcc00', '#ff8800', '#cc4400'],
    indestructible: ['#555577'],
  }

  private drawBricks() {
    const ctx = this.ctx
    for (const brick of this.bricks) {
      if (brick.destroyed) continue
      const colors = this.brickColors[brick.type] ?? ['#ffffff']
      const hitsMax: Record<string, number> = {
        single: 1,
        multi2: 2,
        multi3: 3,
        indestructible: 1,
      }
      const colorIndex = (hitsMax[brick.type] ?? 1) - brick.hitsRemaining
      const color = colors[Math.min(colorIndex, colors.length - 1)]

      ctx.save()
      ctx.shadowColor = color
      ctx.shadowBlur = 8
      ctx.fillStyle = `${color}88`
      ctx.fillRect(brick.x, brick.y, brick.width, brick.height)
      ctx.strokeStyle = color
      ctx.lineWidth = 1.5
      ctx.strokeRect(brick.x, brick.y, brick.width, brick.height)
      ctx.restore()
    }
  }

  private drawPaddle() {
    const ctx = this.ctx
    const p = this.paddle
    ctx.save()
    ctx.shadowColor = '#aaaaff'
    ctx.shadowBlur = 12
    ctx.fillStyle = 'rgba(150,150,255,0.3)'
    ctx.fillRect(p.x, p.y, p.width, p.height)
    ctx.strokeStyle = '#aaaaff'
    ctx.lineWidth = 2
    ctx.strokeRect(p.x, p.y, p.width, p.height)
    ctx.restore()
  }

  private drawBalls() {
    const fireball = isFireballActive(this.activePowerUps)
    for (const ball of this.balls) {
      drawBall(this.ctx, ball.x, ball.y, ball.radius, this.ballType, fireball)
    }
  }

  private drawFallingPowerUps() {
    const ctx = this.ctx
    const colors: Record<PowerUpKind, string> = {
      widePaddle: '#00ffcc',
      multiBall: '#ff44ff',
      slowBall: '#4488ff',
      extraLife: '#ff4444',
      fireball: '#ff8800',
    }
    for (const pu of this.fallingPowerUps) {
      const color = colors[pu.kind]
      ctx.save()
      ctx.shadowColor = color
      ctx.shadowBlur = 10
      ctx.fillStyle = color
      ctx.fillRect(pu.x - pu.width / 2, pu.y, pu.width, pu.height)
      ctx.restore()
    }
  }
}

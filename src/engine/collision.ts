import type { Ball, Brick, Paddle } from './types'
import { GAME_HEIGHT, GAME_WIDTH } from './types'

export function ballHitsLeftWall(ball: Ball): boolean {
  return ball.x - ball.radius <= 0
}

export function ballHitsRightWall(ball: Ball): boolean {
  return ball.x + ball.radius >= GAME_WIDTH
}

export function ballHitsCeiling(ball: Ball): boolean {
  return ball.y - ball.radius <= 0
}

export function ballExitsBottom(ball: Ball): boolean {
  return ball.y + ball.radius >= GAME_HEIGHT
}

export function reflectBallWall(ball: Ball, axis: 'x' | 'y'): Ball {
  return {
    ...ball,
    vx: axis === 'x' ? -ball.vx : ball.vx,
    vy: axis === 'y' ? -ball.vy : ball.vy,
  }
}

export type BrickCollision = false | { axis: 'x' | 'y' }

export function ballHitsBrick(ball: Ball, brick: Brick): BrickCollision {
  const bLeft = brick.x
  const bRight = brick.x + brick.width
  const bTop = brick.y
  const bBottom = brick.y + brick.height

  const ballLeft = ball.x - ball.radius
  const ballRight = ball.x + ball.radius
  const ballTop = ball.y - ball.radius
  const ballBottom = ball.y + ball.radius

  if (
    ballRight <= bLeft ||
    ballLeft >= bRight ||
    ballBottom <= bTop ||
    ballTop >= bBottom
  ) {
    return false
  }

  const overlapX = Math.min(ballRight - bLeft, bRight - ballLeft)
  const overlapY = Math.min(ballBottom - bTop, bBottom - ballTop)

  return { axis: overlapX < overlapY ? 'x' : 'y' }
}

export function ballHitsPaddle(ball: Ball, paddle: Paddle): boolean {
  if (ball.vy <= 0) return false

  const ballLeft = ball.x - ball.radius
  const ballRight = ball.x + ball.radius
  const ballBottom = ball.y + ball.radius

  return (
    ballBottom >= paddle.y &&
    ball.y <= paddle.y + paddle.height &&
    ballRight >= paddle.x &&
    ballLeft <= paddle.x + paddle.width
  )
}

export function computePaddleBounceAngle(
  ballX: number,
  paddle: Paddle,
): number {
  const paddleCenter = paddle.x + paddle.width / 2
  const relativeX = ballX - paddleCenter
  const normalised = relativeX / (paddle.width / 2)

  const minAngle = Math.PI * (30 / 180)
  const maxAngle = Math.PI * (150 / 180)
  const baseAngle = maxAngle - ((normalised + 1) / 2) * (maxAngle - minAngle)

  const centerThreshold = 0.05
  if (Math.abs(normalised) < centerThreshold) {
    const deflection = (Math.random() * 2 - 1) * ((5 * Math.PI) / 180)
    return baseAngle + deflection
  }

  return baseAngle
}

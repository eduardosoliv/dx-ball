import type { ActivePowerUp, Paddle, PowerUpKind } from './types'

const DURATIONS: Record<PowerUpKind, number> = {
  widePaddle: 15000,
  multiBall: -1,
  slowBall: 10000,
  extraLife: -1,
  fireball: 10000,
}

export function createActivePowerUp(
  kind: PowerUpKind,
  now: number,
): ActivePowerUp {
  const duration = DURATIONS[kind]
  return { kind, expiresAt: duration === -1 ? -1 : now + duration }
}

export function isExpired(powerUp: ActivePowerUp, now: number): boolean {
  if (powerUp.expiresAt === -1) return false
  return now > powerUp.expiresAt
}

/** Always computes width from baseWidth, never from current (possibly already-wide) width. */
export function applyWidePaddle(paddle: Paddle): Paddle {
  const newWidth = Math.min(paddle.baseWidth * 1.75, paddle.baseWidth * 2)
  return { ...paddle, width: newWidth }
}

export function getSlowBallMultiplier(slowBallActive: boolean): number {
  return slowBallActive ? 0.6 : 1.0
}

export function isFireballActive(active: ActivePowerUp[]): boolean {
  return active.some((p) => p.kind === 'fireball')
}

export function isWidePaddleActive(active: ActivePowerUp[]): boolean {
  return active.some((p) => p.kind === 'widePaddle')
}

export function isSlowBallActive(active: ActivePowerUp[]): boolean {
  return active.some((p) => p.kind === 'slowBall')
}

export function refreshOrAddPowerUp(
  list: ActivePowerUp[],
  kind: PowerUpKind,
  now: number,
): ActivePowerUp[] {
  if (kind === 'multiBall') {
    return [...list, createActivePowerUp(kind, now)]
  }
  const exists = list.find((p) => p.kind === kind)
  if (exists) {
    return list.map((p) =>
      p.kind === kind ? createActivePowerUp(kind, now) : p,
    )
  }
  return [...list, createActivePowerUp(kind, now)]
}

export function removePowerUp(
  list: ActivePowerUp[],
  kind: PowerUpKind,
): ActivePowerUp[] {
  const idx = list.findIndex((p) => p.kind === kind)
  if (idx === -1) return list
  return [...list.slice(0, idx), ...list.slice(idx + 1)]
}

export function filterExpired(
  list: ActivePowerUp[],
  now: number,
): ActivePowerUp[] {
  return list.filter((p) => !isExpired(p, now))
}

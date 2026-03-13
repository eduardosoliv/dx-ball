export type { BallType } from './ballRenderers'

export type BrickType =
  | 'empty'
  | 'single'
  | 'multi2'
  | 'multi3'
  | 'indestructible'

export type PowerUpKind =
  | 'widePaddle'
  | 'multiBall'
  | 'slowBall'
  | 'extraLife'
  | 'fireball'

export interface Ball {
  x: number // center x, game coords
  y: number // center y, game coords
  vx: number // velocity x, px/s
  vy: number // velocity y, px/s
  radius: number
  isOriginal: boolean
}

export interface Paddle {
  x: number // left edge, game coords
  y: number // top edge, game coords
  width: number
  height: number
  baseWidth: number
}

export interface Brick {
  row: number
  col: number
  type: BrickType
  hitsRemaining: number
  destroyed: boolean // true when hitsRemaining reached 0
  x: number // computed pixel position (top-left), game coords
  y: number
  width: number
  height: number
}

export interface FallingPowerUp {
  kind: PowerUpKind
  x: number // center x
  y: number // top edge
  width: number
  height: number
}

export interface ActivePowerUp {
  kind: PowerUpKind
  expiresAt: number // ms timestamp; -1 for instant/permanent-until-reset
}

export interface Level {
  id: number
  ballSpeedMultiplier: number
  grid: BrickType[][] // grid[row][col], 10 rows × 14 cols
}

export interface GameState {
  screen: 'title' | 'game' | 'gameover' | 'levelComplete'
  score: number
  lives: number
  level: number
  loopMultiplier: number
}

// Constants
export const GAME_WIDTH = 640
export const GAME_HEIGHT = 480
export const BALL_RADIUS = 8
export const PADDLE_WIDTH = 80
export const PADDLE_HEIGHT = 12
export const PADDLE_Y = 440
export const BRICK_COLS = 14
export const BRICK_ROWS = 10
export const BRICK_WIDTH = 40
export const BRICK_HEIGHT = 16
export const BRICK_PADDING = 2
export const BRICK_OFFSET_TOP = 40
export const BRICK_OFFSET_LEFT = 20
export const BASE_SPEED = 300 // px/s
export const POWERUP_FALL_SPEED = 150 // px/s
export const PADDLE_KEYBOARD_SPEED = 400 // px/s

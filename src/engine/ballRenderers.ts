export type BallType = 'standard' | 'tennis' | 'football' | 'soccer'

type BallDrawer = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
) => void

const BALL_RENDERERS: Record<BallType, BallDrawer> = {
  standard: (ctx, x, y, radius) =>
    drawStandardBall(ctx, x, y, radius, '#ffffff'),
  tennis: drawTennisBall,
  football: drawFootballBall,
  soccer: drawSoccerBall,
}

export function drawBall(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  type: BallType,
  fireball: boolean,
): void {
  if (fireball) {
    drawStandardBall(ctx, x, y, radius, '#ff6600')
    return
  }
  BALL_RENDERERS[type](ctx, x, y, radius)
}

function drawStandardBall(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
): void {
  ctx.save()
  ctx.shadowColor = color
  ctx.shadowBlur = 15
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function drawTennisBall(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
): void {
  ctx.save()
  ctx.shadowColor = '#ccee00'
  ctx.shadowBlur = 12
  ctx.fillStyle = '#ccee00'
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fill()

  // Two curved seam arcs
  ctx.shadowBlur = 0
  ctx.strokeStyle = '#88aa00'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.arc(x, y, radius * 0.85, 0.3 * Math.PI, 0.7 * Math.PI)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(x, y, radius * 0.85, 1.3 * Math.PI, 1.7 * Math.PI)
  ctx.stroke()

  ctx.restore()
}

function drawSoccerBall(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
): void {
  ctx.save()
  ctx.shadowColor = '#cccccc'
  ctx.shadowBlur = 12
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fill()

  ctx.shadowBlur = 0
  ctx.fillStyle = '#111111'

  // Central pentagon
  ctx.beginPath()
  const pentR = radius * 0.35
  for (let i = 0; i < 5; i++) {
    const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2
    const px = x + pentR * Math.cos(angle)
    const py = y + pentR * Math.sin(angle)
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
  ctx.fill()

  // 5 black patches around perimeter
  for (let i = 0; i < 5; i++) {
    const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2
    const px = x + radius * 0.65 * Math.cos(angle)
    const py = y + radius * 0.65 * Math.sin(angle)
    ctx.beginPath()
    ctx.arc(px, py, radius * 0.2, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.restore()
}

function drawFootballBall(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
): void {
  ctx.save()
  ctx.shadowColor = '#8B4513'
  ctx.shadowBlur = 12
  ctx.fillStyle = '#8B4513'
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fill()

  ctx.shadowBlur = 0

  // Horizontal lace line
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(x - radius * 0.6, y)
  ctx.lineTo(x + radius * 0.6, y)
  ctx.stroke()

  // 5 vertical stitches
  ctx.lineWidth = 1.5
  const stitchHalf = (radius * 0.35) / 2
  const spacing = (radius * 1.2) / 4
  for (let i = 0; i < 5; i++) {
    const sx = x - radius * 0.6 + i * spacing
    ctx.beginPath()
    ctx.moveTo(sx, y - stitchHalf)
    ctx.lineTo(sx, y + stitchHalf)
    ctx.stroke()
  }

  ctx.restore()
}

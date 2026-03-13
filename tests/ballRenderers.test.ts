import { beforeEach, describe, expect, it, vi } from 'vitest'
import { drawBall } from '../src/engine/ballRenderers'

function makeCtx() {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    shadowBlur: 0,
    shadowColor: '',
  } as unknown as CanvasRenderingContext2D
}

describe('drawBall', () => {
  let ctx: CanvasRenderingContext2D

  beforeEach(() => {
    ctx = makeCtx()
  })

  it('calls arc for standard ball', () => {
    drawBall(ctx, 50, 50, 8, 'standard', false)
    expect(ctx.arc).toHaveBeenCalledWith(50, 50, 8, 0, Math.PI * 2)
  })

  it('uses fireball colour when fireball=true regardless of type', () => {
    drawBall(ctx, 50, 50, 8, 'tennis', true)
    expect(ctx.fillStyle).toBe('#ff6600')
    expect(ctx.shadowColor).toBe('#ff6600')
  })

  it('uses yellow-green for tennis when not fireball', () => {
    drawBall(ctx, 50, 50, 8, 'tennis', false)
    expect(ctx.fillStyle).toBe('#ccee00')
  })

  it('calls arc for tennis base circle', () => {
    drawBall(ctx, 50, 50, 8, 'tennis', false)
    expect(ctx.arc).toHaveBeenCalledWith(50, 50, 8, 0, Math.PI * 2)
  })

  it('uses brown for football when not fireball', () => {
    drawBall(ctx, 50, 50, 8, 'football', false)
    expect(ctx.fillStyle).toBe('#8B4513')
  })

  it('calls moveTo/lineTo for football lace line', () => {
    drawBall(ctx, 50, 50, 8, 'football', false)
    expect(ctx.moveTo).toHaveBeenCalled()
    expect(ctx.lineTo).toHaveBeenCalled()
  })

  it('uses white base for soccer ball', () => {
    drawBall(ctx, 50, 50, 8, 'soccer', false)
    expect(ctx.arc).toHaveBeenCalledWith(50, 50, 8, 0, Math.PI * 2)
  })

  it('draws multiple arc calls for soccer patches', () => {
    drawBall(ctx, 50, 50, 8, 'soccer', false)
    // base circle (1) + 5 perimeter patches = at least 6 arc calls
    expect(
      (ctx.arc as ReturnType<typeof vi.fn>).mock.calls.length,
    ).toBeGreaterThanOrEqual(6)
  })
})

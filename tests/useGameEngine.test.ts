import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useGameEngine } from '../src/hooks/useGameEngine'

const mockStart = vi.fn()
const mockStop = vi.fn()
const mockLaunch = vi.fn()
const mockSetPaused = vi.fn()
const mockSetMouseX = vi.fn()
const mockSetKey = vi.fn()

vi.mock('../src/engine/GameEngine', () => ({
  GameEngine: class {
    start = mockStart
    stop = mockStop
    launch = mockLaunch
    setPaused = mockSetPaused
    setMouseX = mockSetMouseX
    setKey = mockSetKey
    setBallType = vi.fn()
  },
}))

function makeCanvasRef() {
  const canvas = document.createElement('canvas')
  // jsdom returns null for getContext; provide a stub so the hook doesn't crash
  canvas.getContext = vi
    .fn()
    .mockReturnValue({}) as unknown as typeof canvas.getContext
  canvas.getBoundingClientRect = vi
    .fn()
    .mockReturnValue({ left: 0, width: 640, top: 0 })
  return { current: canvas }
}

describe('useGameEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('starts the engine when active and canvas is present', () => {
    const canvasRef = makeCanvasRef()
    const onStateChange = vi.fn()
    renderHook(() => useGameEngine(canvasRef, onStateChange, true))
    expect(mockStart).toHaveBeenCalled()
  })

  it('does not start engine when active is false', () => {
    const canvasRef = makeCanvasRef()
    const onStateChange = vi.fn()
    renderHook(() => useGameEngine(canvasRef, onStateChange, false))
    expect(mockStart).not.toHaveBeenCalled()
  })

  it('does not start engine when canvasRef.current is null', () => {
    const onStateChange = vi.fn()
    renderHook(() => useGameEngine({ current: null }, onStateChange, true))
    expect(mockStart).not.toHaveBeenCalled()
  })

  it('stops the engine on unmount', () => {
    const canvasRef = makeCanvasRef()
    const onStateChange = vi.fn()
    const { unmount } = renderHook(() =>
      useGameEngine(canvasRef, onStateChange, true),
    )
    const startCount = mockStart.mock.calls.length
    unmount()
    // stop should be called once per start
    expect(mockStop).toHaveBeenCalledTimes(startCount)
  })

  it('exposes setPaused that delegates to the engine', () => {
    const canvasRef = makeCanvasRef()
    const onStateChange = vi.fn()
    const { result } = renderHook(() =>
      useGameEngine(canvasRef, onStateChange, true),
    )
    result.current.setPaused(true)
    expect(mockSetPaused).toHaveBeenCalledWith(true)
  })

  it('exposes launch that delegates to the engine', () => {
    const canvasRef = makeCanvasRef()
    const onStateChange = vi.fn()
    const { result } = renderHook(() =>
      useGameEngine(canvasRef, onStateChange, true),
    )
    result.current.launch()
    expect(mockLaunch).toHaveBeenCalled()
  })

  it('fires setMouseX when mousemove event is dispatched on canvas', () => {
    const canvasRef = makeCanvasRef()
    const onStateChange = vi.fn()
    renderHook(() => useGameEngine(canvasRef, onStateChange, true))
    canvasRef.current.dispatchEvent(
      new MouseEvent('mousemove', { clientX: 200, bubbles: true }),
    )
    expect(mockSetMouseX).toHaveBeenCalled()
  })

  it('fires launch when click event is dispatched on canvas', () => {
    const canvasRef = makeCanvasRef()
    const onStateChange = vi.fn()
    renderHook(() => useGameEngine(canvasRef, onStateChange, true))
    canvasRef.current.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(mockLaunch).toHaveBeenCalled()
  })

  it('fires setKey(ArrowLeft, true) on keydown and (ArrowLeft, false) on keyup', () => {
    const canvasRef = makeCanvasRef()
    const onStateChange = vi.fn()
    renderHook(() => useGameEngine(canvasRef, onStateChange, true))
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowLeft' }))
    expect(mockSetKey).toHaveBeenCalledWith('ArrowLeft', true)
    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'ArrowLeft' }))
    expect(mockSetKey).toHaveBeenCalledWith('ArrowLeft', false)
  })

  it('fires setKey(ArrowRight) on keydown/keyup', () => {
    const canvasRef = makeCanvasRef()
    const onStateChange = vi.fn()
    renderHook(() => useGameEngine(canvasRef, onStateChange, true))
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowRight' }))
    expect(mockSetKey).toHaveBeenCalledWith('ArrowRight', true)
    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'ArrowRight' }))
    expect(mockSetKey).toHaveBeenCalledWith('ArrowRight', false)
  })

  it('fires launch on Space keydown', () => {
    const canvasRef = makeCanvasRef()
    const onStateChange = vi.fn()
    renderHook(() => useGameEngine(canvasRef, onStateChange, true))
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }))
    expect(mockLaunch).toHaveBeenCalled()
  })
})

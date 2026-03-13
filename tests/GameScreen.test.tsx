import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { GameState } from '../src/engine/types'
import GameScreen from '../src/screens/GameScreen'

// jsdom doesn't implement canvas — mock getContext so BallPicker doesn't crash
const mockCtx = {
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 0,
  shadowBlur: 0,
  shadowColor: '',
  fillRect: vi.fn(),
  beginPath: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
}
HTMLCanvasElement.prototype.getContext = vi.fn(
  () => mockCtx,
) as unknown as typeof HTMLCanvasElement.prototype.getContext

const mockSetPaused = vi.fn()
const mockSetBallType = vi.fn()
let capturedStateChange: ((state: GameState) => void) | null = null

vi.mock('../src/hooks/useGameEngine', () => ({
  useGameEngine: (
    _canvasRef: unknown,
    onStateChange: (s: GameState) => void,
  ) => {
    capturedStateChange = onStateChange
    return {
      setPaused: mockSetPaused,
      setBallType: mockSetBallType,
      launch: vi.fn(),
      ready: true,
    }
  },
}))

describe('GameScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSetBallType.mockReset()
    capturedStateChange = null
  })

  it('renders a canvas element', () => {
    render(<GameScreen onGameOver={vi.fn()} />)
    expect(document.querySelector('canvas')).toBeInTheDocument()
  })

  it('shows HUD with initial score 0 and 3 lives', () => {
    render(<GameScreen onGameOver={vi.fn()} />)
    expect(screen.getByText(/SCORE 000000/)).toBeInTheDocument()
    expect(screen.getAllByText('♥')).toHaveLength(3)
  })

  it('shows PAUSED overlay when Escape is pressed', () => {
    render(<GameScreen onGameOver={vi.fn()} />)
    fireEvent.keyDown(window, { code: 'Escape' })
    expect(screen.getByText('PAUSED')).toBeInTheDocument()
    expect(mockSetPaused).toHaveBeenCalledWith(true)
  })

  it('hides PAUSED overlay when Escape is pressed again', () => {
    render(<GameScreen onGameOver={vi.fn()} />)
    fireEvent.keyDown(window, { code: 'Escape' })
    fireEvent.keyDown(window, { code: 'Escape' })
    expect(screen.queryByText('PAUSED')).not.toBeInTheDocument()
    expect(mockSetPaused).toHaveBeenLastCalledWith(false)
  })

  it('shows PAUSED overlay when P is pressed', () => {
    render(<GameScreen onGameOver={vi.fn()} />)
    fireEvent.keyDown(window, { code: 'KeyP' })
    expect(screen.getByText('PAUSED')).toBeInTheDocument()
  })

  it('shows level complete overlay when levelComplete state fires', () => {
    vi.useFakeTimers()
    render(<GameScreen onGameOver={vi.fn()} />)
    act(() => {
      capturedStateChange!({
        screen: 'levelComplete',
        score: 100,
        lives: 3,
        level: 2,
        loopMultiplier: 1,
      })
    })
    expect(screen.getByText(/LEVEL 2 COMPLETE/)).toBeInTheDocument()
    act(() => {
      vi.runAllTimers()
    })
    vi.useRealTimers()
  })

  it('cancels previous transition timeout when a second levelComplete fires rapidly', () => {
    vi.useFakeTimers()
    render(<GameScreen onGameOver={vi.fn()} />)
    act(() => {
      capturedStateChange!({
        screen: 'levelComplete',
        score: 100,
        lives: 3,
        level: 2,
        loopMultiplier: 1,
      })
    })
    // Second levelComplete before the first timeout expires — should clear the first
    act(() => {
      capturedStateChange!({
        screen: 'levelComplete',
        score: 200,
        lives: 3,
        level: 3,
        loopMultiplier: 1,
      })
    })
    expect(screen.getByText(/LEVEL 3 COMPLETE/)).toBeInTheDocument()
    act(() => {
      vi.runAllTimers()
    })
    vi.useRealTimers()
  })

  it('calls onGameOver with final score when gameover state fires', () => {
    const onGameOver = vi.fn()
    render(<GameScreen onGameOver={onGameOver} />)
    act(() => {
      capturedStateChange!({
        screen: 'gameover',
        score: 4200,
        lives: 0,
        level: 3,
        loopMultiplier: 1,
      })
    })
    expect(onGameOver).toHaveBeenCalledWith(4200)
  })

  it('pressing B opens the ball picker overlay', () => {
    render(<GameScreen onGameOver={vi.fn()} />)
    fireEvent.keyDown(window, { code: 'KeyB' })
    expect(screen.getByText('SELECT BALL')).toBeInTheDocument()
  })

  it('pressing B while transitioning does not open the picker', () => {
    vi.useFakeTimers()
    render(<GameScreen onGameOver={vi.fn()} />)
    act(() => {
      capturedStateChange!({
        screen: 'levelComplete',
        score: 0,
        lives: 3,
        level: 2,
        loopMultiplier: 1,
      })
    })
    fireEvent.keyDown(window, { code: 'KeyB' })
    expect(screen.queryByText('SELECT BALL')).not.toBeInTheDocument()
    act(() => {
      vi.runAllTimers()
    })
    vi.useRealTimers()
  })

  it('pressing B a second time while picker is open does not close it', () => {
    render(<GameScreen onGameOver={vi.fn()} />)
    fireEvent.keyDown(window, { code: 'KeyB' })
    fireEvent.keyDown(window, { code: 'KeyB' })
    expect(screen.getByText('SELECT BALL')).toBeInTheDocument()
  })

  it('pressing Escape while picker is open closes it', () => {
    render(<GameScreen onGameOver={vi.fn()} />)
    fireEvent.keyDown(window, { code: 'KeyB' })
    expect(screen.getByText('SELECT BALL')).toBeInTheDocument()
    fireEvent.keyDown(window, { code: 'Escape' })
    expect(screen.queryByText('SELECT BALL')).not.toBeInTheDocument()
  })

  it('opening picker auto-pauses; closing resumes when not previously paused', () => {
    render(<GameScreen onGameOver={vi.fn()} />)
    fireEvent.keyDown(window, { code: 'KeyB' })
    expect(mockSetPaused).toHaveBeenCalledWith(true)
    fireEvent.keyDown(window, { code: 'Escape' })
    expect(mockSetPaused).toHaveBeenCalledWith(false)
  })

  it('PAUSED overlay is hidden while picker is open', () => {
    render(<GameScreen onGameOver={vi.fn()} />)
    // Pause first, then open picker
    fireEvent.keyDown(window, { code: 'KeyP' })
    expect(screen.getByText('PAUSED')).toBeInTheDocument()
    fireEvent.keyDown(window, { code: 'KeyB' })
    expect(screen.queryByText('PAUSED')).not.toBeInTheDocument()
    expect(screen.getByText('SELECT BALL')).toBeInTheDocument()
  })

  it('updates HUD score when game state changes', () => {
    render(<GameScreen onGameOver={vi.fn()} />)
    act(() => {
      capturedStateChange!({
        screen: 'game',
        score: 500,
        lives: 2,
        level: 3,
        loopMultiplier: 1,
      })
    })
    expect(screen.getByText(/SCORE 000500/)).toBeInTheDocument()
    expect(screen.getAllByText('♥')).toHaveLength(2)
  })

  it('fires resize event without throwing', () => {
    render(<GameScreen onGameOver={vi.fn()} />)
    act(() => {
      fireEvent(window, new Event('resize'))
    })
    // No assertion needed — just confirms the update() handler runs without error
    expect(document.querySelector('canvas')).toBeInTheDocument()
  })

  it('selecting a ball in the picker calls setBallType', () => {
    render(<GameScreen onGameOver={vi.fn()} />)
    fireEvent.keyDown(window, { code: 'KeyB' })
    fireEvent.click(screen.getByText('Tennis'))
    expect(mockSetBallType).toHaveBeenCalledWith('tennis')
  })
})

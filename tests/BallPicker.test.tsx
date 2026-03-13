import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import BallPicker from '../src/components/BallPicker'

// jsdom doesn't implement canvas — provide a minimal mock
beforeEach(() => {
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    fillStyle: '',
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
    shadowBlur: 0,
    shadowColor: '',
    strokeStyle: '',
    lineWidth: 0,
  })) as unknown as typeof HTMLCanvasElement.prototype.getContext
})

describe('BallPicker', () => {
  it('renders SELECT BALL heading', () => {
    render(
      <BallPicker current="standard" onSelect={vi.fn()} onClose={vi.fn()} />,
    )
    expect(screen.getByText('SELECT BALL')).toBeInTheDocument()
  })

  it('renders all four ball type labels', () => {
    render(
      <BallPicker current="standard" onSelect={vi.fn()} onClose={vi.fn()} />,
    )
    expect(screen.getByText('Standard')).toBeInTheDocument()
    expect(screen.getByText('Tennis')).toBeInTheDocument()
    expect(screen.getByText('Football')).toBeInTheDocument()
    expect(screen.getByText('Soccer')).toBeInTheDocument()
  })

  it('renders ESC to cancel hint', () => {
    render(
      <BallPicker current="standard" onSelect={vi.fn()} onClose={vi.fn()} />,
    )
    expect(screen.getByText(/ESC/)).toBeInTheDocument()
  })

  it('calls onSelect with correct type when a card is clicked', () => {
    const onSelect = vi.fn()
    render(
      <BallPicker current="standard" onSelect={onSelect} onClose={vi.fn()} />,
    )
    fireEvent.click(screen.getByText('Tennis'))
    expect(onSelect).toHaveBeenCalledWith('tennis')
  })

  it('calls onClose when a card is clicked', () => {
    const onClose = vi.fn()
    render(
      <BallPicker current="standard" onSelect={vi.fn()} onClose={onClose} />,
    )
    fireEvent.click(screen.getByText('Football'))
    expect(onClose).toHaveBeenCalled()
  })

  it('calls onSelect then onClose in that order', () => {
    const calls: string[] = []
    render(
      <BallPicker
        current="standard"
        onSelect={() => calls.push('select')}
        onClose={() => calls.push('close')}
      />,
    )
    fireEvent.click(screen.getByText('Tennis'))
    expect(calls).toEqual(['select', 'close'])
  })

  it('highlights the current ball type card', () => {
    render(<BallPicker current="tennis" onSelect={vi.fn()} onClose={vi.fn()} />)
    const tennisLabel = screen.getByText('Tennis')
    // The highlighted card has #00ccff color; others have #4488aa
    expect(tennisLabel).toHaveStyle({ color: '#00ccff' })
  })

  it('non-current cards are not highlighted', () => {
    render(<BallPicker current="tennis" onSelect={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByText('Standard')).toHaveStyle({ color: '#4488aa' })
    expect(screen.getByText('Football')).toHaveStyle({ color: '#4488aa' })
  })

  it('ArrowRight moves keyboard focus to next card', () => {
    render(
      <BallPicker current="standard" onSelect={vi.fn()} onClose={vi.fn()} />,
    )
    // initial focus is on standard (index 0); ArrowRight → tennis (index 1)
    fireEvent.keyDown(window, { code: 'ArrowRight' })
    const tennisCard = screen.getByText('Tennis').closest('button')!
    expect(tennisCard).toHaveStyle({ outline: '2px solid #ffffff' })
  })

  it('ArrowLeft wraps around to last card from first', () => {
    render(
      <BallPicker current="standard" onSelect={vi.fn()} onClose={vi.fn()} />,
    )
    fireEvent.keyDown(window, { code: 'ArrowLeft' })
    const soccerCard = screen.getByText('Soccer').closest('button')!
    expect(soccerCard).toHaveStyle({ outline: '2px solid #ffffff' })
  })

  it('Enter confirms the focused card', () => {
    const onSelect = vi.fn()
    const onClose = vi.fn()
    render(
      <BallPicker current="standard" onSelect={onSelect} onClose={onClose} />,
    )
    // Move focus to Tennis then confirm
    fireEvent.keyDown(window, { code: 'ArrowRight' })
    fireEvent.keyDown(window, { code: 'Enter' })
    expect(onSelect).toHaveBeenCalledWith('tennis')
    expect(onClose).toHaveBeenCalled()
  })

  it('initial keyboard focus is on the current ball type', () => {
    render(
      <BallPicker current="football" onSelect={vi.fn()} onClose={vi.fn()} />,
    )
    const footballCard = screen.getByText('Football').closest('button')!
    expect(footballCard).toHaveStyle({ outline: '2px solid #ffffff' })
  })
})

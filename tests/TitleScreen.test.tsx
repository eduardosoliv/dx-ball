import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import TitleScreen from '../src/screens/TitleScreen'

describe('TitleScreen', () => {
  it('renders DX BALL title', () => {
    render(<TitleScreen onPlay={vi.fn()} />)
    expect(screen.getByText('DX BALL')).toBeInTheDocument()
  })

  it('renders PLAY button', () => {
    render(<TitleScreen onPlay={vi.fn()} />)
    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument()
  })

  it('calls onPlay when PLAY button is clicked', () => {
    const onPlay = vi.fn()
    render(<TitleScreen onPlay={onPlay} />)
    fireEvent.click(screen.getByRole('button', { name: /play/i }))
    expect(onPlay).toHaveBeenCalledTimes(1)
  })

  it('highlights button background on mouseEnter', () => {
    render(<TitleScreen onPlay={vi.fn()} />)
    const button = screen.getByRole('button', { name: /play/i })
    fireEvent.mouseEnter(button)
    expect(button.style.background).toBeTruthy()
  })

  it('resets button background on mouseLeave', () => {
    render(<TitleScreen onPlay={vi.fn()} />)
    const button = screen.getByRole('button', { name: /play/i })
    fireEvent.mouseEnter(button)
    fireEvent.mouseLeave(button)
    expect(button.style.background).toBe('transparent')
  })
})

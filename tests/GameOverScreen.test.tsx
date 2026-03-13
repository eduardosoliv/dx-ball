import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import GameOverScreen from '../src/screens/GameOverScreen'

describe('GameOverScreen', () => {
  it('renders GAME OVER heading', () => {
    render(<GameOverScreen score={0} onPlayAgain={vi.fn()} onMenu={vi.fn()} />)
    expect(screen.getByText('GAME OVER')).toBeInTheDocument()
  })

  it('renders score padded to 6 digits', () => {
    render(
      <GameOverScreen score={1230} onPlayAgain={vi.fn()} onMenu={vi.fn()} />,
    )
    expect(screen.getByText('001230')).toBeInTheDocument()
  })

  it('calls onPlayAgain when PLAY AGAIN is clicked', () => {
    const onPlayAgain = vi.fn()
    render(
      <GameOverScreen score={0} onPlayAgain={onPlayAgain} onMenu={vi.fn()} />,
    )
    fireEvent.click(screen.getByRole('button', { name: /play again/i }))
    expect(onPlayAgain).toHaveBeenCalledTimes(1)
  })

  it('calls onMenu when MAIN MENU is clicked', () => {
    const onMenu = vi.fn()
    render(<GameOverScreen score={0} onPlayAgain={vi.fn()} onMenu={onMenu} />)
    fireEvent.click(screen.getByRole('button', { name: /main menu/i }))
    expect(onMenu).toHaveBeenCalledTimes(1)
  })

  it('highlights button background on mouseEnter', () => {
    render(<GameOverScreen score={0} onPlayAgain={vi.fn()} onMenu={vi.fn()} />)
    const button = screen.getByRole('button', { name: /play again/i })
    fireEvent.mouseEnter(button)
    expect(button.style.background).toBeTruthy()
  })

  it('resets button background on mouseLeave', () => {
    render(<GameOverScreen score={0} onPlayAgain={vi.fn()} onMenu={vi.fn()} />)
    const button = screen.getByRole('button', { name: /play again/i })
    fireEvent.mouseEnter(button)
    fireEvent.mouseLeave(button)
    expect(button.style.background).toBe('transparent')
  })
})

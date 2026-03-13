import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import App from '../src/App'

// GameScreen uses canvas + requestAnimationFrame — mock it so App routing can be tested in isolation
vi.mock('../src/screens/GameScreen', () => ({
  default: ({ onGameOver }: { onGameOver: (score: number) => void }) => (
    <div>
      <div data-testid="game-screen">Game Screen</div>
      <button type="button" onClick={() => onGameOver(9999)}>
        Trigger Game Over
      </button>
    </div>
  ),
}))

describe('App routing', () => {
  it('shows TitleScreen on initial load', () => {
    render(<App />)
    expect(screen.getByText('DX BALL')).toBeInTheDocument()
  })

  it('transitions to GameScreen when Play is clicked', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /play/i }))
    expect(screen.getByTestId('game-screen')).toBeInTheDocument()
  })

  it('transitions to GameOverScreen when game over fires', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /play/i }))
    fireEvent.click(screen.getByText('Trigger Game Over'))
    expect(screen.getByText('GAME OVER')).toBeInTheDocument()
    expect(screen.getByText('009999')).toBeInTheDocument()
  })

  it('returns to TitleScreen from GameOverScreen via Main Menu', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /play/i }))
    fireEvent.click(screen.getByText('Trigger Game Over'))
    fireEvent.click(screen.getByRole('button', { name: /main menu/i }))
    expect(screen.getByText('DX BALL')).toBeInTheDocument()
  })

  it('starts a new game when Play Again is clicked', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /play/i }))
    fireEvent.click(screen.getByText('Trigger Game Over'))
    fireEvent.click(screen.getByRole('button', { name: /play again/i }))
    expect(screen.getByTestId('game-screen')).toBeInTheDocument()
  })
})

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import HUD from '../src/components/HUD'

describe('HUD', () => {
  it('renders score padded to 6 digits', () => {
    render(<HUD score={1230} lives={3} level={1} />)
    expect(screen.getByText(/SCORE 001230/)).toBeInTheDocument()
  })

  it('renders zero score as 000000', () => {
    render(<HUD score={0} lives={3} level={1} />)
    expect(screen.getByText(/SCORE 000000/)).toBeInTheDocument()
  })

  it('renders a heart icon for each life', () => {
    render(<HUD score={0} lives={3} level={1} />)
    expect(screen.getAllByText('♥')).toHaveLength(3)
  })

  it('renders no hearts when lives is zero', () => {
    render(<HUD score={0} lives={0} level={1} />)
    expect(screen.queryAllByText('♥')).toHaveLength(0)
  })

  it('renders level number', () => {
    render(<HUD score={0} lives={3} level={7} />)
    expect(screen.getByText(/LVL 7/)).toBeInTheDocument()
  })
})

import { useCallback, useEffect, useRef, useState } from 'react'
import type { BallType } from '../engine/ballRenderers'
import { GameEngine } from '../engine/GameEngine'
import type { GameState } from '../engine/types'
import { GAME_WIDTH } from '../engine/types'

export function useGameEngine(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  onStateChange: (state: GameState) => void,
  active: boolean,
) {
  const engineRef = useRef<GameEngine | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!active || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const engine = new GameEngine(ctx, onStateChange)
    engineRef.current = engine
    engine.start()
    setReady(true)

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const scaleX = GAME_WIDTH / rect.width
      const gameX = (e.clientX - rect.left) * scaleX
      engine.setMouseX(gameX)
    }

    const handleClick = () => engine.launch()
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        engine.launch()
      }
      if (e.code === 'ArrowLeft') {
        e.preventDefault()
        engine.setKey('ArrowLeft', true)
      }
      if (e.code === 'ArrowRight') {
        e.preventDefault()
        engine.setKey('ArrowRight', true)
      }
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft') engine.setKey('ArrowLeft', false)
      if (e.code === 'ArrowRight') engine.setKey('ArrowRight', false)
    }

    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('click', handleClick)
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      engine.stop()
      engineRef.current = null
      setReady(false)
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('click', handleClick)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [active, canvasRef, onStateChange])

  const launch = useCallback(() => engineRef.current?.launch(), [])
  const setPaused = useCallback(
    (p: boolean) => engineRef.current?.setPaused(p),
    [],
  )
  const setBallType = useCallback(
    (type: BallType) => engineRef.current?.setBallType(type),
    [],
  )

  return { launch, setPaused, setBallType, ready }
}

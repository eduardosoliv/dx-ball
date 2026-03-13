import { useCallback, useEffect, useRef, useState } from 'react'
import BallPicker from '../components/BallPicker'
import HUD from '../components/HUD'
import type { BallType } from '../engine/ballRenderers'
import type { GameState } from '../engine/types'
import { GAME_HEIGHT, GAME_WIDTH } from '../engine/types'
import { useGameEngine } from '../hooks/useGameEngine'

interface GameScreenProps {
  onGameOver: (score: number) => void
}

export default function GameScreen({ onGameOver }: GameScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  )
  const [gameState, setGameState] = useState<GameState>({
    screen: 'game',
    score: 0,
    lives: 3,
    level: 1,
    loopMultiplier: 1.0,
  })
  const [paused, setPausedState] = useState(false)
  const [transitioning, setTransitioning] = useState(false)
  const [transitionLevel, setTransitionLevel] = useState(0)
  const [pickerOpen, setPickerOpen] = useState(false)
  const pickerOpenRef = useRef(false)
  const wasAlreadyPaused = useRef(false)
  const [currentBallType, setCurrentBallType] = useState<BallType>('standard')

  const handleStateChange = useCallback(
    (state: GameState) => {
      if (state.screen === 'levelComplete') {
        setTransitioning(true)
        setTransitionLevel(state.level)
        if (transitionTimeoutRef.current)
          clearTimeout(transitionTimeoutRef.current)
        transitionTimeoutRef.current = setTimeout(
          () => setTransitioning(false),
          2000,
        )
        return
      }
      setGameState(state)
      if (state.screen === 'gameover') onGameOver(state.score)
    },
    [onGameOver],
  )

  const { setPaused, setBallType } = useGameEngine(
    canvasRef,
    handleStateChange,
    true,
  )

  const handlePickerClose = useCallback(() => {
    setPickerOpen(false)
    pickerOpenRef.current = false
    if (!wasAlreadyPaused.current) setPaused(false)
  }, [setPaused])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.code === 'Escape' && pickerOpenRef.current) {
        handlePickerClose()
        return
      }
      if (
        (e.code === 'Escape' || e.code === 'KeyP') &&
        !transitioning &&
        !pickerOpenRef.current
      ) {
        setPausedState((prev) => {
          const next = !prev
          setPaused(next)
          return next
        })
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [setPaused, transitioning, handlePickerClose])

  useEffect(() => {
    const handleB = (e: KeyboardEvent) => {
      if (e.code !== 'KeyB') return
      if (transitioning) return
      if (pickerOpen) return
      wasAlreadyPaused.current = paused
      setPaused(true)
      setPickerOpen(true)
      pickerOpenRef.current = true
    }
    window.addEventListener('keydown', handleB)
    return () => window.removeEventListener('keydown', handleB)
  }, [setPaused, paused, transitioning, pickerOpen])

  const [scale, setScale] = useState(1)
  useEffect(() => {
    const update = () => {
      setScale(
        Math.min(
          window.innerWidth / GAME_WIDTH,
          window.innerHeight / GAME_HEIGHT,
        ),
      )
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current)
        clearTimeout(transitionTimeoutRef.current)
    }
  }, [])

  const overlayStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.65)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  }
  const overlayTextStyle: React.CSSProperties = {
    color: '#00ccff',
    fontFamily: 'monospace',
    fontSize: 36,
    letterSpacing: 4,
    textShadow: '0 0 16px #00ccff',
  }

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: GAME_WIDTH * scale,
          height: GAME_HEIGHT * scale,
        }}
      >
        <canvas
          ref={canvasRef}
          width={GAME_WIDTH}
          height={GAME_HEIGHT}
          style={{ width: '100%', height: '100%', display: 'block' }}
        />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
          <HUD
            score={gameState.score}
            lives={gameState.lives}
            level={gameState.level}
          />
        </div>
        {paused && !transitioning && !pickerOpen && (
          <div style={overlayStyle}>
            <p style={overlayTextStyle}>PAUSED</p>
            <p
              style={{
                color: '#4488aa',
                fontFamily: 'monospace',
                fontSize: 14,
              }}
            >
              Press ESC or P to resume
            </p>
          </div>
        )}
        {transitioning && (
          <div style={overlayStyle}>
            <p style={overlayTextStyle}>LEVEL {transitionLevel} COMPLETE!</p>
          </div>
        )}
        {pickerOpen && !transitioning && (
          <BallPicker
            current={currentBallType}
            onSelect={(type) => {
              setBallType(type)
              setCurrentBallType(type)
            }}
            onClose={handlePickerClose}
          />
        )}
      </div>
    </div>
  )
}

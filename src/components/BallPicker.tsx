import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import type { BallType } from '../engine/ballRenderers'
import { drawBall } from '../engine/ballRenderers'

interface BallPickerProps {
  current: BallType
  onSelect: (type: BallType) => void
  onClose: () => void
}

const BALL_TYPES: { type: BallType; label: string }[] = [
  { type: 'standard', label: 'Standard' },
  { type: 'tennis', label: 'Tennis' },
  { type: 'football', label: 'Football' },
  { type: 'soccer', label: 'Soccer' },
]

export default function BallPicker({
  current,
  onSelect,
  onClose,
}: BallPickerProps) {
  const standardRef = useRef<HTMLCanvasElement>(null)
  const tennisRef = useRef<HTMLCanvasElement>(null)
  const footballRef = useRef<HTMLCanvasElement>(null)
  const soccerRef = useRef<HTMLCanvasElement>(null)

  const [focusedIndex, setFocusedIndex] = useState(() =>
    Math.max(
      0,
      BALL_TYPES.findIndex((b) => b.type === current),
    ),
  )

  useEffect(() => {
    const entries: [BallType, React.RefObject<HTMLCanvasElement | null>][] = [
      ['standard', standardRef],
      ['tennis', tennisRef],
      ['football', footballRef],
      ['soccer', soccerRef],
    ]
    for (const [type, ref] of entries) {
      const canvas = ref.current
      if (!canvas) continue
      const ctx = canvas.getContext('2d')
      if (!ctx) continue
      ctx.fillStyle = '#0d0d1a'
      ctx.fillRect(0, 0, 60, 60)
      drawBall(ctx, 30, 30, 20, type, false)
    }
  }, [])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft') {
        e.preventDefault()
        setFocusedIndex((i) => (i - 1 + BALL_TYPES.length) % BALL_TYPES.length)
      } else if (e.code === 'ArrowRight') {
        e.preventDefault()
        setFocusedIndex((i) => (i + 1) % BALL_TYPES.length)
      } else if (e.code === 'Enter') {
        e.preventDefault()
        onSelect(BALL_TYPES[focusedIndex].type)
        onClose()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [focusedIndex, onSelect, onClose])

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 20,
      }}
    >
      <p
        style={{
          color: '#00ccff',
          fontFamily: 'monospace',
          fontSize: 22,
          letterSpacing: 4,
          textShadow: '0 0 12px #00ccff',
          marginBottom: 24,
        }}
      >
        SELECT BALL
      </p>
      <div style={{ display: 'flex', gap: 20 }}>
        {BALL_TYPES.map(({ type, label }, i) => {
          const isSelected = current === type
          const isFocused = focusedIndex === i
          return (
            <button
              key={type}
              type="button"
              onClick={() => {
                onSelect(type)
                onClose()
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10,
                cursor: 'pointer',
                border: isSelected ? '2px solid #00ccff' : '2px solid #2a5566',
                borderRadius: 8,
                padding: '12px 16px',
                background: isSelected ? 'rgba(0,204,255,0.08)' : 'transparent',
                outline: isFocused ? '2px solid #ffffff' : 'none',
                outlineOffset: '3px',
                fontFamily: 'inherit',
              }}
            >
              <canvas
                ref={
                  type === 'standard'
                    ? standardRef
                    : type === 'tennis'
                      ? tennisRef
                      : type === 'football'
                        ? footballRef
                        : soccerRef
                }
                width={60}
                height={60}
              />
              <span
                style={{
                  color: isSelected ? '#00ccff' : '#4488aa',
                  fontFamily: 'monospace',
                  fontSize: 13,
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                }}
              >
                {label}
              </span>
            </button>
          )
        })}
      </div>
      <p
        style={{
          color: '#2a5566',
          fontFamily: 'monospace',
          fontSize: 12,
          marginTop: 20,
        }}
      >
        ← → select &nbsp; Enter confirm &nbsp; ESC cancel
      </p>
    </div>
  )
}

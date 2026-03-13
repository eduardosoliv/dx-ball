interface GameOverScreenProps {
  score: number
  onPlayAgain: () => void
  onMenu: () => void
}

export default function GameOverScreen({
  score,
  onPlayAgain,
  onMenu,
}: GameOverScreenProps) {
  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(135deg, #0d0d1a, #0a0a14)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'monospace',
      }}
    >
      <h1
        style={{
          fontSize: 48,
          color: '#ff4444',
          textShadow: '0 0 20px #ff4444',
          marginBottom: 8,
        }}
      >
        GAME OVER
      </h1>
      <p style={{ color: '#aaaacc', fontSize: 24, marginBottom: 48 }}>
        SCORE:{' '}
        <span style={{ color: '#00ccff' }}>
          {score.toString().padStart(6, '0')}
        </span>
      </p>
      <div style={{ display: 'flex', gap: 24 }}>
        {[
          { label: 'PLAY AGAIN', action: onPlayAgain },
          { label: 'MAIN MENU', action: onMenu },
        ].map(({ label, action }) => (
          <button
            key={label}
            type="button"
            onClick={action}
            style={{
              padding: '12px 32px',
              fontSize: 14,
              letterSpacing: 3,
              background: 'transparent',
              color: '#00ccff',
              border: '2px solid #00ccff',
              boxShadow: '0 0 12px #00ccff66',
              cursor: 'pointer',
              fontFamily: 'monospace',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = '#00ccff22')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = 'transparent')
            }
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}

interface TitleScreenProps {
  onPlay: () => void
}

export default function TitleScreen({ onPlay }: TitleScreenProps) {
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
          fontSize: 64,
          letterSpacing: 8,
          color: '#00ccff',
          textShadow: '0 0 20px #00ccff, 0 0 40px #00ccff',
          margin: 0,
          marginBottom: 16,
        }}
      >
        DX BALL
      </h1>
      <p style={{ color: '#4488aa', marginBottom: 16, letterSpacing: 2 }}>
        DESTROY ALL BRICKS
      </p>
      <p
        style={{
          color: '#2a5566',
          marginBottom: 48,
          letterSpacing: 2,
          fontSize: 12,
        }}
      >
        <a
          href="https://github.com/eduardosoliv/dx-ball"
          target="_blank"
          rel="noreferrer"
          style={{ color: 'inherit', textDecoration: 'none' }}
        >
          @eduardosoliv/dx-ball
        </a>
      </p>
      <button
        type="button"
        onClick={onPlay}
        style={{
          padding: '14px 48px',
          fontSize: 18,
          letterSpacing: 4,
          background: 'transparent',
          color: '#00ccff',
          border: '2px solid #00ccff',
          boxShadow: '0 0 16px #00ccff88',
          cursor: 'pointer',
          fontFamily: 'monospace',
          textTransform: 'uppercase',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#00ccff22')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        PLAY
      </button>
    </div>
  )
}

interface HUDProps {
  score: number
  lives: number
  level: number
}

export default function HUD({ score, lives, level }: HUDProps) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        padding: '6px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontFamily: 'monospace',
        color: '#00ccff',
        textShadow: '0 0 8px #00ccff',
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      {/* Left: score + lives + level */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
        <span style={{ fontSize: 18 }}>
          SCORE {score.toString().padStart(6, '0')}
        </span>
        <span style={{ fontSize: 18 }}>
          {Array.from({ length: lives }, (_, i) => (
            <span
              key={i}
              style={{ color: '#ff4444', textShadow: '0 0 6px #ff4444' }}
            >
              ♥
            </span>
          ))}
        </span>
        <span style={{ fontSize: 18 }}>LVL {level}</span>
      </div>

      {/* Right: controls reference */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          alignItems: 'center',
          fontSize: 13,
          color: '#2a6677',
          textShadow: 'none',
        }}
      >
        <span>
          <Kbd>B</Kbd> ball
        </span>
        <span>
          <Kbd>←</Kbd>
          <Kbd>→</Kbd> move
        </span>
        <span>
          <Kbd>P</Kbd> pause
        </span>
        <span>
          <Kbd>ESC</Kbd> pause
        </span>
      </div>
    </div>
  )
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '1px 5px',
        marginRight: 3,
        border: '1px solid #2a6677',
        borderRadius: 3,
        fontSize: 11,
        lineHeight: '16px',
        verticalAlign: 'middle',
      }}
    >
      {children}
    </span>
  )
}

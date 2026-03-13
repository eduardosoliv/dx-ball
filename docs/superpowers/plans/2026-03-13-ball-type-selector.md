# Ball Type Selector Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a cosmetic ball type picker (Standard / Tennis / Football) toggled by pressing `B` during gameplay.

**Architecture:** A new `ballRenderers.ts` module owns all canvas drawing logic for ball types as standalone exported functions — both the game engine and the BallPicker React component import from it. `GameEngine` stores `ballType` and calls `drawBall()` from renderers. `GameScreen` manages the picker overlay state and wires `B` key.

**Tech Stack:** React 18, TypeScript, Canvas 2D API, Vitest

---

## Chunk 1: Ball Renderers + Engine Integration

### Task 1: Create `ballRenderers.ts` with all draw functions

**Files:**
- Create: `src/engine/ballRenderers.ts`
- Test: `tests/ballRenderers.test.ts`

- [ ] **Step 1: Write failing tests for `drawBall`**

Create `tests/ballRenderers.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { drawBall } from '../src/engine/ballRenderers'
import type { BallType } from '../src/engine/ballRenderers'

function makeCtx() {
  return {
    save: vi.fn(), restore: vi.fn(),
    beginPath: vi.fn(), arc: vi.fn(), fill: vi.fn(), stroke: vi.fn(),
    moveTo: vi.fn(), lineTo: vi.fn(),
    fillStyle: '', strokeStyle: '', lineWidth: 0,
    shadowBlur: 0, shadowColor: '',
  } as unknown as CanvasRenderingContext2D
}

describe('drawBall', () => {
  let ctx: CanvasRenderingContext2D

  beforeEach(() => { ctx = makeCtx() })

  it('calls arc for standard ball', () => {
    drawBall(ctx, 50, 50, 8, 'standard', false)
    expect(ctx.arc).toHaveBeenCalledWith(50, 50, 8, 0, Math.PI * 2)
  })

  it('uses fireball colour when fireball=true regardless of type', () => {
    drawBall(ctx, 50, 50, 8, 'tennis', true)
    expect(ctx.fillStyle).toBe('#ff6600')
    expect(ctx.shadowColor).toBe('#ff6600')
  })

  it('uses yellow-green for tennis when not fireball', () => {
    drawBall(ctx, 50, 50, 8, 'tennis', false)
    expect(ctx.fillStyle).toBe('#ccee00')
  })

  it('calls arc for tennis base circle', () => {
    drawBall(ctx, 50, 50, 8, 'tennis', false)
    // first arc call is the base circle
    expect(ctx.arc).toHaveBeenCalledWith(50, 50, 8, 0, Math.PI * 2)
  })

  it('uses brown for football when not fireball', () => {
    drawBall(ctx, 50, 50, 8, 'football', false)
    expect(ctx.fillStyle).toBe('#8B4513')
  })

  it('calls moveTo/lineTo for football lace line', () => {
    drawBall(ctx, 50, 50, 8, 'football', false)
    expect(ctx.moveTo).toHaveBeenCalled()
    expect(ctx.lineTo).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd /Users/eduardooliveira/projects/dx-ball && npx vitest run tests/ballRenderers.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create `ballRenderers.ts`**

Create `src/engine/ballRenderers.ts`:

```ts
export type BallType = 'standard' | 'tennis' | 'football'

export function drawBall(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, radius: number,
  type: BallType,
  fireball: boolean,
): void {
  if (fireball) {
    drawStandardBall(ctx, x, y, radius, '#ff6600')
    return
  }
  if (type === 'tennis') { drawTennisBall(ctx, x, y, radius); return }
  if (type === 'football') { drawFootballBall(ctx, x, y, radius); return }
  drawStandardBall(ctx, x, y, radius, '#ffffff')
}

function drawStandardBall(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, radius: number, color: string,
): void {
  ctx.save()
  ctx.shadowColor = color
  ctx.shadowBlur = 15
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function drawTennisBall(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, radius: number,
): void {
  ctx.save()
  ctx.shadowColor = '#ccee00'
  ctx.shadowBlur = 12
  ctx.fillStyle = '#ccee00'
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fill()

  // Two curved seam arcs
  ctx.shadowBlur = 0
  ctx.strokeStyle = '#88aa00'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.arc(x, y, radius * 0.85, 0.3 * Math.PI, 0.7 * Math.PI)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(x, y, radius * 0.85, 1.3 * Math.PI, 1.7 * Math.PI)
  ctx.stroke()

  ctx.restore()
}

function drawFootballBall(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, radius: number,
): void {
  ctx.save()
  ctx.shadowColor = '#8B4513'
  ctx.shadowBlur = 12
  ctx.fillStyle = '#8B4513'
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fill()

  ctx.shadowBlur = 0

  // Horizontal lace line
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(x - radius * 0.6, y)
  ctx.lineTo(x + radius * 0.6, y)
  ctx.stroke()

  // 5 vertical stitches
  ctx.lineWidth = 1.5
  const stitchHalf = radius * 0.35 / 2
  const spacing = (radius * 1.2) / 4
  for (let i = 0; i < 5; i++) {
    const sx = x - radius * 0.6 + i * spacing
    ctx.beginPath()
    ctx.moveTo(sx, y - stitchHalf)
    ctx.lineTo(sx, y + stitchHalf)
    ctx.stroke()
  }

  ctx.restore()
}
```

- [ ] **Step 4: Run tests — expect all pass**

```bash
cd /Users/eduardooliveira/projects/dx-ball && npx vitest run tests/ballRenderers.test.ts
```

Expected: all 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/engine/ballRenderers.ts tests/ballRenderers.test.ts
git commit -m "feat: add ball renderer module with standard, tennis, football draw functions"
```

---

### Task 2: Add `BallType` to `types.ts` and wire `GameEngine`

**Files:**
- Modify: `src/engine/types.ts`
- Modify: `src/engine/GameEngine.ts`

- [ ] **Step 1: Add `BallType` re-export to `types.ts`**

Prepend the following line to `src/engine/types.ts` (the file has no existing imports, so this becomes line 1):

```ts
export type { BallType } from './ballRenderers'
```

- [ ] **Step 2: Write failing tests for `setBallType` on `GameEngine`**

Add at the **end** of `tests/GameEngine.test.ts`, after the closing `}` of the existing top-level `describe('GameEngine', ...)` block, as a new sibling `describe`:

```ts
describe('ball type', () => {
  it('defaults to standard', () => {
    const ctx = makeCanvas()
    const engine = new GameEngine(ctx, vi.fn())
    expect(engine.getBallType()).toBe('standard')
  })

  it('setBallType changes the stored type', () => {
    const ctx = makeCanvas()
    const engine = new GameEngine(ctx, vi.fn())
    engine.setBallType('tennis')
    expect(engine.getBallType()).toBe('tennis')
  })

  it('ballType persists after life loss', () => {
    const ctx = makeCanvas()
    const engine = new GameEngine(ctx, vi.fn())
    engine.setBallType('football')
    // Force ball below screen to trigger life lost
    engine._forceBallPosition(320, 600)
    engine._tick(16)
    expect(engine.getBallType()).toBe('football')
  })

  it('drawBalls calls arc (confirms rendering runs after type change)', () => {
    const ctx = makeCanvas()
    const engine = new GameEngine(ctx, vi.fn())
    engine.setBallType('tennis')
    engine.launch()
    engine._tick(16)
    // The tennis renderer calls ctx.arc for the base circle and seam arcs
    expect(ctx.arc).toHaveBeenCalled()
  })
})
```

- [ ] **Step 3: Run test to confirm it fails**

```bash
cd /Users/eduardooliveira/projects/dx-ball && npx vitest run tests/GameEngine.test.ts
```

Expected: FAIL — `getBallType is not a function`.

- [ ] **Step 4: Update `GameEngine.ts`**

At the top of `GameEngine.ts`, add to the imports:

```ts
import { drawBall } from './ballRenderers'
import type { BallType } from './ballRenderers'
```

Add field after `private paused = false`:

```ts
private ballType: BallType = 'standard'
```

Add public methods after `setPaused`:

```ts
setBallType(type: BallType) { this.ballType = type }
getBallType(): BallType { return this.ballType }
```

Replace the existing `drawBalls()` method body:

```ts
private drawBalls() {
  const fireball = isFireballActive(this.activePowerUps)
  for (const ball of this.balls) {
    drawBall(this.ctx, ball.x, ball.y, ball.radius, this.ballType, fireball)
  }
}
```

- [ ] **Step 5: Run all tests — expect all pass**

```bash
cd /Users/eduardooliveira/projects/dx-ball && npx vitest run
```

Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/engine/types.ts src/engine/GameEngine.ts tests/GameEngine.test.ts
git commit -m "feat: add ballType field and setBallType to GameEngine, wire drawBall renderer"
```

---

## Chunk 2: Hook + UI Layer

### Task 3: Expose `setBallType` from `useGameEngine`

**Files:**
- Modify: `src/hooks/useGameEngine.ts`

- [ ] **Step 1: Add `setBallType` callback**

In `src/hooks/useGameEngine.ts`, add after the `setPaused` line:

```ts
const setBallType = useCallback((type: BallType) => engineRef.current?.setBallType(type), [])
```

And add to the return:

```ts
return { launch, setPaused, setBallType, ready }
```

Also add the import at the top:

```ts
import type { BallType } from '../engine/ballRenderers'
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/eduardooliveira/projects/dx-ball && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useGameEngine.ts
git commit -m "feat: expose setBallType from useGameEngine hook"
```

---

### Task 4: Create `BallPicker` component

**Files:**
- Create: `src/components/BallPicker.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/BallPicker.tsx`:

```tsx
import { useRef, useEffect } from 'react'
import { drawBall } from '../engine/ballRenderers'
import type { BallType } from '../engine/ballRenderers'

interface BallPickerProps {
  current: BallType
  onSelect: (type: BallType) => void
  onClose: () => void
}

const BALL_TYPES: { type: BallType; label: string }[] = [
  { type: 'standard', label: 'Standard' },
  { type: 'tennis',   label: 'Tennis'   },
  { type: 'football', label: 'Football' },
]

export default function BallPicker({ current, onSelect, onClose }: BallPickerProps) {
  const standardRef = useRef<HTMLCanvasElement>(null)
  const tennisRef   = useRef<HTMLCanvasElement>(null)
  const footballRef = useRef<HTMLCanvasElement>(null)

  const refs = { standard: standardRef, tennis: tennisRef, football: footballRef }

  useEffect(() => {
    for (const { type } of BALL_TYPES) {
      const canvas = refs[type].current
      if (!canvas) continue
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = '#0d0d1a'
      ctx.fillRect(0, 0, 60, 60)
      drawBall(ctx, 30, 30, 20, type, false)
    }
  }, [])

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.75)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      zIndex: 20,
    }}>
      <p style={{
        color: '#00ccff', fontFamily: 'monospace',
        fontSize: 22, letterSpacing: 4,
        textShadow: '0 0 12px #00ccff',
        marginBottom: 24,
      }}>SELECT BALL</p>
      <div style={{ display: 'flex', gap: 20 }}>
        {BALL_TYPES.map(({ type, label }) => (
          <div
            key={type}
            onClick={() => { onSelect(type); onClose() }}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 10, cursor: 'pointer',
              border: current === type ? '2px solid #00ccff' : '2px solid #2a5566',
              borderRadius: 8, padding: '12px 16px',
              background: current === type ? 'rgba(0,204,255,0.08)' : 'transparent',
            }}
          >
            <canvas ref={refs[type]} width={60} height={60} />
            <span style={{
              color: current === type ? '#00ccff' : '#4488aa',
              fontFamily: 'monospace', fontSize: 13, letterSpacing: 2,
              textTransform: 'uppercase',
            }}>{label}</span>
          </div>
        ))}
      </div>
      <p style={{ color: '#2a5566', fontFamily: 'monospace', fontSize: 12, marginTop: 20 }}>
        ESC to cancel
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/eduardooliveira/projects/dx-ball && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/BallPicker.tsx
git commit -m "feat: add BallPicker overlay component with canvas previews"
```

---

### Task 5: Wire `GameScreen` — B key handler + picker state

**Files:**
- Modify: `src/screens/GameScreen.tsx`

- [ ] **Step 1: Update imports and state in `GameScreen.tsx`**

Add to the import line at the top:

```ts
import { useRef, useState, useCallback, useEffect } from 'react'
import BallPicker from '../components/BallPicker'
import type { BallType } from '../engine/ballRenderers'
```

(The `useRef` import is already present; just add `BallPicker` and `BallType`.)

- [ ] **Step 2: Add new state and refs inside `GameScreen`**

After the existing `const [transitioning, setTransitioning] = useState(false)` line, add:

```ts
const [pickerOpen, setPickerOpen] = useState(false)
const pickerOpenRef = useRef(false)
const wasAlreadyPaused = useRef(false)
const [currentBallType, setCurrentBallType] = useState<BallType>('standard')
```

- [ ] **Step 3: Update the `setBallType` destructure from the hook**

Change:

```ts
const { setPaused } = useGameEngine(canvasRef, handleStateChange, true)
```

To:

```ts
const { setPaused, setBallType } = useGameEngine(canvasRef, handleStateChange, true)
```

- [ ] **Step 4: Add the close handler and B key handler**

After the existing `useEffect` for Escape/P, add:

```ts
const handlePickerClose = useCallback(() => {
  setPickerOpen(false)
  pickerOpenRef.current = false
  if (!wasAlreadyPaused.current) setPaused(false)
}, [setPaused])

useEffect(() => {
  const handleB = (e: KeyboardEvent) => {
    if (e.code !== 'KeyB') return
    if (transitioning) return
    if (pickerOpen) return  // second B press ignored; use Escape to close
    wasAlreadyPaused.current = paused
    setPaused(true)
    setPickerOpen(true)
    pickerOpenRef.current = true
  }
  window.addEventListener('keydown', handleB)
  return () => window.removeEventListener('keydown', handleB)
}, [setPaused, paused, transitioning, pickerOpen])
```

- [ ] **Step 5: Update existing Escape/P handler to guard against picker**

Find the existing `handleEscape` useEffect and update the condition:

```ts
if ((e.code === 'Escape' || e.code === 'KeyP') && !transitioning && !pickerOpenRef.current) {
```

Also add `Escape` closing the picker when it is open — add this before the pause toggle:

```ts
if (e.code === 'Escape' && pickerOpenRef.current) {
  handlePickerClose()
  return
}
```

The full updated Escape/P useEffect becomes:

```ts
useEffect(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.code === 'Escape' && pickerOpenRef.current) {
      handlePickerClose()
      return
    }
    if ((e.code === 'Escape' || e.code === 'KeyP') && !transitioning && !pickerOpenRef.current) {
      setPausedState(prev => {
        const next = !prev
        setPaused(next)
        return next
      })
    }
  }
  window.addEventListener('keydown', handleEscape)
  return () => window.removeEventListener('keydown', handleEscape)
}, [setPaused, transitioning])
```

- [ ] **Step 6: Update PAUSED overlay guard and add picker overlay**

Find: `{paused && !transitioning && (`
Replace with: `{paused && !transitioning && !pickerOpen && (`

After the transitioning overlay closing `)}`, add the picker overlay:

```tsx
{pickerOpen && !transitioning && (
  <BallPicker
    current={currentBallType}
    onSelect={(type) => { setBallType(type); setCurrentBallType(type) }}
    onClose={handlePickerClose}
  />
)}
```

- [ ] **Step 7: Verify TypeScript compiles and run all tests**

```bash
cd /Users/eduardooliveira/projects/dx-ball && npx tsc --noEmit && npx vitest run
```

Expected: no type errors, all tests PASS.

- [ ] **Step 8: Commit**

```bash
git add src/screens/GameScreen.tsx
git commit -m "feat: wire B key to open BallPicker overlay in GameScreen"
```

---

### Task 6: Update HUD with `B` ball key hint

**Files:**
- Modify: `src/components/HUD.tsx`

- [ ] **Step 1: Add `B` key to HUD controls**

In `HUD.tsx`, find the right-side controls div and add `<Kbd>B</Kbd> ball` as the first item:

```tsx
<span><Kbd>B</Kbd> ball</span>
<span><Kbd>←</Kbd><Kbd>→</Kbd> move</span>
<span><Kbd>P</Kbd> pause</span>
<span><Kbd>ESC</Kbd> pause</span>
```

- [ ] **Step 2: Run all tests one final time**

```bash
cd /Users/eduardooliveira/projects/dx-ball && npx vitest run
```

Expected: all tests PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/HUD.tsx
git commit -m "feat: add B ball shortcut to HUD keyboard reference"
```

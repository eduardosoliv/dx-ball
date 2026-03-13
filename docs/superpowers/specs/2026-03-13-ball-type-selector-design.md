# Ball Type Selector — Design Spec

**Date:** 2026-03-13
**Status:** Approved

## Overview

Allow the player to choose between three cosmetic ball types — Standard, Tennis, and Football — at any point during gameplay by pressing `B`. The ball type is purely visual; physics and gameplay are identical across all types.

## Requirements

- Pressing `B` (`e.code === 'KeyB'`) during gameplay opens a ball-type picker overlay.
- `B` is suppressed during a level transition (`transitioning === true`), consistent with `P`/`Escape`.
- `B` is allowed before the ball is launched (ball sitting on paddle) — selection is cosmetic and can be made at any time.
- The game auto-pauses while the picker is open and resumes on close — **unless the game was already paused before the picker opened**, in which case it stays paused after close.
- `Escape` closes the picker; the existing pause-toggle handler must guard against `pickerOpen` so it does not double-fire.
- The picker is also closeable by clicking a ball type card.
- Three ball types: **Standard**, **Tennis**, **Football**.
- Ball type is cosmetic only — no gameplay differences.
- The existing fireball power-up override still applies on top of the active ball type (overrides colour to `#ff6600`).
- `ballType` persists across life loss and level advance (it is a player preference, not a game-state reset).
- HUD keyboard reference updated to include `B` ball.

## State Management

### `GameEngine.ts`
- `private ballType: BallType = 'standard'` — engine owns the rendering value.
- `setBallType(type: BallType): void` — exposed method.

### `useGameEngine.ts`
- Add `setBallType` to the hook return value: `setBallType: (type: BallType) => void`.
- Implement as `useCallback((type) => engineRef.current?.setBallType(type), [])`, consistent with how `setPaused` is currently done.
- Updated return shape: `{ launch, setPaused, setBallType, ready }`.

### `GameScreen.tsx`

**New state/refs:**
- `pickerOpen: boolean` (useState) — controls overlay visibility.
- `pickerOpenRef: React.MutableRefObject<boolean>` — ref mirroring `pickerOpen`, used to avoid stale closure in the `Escape`/`P` handler without adding `pickerOpen` to its dependency array.
- `wasAlreadyPaused: React.MutableRefObject<boolean>` — records whether the game was paused _before_ the picker opened.
- `currentBallType: BallType` (useState, initialised to `'standard'`) — mirrors engine value so `BallPicker` highlights the current selection. Resets to `'standard'` on re-mount (same as the engine), so they stay in sync.

**Key handlers — two separate `useEffect`s:**

1. **Existing `Escape`/`P` handler** (keep as-is but add guard):
   ```
   if ((Escape || KeyP) && !transitioning && !pickerOpenRef.current) { toggle pause }
   ```
   Dependency array: `[setPaused, transitioning]` (unchanged — uses `pickerOpenRef.current` to avoid adding state dependency).

2. **New `B` handler** in its own `useEffect`:
   - Suppressed if `transitioning`.
   - If `pickerOpen` is already true: **ignore** (second `B` press does not close the picker; `Escape` is the close path).
   - On open: `wasAlreadyPaused.current = paused`; `setPaused(true)`; `setPickerOpen(true)`; `pickerOpenRef.current = true`.
   - Dependency array: `[setPaused, paused, transitioning, pickerOpen]`.

**Close handler** (passed as `onClose` to `BallPicker` and also called by `Escape` inside the picker):
- `setPickerOpen(false)`; `pickerOpenRef.current = false`; if `!wasAlreadyPaused.current` call `setPaused(false)`.

**Overlay guards:**
- PAUSED overlay: `paused && !transitioning && !pickerOpen` (suppress when picker is open).
- Picker overlay: `pickerOpen && !transitioning`, `zIndex: 20`.

## Ball Renderer Module

Extract ball drawing into `src/engine/ballRenderers.ts` — standalone exported functions. Both `GameEngine` (game canvas) and `BallPicker` (preview canvases) import from here. No dependency on `GameEngine` internals.

```ts
export type BallType = 'standard' | 'tennis' | 'football'

export function drawBall(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, radius: number,
  type: BallType,
  fireball: boolean
): void

function drawStandardBall(ctx, x, y, radius, color): void
function drawTennisBall(ctx, x, y, radius): void
function drawFootballBall(ctx, x, y, radius): void
```

`BallType` is re-exported from `types.ts` (or imported directly from `ballRenderers.ts`).

## Ball Rendering Geometry

### Standard
Unchanged from current implementation: white glowing circle (`shadowBlur: 15`, `shadowColor: '#ffffff'`, `fillStyle: '#ffffff'`). Fireball override sets both to `#ff6600`.

### Tennis
- Base circle: `fillStyle: '#ccee00'`, `shadowColor: '#ccee00'`, `shadowBlur: 12`.
- Two curved seam arcs drawn after fill, `strokeStyle: '#88aa00'`, `lineWidth: 1.5`.
- Arc 1: centre offset `(0, 0)`, startAngle `0.3π`, endAngle `0.7π` (lower-left curve).
- Arc 2: centre offset `(0, 0)`, startAngle `1.3π`, endAngle `1.7π` (upper-right curve), same radius as ball, no fill.
- Both arcs use `ctx.arc(x, y, radius * 0.85, start, end)` with `stroke()` only.

### Football
- Base circle: `fillStyle: '#8B4513'`, `shadowColor: '#8B4513'`, `shadowBlur: 12`.
- Horizontal lace line: `strokeStyle: '#ffffff'`, `lineWidth: 2`, drawn from `(x - radius * 0.6, y)` to `(x + radius * 0.6, y)`.
- 5 vertical stitches evenly spaced along lace line, each `lineWidth: 1.5`, length `radius * 0.35`, centred on the lace line. Spacing: `radius * 1.2 / 4` between stitches (4 gaps for 5 stitches). Stitch x-positions: `x - radius * 0.6 + i * (radius * 1.2 / 4)` for `i` in `[0,1,2,3,4]` — first and last stitches land on the lace endpoints.

## `BallPicker` Component

**File:** `src/components/BallPicker.tsx`

**Props:**
```ts
interface BallPickerProps {
  current: BallType
  onSelect: (type: BallType) => void
  onClose: () => void
}
```

- Renders three cards (Standard, Tennis, Football), each with a `<canvas width={60} height={60}>` preview and a label.
- Preview canvas background: `#0d0d1a` (matches game canvas dark background).
- Ball drawn centred at `(30, 30)` with radius 20, using `drawBall()` from `ballRenderers.ts`. Fireball is always `false` in previews.
- Each card uses a `useRef` on its canvas element and a `useEffect` (dependency: none / mount only) to call `drawBall()` after the canvas mounts. The three refs can be declared individually (`standardRef`, `tennisRef`, `footballRef`) and drawn in a single shared `useEffect([])`.
- The card matching `current` is highlighted (border `2px solid #00ccff`; others `2px solid #2a5566`).
- Clicking a card calls `onSelect(type)` then `onClose()`.
- Overlay styling: `position: absolute`, `top/left/right/bottom: 0`, `background: rgba(0,0,0,0.75)`, `zIndex: 20`, flex column centred.

## HUD Update

Add `B` ball to the right-side keyboard reference in `HUD.tsx`, alongside the existing `←``→`, `P`, `ESC` keys.

## Files Changed

| File | Change |
|------|--------|
| `src/engine/types.ts` | Re-export `BallType` from `ballRenderers.ts` (or add type here) |
| `src/engine/ballRenderers.ts` | New — standalone draw functions |
| `src/engine/GameEngine.ts` | Import `drawBall`; add `ballType` field and `setBallType()`; update `drawBalls()` |
| `src/hooks/useGameEngine.ts` | Expose `setBallType` |
| `src/screens/GameScreen.tsx` | `B` key handler, picker state, `wasAlreadyPaused` ref, overlay, guard existing Escape handler |
| `src/components/BallPicker.tsx` | New component |
| `src/components/HUD.tsx` | Add `B` ball key hint |

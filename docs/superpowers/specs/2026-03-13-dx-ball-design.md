# DX Ball — Design Spec

**Date:** 2026-03-13
**Stack:** React + TypeScript + Vite
**Rendering:** HTML Canvas (game) + React (UI shell)

---

## Overview

A browser-based clone of the classic DX-Ball game (Breakout/Arkanoid style). The player controls a paddle to bounce a ball and destroy bricks across 15–20 hand-crafted levels. Power-ups drop from destroyed bricks. Visual style is modern/neon — dark gradient background, glowing bricks.

**Initial lives:** 3
**Total levels:** 20

---

## Architecture

### Approach

`GameEngine` is a plain TypeScript class that owns the full game loop via `requestAnimationFrame`. React mounts the canvas and renders UI (HUD, screens) around it. The engine calls React callbacks on state changes (score, lives, level, game over). React does not drive the game loop.

### File Structure

```
src/
  main.tsx                  # React entry point
  App.tsx                   # Root: routes between screens (title, game, game-over)
  screens/
    TitleScreen.tsx         # "DX Ball" title + Play button
    GameScreen.tsx          # Mounts canvas, HUD overlay
    GameOverScreen.tsx      # Final score + Play Again / Main Menu
  engine/
    GameEngine.ts           # Core class: game loop, physics, collisions, rendering
    types.ts                # Shared types: Ball, Paddle, Brick, PowerUp, Level
    collision.ts            # Pure collision detection helpers
    levels.ts               # 15–20 level definitions (BrickType[][] grids)
    powerups.ts             # Power-up behaviors and timers
  components/
    HUD.tsx                 # Score + lives + level overlay (React, over canvas)
  hooks/
    useGameEngine.ts        # Mounts/unmounts engine, exposes React-visible state
tests/
  collision.test.ts
  powerups.test.ts
  levels.test.ts
  GameEngine.test.ts
```

### Data Flow

1. `GameScreen` creates a `canvas` ref
2. `useGameEngine` instantiates `GameEngine` with the canvas ref and state callbacks
3. Engine runs its own `requestAnimationFrame` loop independently of React
4. On state changes (score, lives, level complete, game over), engine calls callbacks
5. React re-renders HUD and transitions screens accordingly

---

## Game Engine & Physics

### Game Loop (per tick)
1. Update ball position
2. Check collisions (walls, ceiling, paddle, bricks)
3. Apply power-up effects
4. Check win/lose conditions
5. Draw canvas frame

### Ball Physics
- Constant speed vector `(vx, vy)` reflected on contact
- Wall/ceiling hits: reflect appropriate axis
- Paddle hit: angle determined by contact point — center = straight up, edges = sharp angle
- Bottom wall hit: life lost, ball resets to paddle (see Life Lost section)
- Speed scales with `ballSpeedMultiplier` per level

### Ball Type

Each ball carries an `isOriginal: boolean` flag. At any point in time there is **exactly one** ball with `isOriginal: true`. On game start and after each life reset, one ball is created with `isOriginal: true`. Multi-ball spawns additional balls with `isOriginal: false`. A life is lost the moment the single `isOriginal: true` ball exits the bottom wall — regardless of how many extra balls are still active. Extra balls (`isOriginal: false`) that exit the bottom are simply removed with no life penalty. The Fireball power-up does not affect the floor: the original ball exiting the bottom always costs a life, even when Fireball is active.

### Brick Types

| Type | Hits to Destroy | Notes |
|---|---|---|
| `single` | 1 | Standard brick |
| `multi2` | 2 | Changes color after first hit |
| `multi3` | 3 | Changes color each hit |
| `indestructible` | ∞ | Acts as permanent obstacle, never drops power-ups |
| `empty` | — | No brick in this cell |

### Collision Detection
- AABB (axis-aligned bounding box) for all entities
- Ball-vs-brick corner hits deflect both axes
- Brick hit checks all bricks each frame (grid is small enough for brute force)

### Canvas Scaling
- Internal game resolution: 640×480
- Scaled to fit the viewport using **letterbox** (preserve aspect ratio, center with black bars if needed)
- Mouse coordinates are mapped back through the inverse scale transform before use, so paddle control is always accurate regardless of viewport size

### Life Lost
When the `isOriginal` ball exits the bottom wall (Fireball does not prevent this):
1. All active balls are removed (including extra multi-ball balls)
2. All active power-up effects expire immediately
3. Paddle resets to center
4. Lives count decrements by 1
5. If lives > 0: new ball spawns stuck to paddle center, waiting for launch input
6. If lives === 0: game over

### Ball Launch
When the ball is stuck to the paddle (start of life or level), it launches upward at a **random angle between 75° and 105°** from horizontal (centered on straight up, ±15° random offset). This prevents degenerate vertical bounce loops. Additionally, if a returning ball hits the exact center of the paddle, a small random deflection of ±5° is applied to avoid a perfectly vertical loop.

### Speed Formula

```
effectiveSpeed = baseSpeed × levelMultiplier × loopMultiplier × slowBallMultiplier
```

- `baseSpeed`: constant defined in engine (e.g. 300 px/s in game coordinates)
- `levelMultiplier`: the `ballSpeedMultiplier` from the current level definition (1.0–1.8)
- `loopMultiplier`: starts at 1.0, increases by +0.2 each time the player completes all 20 levels
- `slowBallMultiplier`: 0.6 when Slow Ball is active, otherwise 1.0

---

## Scoring

Points are awarded on brick destruction:

| Brick Type | Points per destruction |
|---|---|
| `single` | 10 |
| `multi2` | 20 (total across both hits) |
| `multi3` | 30 (total across all three hits) |

Each hit on a multi-hit brick awards equal fractional points (e.g. `multi2` = 10pts per hit). No level completion bonus. Score is displayed live in the HUD and shown on the Game Over screen.

---

## Power-Ups

Drop from destroyed bricks at ~20% chance **on the final (destroying) hit only** — intermediate hits on multi-hit bricks do not trigger a drop. **Indestructible bricks never drop power-ups.** Power-ups fall at **150 px/s** (game coordinates) and are caught by paddle contact.

| Power-Up | Effect | Duration |
|---|---|---|
| Wide Paddle | Paddle width × 1.75 (capped at 2× base width) | 15s |
| Multi-Ball | Spawns 2 additional balls (`isOriginal: false`); max 6 balls total (1 original + 5 extra) | Until all extras lost |
| Slow Ball | Ball speed × 0.6, applied to all active balls | 10s |
| Extra Life | +1 life | Instant |
| Fireball | All active balls pass through bricks, decrementing health each pass and triggering power-up drops normally | 10s |

### Stacking Rules
- **Wide Paddle**: collecting a second Wide Paddle resets the timer to 15s; width does not multiply again (stays at 1.75×, capped at 2× base)
- **Slow Ball**: collecting a second Slow Ball resets the timer to 10s; speed multiplier does not compound
- **Fireball**: applies to all active balls (both original and extra); fireball balls still lose a life when the original ball exits the bottom (fireball only bypasses brick bouncing, not the floor)
- **Multi-Ball**: spawning again adds 2 more extra balls
- All other power-up timers run independently

---

## Levels

### Format

```ts
type BrickType = 'empty' | 'single' | 'multi2' | 'multi3' | 'indestructible'

interface Level {
  id: number                   // 1–20
  ballSpeedMultiplier: number  // 1.0 for level 1, up to ~1.8 for level 20
  grid: BrickType[][]          // grid[row][col], 10 rows × 14 columns (row 0 = top)
}
```

- 20 levels, each with a distinct hand-authored brick pattern
- Level complete when all non-indestructible bricks are destroyed
- Grid fixed at 14 columns × 10 rows
- After level 20: loops back to level 1 with `loopMultiplier` increased by +0.2 (see Speed Formula)

### Level Transition
- On level complete: game loop pauses, "Level X Complete!" overlay displays for 2 seconds
- After 2 seconds: next level loads automatically, ball spawns stuck to paddle, waiting for launch input
- No user input is required to dismiss the transition overlay

---

## UI Screens

### Title Screen
- Dark neon background
- "DX Ball" title in large glowing text
- "Play" button → starts level 1

### Game Screen
- 640×480 canvas, letterboxed to fit viewport
- HUD overlay (React, absolutely positioned over canvas):
  - Score — top left
  - Level — top center
  - Lives as heart icons — top right
- Pause: `Escape` key → game loop pauses, dimmed **React overlay** "Paused — Press Escape to resume". `Escape` is ignored during the 2-second auto-transition overlay (the game loop is already paused and the transition is automatic).
- Level transition: 2-second **React overlay** "Level X Complete!", game loop paused, no user input required
- Ball launch: ball starts stuck to paddle; click or Space to launch

### Game Over Screen
- Shows final score
- "Play Again" → restart from level 1, 3 lives
- "Main Menu" → return to title screen

---

## Controls

| Input | Action |
|---|---|
| Mouse move | Move paddle (coordinates mapped through inverse canvas scale) |
| Left / Right arrow | Move paddle at 400px/s (game coordinates); paddle position clamped to canvas bounds. Movement is driven by a held-key state map (`{ ArrowLeft: bool, ArrowRight: bool }`) sampled each game tick — not from keydown event repeat rate. |
| Click / Space | Launch ball |
| Escape | Pause / Unpause |

---

## Testing

Tests live in `tests/` at the project root. Focus on pure engine logic — no canvas rendering, no React.

| File | Coverage |
|---|---|
| `collision.test.ts` | Ball-wall, ball-paddle, ball-brick AABB logic; corner cases |
| `powerups.test.ts` | Activation, timer countdown, stacking, expiry, fireball + multi-ball interaction |
| `levels.test.ts` | All level grids are valid dimensions (10×14); at least one destructible brick per level |
| `GameEngine.test.ts` | State transitions: start, life lost (original ball), extra ball lost (no life lost), level complete, game over; mock canvas context |

---

## Out of Scope

- Sound effects
- High score persistence
- Level editor
- Mobile/touch controls
- Multiplayer

# DX Ball

A browser-based clone of the classic DX-Ball (Breakout/Arkanoid) game. Control a paddle to bounce a ball and destroy bricks across 20 hand-crafted levels. Power-ups drop from destroyed bricks. Modern neon visual style on a dark gradient background.

## Gameplay

- **Paddle:** mouse or arrow keys
- **Launch ball:** click or Space
- **Pause:** Escape or P
- **Lives:** 3 — lose one each time the original ball falls off the bottom
- **Power-ups:** Wide Paddle, Multi-Ball, Slow Ball, Extra Life, Fireball
- **Levels:** 20 unique layouts; loops back with increasing speed after level 20

## Setup

Requires Node.js 20+.

```bash
npm install
```

[`just`](https://just.systems) is an optional command runner that wraps common tasks. Install with Homebrew:

```bash
brew install just
```

## Running the game

```bash
npm run dev
```

Open the URL printed in the terminal (default: `http://localhost:5173`).

## Building for production

```bash
npm run build
```

Output goes to `dist/`. Preview the production build with:

```bash
npm run preview
```

## Tests

Run all tests once:

```bash
npm test
```

Watch mode:

```bash
npx vitest
```

With coverage report (output in `coverage/`):

```bash
npx vitest run --coverage
```

## Linting and formatting

[Biome](https://biomejs.dev) handles linting and formatting.

Check lint + formatting:

```bash
npm run lint
```

Lint + formatting auto-fix:

```bash
npm run lint:fix
```

## Type-checking

TypeScript is configured with `strict: true` plus `noUnusedLocals`, `noUnusedParameters`, and `noFallthroughCasesInSwitch`.

```bash
npx tsc --noEmit
```

## Just commands

If you have [`just`](https://just.systems) installed, these shortcuts are available:

Start the dev server:

```bash
just run
```

Run all tests once:

```bash
just test
```

Run tests with coverage report:

```bash
just coverage
```

Check lint + formatting:

```bash
just lint
```

Lint + formatting auto-fix:

```bash
just lint-fix
```

Run TypeScript type-checker:

```bash
just typecheck
```

Lint + format fix, typecheck, and test in one pass:

```bash
just check
```

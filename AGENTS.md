# DX Ball — Agent Guide

## Tech stack

React 19, TypeScript (strict), Vite, Vitest, Biome (lint + format).

## Commands

Install dependencies:

```bash
npm install
```

Run all tests:

```bash
npm test
```

Lint check (no fix):

```bash
npm run lint
```

Lint + format fix:

```bash
npm run lint:fix
```

Type-check:

```bash
npx tsc --noEmit
```

Build:

```bash
npm run build
```

## Before marking work complete

Run the full check (lint+format fix, typecheck, tests):

```bash
just check
```

Or without `just`:

```bash
npm run lint:fix && npx tsc --noEmit && npm test
```

All three must pass with no errors.

## TypeScript

`strict: true` with `noUnusedLocals`, `noUnusedParameters`, and `noFallthroughCasesInSwitch`. Do not introduce unused imports or variables.

## Linting

Biome handles both linting and formatting. Run `npm run lint:fix` after any edits to keep formatting consistent. Notable rule overrides:

- `noNonNullAssertion` — off (game code uses `!` for invariants)
- `noArrayIndexKey` — off
- `useLiteralKeys` — off (tests access private fields via bracket notation)
- `noExplicitAny` — off in `tests/` only

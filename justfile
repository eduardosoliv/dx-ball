check:
    npm run lint:fix
    npx tsc --noEmit
    npm test

lint:
    npm run lint

lint-fix:
    npm run lint:fix

typecheck:
    npx tsc --noEmit

test:
    npm test

coverage:
    npx vitest run --coverage

run:
    npx vite

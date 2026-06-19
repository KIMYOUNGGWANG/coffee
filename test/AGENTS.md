# TEST KNOWLEDGE

## OVERVIEW

Mixed Node contract/smoke tests (`*.test.mjs`) and Playwright browser flows (`*.test.ts`) under one test directory.

## WHERE TO LOOK

| Task | Location | Notes |
| --- | --- | --- |
| Repository smoke contract | `smoke.test.mjs` | Package scripts, docs, product surfaces |
| Product flow truth | `../docs/golden-flows.md` | Narrative paired with smoke checks |
| Auth and activation | `auth-gate.test.ts`, `auth-resume.test.ts`, `activation-loop.test.ts` | Uses mocked API routes |
| Checkout and entitlement | `checkout-*.test.mjs`, `credit-lifecycle.test.mjs`, `subscription-lifecycle.test.mjs` | Test-mode fixtures only |
| Browser product behavior | `behavior.test.ts`, `story-export.test.ts`, `public-share.test.ts` | Runs through Playwright |
| Brand and copy contracts | `brand-*.test.mjs`, `product-copy.test.*` | Korean copy is intentional contract data |

## CONVENTIONS

- Use `*.test.mjs` for Node contract or static repository checks and `*.test.ts` for Playwright browser flows.
- Keep each test independently runnable and deterministic; restore temporary modules, globals, and environment changes.
- Mock `/api/v1/**` with `page.route` for browser flows that do not need the real server dependency.
- Prefer roles, labels, visible text, and stable test IDs over DOM structure selectors.
- Follow existing Given/When/Then naming in contract tests and user-flow naming in browser tests.
- Prefer executed imports, route contracts, or browser behavior for runtime claims; reserve source-text assertions for inherently static surfaces.
- Update smoke, copy, and contract tests when an intentional public surface changes.

## COMMANDS

```bash
npm run test:smoke
npm run test:e2e
npx playwright test test/<name>.test.ts
node --test test/<name>.test.mjs
```

## ANTI-PATTERNS

- Do not make browser-proof criteria pass with a source-only assertion.
- Do not weaken copy, schema, idempotency, or entitlement assertions to accommodate a regression.
- Do not depend on test order, a previous test's login, or persistent browser storage unless the test sets it explicitly.
- Do not commit screenshots, traces, or `test-results/` as source artifacts unless a task explicitly requests evidence.

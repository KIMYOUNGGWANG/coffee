# TEST KNOWLEDGE

## OVERVIEW

- 52 Node contract/smoke files use `*.test.mjs` and `node:test`.
- Playwright owns 24 `*.test.ts` files plus `paywall-flow.spec.ts`.
- Playwright TS is not synonymous with browser E2E: `fresh-shelf.test.ts` is pure logic, `analytics-events.test.ts` includes an imported-constant contract, and `behavior.test.ts` includes an HTTP request check.
- Route integrations transpile selected TypeScript and replace Next, Supabase, Stripe, environment, or provider imports with fixtures.

## WHERE TO LOOK

| Contract | Location | Scope |
| --- | --- | --- |
| Repository/product smoke | `smoke.test.mjs` | Scripts, CI, docs, routes, product surfaces |
| Product truth and legal copy | `product-copy.test.mjs`, `product-copy.test.ts` | Static boundaries plus rendered copy |
| Brand | `brand-contract.test.mjs`, `brand-leak.test.mjs` | Executed constants and retired-name scan |
| Auth and activation | `auth-*.test.*`, `activation-*.test.*` | Redirect, resume, onboarding, save gate |
| Checkout and entitlement | `checkout-*`, `credit-lifecycle.test.mjs`, `subscription-lifecycle.test.mjs` | Fixture-only commerce lifecycle |
| Route ownership and failures | `*-route.test.mjs`, `memory-crud-contract.test.mjs`, `scan-trust.test.mjs` | Transpiled handlers with injected stores |
| Browser behavior | `dashboard-*.test.ts`, `guest-*.test.ts`, `wizard-errors.test.ts` | Mocked API flows through rendered UI |
| Shared fixture builder | `support/analytics-route-fixture.mjs` | Analytics route transpilation, fake persistence, cleanup |

## RUNNER MAP

```bash
node --test test/<name>.test.mjs
npx playwright test test/<name>.test.ts
npx playwright test test/paywall-flow.spec.ts
```

- `npm run test:smoke`: `smoke.test.mjs` only.
- `npm run test:mobile-bridge`: mobile bridge contract only.
- `npm run test:product-truth`: four curated smoke/copy/brand files.
- `npm run test:routes`: fifteen curated route, lifecycle, and entitlement files.
- These npm commands are subsets; many Node contracts remain direct-invocation tests.
- `npm run test:e2e` uses `next start`; run `npm run build` first when invoking it independently.
- `npm run validate:full` builds before E2E after the curated product-truth and route subsets.
- The web Playwright config explicitly matches TypeScript `*.test.ts` and `*.spec.ts` files. Node `*.test.mjs` contracts run only through explicit `node --test` commands.
- Do not treat browser E2E as a replacement for explicit Node contract commands.

## FIXTURE AND STATE RULES

- Never use a real Supabase database, live Stripe mode, or a live AI/provider call.
- Replace server integrations before importing transpiled route modules; use fixture keys and in-memory state.
- Browser flows mock `/api/v1/**` with `page.route` unless the test explicitly proves the local server route.
- Mock direct OAuth or Supabase browser endpoints when the flow reaches them.
- Keep `test/support` for fixture builders reused across files; keep scenario-specific payloads beside their test.
- Restore temporary modules, OS temp directories, `globalThis.fetch`, environment variables, local storage, and fixture state in the test that changes them.
- Do not depend on test order, prior login, retained browser context, or persistent storage.

## ASSERTION RULES

- Browser proof uses rendered behavior: roles, labels, visible text, or stable test IDs.
- Source regex is for static surfaces such as scripts, migrations, documentation, and forbidden product claims.
- Do not make browser-proof criteria pass with source-only assertions.
- Korean copy, schema constraints, owner filters, webhook idempotency, and entitlement outcomes are contract data; update the matching assertions only with intentional behavior changes.

## EVIDENCE ARTIFACTS

- Playwright traces remain `on-first-retry`; service workers remain blocked.
- Do not commit screenshots, traces, `playwright-report/`, or `test-results/` unless the task explicitly requests evidence.

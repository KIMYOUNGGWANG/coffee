# Hyangmi Auth Gate Sprint Plan

## Goal
Make the public-card activation path sellable by routing unauthenticated visitors through a Korean Hyangmi auth gate, preserving the dashboard first-card intent after sign-in.

## Constraints
- Preserve existing Supabase API, database, and Stripe contracts.
- Do not use live Stripe mutation, npm installs, or real Supabase DB in tests.
- Keep marketplace, social network, shipping, and print scope out.
- Avoid editing `hooks/useTastingCards.ts` because it is over the 250 pure LOC ceiling.
- Keep `components/dashboard-client.tsx` changes minimal because it is in the warning band.
- No git commit is expected because this workspace is not a git repository.

## Wave 1: Auth Redirect Contract And Gate Surface

Task A: Auth redirect helper and contract tests
- Write scope: `lib/auth-redirect.ts`, `test/auth-redirect.test.mjs`
- RED: helper import or unsafe redirect expectation fails before helper exists.
- GREEN: sanitize redirect values so internal `/dashboard?...` survives and external `https://evil.example` becomes `/dashboard`.
- Covers: C001, C002
- Evidence path later: `.omo/evidence/auth-gate-c003-node.txt`

Task B: Auth page and auth form
- Write scope: `app/auth/page.tsx`, `components/auth-gate-client.tsx`
- RED: Playwright auth-gate tests fail because `/auth` page is missing.
- GREEN: render Korean Hyangmi sign-up/sign-in gate, use public Supabase env only, redirect to sanitized target after auth success.
- Covers: C001, C002
- Evidence paths later: `.omo/evidence/auth-gate-c001-browser.txt`, `.omo/evidence/auth-gate-c002-browser.txt`

## Wave 2: Dashboard 401-to-Auth Routing

Task C: Dashboard auth redirect wiring
- Write scope: `components/dashboard-client.tsx`
- RED: Playwright unauthenticated dashboard test fails by showing dashboard error instead of `/auth`.
- GREEN: detect auth-required errors from dashboard data queries, redirect to `/auth?redirect=<current dashboard path>`, and leave mocked successful dashboard activation unchanged.
- Covers: C001, C002, C003

Task D: Playwright coverage
- Write scope: `test/auth-gate.test.ts`, existing activation tests only if needed.
- PIN: existing `test/activation-loop.test.ts` still proves mocked activation opens the first-card modal.
- RED: new C001/C002 tests fail on current code for the right reason.
- GREEN: C001 public-card/onboarding-to-auth and C002 direct dashboard/malformed redirect pass.

## Wave 3: Evidence And Quality Gate

Task E: Regression commands
- Commands:
  - `/Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test test/*.test.mjs`
  - `/Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/typescript/bin/tsc --noEmit`
  - `/Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/playwright/cli.js test test/auth-gate.test.ts test/activation-loop.test.ts test/public-share.test.ts test/payment-dialog.test.ts test/story-export.test.ts`
  - `/Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/next/dist/bin/next build`
- Evidence paths: `.omo/evidence/auth-gate-c003-node.txt`, `.omo/evidence/auth-gate-c003-playwright.txt`, `.omo/evidence/auth-gate-c003-build.txt`, `.omo/evidence/auth-gate-c003-scope.txt`

Task F: Browser manual QA
- C001: open public card with mocked API, click public CTA, click onboarding CTA, capture `/auth` URL and sign-up/sign-in copy.
- C002: open direct unauthenticated dashboard, capture `/auth`; open malformed external redirect, confirm sanitized `/dashboard`.
- Evidence paths: `.omo/evidence/auth-gate-c001-browser.txt`, `.omo/evidence/auth-gate-c001.png`, `.omo/evidence/auth-gate-c002-browser.txt`, `.omo/evidence/auth-gate-c002.png`
- Cleanup: close browser context, stop dev server, confirm TCP:3000 empty, no auth temp dirs.

## Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
| --- | --- | --- | --- |
| A | none | B, C, D | none |
| B | A | D, F | C after A |
| C | A | D, F | B after A |
| D | A, B, C | E, F | none |
| E | D | final gate | none |
| F | D | criteria evidence | none |

Critical path: A -> B/C -> D -> F -> criteria recording -> E -> final quality gate.

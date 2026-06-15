# Hyangmi Authenticated Conversion Resume

## TL;DR
> Summary:      Complete the auth-gated resume loop so mocked sign-in returns first-card visitors to the dashboard modal, and unauthenticated checkout intent resumes into the payment dialog without live Stripe or Supabase mutation.
> Deliverables:
> - Auth redirect and checkout-intent contracts with failing-first evidence
> - Korean auth gate sign-in/sign-up resume behavior
> - Extracted dashboard resume effects so `components/dashboard-client.tsx` does not grow beyond its 235 pure LOC baseline
> - Payment dialog resume cue with no automatic checkout POST
> - C001/C002 browser artifacts and C003 regression/type/build/scope evidence
> Effort:       Medium
> Risk:         Medium - auth/session and revenue-entry routing cross browser, query parsing, Supabase client mocks, and dashboard state effects.

## Scope
### Must have
- Preserve the active ULW goal `.omo/ulw-loop/hyangmi-auth-resume-conversion-loop/goals.json:17` C001: mocked browser sign-in from `/auth?redirect=/dashboard?intent=first_card...` lands on `/dashboard` and opens the first-card modal.
- Preserve `.omo/ulw-loop/hyangmi-auth-resume-conversion-loop/goals.json:25` C002: `/dashboard?checkout_intent=premium_subscription` redirects through `/auth`, mocked sign-in reopens the payment dialog, sign-up without a session shows Korean email-confirmation/re-entry guidance, and malformed redirects sanitize to `/dashboard`.
- Preserve `.omo/ulw-loop/hyangmi-auth-resume-conversion-loop/goals.json:33` C003: targeted node tests, Playwright tests, typecheck, Next build, and unsupported-scope scan pass with evidence.
- Use bundled Node only: `/Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node`.
- Keep all search/query boundaries parsed with Zod where new behavior crosses URL or network boundaries.
- Extract new dashboard resume logic out of `components/dashboard-client.tsx`; current pure LOC is `235`, measured by `awk '!/^[[:space:]]*$/ && !/^[[:space:]]*\/\//' components/dashboard-client.tsx | wc -l`.
- Keep Korean UI copy in auth and payment surfaces.
- Record no-commit evidence because `git rev-parse --is-inside-work-tree` currently fails with `fatal: not a git repository`.

### Must NOT have (guardrails, anti-slop, scope boundaries)
- Do not run npm, install packages, mutate live Stripe, or mutate live Supabase.
- Do not add marketplace, social network, shipping, print, poster, theme/skin, or unsupported product scope.
- Do not edit `components/ui/*`; `components/AGENTS.md:7` permits Shadcn/UI wrappers only.
- Do not put React imports in `lib/*`; `lib/AGENTS.md:7` requires pure side-effect-free helpers and `lib/AGENTS.md:8` forbids React imports.
- Do not broaden `hooks/useTastingCards.ts`; it is already over the 250 pure LOC ceiling and is outside the requested focus.
- Do not add `any`, non-null assertions, `@ts-*` escapes, broad refactors, default exports outside framework-required files, or unparsed URL boundary data.
- Do not auto-submit checkout after login; resume opens/highlights the intended product and waits for an explicit user click.

## Verification strategy
> Zero human intervention - all verification is agent-executed.
- Test decision: TDD + Node `node:test` for pure helpers and Playwright Test for browser flows
- QA policy: every task has agent-executed scenarios
- Evidence: `.omo/evidence/task-<N>-<slug>.<ext>`

Shared command prefix:
```bash
BUNDLED_NODE="/Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
export NEXT_TELEMETRY_DISABLED=1
```

## Execution strategy
### Parallel execution waves
> Target 5-8 tasks per wave. <3 per wave (except final) = under-splitting.
> Extract shared dependencies as Wave-1 tasks to maximize parallelism.

Wave 1 (no dependencies):
- Task 1: Checkout-intent parser and contract
- Task 2: Auth redirect hardening and contract
- Task 3: Auth gate mocked sign-in/sign-up resume behavior
- Task 4: Dashboard resume-effect extraction
- Task 5: Payment dialog resume cue

Wave 2 (after Wave 1):
- Task 6: Dashboard checkout-intent wire-up depends [1, 4, 5]
- Task 7: C001/C002 browser proof depends [2, 3, 6]

Wave 3 (after Wave 2):
- Task 8: C003 regression/type/build/scope evidence depends [1, 2, 3, 4, 5, 6, 7]

Critical path: Task 1 -> Task 6 -> Task 7 -> Task 8

### Dependency matrix
| Task | Depends on | Blocks | Can parallelize with |
|------|------------|--------|----------------------|
| 1    | none       | 6, 8   | 2, 3, 4, 5           |
| 2    | none       | 7, 8   | 1, 3, 4, 5           |
| 3    | none       | 7, 8   | 1, 2, 4, 5           |
| 4    | none       | 6, 8   | 1, 2, 3, 5           |
| 5    | none       | 6, 8   | 1, 2, 3, 4           |
| 6    | 1, 4, 5    | 7, 8   | none                 |
| 7    | 2, 3, 6    | 8      | none                 |
| 8    | 1-7        | final  | none                 |

## Todos
> Implementation + Test = ONE task. Never separate.
> Every task MUST have: References + Acceptance Criteria + QA Scenarios + Commit.

- [ ] 1. Checkout-intent parser and contract

  What to do: Extend `lib/checkout-return.ts` with a Zod-parsed checkout resume intent for `checkout_intent=<CheckoutItemType>`, plus record/search readers and a builder only if needed by dashboard code. Add a failing-first node contract test, preferably `test/checkout-return-contract.test.mjs`, using the existing TypeScript transpile pattern.
  Must NOT do: Do not change existing checkout return notice semantics for `checkout_status=success|cancel`; do not add new product item types.

  Parallelization: Can parallel: YES | Wave 1 | Blocks: [6, 8] | Blocked by: []

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `lib/checkout-return.ts:1` - Existing Zod schema, `CheckoutItemType`, and notice parser to extend.
  - Pattern:  `test/auth-redirect.test.mjs:12` - Node test pattern for transpiling a TypeScript helper without npm.
  - Test:     `test/checkout-return.test.ts:61` - Browser checkout-return behavior that must keep passing.
  - External: `https://github.com/vercel/next.js/blob/v16.1.6/docs/01-app/03-api-reference/03-file-conventions/page.mdx` - App Router `searchParams` object can contain `string | string[] | undefined`.

  Acceptance criteria (agent-executable only):
  - [ ] RED evidence: `$BUNDLED_NODE --test test/checkout-return-contract.test.mjs` fails before implementation because `readCheckoutIntentFromRecord` or equivalent export does not exist or returns `none`.
  - [ ] GREEN evidence: `$BUNDLED_NODE --test test/checkout-return-contract.test.mjs test/checkout-products.test.mjs` exits `0`.
  - [ ] `readCheckoutNoticeFromSearch("?checkout_status=success&item_type=pdf_book")` remains a success notice, and unrelated `checkout_intent` alone does not create a checkout return notice.

  QA scenarios (MANDATORY - task incomplete without these):
  > Name the exact tool AND its exact invocation - not "verify it works". Browser use: use Chrome to drive the page; if Chrome is not available, download and use agent-browser (https://github.com/vercel-labs/agent-browser). Computer use: OS-level GUI automation for a non-browser desktop app.
  ```
  Scenario: checkout intent parses approved item
    Tool:     bash
    Steps:    BUNDLED_NODE="/Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"; $BUNDLED_NODE --test test/checkout-return-contract.test.mjs 2>&1 | tee .omo/evidence/task-1-checkout-intent.txt
    Expected: command exits 0 and asserts premium_subscription, credits_10, and pdf_book parse as checkout resume intents.
    Evidence: .omo/evidence/task-1-checkout-intent.txt

  Scenario: malformed checkout intent is ignored
    Tool:     bash
    Steps:    BUNDLED_NODE="/Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"; $BUNDLED_NODE --test test/checkout-return-contract.test.mjs --test-name-pattern "malformed checkout intent" 2>&1 | tee .omo/evidence/task-1-checkout-intent-error.txt
    Expected: command exits 0 and asserts marketplace/social/shipping/print/unknown item values return the none intent.
    Evidence: .omo/evidence/task-1-checkout-intent-error.txt
  ```

  Commit: NO | Message: `test(checkout): parse auth resume checkout intent` | Files: [`lib/checkout-return.ts`, `test/checkout-return-contract.test.mjs`, `.omo/evidence/task-1-checkout-intent.txt`, `.omo/evidence/task-1-checkout-intent-error.txt`]

- [ ] 2. Auth redirect hardening and contract

  What to do: Extend `test/auth-redirect.test.mjs` first, then harden `lib/auth-redirect.ts` so `/dashboard?checkout_intent=premium_subscription` and first-card query redirects survive, while external URLs, protocol-relative URLs, non-dashboard paths, and malformed values sanitize to `/dashboard`.
  Must NOT do: Do not allow redirects to `/onboarding`, external origins, hash-only bypasses, or absolute URLs.

  Parallelization: Can parallel: YES | Wave 1 | Blocks: [7, 8] | Blocked by: []

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `lib/auth-redirect.ts:4` - Current redirect sanitizer and `/dashboard` allowlist.
  - Pattern:  `lib/auth-redirect.ts:33` - `buildAuthGateHref` must keep using sanitized redirects.
  - Test:     `test/auth-redirect.test.mjs:35` - Existing first-card query preservation test.
  - Test:     `test/auth-redirect.test.mjs:51` - Existing unsafe redirect fallback test.

  Acceptance criteria (agent-executable only):
  - [ ] RED evidence: `$BUNDLED_NODE --test test/auth-redirect.test.mjs --test-name-pattern "checkout intent"` fails before sanitizer coverage is added.
  - [ ] GREEN evidence: `$BUNDLED_NODE --test test/auth-redirect.test.mjs` exits `0`.
  - [ ] `buildAuthGateHref("/dashboard?checkout_intent=premium_subscription")` returns `/auth?redirect=%2Fdashboard%3Fcheckout_intent%3Dpremium_subscription`.

  QA scenarios (MANDATORY - task incomplete without these):
  ```
  Scenario: checkout redirect survives auth gate
    Tool:     bash
    Steps:    BUNDLED_NODE="/Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"; $BUNDLED_NODE --test test/auth-redirect.test.mjs 2>&1 | tee .omo/evidence/task-2-auth-redirect.txt
    Expected: command exits 0 and includes a passing checkout-intent redirect preservation assertion.
    Evidence: .omo/evidence/task-2-auth-redirect.txt

  Scenario: external redirect sanitizes
    Tool:     bash
    Steps:    BUNDLED_NODE="/Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"; $BUNDLED_NODE --test test/auth-redirect.test.mjs --test-name-pattern "unsafe redirect" 2>&1 | tee .omo/evidence/task-2-auth-redirect-error.txt
    Expected: command exits 0 and `https://evil.example`, `//evil.example`, and `/onboarding?source=public_card` all map to `/dashboard`.
    Evidence: .omo/evidence/task-2-auth-redirect-error.txt
  ```

  Commit: NO | Message: `fix(auth): preserve safe checkout resume redirects` | Files: [`lib/auth-redirect.ts`, `test/auth-redirect.test.mjs`, `.omo/evidence/task-2-auth-redirect.txt`, `.omo/evidence/task-2-auth-redirect-error.txt`]

- [ ] 3. Auth gate mocked sign-in/sign-up resume behavior

  What to do: In `components/auth-gate-client.tsx`, keep sign-in redirecting to the sanitized `redirectTo`, add Supabase sign-up `options.emailRedirectTo` pointing back to `/auth?redirect=<redirectTo>` on the current origin, and improve the no-session Korean status message to include the preserved internal redirect. In `app/auth/page.tsx`, keep the async `searchParams` parsing and sanitized prop flow. Add Playwright coverage in `test/auth-gate.test.ts` for mocked sign-in success and sign-up no-session guidance.
  Must NOT do: Do not introduce real Supabase credentials, live Supabase calls in tests, or English-only UI.

  Parallelization: Can parallel: YES | Wave 1 | Blocks: [7, 8] | Blocked by: []

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `components/auth-gate-client.tsx:46` - Current `runAuthAction` switch and sign-in/sign-up branches.
  - Pattern:  `components/auth-gate-client.tsx:73` - Existing no-session sign-up branch that needs clearer Korean re-entry guidance.
  - Pattern:  `components/auth-gate-client.tsx:141` - Existing Korean error/status rendering.
  - Pattern:  `app/auth/page.tsx:16` - Next async `searchParams` page pattern.
  - Test:     `test/auth-gate.test.ts:67` - Existing Korean auth gate assertions.
  - External: `https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/auth/passwords.mdx` - Supabase `signUp` supports `options.emailRedirectTo`; email confirmation can return no browser session.

  Acceptance criteria (agent-executable only):
  - [ ] RED evidence: `CI=1 NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:3000 NEXT_PUBLIC_SUPABASE_ANON_KEY=test-anon PLAYWRIGHT_HTML_OPEN=never $BUNDLED_NODE node_modules/@playwright/test/cli.js test test/auth-gate.test.ts --grep "mocked sign-in"` fails on current code for the right reason.
  - [ ] GREEN evidence: same command exits `0`, with Playwright routes intercepting `**/auth/v1/token**` and never touching live Supabase.
  - [ ] No-session sign-up test asserts a Korean status message containing the preserved `/dashboard?...` redirect target or a clear "메일 인증 후 다시 로그인" re-entry instruction.

  QA scenarios (MANDATORY - task incomplete without these):
  ```
  Scenario: mocked sign-in resumes redirect
    Tool:     playwright(real Chrome)
    Steps:    CI=1 NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:3000 NEXT_PUBLIC_SUPABASE_ANON_KEY=test-anon NEXT_TELEMETRY_DISABLED=1 PLAYWRIGHT_HTML_OPEN=never /Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/@playwright/test/cli.js test test/auth-gate.test.ts --grep "mocked sign-in" 2>&1 | tee .omo/evidence/task-3-auth-gate-signin.txt
    Expected: command exits 0, login button submits to mocked Supabase auth route, and browser navigates to the sanitized dashboard redirect.
    Evidence: .omo/evidence/task-3-auth-gate-signin.txt

  Scenario: sign-up no-session guidance
    Tool:     playwright(real Chrome)
    Steps:    CI=1 NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:3000 NEXT_PUBLIC_SUPABASE_ANON_KEY=test-anon NEXT_TELEMETRY_DISABLED=1 PLAYWRIGHT_HTML_OPEN=never /Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/@playwright/test/cli.js test test/auth-gate.test.ts --grep "sign-up without a session" 2>&1 | tee .omo/evidence/task-3-auth-gate-signup-no-session.txt
    Expected: command exits 0 and the page shows Korean email-confirmation/re-entry guidance without navigating or exposing raw 401.
    Evidence: .omo/evidence/task-3-auth-gate-signup-no-session.txt
  ```

  Commit: NO | Message: `fix(auth): resume sanitized redirect after mocked auth` | Files: [`components/auth-gate-client.tsx`, `app/auth/page.tsx`, `test/auth-gate.test.ts`, `.omo/evidence/task-3-auth-gate-signin.txt`, `.omo/evidence/task-3-auth-gate-signup-no-session.txt`]

- [ ] 4. Dashboard resume-effect extraction

  What to do: Create a focused extracted client-side module such as `components/dashboard-resume-effects.tsx` to own dashboard auth-required redirect, first-card activation, checkout return notice, and later checkout intent effects. Move existing effect code from `components/dashboard-client.tsx:91`, `components/dashboard-client.tsx:96`, `components/dashboard-client.tsx:103`, and `components/dashboard-client.tsx:127` into that module behind typed props/callbacks. Keep `components/dashboard-client.tsx` as the orchestrating view.
  Must NOT do: Do not move unrelated dashboard layout, card rendering, filters, analytics panels, or hook implementations.

  Parallelization: Can parallel: YES | Wave 1 | Blocks: [6, 8] | Blocked by: []

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `components/dashboard-client.tsx:54` - Current `DashboardClient` state and view orchestrator.
  - Pattern:  `components/dashboard-client.tsx:81` - `latestCard` stays in dashboard view logic.
  - Pattern:  `components/dashboard-client.tsx:91` - Existing ready/analytics effect to relocate or keep only if extraction would over-couple.
  - Pattern:  `components/dashboard-client.tsx:103` - Existing first-card activation effect to extract.
  - Pattern:  `components/dashboard-client.tsx:127` - Existing checkout-return effect to extract.
  - Rule:     `components/AGENTS.md:8` - New component file name must be kebab-case; component names PascalCase.

  Acceptance criteria (agent-executable only):
  - [ ] RED evidence: add a characterization Playwright or node check proving first-card activation still opens `새로운 테이스팅 카드`; run it before extraction and capture pass as a PIN in `.omo/evidence/task-4-dashboard-extraction-pin.txt`.
  - [ ] GREEN evidence: `awk '!/^[[:space:]]*$/ && !/^[[:space:]]*\/\//' components/dashboard-client.tsx | wc -l` reports `235` or lower after extraction, with new resume module under `250` pure LOC.
  - [ ] `CI=1 ... $BUNDLED_NODE node_modules/@playwright/test/cli.js test test/activation-loop.test.ts` exits `0` after extraction.

  QA scenarios (MANDATORY - task incomplete without these):
  ```
  Scenario: first-card activation survives extraction
    Tool:     playwright(real Chrome)
    Steps:    CI=1 NEXT_TELEMETRY_DISABLED=1 PLAYWRIGHT_HTML_OPEN=never /Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/@playwright/test/cli.js test test/activation-loop.test.ts 2>&1 | tee .omo/evidence/task-4-dashboard-extraction.txt
    Expected: command exits 0 and verifies the dashboard opens the "새로운 테이스팅 카드" modal from the first-card activation query.
    Evidence: .omo/evidence/task-4-dashboard-extraction.txt

  Scenario: file-size guard
    Tool:     bash
    Steps:    { awk '!/^[[:space:]]*$/ && !/^[[:space:]]*\\/\\//' components/dashboard-client.tsx | wc -l; awk '!/^[[:space:]]*$/ && !/^[[:space:]]*\\/\\//' components/dashboard-resume-effects.tsx | wc -l; } | tee .omo/evidence/task-4-dashboard-extraction-size.txt
    Expected: dashboard-client count is <=235 and dashboard-resume-effects count is <=250.
    Evidence: .omo/evidence/task-4-dashboard-extraction-size.txt
  ```

  Commit: NO | Message: `refactor(dashboard): extract resume effects` | Files: [`components/dashboard-client.tsx`, `components/dashboard-resume-effects.tsx`, `.omo/evidence/task-4-dashboard-extraction.txt`, `.omo/evidence/task-4-dashboard-extraction-size.txt`]

- [ ] 5. Payment dialog resume cue

  What to do: Add a typed optional resume target prop to `components/PaymentDialog.tsx`, using the existing `CheckoutItemType` union or a local equivalent without widening products. Show a compact Korean cue/highlight when checkout intent resumes a specific item, and ensure the dialog does not call `/api/v1/checkout` until the user explicitly clicks the item CTA. Update `test/payment-dialog.test.ts` with failing-first coverage.
  Must NOT do: Do not auto-post to checkout, add new products, or reintroduce retired theme/skin/poster/mock copy.

  Parallelization: Can parallel: YES | Wave 1 | Blocks: [6, 8] | Blocked by: []

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `components/PaymentDialog.tsx:8` - Existing Zod checkout response parser.
  - Pattern:  `components/PaymentDialog.tsx:13` - Existing approved checkout item union.
  - Pattern:  `components/PaymentDialog.tsx:26` - `handleCheckout` is the only place that may POST to `/api/v1/checkout`.
  - Test:     `test/payment-dialog.test.ts:24` - Existing lifecycle-safe product assertions and unsupported-scope negative checks.
  - Rule:     `components/AGENTS.md:9` - Props type stays at the top of the component file.

  Acceptance criteria (agent-executable only):
  - [ ] RED evidence: `CI=1 ... $BUNDLED_NODE node_modules/@playwright/test/cli.js test test/payment-dialog.test.ts --grep "resumed checkout intent"` fails before the cue exists.
  - [ ] GREEN evidence: same command exits `0`.
  - [ ] Playwright route counter proves `/api/v1/checkout` receives `0` calls on dialog open and `1` call only after clicking the intended item CTA against a mocked response.

  QA scenarios (MANDATORY - task incomplete without these):
  ```
  Scenario: resumed payment dialog highlights intended product
    Tool:     playwright(real Chrome)
    Steps:    CI=1 NEXT_TELEMETRY_DISABLED=1 PLAYWRIGHT_HTML_OPEN=never /Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/@playwright/test/cli.js test test/payment-dialog.test.ts --grep "resumed checkout intent" 2>&1 | tee .omo/evidence/task-5-payment-resume.txt
    Expected: command exits 0 and the dialog visibly identifies Hyangmi Premium as the resumed product.
    Evidence: .omo/evidence/task-5-payment-resume.txt

  Scenario: no auto checkout POST
    Tool:     playwright(real Chrome)
    Steps:    CI=1 NEXT_TELEMETRY_DISABLED=1 PLAYWRIGHT_HTML_OPEN=never /Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/@playwright/test/cli.js test test/payment-dialog.test.ts --grep "does not auto-submit checkout" 2>&1 | tee .omo/evidence/task-5-payment-resume-error.txt
    Expected: command exits 0 and route counter stays 0 until an explicit CTA click.
    Evidence: .omo/evidence/task-5-payment-resume-error.txt
  ```

  Commit: NO | Message: `feat(payment): cue resumed checkout item` | Files: [`components/PaymentDialog.tsx`, `test/payment-dialog.test.ts`, `.omo/evidence/task-5-payment-resume.txt`, `.omo/evidence/task-5-payment-resume-error.txt`]

- [ ] 6. Dashboard checkout-intent wire-up

  What to do: Wire Task 1 and Task 5 through `app/dashboard/page.tsx`, `components/dashboard-client.tsx`, and `components/dashboard-resume-effects.tsx`: parse `checkout_intent` server-side, pass a typed initial intent to the client, route unauthenticated dashboard API failures through `buildAuthGateHref(current dashboard path)`, and after mocked authenticated APIs succeed, open `PaymentDialog` with the resumed item and scrub `checkout_intent` from the URL.
  Must NOT do: Do not start a checkout session automatically, do not erase unrelated first-card activation query behavior, and do not add broad dashboard refactors.

  Parallelization: Can parallel: NO | Wave 2 | Blocks: [7, 8] | Blocked by: [1, 4, 5]

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `app/dashboard/page.tsx:9` - Server page resolves `searchParams` and passes typed initial props.
  - Pattern:  `components/dashboard-client.tsx:30` - Current dashboard props type to extend.
  - Pattern:  `components/dashboard-client.tsx:96` - Auth-required redirect already preserves current path via `buildAuthGateHref`.
  - Pattern:  `components/dashboard-client.tsx:147` - `openPayment` tracks paywall and opens the dialog.
  - Pattern:  `components/dashboard-client.tsx:240` - Existing `PaymentDialog` mount point.
  - External: `https://github.com/microsoft/playwright/blob/main/docs/src/api/class-locatorassertions.md` - Use locator visibility assertions and screenshots for browser proof.

  Acceptance criteria (agent-executable only):
  - [ ] RED evidence: Playwright test for `/dashboard?checkout_intent=premium_subscription` fails on current code because the dialog does not resume after auth.
  - [ ] GREEN evidence: the same test exits `0`, landing on `/dashboard` with the payment dialog visible and raw `checkout_intent` removed from the final URL.
  - [ ] `test/activation-loop.test.ts` still exits `0`, proving first-card query resume was not broken.

  QA scenarios (MANDATORY - task incomplete without these):
  ```
  Scenario: checkout intent resumes payment dialog
    Tool:     playwright(real Chrome)
    Steps:    CI=1 NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:3000 NEXT_PUBLIC_SUPABASE_ANON_KEY=test-anon NEXT_TELEMETRY_DISABLED=1 PLAYWRIGHT_HTML_OPEN=never /Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/@playwright/test/cli.js test test/auth-gate.test.ts --grep "checkout intent resumes payment dialog" 2>&1 | tee .omo/evidence/task-6-checkout-resume.txt
    Expected: command exits 0, unauthenticated dashboard redirects to `/auth?redirect=...checkout_intent...`, mocked sign-in returns to `/dashboard`, and the payment dialog is visible with the resumed premium cue.
    Evidence: .omo/evidence/task-6-checkout-resume.txt

  Scenario: malformed checkout intent does not open payment
    Tool:     playwright(real Chrome)
    Steps:    CI=1 NEXT_TELEMETRY_DISABLED=1 PLAYWRIGHT_HTML_OPEN=never /Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/@playwright/test/cli.js test test/auth-gate.test.ts --grep "malformed checkout intent" 2>&1 | tee .omo/evidence/task-6-checkout-resume-error.txt
    Expected: command exits 0 and `/dashboard?checkout_intent=marketplace` sanitizes to normal dashboard behavior with no payment dialog.
    Evidence: .omo/evidence/task-6-checkout-resume-error.txt
  ```

  Commit: NO | Message: `feat(dashboard): resume checkout intent after auth` | Files: [`app/dashboard/page.tsx`, `components/dashboard-client.tsx`, `components/dashboard-resume-effects.tsx`, `test/auth-gate.test.ts`, `.omo/evidence/task-6-checkout-resume.txt`, `.omo/evidence/task-6-checkout-resume-error.txt`]

- [ ] 7. C001/C002 browser proof

  What to do: Execute the real browser scenarios required by C001 and C002 with local route mocks only. Ensure tests write `.omo/evidence/auth-resume-c001.png` and `.omo/evidence/auth-resume-c002.png`, and tee action logs to `.omo/evidence/auth-resume-c001-browser.txt` and `.omo/evidence/auth-resume-c002-browser.txt`. Append cleanup receipts: Playwright browser closed, dev server stopped, TCP:3000 empty, and no auth temp dirs.
  Must NOT do: Do not mark C001/C002 pass from unit tests alone and do not use a non-browser substitute.

  Parallelization: Can parallel: NO | Wave 2 | Blocks: [8] | Blocked by: [2, 3, 6]

  References (executor has NO interview context - be exhaustive):
  - Criterion: `.omo/ulw-loop/hyangmi-auth-resume-conversion-loop/goals.json:17` - C001 browser sign-in resume requirement.
  - Criterion: `.omo/ulw-loop/hyangmi-auth-resume-conversion-loop/goals.json:25` - C002 checkout/sign-up/sanitized redirect edge requirement.
  - Prior evidence: `.omo/evidence/auth-gate-c001-browser.txt` - Previous auth-gate-only proof stopped before sign-in resume.
  - Prior evidence: `.omo/evidence/auth-gate-c002-browser.txt` - Previous malformed redirect proof stopped before checkout resume.
  - Test:     `test/activation-loop.test.ts:113` - First-card modal assertion text.
  - Test:     `test/payment-dialog.test.ts:48` - Payment dialog role/name assertion.

  Acceptance criteria (agent-executable only):
  - [ ] `.omo/evidence/auth-resume-c001-browser.txt` exists and states the mocked sign-in path, final `/dashboard` URL, visible `새로운 테이스팅 카드`, no raw 401, and cleanup receipt.
  - [ ] `.omo/evidence/auth-resume-c001.png` exists and shows the first-card modal.
  - [ ] `.omo/evidence/auth-resume-c002-browser.txt` exists and states checkout auth redirect, payment dialog resume, sign-up no-session guidance, malformed redirect sanitization, no raw 401, and cleanup receipt.
  - [ ] `.omo/evidence/auth-resume-c002.png` exists and shows the resumed payment dialog or sign-up guidance state named in the log.

  QA scenarios (MANDATORY - task incomplete without these):
  ```
  Scenario: C001 first-card modal after mocked sign-in
    Tool:     playwright(real Chrome)
    Steps:    CI=1 NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:3000 NEXT_PUBLIC_SUPABASE_ANON_KEY=test-anon NEXT_TELEMETRY_DISABLED=1 PLAYWRIGHT_HTML_OPEN=never /Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/@playwright/test/cli.js test test/auth-gate.test.ts --grep "C001" 2>&1 | tee .omo/evidence/auth-resume-c001-browser.txt; lsof -iTCP:3000 -sTCP:LISTEN -n -P >> .omo/evidence/auth-resume-c001-browser.txt 2>&1 || true
    Expected: command exits 0, `.omo/evidence/auth-resume-c001.png` exists, and TCP:3000 is empty after cleanup.
    Evidence: .omo/evidence/auth-resume-c001-browser.txt and .omo/evidence/auth-resume-c001.png

  Scenario: C002 checkout/sign-up/sanitized redirect edge
    Tool:     playwright(real Chrome)
    Steps:    CI=1 NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:3000 NEXT_PUBLIC_SUPABASE_ANON_KEY=test-anon NEXT_TELEMETRY_DISABLED=1 PLAYWRIGHT_HTML_OPEN=never /Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/@playwright/test/cli.js test test/auth-gate.test.ts --grep "C002" 2>&1 | tee .omo/evidence/auth-resume-c002-browser.txt; lsof -iTCP:3000 -sTCP:LISTEN -n -P >> .omo/evidence/auth-resume-c002-browser.txt 2>&1 || true
    Expected: command exits 0, `.omo/evidence/auth-resume-c002.png` exists, checkout intent resumes the payment dialog, no-session sign-up guidance is Korean, malformed external redirect shows `/dashboard`, and TCP:3000 is empty after cleanup.
    Evidence: .omo/evidence/auth-resume-c002-browser.txt and .omo/evidence/auth-resume-c002.png
  ```

  Commit: NO | Message: `test(auth): prove conversion resume in browser` | Files: [`test/auth-gate.test.ts`, `.omo/evidence/auth-resume-c001-browser.txt`, `.omo/evidence/auth-resume-c001.png`, `.omo/evidence/auth-resume-c002-browser.txt`, `.omo/evidence/auth-resume-c002.png`]

- [ ] 8. C003 regression, type, build, scope, and no-commit evidence

  What to do: Run the full C003 command set with bundled Node, record outputs, run a scope scan over changed app/component/lib source, and record no-commit evidence. If Next build fails due to an environmental native binding issue already seen in `scripts/verify-npm-free.sh:125`, record the exact blocker and rerun all non-build checks; do not hide real TypeScript or source failures behind that blocker.
  Must NOT do: Do not use `npm run`, do not install missing packages, and do not commit.

  Parallelization: Can parallel: NO | Wave 3 | Blocks: [final] | Blocked by: [1, 2, 3, 4, 5, 6, 7]

  References (executor has NO interview context - be exhaustive):
  - Command:  `package.json:10` - Typecheck is `tsc --noEmit`, but invoke through bundled Node.
  - Command:  `package.json:12` - E2E is Playwright, but invoke direct CLI through bundled Node.
  - Command:  `package.json:8` - Build intent is Next build with webpack.
  - Pattern:  `scripts/verify-npm-free.sh:152` - Bundled-node typecheck invocation.
  - Pattern:  `scripts/verify-npm-free.sh:153` - Bundled-node Next build invocation.
  - Rule:     `AGENTS.md:21` - Truthful commands, recoverable automation, strict type safety.

  Acceptance criteria (agent-executable only):
  - [ ] `.omo/evidence/auth-resume-c003-node.txt` contains passing node tests for auth redirect, checkout intent, activation intent, and existing `.mjs` contracts.
  - [ ] `.omo/evidence/auth-resume-c003-playwright.txt` contains passing Playwright output for `test/auth-gate.test.ts`, `test/activation-loop.test.ts`, `test/payment-dialog.test.ts`, and `test/checkout-return.test.ts`.
  - [ ] `.omo/evidence/auth-resume-c003-build.txt` contains passing `tsc --noEmit` and `next build --webpack`, or an exact environmental build blocker plus passing `tsc --noEmit`.
  - [ ] `.omo/evidence/auth-resume-c003-scope.txt` contains no unsupported source-scope matches and confirms no new `any`, `!`, or `@ts-*` escapes in changed TS/TSX.
  - [ ] `.omo/evidence/auth-resume-no-commit.txt` records `git rev-parse --is-inside-work-tree` failure and states no commit was made because this workspace is not a git repository.

  QA scenarios (MANDATORY - task incomplete without these):
  ```
  Scenario: regression/type/build gate
    Tool:     bash
    Steps:    BUNDLED_NODE="/Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"; { $BUNDLED_NODE --test test/auth-redirect.test.mjs test/activation-intent.test.mjs test/checkout-return-contract.test.mjs test/*.test.mjs; } 2>&1 | tee .omo/evidence/auth-resume-c003-node.txt; { $BUNDLED_NODE node_modules/typescript/bin/tsc --noEmit; $BUNDLED_NODE node_modules/next/dist/bin/next build --webpack; } 2>&1 | tee .omo/evidence/auth-resume-c003-build.txt
    Expected: node tests and typecheck exit 0; build exits 0 or records exact native-binding/environment blocker without TypeScript errors.
    Evidence: .omo/evidence/auth-resume-c003-node.txt and .omo/evidence/auth-resume-c003-build.txt

  Scenario: browser regression and scope guard
    Tool:     bash
    Steps:    BUNDLED_NODE="/Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"; CI=1 NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:3000 NEXT_PUBLIC_SUPABASE_ANON_KEY=test-anon NEXT_TELEMETRY_DISABLED=1 PLAYWRIGHT_HTML_OPEN=never $BUNDLED_NODE node_modules/@playwright/test/cli.js test test/auth-gate.test.ts test/activation-loop.test.ts test/payment-dialog.test.ts test/checkout-return.test.ts 2>&1 | tee .omo/evidence/auth-resume-c003-playwright.txt; { rg -n "marketplace|social network|shipping|print product|인쇄용 결산|프리미엄 카드 스킨|테마 10종|스킨 10종|MOCK" components/auth-gate-client.tsx components/dashboard-client.tsx components/dashboard-resume-effects.tsx components/PaymentDialog.tsx lib/auth-redirect.ts lib/checkout-return.ts app/auth/page.tsx app/dashboard/page.tsx || true; rg -n "(: any|as any|@ts-ignore|@ts-expect-error|[^=]![.;,)\\]])" components/auth-gate-client.tsx components/dashboard-client.tsx components/dashboard-resume-effects.tsx components/PaymentDialog.tsx lib/auth-redirect.ts lib/checkout-return.ts app/auth/page.tsx app/dashboard/page.tsx || true; git rev-parse --is-inside-work-tree || true; } 2>&1 | tee .omo/evidence/auth-resume-c003-scope.txt; git rev-parse --is-inside-work-tree > .omo/evidence/auth-resume-no-commit.txt 2>&1 || printf "no commit: workspace is not a git repository\n" >> .omo/evidence/auth-resume-no-commit.txt
    Expected: Playwright exits 0; scope scan has no product-source matches except intentional negative test text outside source; no type escape matches; no-commit file records non-git workspace.
    Evidence: .omo/evidence/auth-resume-c003-playwright.txt, .omo/evidence/auth-resume-c003-scope.txt, .omo/evidence/auth-resume-no-commit.txt
  ```

  Commit: NO | Message: `chore(auth): record conversion resume verification` | Files: [`.omo/evidence/auth-resume-c003-node.txt`, `.omo/evidence/auth-resume-c003-playwright.txt`, `.omo/evidence/auth-resume-c003-build.txt`, `.omo/evidence/auth-resume-c003-scope.txt`, `.omo/evidence/auth-resume-no-commit.txt`]

## Final verification wave (MANDATORY - after all implementation tasks)
> Runs in PARALLEL. ALL must APPROVE. Surface results to the caller and wait for an explicit "okay" before declaring complete.
- [ ] F1. Plan compliance audit - every task done, every acceptance criterion met
- [ ] F2. Code quality review - diagnostics clean, idioms match, no dead code
- [ ] F3. Real manual QA - every QA scenario executed with evidence captured
- [ ] F4. Scope fidelity - nothing extra shipped beyond Must-Have, nothing Must-NOT-Have introduced

## Commit strategy
- No commits in this workspace because it is not a git repository; every task must use `Commit: NO` and produce `.omo/evidence/auth-resume-no-commit.txt` or task-local no-commit evidence.
- If an executor later runs this plan inside a git repository, use one logical change per commit. Conventional Commits (`<type>(<scope>): <subject>` body + footer).
- Atomic: every commit builds and passes tests on its own.
- No "WIP" / "fix typo squash later" commits on the final branch - clean up before merge.
- Reference the plan file path in the final commit footer: `Plan: .omo/plans/auth-resume-conversion.md`.

## Success criteria
- All Must-Have shipped; all QA scenarios pass with captured evidence; F1-F4 approved; no unsupported scope introduced; no live Stripe/Supabase mutation; no-commit evidence recorded because the workspace is not a git repository.

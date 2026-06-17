# Hyangmi Commercial Readiness Hardening

## TL;DR
> Summary:      Harden the Hyangmi/Coffee commercial path by fixing mobile payment dialog failure UX, Korean paid-copy polish, billing support clarity, billing-status metadata visibility, and HTTP/browser evidence gates.
> Deliverables:
> - C001 browser UX fixes for payment, pricing, support, and billing status.
> - C002 real HTTP edge evidence for support, checkout, and subscription contracts.
> - C003 CLI/final review evidence with scope, type-safety, build, and browser QA gates.
> Effort:       Medium
> Risk:         Medium - checkout/support/billing surfaces are user-facing revenue paths, and `components/PaymentDialog.tsx` is already 226 lines.

## Scope
### Must have
- C001: `components/PaymentDialog.tsx` must fit mobile viewports, avoid blocking `window.alert`, keep checkout failures inline and recoverable, and preserve current auth-gate redirect behavior from `components/PaymentDialog.tsx:48`.
- C001: `components/landing-pricing-section.tsx` must remove tiny English uppercase commercial labels such as `Pricing` at `components/landing-pricing-section.tsx:35` and product short-name badges rendered at `components/landing-pricing-section.tsx:63`.
- C001: `components/billing-support-form.tsx` must localize `Support ticket`, `Checkout Session ID`, and `Subscription ID` from `components/billing-support-form.tsx:89` and `components/billing-support-form.tsx:135`, add optional-field guidance, and show a Korean response-time/SLA expectation.
- C001: `components/dashboard-billing-status-panel.tsx` must render plan, renewal/current-period, cancel-at-period-end, invoice, and last-sync metadata already accepted by its schema at `components/dashboard-billing-status-panel.tsx:15`.
- C002: preserve Zod boundaries in `lib/support.ts:19`, `app/api/v1/support/route.ts:22`, `app/api/v1/subscription/route.ts:65`, and `app/api/v1/checkout/route.ts:20`.
- C003: run targeted Playwright, HTTP, typecheck, build, and final scope-review evidence with no human manual testing.
- Keep legal `updatedAt="2026년 6월 15일"` in `app/legal/terms/page.tsx:7`, `app/legal/privacy/page.tsx:7`, and `app/legal/payment/page.tsx:7`; Monday June 15, 2026 is valid and must not be flagged.

### Must NOT have (guardrails, anti-slop, scope boundaries)
- Do not edit implementation files outside `components/PaymentDialog.tsx`, `components/landing-pricing-section.tsx`, `components/billing-support-form.tsx`, `components/dashboard-billing-status-panel.tsx`, and tests under `test/*` unless the user explicitly expands scope.
- Do not edit `app/support/billing/page.tsx`; its English heading at `app/support/billing/page.tsx:8` is observed but outside this pass's approved write scope.
- Do not alter Stripe prices, item keys, checkout URLs, database schema, legal pages, Supabase auth/session logic, or live Stripe/Supabase integrations.
- Do not add dependencies or use live Stripe/Supabase mutation in tests or QA.
- Do not use `any`, `as any`, non-null assertions, `@ts-ignore`, or `@ts-expect-error`.
- Do not let any edited component exceed 250 pure LOC; `components/PaymentDialog.tsx` is 226 LOC, so replace/compress rather than append large blocks.
- Do not commit unless the user explicitly asks.

## Verification strategy
> Zero human intervention - all verification is agent-executed.
- Test decision: TDD for regression-visible bugs, tests-after for copy-only polish; Playwright, Node test, TypeScript, Next build.
- QA policy: every task has agent-executed scenarios.
- Evidence: `.omo/evidence/task-<N>-<slug>.<ext>`
- Real-surface policy: C001 uses Chrome-driven Playwright screenshots/action logs; C002 uses `curl -i` against a running local Next server plus focused route/test assertions.
- Adversarial classes: malformed input, cancel/resume, stale subscription state, blocked browser dialogs, mobile overflow, misleading success output, dirty worktree, long-running dev server cleanup.
- Stop conditions: stop after 3 identical failures on the same scenario, if a component would exceed 250 pure LOC, if a fix requires out-of-scope files, or if the dev server cannot start after capturing `.omo/evidence/task-4-http-contracts-blocked.txt`.

## Execution strategy
### Parallel execution waves
> Target 5-8 tasks per wave. <3 per wave (except final) = under-splitting.
> Extract shared dependencies as Wave-1 tasks to maximize parallelism.

Wave 1 (no dependencies):
- Task 1: Payment dialog mobile and inline checkout errors
- Task 2: Korean pricing/support copy and billing-support guidance
- Task 3: Dashboard billing status metadata

Wave 2 (after Wave 1):
- Task 4: depends [1, 2, 3]

Critical path: Task 1 -> Task 4 -> F3

### Dependency matrix
| Task | Depends on | Blocks | Can parallelize with |
|------|------------|--------|----------------------|
| 1    | none       | 4      | 2, 3                 |
| 2    | none       | 4      | 1, 3                 |
| 3    | none       | 4      | 1, 2                 |
| 4    | 1, 2, 3    | F1-F4  | none                 |

## Todos
> Implementation + Test = ONE task. Never separate.
> Every task MUST have: References + Acceptance Criteria + QA Scenarios + Commit.

- [ ] 1. Payment dialog mobile and inline checkout errors

  What to do: Update `components/PaymentDialog.tsx` so the modal is scroll-safe on a 390x844 viewport, keeps the close button and footer reachable, and replaces blocking `alert(...)` checkout failures at `components/PaymentDialog.tsx:58` and `components/PaymentDialog.tsx:71` with an inline Korean `role="alert"` state. Preserve the existing 401/auth redirect branch at `components/PaymentDialog.tsx:48`, analytics events at `components/PaymentDialog.tsx:37` and `components/PaymentDialog.tsx:57`, and product CTAs at `components/PaymentDialog.tsx:137`, `components/PaymentDialog.tsx:170`, and `components/PaymentDialog.tsx:203`. Add or extend Playwright coverage in `test/payment-dialog.test.ts`.
  Must NOT do: Do not change checkout item keys, prices, Stripe route payload shape, auth-gate redirect behavior, or add a new component file unless keeping `PaymentDialog.tsx` under 250 pure LOC becomes impossible.

  Parallelization: Can parallel: YES | Wave 1 | Blocks: [4] | Blocked by: []

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `components/PaymentDialog.tsx:11` - local Zod response schema pattern to keep response parsing strict.
  - Pattern:  `components/PaymentDialog.tsx:78` - existing fixed overlay and dialog container that needs viewport max-height/overflow hardening.
  - Pattern:  `test/payment-dialog.test.ts:42` - existing Playwright dashboard/payment dialog harness and API route stubbing.
  - API/Type: `lib/checkout-return.ts:12` - `CheckoutItemType` contract used by payment resume and product CTAs.
  - API/Type: `app/api/v1/checkout/route.ts:10` - checkout request Zod schema that must remain unchanged.
  - External: `https://playwright.dev/docs/screenshots` - official screenshot capture reference for browser evidence.
  - External: `https://playwright.dev/docs/api/class-route` - official route mocking reference used by existing tests.

  Acceptance criteria (agent-executable only):
  - [ ] `CI=1 NEXT_TELEMETRY_DISABLED=1 PLAYWRIGHT_HTML_OPEN=never /Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/@playwright/test/cli.js test --config=playwright.config.ts test/payment-dialog.test.ts --grep "commercial mobile payment dialog"` exits `0`.
  - [ ] The test asserts no Playwright `dialog` event fires when `/api/v1/checkout` returns a 500 or malformed JSON response.
  - [ ] The mobile dialog bounding box height is `<= 844`, footer links remain visible after scrolling, and the close button is clickable.
  - [ ] `rg -n "alert\\(" components/PaymentDialog.tsx` returns no matches.
  - [ ] `wc -l components/PaymentDialog.tsx` reports `250` lines or fewer.

  QA scenarios (MANDATORY - task incomplete without these):
  > Name the exact tool AND its exact invocation - not "verify it works". Browser use: use Chrome to drive the page; if Chrome is not available, download and use agent-browser (https://github.com/vercel-labs/agent-browser). Computer use: OS-level GUI automation for a non-browser desktop app.
  ```
  Scenario: mobile payment dialog remains usable
    Tool:     playwright(real Chrome)
    Steps:    CI=1 NEXT_TELEMETRY_DISABLED=1 PLAYWRIGHT_HTML_OPEN=never /Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/@playwright/test/cli.js test --config=playwright.config.ts test/payment-dialog.test.ts --grep "commercial mobile payment dialog" 2>&1 | tee .omo/evidence/task-1-payment-dialog-mobile.txt
    Expected: command exits 0; the test uses a 390x844 viewport, opens `/dashboard?checkout_intent=premium_subscription`, verifies the dialog is scroll-contained, verifies the footer support/legal links are reachable, and writes `.omo/evidence/task-1-payment-dialog-mobile.png`.
    Evidence: .omo/evidence/task-1-payment-dialog-mobile.txt

  Scenario: checkout failure is inline, not blocking
    Tool:     playwright(real Chrome)
    Steps:    CI=1 NEXT_TELEMETRY_DISABLED=1 PLAYWRIGHT_HTML_OPEN=never /Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/@playwright/test/cli.js test --config=playwright.config.ts test/payment-dialog.test.ts --grep "checkout failure renders inline Korean error" 2>&1 | tee .omo/evidence/task-1-payment-dialog-error.txt
    Expected: command exits 0; mocked `/api/v1/checkout` returns 500 or invalid JSON; no browser alert event fires; dialog stays open; Korean inline error is visible with `role="alert"`; screenshot `.omo/evidence/task-1-payment-dialog-error.png` exists.
    Evidence: .omo/evidence/task-1-payment-dialog-error.txt
  ```

  Commit: NO | Message: `fix(payment): harden mobile checkout dialog` | Files: [`components/PaymentDialog.tsx`, `test/payment-dialog.test.ts`]

- [ ] 2. Korean pricing/support copy and billing-support guidance

  What to do: Update `components/landing-pricing-section.tsx` and `components/billing-support-form.tsx` so commercial labels are Korean-first, not tiny English uppercase badges. Replace `Pricing` at `components/landing-pricing-section.tsx:36`, product short-name badge rendering at `components/landing-pricing-section.tsx:63`, `Support ticket` at `components/billing-support-form.tsx:89`, and raw English Stripe ID labels at `components/billing-support-form.tsx:135` and `components/billing-support-form.tsx:139`. Add guidance that checkout/subscription IDs are optional, where users can find them if available, and an SLA-style response expectation in Korean. Extend `test/product-operations.test.ts` or add a focused test under `test/*`.
  Must NOT do: Do not edit `lib/commerce.ts` product keys/prices, do not make optional ID fields required, and do not edit `app/support/billing/page.tsx` in this scoped pass.

  Parallelization: Can parallel: YES | Wave 1 | Blocks: [4] | Blocked by: []

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `components/landing-pricing-section.tsx:48` - existing pricing-card map over `checkoutProductOrder`.
  - Pattern:  `components/billing-support-form.tsx:49` - form payload parsing via `supportRequestSchema.safeParse`.
  - Pattern:  `test/product-operations.test.ts:25` - existing support form Playwright submission coverage.
  - API/Type: `lib/support.ts:19` - optional `checkoutSessionId` and `subscriptionId` schema boundaries.
  - Test:     `test/product-operations.test.mjs:40` - source-level operational readiness assertions that should keep support/legal/payment notices present.
  - External: `https://playwright.dev/docs/api/class-route` - official route interception reference for mocked support submit evidence.

  Acceptance criteria (agent-executable only):
  - [ ] `CI=1 NEXT_TELEMETRY_DISABLED=1 PLAYWRIGHT_HTML_OPEN=never /Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/@playwright/test/cli.js test --config=playwright.config.ts test/product-operations.test.ts --grep "commercial Korean pricing and support"` exits `0`.
  - [ ] Landing pricing section contains no visible `Pricing`, `Scan 10 Pack`, or `PDF Book` badges.
  - [ ] Billing support form labels for checkout/subscription IDs are Korean, explicitly optional, and submission without those IDs omits them or sends no non-empty values.
  - [ ] Invalid email or too-short message renders the existing Korean validation error and does not call `/api/v1/support`.

  QA scenarios (MANDATORY - task incomplete without these):
  > Name the exact tool AND its exact invocation - not "verify it works". Browser use: use Chrome to drive the page; if Chrome is not available, download and use agent-browser (https://github.com/vercel-labs/agent-browser). Computer use: OS-level GUI automation for a non-browser desktop app.
  ```
  Scenario: Korean pricing and support copy
    Tool:     playwright(real Chrome)
    Steps:    CI=1 NEXT_TELEMETRY_DISABLED=1 PLAYWRIGHT_HTML_OPEN=never /Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/@playwright/test/cli.js test --config=playwright.config.ts test/product-operations.test.ts --grep "commercial Korean pricing and support" 2>&1 | tee .omo/evidence/task-2-pricing-support.txt
    Expected: command exits 0; `/` pricing section shows Korean commercial badges; `/support/billing` form shows Korean optional ID guidance and SLA copy; screenshot `.omo/evidence/task-2-pricing-support.png` exists.
    Evidence: .omo/evidence/task-2-pricing-support.txt

  Scenario: optional support IDs remain optional
    Tool:     playwright(real Chrome)
    Steps:    CI=1 NEXT_TELEMETRY_DISABLED=1 PLAYWRIGHT_HTML_OPEN=never /Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/@playwright/test/cli.js test --config=playwright.config.ts test/product-operations.test.ts --grep "submits a billing support request without optional Stripe IDs" 2>&1 | tee .omo/evidence/task-2-support-optional-ids.txt
    Expected: command exits 0; submitted payload has `email`, `category`, and `message`, with no non-empty `checkoutSessionId` or `subscriptionId`; invalid input scenario shows Korean error and sends zero support requests.
    Evidence: .omo/evidence/task-2-support-optional-ids.txt
  ```

  Commit: NO | Message: `fix(commerce-copy): localize billing support guidance` | Files: [`components/landing-pricing-section.tsx`, `components/billing-support-form.tsx`, `test/product-operations.test.ts`]

- [ ] 3. Dashboard billing status metadata

  What to do: Update `components/dashboard-billing-status-panel.tsx` to display billing metadata already returned by `/api/v1/subscription`: `plan`, `currentPeriodEnd`, `cancelAtPeriodEnd`, `lastInvoiceStatus`, and `updatedAt` from `components/dashboard-billing-status-panel.tsx:15`. Add Korean formatting helpers inside the same file, using safe fallbacks for null or malformed dates. Add focused Playwright coverage under `test/*`, preferably a new `test/dashboard-billing-status.test.ts` to keep write conflicts low.
  Must NOT do: Do not change `app/api/v1/subscription/route.ts`, `lib/contracts.ts`, subscription enum values, TanStack Query keys, or backend state semantics.

  Parallelization: Can parallel: YES | Wave 1 | Blocks: [4] | Blocked by: []

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `components/dashboard-billing-status-panel.tsx:48` - existing fetch + Zod parse pattern for subscription summary.
  - Pattern:  `components/dashboard-billing-status-panel.tsx:59` - current status-title helper style to extend with metadata labels.
  - Pattern:  `components/dashboard-client.tsx:212` - panel placement in dashboard sidebar.
  - API/Type: `lib/contracts.ts:37` - backend `SubscriptionSummary` contract.
  - API/Type: `app/api/v1/subscription/route.ts:66` - route response maps live profile fields to frontend keys.
  - Test:     `test/checkout-return.test.ts:26` - existing dashboard subscription fixture shape.
  - External: `https://playwright.dev/docs/screenshots` - official screenshot capture reference for browser evidence.

  Acceptance criteria (agent-executable only):
  - [ ] `CI=1 NEXT_TELEMETRY_DISABLED=1 PLAYWRIGHT_HTML_OPEN=never /Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/@playwright/test/cli.js test --config=playwright.config.ts test/dashboard-billing-status.test.ts` exits `0`.
  - [ ] Active premium fixture with `currentPeriodEnd: "2026-07-15T00:00:00.000Z"` visibly shows a Korean premium plan label and a Korean renewal/current-period date, without raw ISO strings.
  - [ ] Cancel-at-period-end fixture visibly explains the period-end date and support action.
  - [ ] Past-due or unpaid fixture localizes invoice status and keeps the retry-payment CTA.
  - [ ] Null or malformed metadata renders Korean fallback text and does not throw.

  QA scenarios (MANDATORY - task incomplete without these):
  > Name the exact tool AND its exact invocation - not "verify it works". Browser use: use Chrome to drive the page; if Chrome is not available, download and use agent-browser (https://github.com/vercel-labs/agent-browser). Computer use: OS-level GUI automation for a non-browser desktop app.
  ```
  Scenario: premium billing metadata is visible
    Tool:     playwright(real Chrome)
    Steps:    CI=1 NEXT_TELEMETRY_DISABLED=1 PLAYWRIGHT_HTML_OPEN=never /Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/@playwright/test/cli.js test --config=playwright.config.ts test/dashboard-billing-status.test.ts --grep "premium metadata" 2>&1 | tee .omo/evidence/task-3-billing-metadata.txt
    Expected: command exits 0; mocked `/api/v1/subscription` returns premium active metadata; dashboard shows plan, renewal/current-period date, last sync, and no raw ISO date; screenshot `.omo/evidence/task-3-billing-metadata.png` exists.
    Evidence: .omo/evidence/task-3-billing-metadata.txt

  Scenario: canceled/past-due metadata degrades gracefully
    Tool:     playwright(real Chrome)
    Steps:    CI=1 NEXT_TELEMETRY_DISABLED=1 PLAYWRIGHT_HTML_OPEN=never /Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/@playwright/test/cli.js test --config=playwright.config.ts test/dashboard-billing-status.test.ts --grep "billing metadata fallback" 2>&1 | tee .omo/evidence/task-3-billing-metadata-error.txt
    Expected: command exits 0; mocked canceled and malformed-date responses do not crash; UI shows Korean fallback/cancel guidance and screenshot `.omo/evidence/task-3-billing-metadata-error.png` exists.
    Evidence: .omo/evidence/task-3-billing-metadata-error.txt
  ```

  Commit: NO | Message: `fix(billing): show subscription metadata` | Files: [`components/dashboard-billing-status-panel.tsx`, `test/dashboard-billing-status.test.ts`]

- [ ] 4. C002 HTTP contracts and commercial readiness evidence harness

  What to do: Add or adjust tests under `test/*` only as needed to prove C002 edge contracts and C001 browser coverage across the three preceding tasks. Then capture real HTTP evidence with `curl -i` against the local Next server: invalid support body returns 400 with Korean message, valid support body without optional IDs returns 200 with a ticket ID, unauthenticated subscription returns 401, and unauthenticated checkout returns 401 without live Stripe mutation. Keep the route implementation unchanged unless a previous task explicitly exposed a regression.
  Must NOT do: Do not use live Stripe, live Supabase, real customer/session IDs, or mutate backend implementation files in this task. Do not treat source grep alone as C002 evidence.

  Parallelization: Can parallel: NO | Wave 2 | Blocks: [F1, F2, F3, F4] | Blocked by: [1, 2, 3]

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `playwright.config.ts:13` - existing local webServer command and port `3000`.
  - Pattern:  `test/product-operations.test.ts:37` - route interception and support payload capture.
  - API/Type: `app/api/v1/support/route.ts:24` - invalid support request returns 400.
  - API/Type: `app/api/v1/support/route.ts:42` - valid support request returns `{ data: { ticketId } }`.
  - API/Type: `app/api/v1/subscription/route.ts:33` - unauthenticated subscription request returns 401.
  - API/Type: `app/api/v1/checkout/route.ts:60` - unauthenticated checkout request returns 401 before Stripe session creation.
  - Test:     `test/subscription-lifecycle.test.mjs:338` - existing subscription response contract coverage.
  - External: `https://playwright.dev/docs/api-testing` - official API testing reference.
  - External: `https://docs.stripe.com/api/checkout/sessions/create` - official Checkout Session reference; this task must not create live sessions.

  Acceptance criteria (agent-executable only):
  - [ ] `.omo/evidence/task-4-http-contracts.txt` contains `HTTP/1.1 400` or `HTTP/2 400` for invalid support payload and the Korean message `지원 요청 형식이 올바르지 않습니다`.
  - [ ] `.omo/evidence/task-4-http-contracts.txt` contains `HTTP/1.1 200` or `HTTP/2 200` for valid support payload without optional IDs and a `hyangmi-support-` ticket ID.
  - [ ] `.omo/evidence/task-4-http-contracts.txt` contains `401` for unauthenticated `/api/v1/subscription` and `/api/v1/checkout`.
  - [ ] `CI=1 NEXT_TELEMETRY_DISABLED=1 PLAYWRIGHT_HTML_OPEN=never /Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/@playwright/test/cli.js test --config=playwright.config.ts test/payment-dialog.test.ts test/product-operations.test.ts test/dashboard-billing-status.test.ts` exits `0`.
  - [ ] Scope scan evidence confirms no legal date edits, no out-of-scope implementation files, no `any`/non-null/ts-ignore escapes, and no live Stripe/Supabase mutation.

  QA scenarios (MANDATORY - task incomplete without these):
  > Name the exact tool AND its exact invocation - not "verify it works". Browser use: use Chrome to drive the page; if Chrome is not available, download and use agent-browser (https://github.com/vercel-labs/agent-browser). Computer use: OS-level GUI automation for a non-browser desktop app.
  ```
  Scenario: real HTTP edge contracts
    Tool:     bash
    Steps:    mkdir -p .omo/evidence; BUNDLED_NODE="/Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"; NEXT_TELEMETRY_DISABLED=1 "$BUNDLED_NODE" node_modules/next/dist/bin/next dev --webpack --hostname 127.0.0.1 --port 3000 > .omo/evidence/task-4-dev-server.log 2>&1 & SERVER_PID=$!; trap 'kill "$SERVER_PID" 2>/dev/null || true; wait "$SERVER_PID" 2>/dev/null || true' EXIT; for i in $(seq 1 60); do curl -fsS http://127.0.0.1:3000 >/dev/null 2>&1 && break; sleep 1; done; { printf '%s\n' '--- invalid support ---'; curl -i -sS -X POST http://127.0.0.1:3000/api/v1/support -H 'Content-Type: application/json' --data '{"category":"refund_request","message":"환불 문의 내용이 충분합니다."}'; printf '\n%s\n' '--- valid support no optional ids ---'; curl -i -sS -X POST http://127.0.0.1:3000/api/v1/support -H 'Content-Type: application/json' --data '{"email":"minji@example.com","category":"refund_request","message":"PDF를 실수로 구매해서 환불 가능 여부를 확인하고 싶습니다."}'; printf '\n%s\n' '--- unauth subscription ---'; curl -i -sS http://127.0.0.1:3000/api/v1/subscription; printf '\n%s\n' '--- unauth checkout ---'; curl -i -sS -X POST http://127.0.0.1:3000/api/v1/checkout -H 'Content-Type: application/json' --data '{"itemType":"premium_subscription"}'; } 2>&1 | tee .omo/evidence/task-4-http-contracts.txt
    Expected: evidence contains support 400, support 200 with `hyangmi-support-`, subscription 401, checkout 401, and the shell trap stops the dev server.
    Evidence: .omo/evidence/task-4-http-contracts.txt

  Scenario: commercial browser regression suite
    Tool:     playwright(real Chrome)
    Steps:    CI=1 NEXT_TELEMETRY_DISABLED=1 PLAYWRIGHT_HTML_OPEN=never /Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/@playwright/test/cli.js test --config=playwright.config.ts test/payment-dialog.test.ts test/product-operations.test.ts test/dashboard-billing-status.test.ts 2>&1 | tee .omo/evidence/task-4-browser-regression.txt
    Expected: command exits 0 and all task-level screenshots exist: `.omo/evidence/task-1-payment-dialog-mobile.png`, `.omo/evidence/task-2-pricing-support.png`, `.omo/evidence/task-3-billing-metadata.png`.
    Evidence: .omo/evidence/task-4-browser-regression.txt
  ```

  Commit: NO | Message: `test(commercial): capture billing edge evidence` | Files: [`test/payment-dialog.test.ts`, `test/product-operations.test.ts`, `test/dashboard-billing-status.test.ts`, `.omo/evidence/task-4-http-contracts.txt`, `.omo/evidence/task-4-browser-regression.txt`]

## Final verification wave (MANDATORY - after all implementation tasks)
> Runs in PARALLEL. ALL must APPROVE. Surface results to the caller and wait for an explicit "okay" before declaring complete.
- [ ] F1. Plan compliance audit - every task done, every acceptance criterion met
  - Tool + invocation: `mkdir -p .omo/evidence; { test -f .omo/evidence/task-1-payment-dialog-mobile.txt; test -f .omo/evidence/task-1-payment-dialog-error.txt; test -f .omo/evidence/task-2-pricing-support.txt; test -f .omo/evidence/task-2-support-optional-ids.txt; test -f .omo/evidence/task-3-billing-metadata.txt; test -f .omo/evidence/task-3-billing-metadata-error.txt; test -f .omo/evidence/task-4-http-contracts.txt; test -f .omo/evidence/task-4-browser-regression.txt; } 2>&1 | tee .omo/evidence/final-F1-commercial-plan-compliance.txt`
- [ ] F2. Code quality review - diagnostics clean, idioms match, no dead code
  - Tool + invocation: `BUNDLED_NODE="/Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"; { "$BUNDLED_NODE" node_modules/typescript/bin/tsc --noEmit; "$BUNDLED_NODE" node_modules/next/dist/bin/next build --webpack; rg -n "(: any|as any|@ts-ignore|@ts-expect-error|[^=]![.;,)\\]])" components/PaymentDialog.tsx components/landing-pricing-section.tsx components/billing-support-form.tsx components/dashboard-billing-status-panel.tsx test || true; wc -l components/PaymentDialog.tsx components/landing-pricing-section.tsx components/billing-support-form.tsx components/dashboard-billing-status-panel.tsx; } 2>&1 | tee .omo/evidence/final-F2-commercial-code-quality.txt`
- [ ] F3. Real manual QA - every QA scenario executed with evidence captured
  - Tool + invocation: `CI=1 NEXT_TELEMETRY_DISABLED=1 PLAYWRIGHT_HTML_OPEN=never /Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/@playwright/test/cli.js test --config=playwright.config.ts test/payment-dialog.test.ts test/product-operations.test.ts test/dashboard-billing-status.test.ts 2>&1 | tee .omo/evidence/final-F3-commercial-browser-qa.txt`
- [ ] F4. Scope fidelity - nothing extra shipped beyond Must-Have, nothing Must-NOT-Have introduced
  - Tool + invocation: `{ git status --short; git diff --name-only; rg -n "2026년 6월 15일" app/legal/terms/page.tsx app/legal/privacy/page.tsx app/legal/payment/page.tsx; rg -n "marketplace|social network|shipping|print fulfillment|인쇄용 결산|프리미엄 카드 스킨|테마 10종|스킨 10종|MOCK|alert\\(" components/PaymentDialog.tsx components/landing-pricing-section.tsx components/billing-support-form.tsx components/dashboard-billing-status-panel.tsx test || true; } 2>&1 | tee .omo/evidence/final-F4-commercial-scope-fidelity.txt`

## Commit strategy
- One logical change per commit. Conventional Commits (`<type>(<scope>): <subject>` body + footer).
- Atomic: every commit builds and passes tests on its own.
- No "WIP" / "fix typo squash later" commits on the final branch - clean up before merge.
- Reference the plan file path in the final commit footer: `Plan: .omo/plans/hyangmi-commercial-readiness-hardening.md`.
- For this assignment, every task says `Commit: NO`; do not commit unless the user explicitly asks after verification.

## Success criteria
- All Must-Have shipped; all QA scenarios pass with captured evidence; F1-F4 approved; commit history clean.

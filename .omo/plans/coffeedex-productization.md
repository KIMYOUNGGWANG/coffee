# CoffeeDex Productization Plan

## TL;DR
> Summary:      Make CoffeeDex a launchable Korea-first AI coffee memory product by fixing product contracts, honest paid exports, billing safety, and verification before expanding into roaster/community revenue.
> Deliverables:
> - CoffeeDex-aligned tests/docs/package identity.
> - Card creation contract fixed with regression coverage.
> - Honest paid UI: poster deferred, checkout return handling, story export, PDF download.
> - Stripe webhook idempotency, profile bootstrap, subscription lifecycle, credit grant/spend lifecycle.
> - Scan confidence/correction groundwork and Korea-first vocabulary polish.
> Effort:       XL
> Risk:         High - billing, DB migrations, export generation, and local build environment are currently incomplete.

## Scope

### Must have
- Keep the approved product direction: Korea-first AI coffee memory product with later roaster/referral layer.
- Fix the current card create contract so image URL, AI description, and footer metadata persist.
- Replace stale starter tests/docs with CoffeeDex-specific tests/docs.
- Make paid claims true or remove them from UI.
- Defer poster UI until a real poster flow exists.
- Keep credit purchase UI hidden until credits can be granted idempotently and spent atomically.
- Implement profile bootstrap and entitlement audit foundations before relying on paid profile flags.
- Make Stripe webhook fulfillment idempotent using test-mode fixture scenarios.
- Add subscription lifecycle event handling for created/updated/deleted and invoice paid/payment failed.
- Define credits exactly: free users get monthly scans first; when the monthly free scan limit is exhausted, one credit buys one package scan; premium users bypass scan limits.
- Keep Korean UX copy and coffee vocabulary first; no live roaster marketplace in this pass.
- Use exact placeholder prices already in code for first pass: Premium $3.99/month, credit pack $4.99, PDF $9.99.

### Must NOT have
- No live roaster marketplace, public social network, roaster analytics product, shipping, or print fulfillment in this pass.
- No poster SKU in visible UI until a real poster export/print path exists.
- No real Stripe live-mode mutation during tests or QA.
- No broad rewrite of app structure, design system, or Supabase auth helpers unless required by the listed tasks.
- No dependency on git commits; this workspace currently is not a git repository.
- No claim that tests alone prove completion; every user-facing criterion needs real surface evidence.

## Verification strategy
> Zero human intervention - all verification is agent-executed.
- Test decision: tests-after for product stabilization; TDD for billing lifecycle tests using Node test where possible.
- QA policy: every todo has agent-executed scenarios.
- Evidence: `.omo/evidence/task-<N>-<slug>.<ext>` plus `.omo/ulw-loop/evidence/<goal>-<criterion>.<ext>` once ULW execution starts.
- Command baseline:
  - `/Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test test/smoke.test.mjs`
  - `/Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/typescript/bin/tsc --noEmit`
  - `/Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/next/dist/bin/next build`
- UI server command without `npm`:
  - `/Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3000`
- Playwright command without `npm`:
  - `/Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/@playwright/test/cli.js test --config=playwright.config.ts <test-file>`
- Build acceptance: typecheck must pass; Next build must either pass or produce a named remediation artifact with exact command, root, SWC/npm failure, and next action.
- Browser QA should use Playwright or the in-app Browser against the local dev server command above. If the server command is blocked by SWC/runtime issues, T4 must remediate or record the exact blocker before browser-facing todos can pass.
- API QA should use HTTP calls or route-level tests with fixture payloads; billing tests must use Stripe fixture objects or mocked constructEvent output, never live mode.

## Execution strategy

### Parallel execution waves
> Target 5-8 todos per wave. < 3 per wave (except the final) = under-splitting.

Wave 1 (no deps): T1 card contract; T2 CoffeeDex tests/docs identity; T3 paid UI honesty; T4 build/runtime verification harness.

Wave 2 (after Wave 1): T5 checkout return UX; T6 story image export; T7 PDF downloadable artifact; T8 user-visible wizard errors.

Wave 3 (after Wave 1, can overlap with Wave 2 except shared payment UI): T9 profile/entitlement migrations; T10 Stripe idempotent fulfillment; T11 subscription lifecycle; T12 credit spend lifecycle.

Wave 4 (after Waves 2-3): T13 scan trust/correction groundwork; T14 Korea-first product polish and taste-map/recap boundary.

Final wave: F1-F4 audits.

Critical path: T1 -> T2/T4 -> T9 -> T10/T11/T12 -> final billing QA.

### Dependency matrix
| Todo | Depends on | Blocks | Can parallelize with |
| --- | --- | --- | --- |
| T1 | none | T2, T13 | T3, T4 |
| T2 | T1 for final assertions | final verification | T3, T4 |
| T3 | none | T5, T12 | T1, T2, T4 |
| T4 | none | final verification | T1, T2, T3 |
| T5 | T3 | final UI QA | T6, T7, T8 |
| T6 | T3 | final UI QA | T5, T7, T8 |
| T7 | T3, T9 | final export QA | T5, T6, T8 |
| T8 | T1 | final UI QA | T5, T6, T7 |
| T9 | none | T10, T11, T12, T7 | T1, T2, T3, T4 |
| T10 | T9 | T11, T12, final billing QA | T5, T6, T8 |
| T11 | T9, T10 | final billing QA | T12 |
| T12 | T3, T9, T10 | credit UI release | T11 |
| T13 | T1 | later roaster/canonical data | T14 |
| T14 | T2 | final product review | T13 |

## Todos

> Implementation + Test = ONE todo. Never separate.

- [ ] T1. Fix card creation contract and persistence
  What to do / Must NOT do: Choose client camelCase as the canonical API contract. Update `CardCreatorWizard` and any hook/type boundary so create-card sends `imageUrl`, `aiDescription`, and `footerMeta`. Do not loosen the API with `any`; keep Zod validation.
  Parallelization: Can parallel Y | Wave 1 | Blocks T2, T13
  References: `components/CardCreatorWizard.tsx:144-160`; `app/api/v1/cards/route.ts:6-21`; `app/api/v1/cards/route.ts:91-103`; `hooks/useTastingCards.ts`
  Acceptance criteria (agent-executable): Add/adjust a Node test or route-level regression proving a create payload with image/AI/footer fields is accepted and maps to DB fields; typecheck passes.
  QA scenarios (name the exact tool + invocation): Create `test/cards-create-contract.test.mjs`; run `/Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test test/cards-create-contract.test.mjs`; expected result: camelCase payload maps to `image_url`, `ai_description`, `footer_meta`; write stdout to `.omo/evidence/task-T1-card-contract.txt`.
  Commit: N | no git repository detected | Files: `components/CardCreatorWizard.tsx`, `hooks/useTastingCards.ts`, `test/*`

- [ ] T2. Replace stale starter tests/docs with CoffeeDex truth
  What to do / Must NOT do: Rewrite smoke assertions around CoffeeDex product surfaces. Create/repair required docs so tests do not reference missing `docs/golden-flows.md` unless it exists. Rename package metadata from starter identity to CoffeeDex. Do not remove useful stack validation.
  Parallelization: Can parallel Y | Wave 1 | Blocks final verification
  References: `test/smoke.test.mjs:14-67`; `docs/api-spec.md`; `package.json:1-15`; `.omo/ultraresearch/20260613-234801/verify-local-commands.md`
  Acceptance criteria (agent-executable): Smoke tests pass under bundled Node; smoke tests assert CoffeeDex home/dashboard/onboarding/API docs instead of starter SaaS copy.
  QA scenarios: Run `/Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test test/smoke.test.mjs`; expected result: all CoffeeDex smoke assertions pass and no missing `docs/golden-flows.md`; write stdout to `.omo/evidence/task-T2-smoke.txt`.
  Commit: N | no git repository detected | Files: `test/smoke.test.mjs`, `docs/*`, `package.json`

- [ ] T3. Make payment UI honest and defer unsafe SKUs
  What to do / Must NOT do: Remove/defer poster card from visible payment UI. Keep PDF and premium. Keep credit top-up hidden until T12 passes. Use exact current first-pass prices: premium `$3.99`, PDF `$9.99`, credits `$4.99` only behind a verified gate.
  Parallelization: Can parallel Y | Wave 1 | Blocks T5, T12
  References: `components/PaymentDialog.tsx:70-166`; `app/api/v1/checkout/route.ts:7-20`; `.omo/ultraresearch/20260613-234801/SYNTHESIS.md`
  Acceptance criteria: Payment dialog has no visible poster SKU, no misleading mock label, and no credit purchase CTA before T12. Checkout API still rejects unknown `poster`.
  QA scenarios: Create `test/payment-dialog.e2e.ts`; run UI server command, then `/Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/@playwright/test/cli.js test --config=playwright.config.ts test/payment-dialog.e2e.ts`; expected result: modal shows premium/PDF only, no poster or credit top-up CTA. Also create `test/checkout-products.test.mjs`; run bundled Node test asserting `poster` returns 400. Write outputs to `.omo/evidence/task-T3-payment-honesty.txt`.
  Commit: N | no git repository detected | Files: `components/PaymentDialog.tsx`, optional tests

- [ ] T4. Establish bounded local verification and build remediation artifact
  What to do / Must NOT do: Keep using bundled Node if `npm` is unavailable. Update `playwright.config.ts` if needed so its `webServer.command` does not require `npm`. Add or update docs/scripts only if needed to make the verification path reproducible. Do not claim build passes if Next/SWC remains blocked.
  Parallelization: Can parallel Y | Wave 1 | Blocks final verification
  References: `package.json:scripts`; `.omo/ultraresearch/20260613-234801/verify-local-commands.md`
  Acceptance criteria: Typecheck passes; Playwright config can start the dev server without `npm`; build either passes or `.omo/evidence/task-T4-build-remediation.txt` records exact failing command/output, root inference, SWC architecture, and remediation.
  QA scenarios: Run `/Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/typescript/bin/tsc --noEmit`; run `/Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/next/dist/bin/next build`; run the UI server command and capture the first successful ready line or exact failure. Write stdout/stderr to `.omo/evidence/task-T4-build.txt` and remediation to `.omo/evidence/task-T4-build-remediation.txt` if needed.
  Commit: N | no git repository detected | Files: `playwright.config.ts`, optional docs/scripts/evidence only

- [ ] T5. Add checkout success/cancel return UX
  What to do / Must NOT do: Dashboard must read `checkout_status` and `item_type`, show a dismissible success/cancel message, refresh profile/card-relevant queries after success, and avoid stale URL noise after handling if appropriate.
  Parallelization: Can parallel Y | Wave 2 | Blocks final UI QA
  References: `app/api/v1/checkout/route.ts:76-77`; `app/dashboard/page.tsx:1-80`; `hooks/useTastingCards.ts`
  Acceptance criteria: `/dashboard?checkout_status=success&item_type=pdf_book` shows a PDF success message; `/dashboard?checkout_status=cancel` shows cancellation; no message for unrelated query params.
  QA scenarios: Create `test/checkout-return.e2e.ts`; run UI server command, then `/Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/@playwright/test/cli.js test --config=playwright.config.ts test/checkout-return.e2e.ts`; expected result: success URL renders success notice, cancel URL renders cancel notice, unrelated query renders no checkout notice. Save screenshot `.omo/evidence/task-T5-checkout-return.png` and stdout `.omo/evidence/task-T5-checkout-return.txt`.
  Commit: N | no git repository detected | Files: `app/dashboard/page.tsx`, optional tests

- [ ] T6. Implement real story image download
  What to do / Must NOT do: Replace alert-only download with a real browser download for the rendered 9:16 story card. Avoid adding external packages unless absolutely necessary; prefer DOM/SVG/canvas-native implementation. Handle download errors visibly.
  Parallelization: Can parallel Y | Wave 2 | Blocks final UI QA
  References: `components/StoryExportModal.tsx:86-90`; `components/StoryExportModal.tsx:268-276`
  Acceptance criteria: Clicking `Story 이미지 다운로드` triggers a file download with a stable filename and non-empty image content; no alert-only behavior remains.
  QA scenarios: Create `test/story-export.e2e.ts`; run UI server command, then `/Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/@playwright/test/cli.js test --config=playwright.config.ts test/story-export.e2e.ts`; expected result: clicking `Story 이미지 다운로드` emits a Playwright download event with non-zero file size and no alert-only path. Write stdout and downloaded file metadata to `.omo/evidence/task-T6-story-download.txt`.
  Commit: N | no git repository detected | Files: `components/StoryExportModal.tsx`, optional utility/test

- [ ] T7. Make PDF product a downloadable artifact
  What to do / Must NOT do: Implement a real downloadable PDF response from `/api/v1/pdf` using existing dependencies or a minimal internal generator. Return `application/pdf` with attachment headers. If full rich PDF is too large, generate a basic but valid CoffeeDex tasting book PDF. Do not leave paid PDF endpoint returning JSON only.
  Parallelization: Can parallel Y | Wave 2 | Blocked by T9 for profile bootstrap confidence | Blocks final export QA
  References: `app/api/v1/pdf/route.ts:17-60`; `components/PaymentDialog.tsx:104-132`
  Acceptance criteria: Authorized user with `has_pdf_access` gets HTTP 200, `Content-Type: application/pdf`, attachment filename, and non-empty PDF bytes; unauthorized user gets 403.
  QA scenarios: Create `test/pdf-route.test.mjs` with mocked Supabase auth/profile/card responses; run `/Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test test/pdf-route.test.mjs`; expected result: authorized response has `application/pdf`, attachment filename, `%PDF` header, and non-zero bytes; unauthorized response is 403. Write stdout to `.omo/evidence/task-T7-pdf.txt`.
  Commit: N | no git repository detected | Files: `app/api/v1/pdf/route.ts`, optional `lib/pdf/*`, tests

- [ ] T8. Surface wizard scan/AI/submit errors inline
  What to do / Must NOT do: Replace console-only failure handling for AI note generation and submit with visible inline error/retry states. Keep scan failure feedback persistent enough for users to recover.
  Parallelization: Can parallel Y | Wave 2 | Blocks final UI QA
  References: `components/CardCreatorWizard.tsx:72-130`; `components/CardCreatorWizard.tsx:133-166`; `hooks/useTastingCards.ts:135-177`
  Acceptance criteria: AI note failure and submit failure render visible messages; retry clears or updates the message; typecheck passes.
  QA scenarios: Create `test/wizard-errors.e2e.ts`; run UI server command, then `/Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/@playwright/test/cli.js test --config=playwright.config.ts test/wizard-errors.e2e.ts`; expected result: mocked AI-note failure and submit failure render inline errors and retry clears/updates the message. Write stdout to `.omo/evidence/task-T8-wizard-errors.txt`.
  Commit: N | no git repository detected | Files: `components/CardCreatorWizard.tsx`, optional tests

- [ ] T9. Add profile bootstrap, entitlement audit, and Stripe event schema
  What to do / Must NOT do: Add migrations for missing foundational paid-state tables. Ensure `profiles` exists or is bootstrapped safely. Add `stripe_events`/fulfillment ledger with unique event IDs and an entitlement audit table. Do not assume external Supabase starter migrations exist.
  Parallelization: Can parallel Y | Wave 3 | Blocks T10, T11, T12, T7
  References: `supabase/migrations/20260614000001_add_credits_to_profiles.sql`; `supabase/migrations/20260614000002_add_brewing_notes_and_scan_limits.sql`; `app/api/v1/profile/route.ts:17-35`
  Acceptance criteria: Fresh-schema SQL includes `profiles` creation/bootstrap, RLS where applicable, unique Stripe event key, entitlement audit table, and safe defaults.
  QA scenarios: Create `test/schema-contract.test.mjs`; run `/Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test test/schema-contract.test.mjs`; expected result: migrations contain `CREATE TABLE IF NOT EXISTS profiles`, Stripe event ledger unique key, entitlement audit table, profile defaults, and RLS/policies where applicable. Write stdout to `.omo/evidence/task-T9-schema.txt`.
  Commit: N | no git repository detected | Files: `supabase/migrations/*`, `app/api/v1/profile/route.ts`, tests

- [ ] T10. Make Stripe fulfillment idempotent
  What to do / Must NOT do: Process `checkout.session.completed` by first recording/deduping Stripe event/session/payment identity, then applying entitlement changes once. Duplicate event delivery must return success without double mutation. Use Stripe test fixture payloads only.
  Parallelization: Can parallel Y | Wave 3 | Blocked by T9 | Blocks T11, T12
  References: `app/api/v1/webhooks/stripe/route.ts:35-118`; `app/api/v1/checkout/route.ts:53-82`; `supabase/migrations/*`
  Acceptance criteria: Duplicate `credits_10` checkout fixture grants exactly 10 credits once; duplicate PDF fixture records one entitlement; duplicate premium fixture records one subscription activation.
  QA scenarios: Create `test/stripe-webhook-idempotency.test.mjs`; first RED on current duplicate credit behavior, then GREEN. Run `/Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test test/stripe-webhook-idempotency.test.mjs`; expected result: repeating the same fixture event/session/payment mutates each entitlement once and returns success. Write stdout to `.omo/evidence/task-T10-webhook-idempotency.txt`.
  Commit: N | no git repository detected | Files: `app/api/v1/webhooks/stripe/route.ts`, `lib/*`, migrations/tests

- [ ] T11. Implement subscription lifecycle state
  What to do / Must NOT do: Handle `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, and `invoice.payment_failed` enough to keep profile/subscription status authoritative. Replace static subscription endpoint with live DB-backed state.
  Parallelization: Can parallel Y | Wave 3 | Blocked by T9, T10 | Blocks final billing QA
  References: `app/api/v1/subscription/route.ts`; `app/api/v1/webhooks/stripe/route.ts:103-118`; `lib/contracts.ts:100-115`
  Acceptance criteria: Cancellation/deleted fixture revokes or marks premium inactive; payment failure marks degraded/past_due; subscription endpoint returns live state instead of static starter contract.
  QA scenarios: Create `test/subscription-lifecycle.test.mjs`; run `/Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test test/subscription-lifecycle.test.mjs`; expected result: fixture events transition subscription/profile state to active, past_due, canceled/inactive, and GET returns live DB-backed state. Write stdout to `.omo/evidence/task-T11-subscription-lifecycle.txt`.
  Commit: N | no git repository detected | Files: `app/api/v1/webhooks/stripe/route.ts`, `app/api/v1/subscription/route.ts`, migrations/tests

- [ ] T12. Wire credit grant and spend lifecycle before exposing top-up UI
  What to do / Must NOT do: Define scan spend: free users consume monthly scan allowance first; after limit, one credit permits one package scan; premium users bypass limits. Make purchase grant idempotent via T10 ledger. Only after tests pass, expose a credit top-up CTA.
  Parallelization: Can parallel Y | Wave 3 | Blocked by T3, T9, T10 | Blocks credit UI release
  References: `app/api/v1/cards/scan/route.ts`; `supabase/migrations/20260614000001_add_credits_to_profiles.sql:17-43`; `supabase/migrations/20260614000002_add_brewing_notes_and_scan_limits.sql:64-111`; `components/PaymentDialog.tsx`
  Acceptance criteria: User below free limit increments scans without spending credits; user at free limit with credits spends exactly one credit and scan succeeds; user at limit with zero credits gets 403; premium user succeeds without credit spend; credit top-up CTA appears only after lifecycle tests exist.
  QA scenarios: Create `test/credit-lifecycle.test.mjs` and extend `test/payment-dialog.e2e.ts`; run `/Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test test/credit-lifecycle.test.mjs`; run Playwright payment dialog test after UI server command. Expected result: below limit no credit spend, at limit with credits spends one, at limit with zero returns 403, premium bypasses spend, and credit CTA appears only after lifecycle passes. Write stdout to `.omo/evidence/task-T12-credit-lifecycle.txt`.
  Commit: N | no git repository detected | Files: `app/api/v1/cards/scan/route.ts`, migrations, `components/PaymentDialog.tsx`, tests

- [ ] T13. Add scan confidence/correction groundwork
  What to do / Must NOT do: Add confidence/correction fields to scan response and UI copy. Preserve original scan payload conceptually for later canonical catalog work. Do not build full community moderation or roaster catalog yet.
  Parallelization: Can parallel Y | Wave 4 | Blocked by T1 | Blocks later roaster graph
  References: `app/api/v1/cards/scan/route.ts`; `components/CardCreatorWizard.tsx:88-103`; `.omo/ultraresearch/20260613-234801/SYNTHESIS.md`
  Acceptance criteria: Scan result includes confidence and source/fallback indicator; wizard lets user review/edit before save; fallback mock is clearly labeled.
  QA scenarios: Create `test/scan-trust.test.mjs`; run `/Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test test/scan-trust.test.mjs`; expected result: no-key/mock scan response includes confidence and fallback source, and parsed AI result normalizes missing confidence. Add Playwright assertion if UI copy changes. Write stdout to `.omo/evidence/task-T13-scan-trust.txt`.
  Commit: N | no git repository detected | Files: `app/api/v1/cards/scan/route.ts`, `components/CardCreatorWizard.tsx`, tests

- [ ] T14. Korea-first product polish and scoped taste/recap boundary
  What to do / Must NOT do: Align visible copy/docs around CoffeeDex as Korean specialty coffee memory. Add Korean roaster/vocabulary cues where low-risk. Do not implement live marketplace, public social graph, or roaster analytics in this pass. Ensure taste map/analytics copy is honest.
  Parallelization: Can parallel Y | Wave 4 | Blocked by T2 | Blocks final product review
  References: `app/page.tsx`; `app/dashboard/page.tsx`; `app/onboarding/page.tsx`; `docs/api-spec.md`; `lib/contracts.ts`
  Acceptance criteria: User-facing pages do not show starter SaaS or unsupported roaster-marketplace claims; CoffeeDex positioning is consistent; docs mark roaster lead-gen as future.
  QA scenarios: Create `test/product-copy.test.mjs` and `test/product-copy.e2e.ts`; run `/Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test test/product-copy.test.mjs`; run UI server command, then `/Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/@playwright/test/cli.js test --config=playwright.config.ts test/product-copy.e2e.ts`; expected result: no unsupported starter/marketplace/print claims, and home/dashboard/onboarding screenshots show CoffeeDex positioning. Write outputs to `.omo/evidence/task-T14-product-polish.txt`.
  Commit: N | no git repository detected | Files: `app/*`, `docs/*`, `lib/contracts.ts`

## Final verification wave (after ALL todos)
> Runs in parallel. ALL must APPROVE. Surface results and wait for the user's explicit okay before declaring complete.

- [ ] F1. Plan compliance audit
  Tool + invocation: `/Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test test/smoke.test.mjs test/cards-create-contract.test.mjs test/checkout-products.test.mjs test/pdf-route.test.mjs test/schema-contract.test.mjs test/stripe-webhook-idempotency.test.mjs test/subscription-lifecycle.test.mjs test/credit-lifecycle.test.mjs test/scan-trust.test.mjs test/product-copy.test.mjs`
  Expected result: all plan-required CLI tests pass.
  Evidence: `.omo/evidence/final-F1-plan-compliance.txt`.

- [ ] F2. Code quality review
  Tool + invocation: `/Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/typescript/bin/tsc --noEmit`; then inspect changed files with `rg -n "any|MOCK|Official SaaS Layer|Starter SaaS|poster|print fulfillment" app components hooks lib supabase test docs package.json`.
  Expected result: typecheck passes; any remaining `MOCK`/poster/starter hits are either removed or documented as intentionally future/out-of-scope.
  Evidence: `.omo/evidence/final-F2-code-quality.txt`.

- [ ] F3. Agent-executed browser QA
  Tool + invocation: run UI server command, then `/Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/@playwright/test/cli.js test --config=playwright.config.ts test/payment-dialog.e2e.ts test/checkout-return.e2e.ts test/story-export.e2e.ts test/wizard-errors.e2e.ts test/product-copy.e2e.ts`.
  Expected result: payment, checkout return, story download, wizard error, and product-copy flows pass in a real browser. No human manual QA required.
  Evidence: `.omo/evidence/final-F3-browser-qa.txt` plus screenshots/download metadata created by tests.

- [ ] F4. Scope fidelity
  Tool + invocation: `rg -n "marketplace|roaster analytics|shipping|print fulfillment|poster SKU|Official SaaS Layer|Starter SaaS" app components docs lib test package.json`; then compare changed file list against this plan.
  Expected result: no implemented live roaster marketplace/social graph/shipping/print fulfillment; no unsupported starter SaaS claims; every changed file maps to a todo.
  Evidence: `.omo/evidence/final-F4-scope-fidelity.txt`.

## Commit strategy

This workspace has no usable git repository, so no commits are required or allowed as completion evidence. Every work unit must instead produce:
- changed-file summary,
- command output evidence,
- real-surface QA artifact where applicable,
- explicit no-commit reason: `not a git repository`.

If a git repository becomes available later, atomic commits should follow the observed local style after inspecting repository history.

## Success criteria

- CoffeeDex create-card flow persists image URL, AI description, and footer metadata.
- Smoke tests are CoffeeDex-specific and pass under bundled Node.
- Typecheck passes.
- Next build either passes or has exact remediation evidence.
- Payment UI contains no poster mock and no unsafe credit purchase CTA before lifecycle readiness.
- Checkout return UX gives clear success/cancel feedback.
- Story image export triggers a real download.
- PDF endpoint returns a downloadable PDF for authorized users and 403 for unauthorized users.
- Billing webhook dedupes duplicate Stripe events and grants each entitlement once.
- Subscription status can activate, update, degrade, and revoke premium state from fixture events.
- Scan credits are spent exactly as defined and never double-granted.
- Product copy is CoffeeDex/Korea-first and does not claim unsupported roaster marketplace/community/print fulfillment.

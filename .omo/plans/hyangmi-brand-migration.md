# Hyangmi Brand Migration Plan

## TL;DR
> Summary:      Rebrand CoffeeDex to Hyangmi across visible product, paid artifacts, exports, docs, and tests while preserving stable API/database contracts.
> Deliverables:
> - Central brand constants for Hyangmi / 향미 naming.
> - User-facing CoffeeDex copy replaced with Hyangmi positioning.
> - Checkout, PDF, story export, public share, and metadata renamed consistently.
> - Tests/docs updated with anti-leak coverage for user-facing CoffeeDex strings.
> - Agent-executed CLI, build, and browser evidence under `.omo/evidence/`.
> Effort:       Large
> Risk:         Medium - the change is mostly copy/contract naming, but CoffeeDex is embedded in checkout names, export filenames, docs, and regression tests.

## Scope

### Must have
- Use the approved brand system:
  - Brand: `Hyangmi`
  - Korean display: `향미`
  - Category: `Coffee Taste Archive`
  - Tagline: `마신 원두가 취향의 기록이 되는 곳`
  - English tagline: `Your coffee taste, beautifully remembered.`
  - Free artifact: `Taste Card`
  - Paid artifact: `Taste Passport`
  - Analytics: `Taste Map`
  - Dashboard: `Archive`
- Keep the product thesis from the research: Korea-first specialty coffee memory and artifact product, not a brew logger, marketplace, public social network, or roaster analytics product.
- Add or update a centralized brand constants module before broad renaming.
- Replace user-facing CoffeeDex strings in home, onboarding, dashboard, payment, public share, story export, checkout notices, PDF output, metadata, docs, and tests.
- Rename generated artifact filenames from `coffeedex-*` to `hyangmi-*`.
- Keep database table names such as `tasting_cards` unchanged.
- Keep API route paths unchanged unless the route output is user-visible.
- Preserve existing paid product pricing and item identifiers unless the display name is the only change.
- Keep Korean UX copy natural; do not force English where Korean is clearer.
- Add regression coverage so user-facing CoffeeDex leaks are caught.

### Must NOT have
- Do not rename Supabase tables, migrations, RLS policies, or existing persisted columns solely for branding.
- Do not rename API routes, Stripe `itemType` keys, or existing internal compatibility IDs if doing so would break already-written tests/contracts.
- Do not introduce live roaster marketplace, public social graph, shipping, print fulfillment, poster, or roaster analytics.
- Do not use `any` to shortcut type errors.
- Do not remove tests just because their CoffeeDex assertions fail; update them to the Hyangmi contract.
- Do not claim trademark/domain clearance. Record Hyangmi availability as preliminary research only.
- Do not edit unrelated productization work outside the brand migration surface.

## Verification strategy
> Zero human intervention - all verification is agent-executed.
- Test decision: tests-after with targeted TDD for brand constants and filename/copy assertions, using Node test, TypeScript typecheck, Next build, and Playwright where applicable.
- QA policy: every todo has agent-executed scenarios and evidence.
- Evidence: `.omo/evidence/task-<N>-<slug>.<ext>`.
- Bundled Node command:
  - `/Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node`
- Typecheck command:
  - `/Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/typescript/bin/tsc --noEmit`
- Build command:
  - `/Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/next/dist/bin/next build`
- Dev server command:
  - `/Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3000`
- Playwright command:
  - `/Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/@playwright/test/cli.js test --config=playwright.config.ts <test-file>`

## Execution strategy

### Parallel execution waves
> Target 5-8 todos per wave. < 3 per wave (except the final) = under-splitting.

Wave 1 (no deps): T1 brand constants/contract; T2 metadata/package/contracts; T3 docs/product truth; T4 visible app surfaces.

Wave 2 (after T1): T5 commerce/checkout naming; T6 exports/public artifacts; T7 tests and brand leak guard; T8 browser polish and responsive copy QA.

Final wave: F1-F4 audits.

Critical path: T1 -> T4/T5/T6/T7 -> T8 -> final verification.

### Dependency matrix

| Todo | Depends on | Blocks | Can parallelize with |
| --- | --- | --- | --- |
| T1 | none | T2, T4, T5, T6, T7 | T3 |
| T2 | T1 | T7, F2 | T3, T4 |
| T3 | none | T7, F4 | T1, T2, T4 |
| T4 | T1 | T7, T8 | T2, T3, T5 |
| T5 | T1 | T7, F4 | T4, T6 |
| T6 | T1 | T7, T8 | T4, T5 |
| T7 | T2, T3, T4, T5, T6 | T8, F1 | none |
| T8 | T4, T6, T7 | F3 | none |

## Todos
> Implementation + Test = ONE todo. Never separate.

- [ ] T1. Establish the Hyangmi brand contract
  What to do / Must NOT do: Add a small typed brand constants module, for example `lib/brand.ts`, containing approved display names, taglines, artifact labels, and filename slugs. Update only direct consumers that can safely read from constants. Do not create a large abstraction or config system.
  Parallelization: Can parallel Y | Wave 1 | Blocks T2, T4, T5, T6, T7
  References: `.omo/ultraresearch/20260614-135730-branding/SYNTHESIS.md`; `.omo/drafts/hyangmi-brand-migration-approval-brief.md`; `package.json:2-3`; `app/layout.tsx:16-19`; `lib/contracts.ts:57-63`
  Acceptance criteria (agent-executable): A Node test proves the brand constants export `Hyangmi`, `향미`, `Coffee Taste Archive`, `Taste Card`, `Taste Passport`, `Taste Map`, and `hyangmi` filename slug exactly.
  QA scenarios (name the exact tool + invocation): Create or update `test/brand-contract.test.mjs`; run `/Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test test/brand-contract.test.mjs`; expected result: all approved brand tokens match the approval brief. Save stdout to `.omo/evidence/task-T1-brand-contract.txt`.
  Commit: N | no git repository detected | Files: `lib/brand.ts`, `test/brand-contract.test.mjs`

- [ ] T2. Rebrand package metadata, app metadata, and internal product constants
  What to do / Must NOT do: Update `package.json` name/description and Next metadata to Hyangmi. Update `starterServiceName` only if tests and API health expectations are also updated; keep type names stable if renaming them creates churn. Do not rename API routes or database schema.
  Parallelization: Can parallel Y | Wave 1 | Blocked by T1 | Blocks T7, F2
  References: `package.json:2-3`; `app/layout.tsx:16-19`; `lib/contracts.ts:57-63`; `lib/contracts.ts:124-130`; `test/smoke.test.mjs:25-32`; `test/product-copy.test.mjs:71-82`
  Acceptance criteria (agent-executable): Package and metadata expose Hyangmi; health/contract tests still pass with the selected stable service name; no starter SaaS copy reappears.
  QA scenarios: Run `/Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test test/smoke.test.mjs test/product-copy.test.mjs test/brand-contract.test.mjs`; expected result: package/metadata assertions pass and no stale starter product surfaces appear. Save stdout to `.omo/evidence/task-T2-metadata-contracts.txt`.
  Commit: N | no git repository detected | Files: `package.json`, `app/layout.tsx`, `lib/contracts.ts`, `test/smoke.test.mjs`, `test/product-copy.test.mjs`

- [ ] T3. Rewrite docs around Hyangmi without changing product scope
  What to do / Must NOT do: Update docs titles and prose from CoffeeDex to Hyangmi while preserving current truth: Korea-first AI specialty coffee memory product with future-only roaster/community layers. Do not add unsupported marketplace, subscription-roaster, print, or social claims.
  Parallelization: Can parallel Y | Wave 1 | Blocks T7, F4
  References: `docs/api-spec.md:1-5`; `docs/golden-flows.md:1-7`; `docs/deploy.md:1-4`; `.omo/ultraresearch/20260614-135730-branding/SYNTHESIS.md`
  Acceptance criteria (agent-executable): Docs mention Hyangmi as the product, keep future-only boundaries for roaster/community layers, and avoid CoffeeDex except in migration notes under `.omo/`.
  QA scenarios: Extend `test/product-copy.test.mjs`; run `/Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test test/product-copy.test.mjs`; expected result: docs assert Hyangmi positioning and reject unsupported marketplace/social/print claims. Save stdout to `.omo/evidence/task-T3-docs.txt`.
  Commit: N | no git repository detected | Files: `docs/api-spec.md`, `docs/golden-flows.md`, `docs/deploy.md`, `test/product-copy.test.mjs`

- [ ] T4. Rebrand visible app surfaces and Korean copy
  What to do / Must NOT do: Replace visible CoffeeDex copy with Hyangmi on home, onboarding, dashboard, empty states, cards, details, filters, usage, analytics, and roaster memory surfaces. Keep the message focused on memory, taste archive, taste map, taste passport, and Korean specialty coffee. Do not introduce new components unless needed to avoid duplication through `lib/brand.ts`.
  Parallelization: Can parallel Y | Wave 1 | Blocked by T1 | Blocks T7, T8
  References: `app/page.tsx:17-43`; `app/page.tsx:126-177`; `app/onboarding/page.tsx:18-38`; `components/dashboard-client.tsx:118-127`; `components/dashboard-empty-state.tsx:20`; `components/TastingCard.tsx:60`; `components/CardDetailModal.tsx:64`; `components/CardDetailModal.tsx:358`
  Acceptance criteria (agent-executable): Home/onboarding/dashboard visible copy uses Hyangmi/향미 and approved descriptors; no visible user-facing CoffeeDex remains in `app/` or `components/` except explicitly documented migration-only references.
  QA scenarios: Run `/Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test test/product-copy.test.mjs`; then run `/Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/typescript/bin/tsc --noEmit`; expected result: copy contract and typecheck pass. Save stdout to `.omo/evidence/task-T4-visible-copy.txt`.
  Commit: N | no git repository detected | Files: `app/page.tsx`, `app/onboarding/page.tsx`, `components/*`, `test/product-copy.test.mjs`

- [ ] T5. Rebrand commerce, checkout, and paid entitlement copy
  What to do / Must NOT do: Update Stripe product display names, checkout descriptions, payment dialog labels, and checkout return notices to Hyangmi. Keep item keys `premium_subscription`, `credits_10`, and `pdf_book` stable unless tests prove a rename is safe. Keep current prices unchanged.
  Parallelization: Can parallel Y | Wave 2 | Blocked by T1 | Blocks T7, F4
  References: `components/PaymentDialog.tsx:77-132`; `app/api/v1/checkout/route.ts:8-20`; `app/api/v1/checkout/route.ts:77-82`; `components/dashboard-checkout-notice.tsx:17-32`; `test/checkout-products.test.mjs:17-25`; `test/payment-dialog.test.ts:49-51`
  Acceptance criteria (agent-executable): Payment UI and Checkout Session product data display Hyangmi names; old CoffeeDex paid strings are gone from user-facing surfaces; checkout item keys remain accepted.
  QA scenarios: Run `/Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test test/checkout-products.test.mjs test/checkout-return.test.ts`; run Playwright payment dialog test with `/Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/@playwright/test/cli.js test --config=playwright.config.ts test/payment-dialog.test.ts`; expected result: Hyangmi paid labels render and checkout contract still accepts current item types. Save stdout to `.omo/evidence/task-T5-commerce.txt`.
  Commit: N | no git repository detected | Files: `components/PaymentDialog.tsx`, `app/api/v1/checkout/route.ts`, `components/dashboard-checkout-notice.tsx`, `test/checkout-products.test.mjs`, `test/payment-dialog.test.ts`, `test/checkout-return.test.ts`

- [ ] T6. Rebrand public sharing, story export, and PDF artifacts
  What to do / Must NOT do: Rename story preview badges, public share page labels, PDF title/recap/owner fallback, and generated filenames to Hyangmi. Keep PDF generator behavior and public share token routes stable. Use `hyangmi-story-*` and `hyangmi-taste-passport-*` or another approved Hyangmi slug consistently.
  Parallelization: Can parallel Y | Wave 2 | Blocked by T1 | Blocks T7, T8
  References: `components/StoryExportModal.tsx:124-176`; `components/story-export-assets.ts:86-88`; `lib/pdf-generator.ts:1-14`; `lib/pdf-generator.ts:74-99`; `lib/pdf-generator.ts:127`; `app/api/v1/pdf/route.ts:81-88`; `components/public-card-page.tsx:80-87`; `components/public-card-page.tsx:120-135`; `test/story-export.test.ts:80`; `test/pdf-route.test.mjs:171`; `test/public-share.test.ts:109`
  Acceptance criteria (agent-executable): Story downloads use a `hyangmi-*` filename, PDF headers use a Hyangmi filename, PDF text no longer says CoffeeDex, and public share pages display Hyangmi/향미.
  QA scenarios: Run `/Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test test/pdf-route.test.mjs test/public-share-contract.test.mjs test/artifact-quality.test.mjs`; run Playwright story/public share tests with `/Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/@playwright/test/cli.js test --config=playwright.config.ts test/story-export.test.ts test/public-share.test.ts`; expected result: filenames, rendered labels, and artifact bytes use Hyangmi. Save stdout to `.omo/evidence/task-T6-artifacts.txt`.
  Commit: N | no git repository detected | Files: `components/StoryExportModal.tsx`, `components/story-export-assets.ts`, `lib/pdf-generator.ts`, `app/api/v1/pdf/route.ts`, `components/public-card-page.tsx`, related tests

- [ ] T7. Update test suite and add a user-facing CoffeeDex leak guard
  What to do / Must NOT do: Update all CoffeeDex-specific assertions to Hyangmi where they verify user-facing product identity. Add a focused leak guard that scans `app`, `components`, `docs`, `lib`, `hooks`, and user-facing tests for forbidden CoffeeDex strings, with an explicit allowlist for `.omo/`, historical migration notes, non-user-facing type names if retained, and temporary compatibility IDs. Do not allow broad regex exemptions that hide visible copy leaks.
  Parallelization: Can parallel N | Wave 2 | Blocked by T2, T3, T4, T5, T6 | Blocks T8, F1
  References: `test/smoke.test.mjs:25-32`; `test/smoke.test.mjs:52-101`; `test/product-copy.test.mjs:21-82`; `test/behavior.test.ts:3-8`; `test/public-share.test.ts:109`; `test/pdf-route.test.mjs:171`; `test/story-export.test.ts:80`; `test/checkout-products.test.mjs:17-25`
  Acceptance criteria (agent-executable): Node and Playwright tests assert Hyangmi product identity; the new leak guard fails if visible CoffeeDex copy returns; intentional internal compatibility mentions are documented in the allowlist.
  QA scenarios: Create or update `test/brand-leak.test.mjs`; run `/Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test test/brand-contract.test.mjs test/brand-leak.test.mjs test/smoke.test.mjs test/product-copy.test.mjs test/checkout-products.test.mjs test/pdf-route.test.mjs test/artifact-quality.test.mjs`; expected result: all identity/contract tests pass and no forbidden user-facing CoffeeDex leaks remain. Save stdout to `.omo/evidence/task-T7-tests-leak-guard.txt`.
  Commit: N | no git repository detected | Files: `test/*`, allowlist only if needed

- [ ] T8. Run browser QA and polish responsive brand presentation
  What to do / Must NOT do: Start the app locally, inspect home, onboarding, dashboard, payment modal, story export modal, and public share page in desktop and mobile widths. Fix only brand/copy/layout issues introduced or exposed by the migration. Do not redesign the product or broaden feature scope.
  Parallelization: Can parallel N | Wave 2 | Blocked by T4, T6, T7 | Blocks F3
  References: `app/page.tsx`; `app/onboarding/page.tsx`; `components/dashboard-client.tsx`; `components/PaymentDialog.tsx`; `components/StoryExportModal.tsx`; `components/public-card-page.tsx`; `playwright.config.ts`
  Acceptance criteria (agent-executable): Browser-rendered pages show Hyangmi branding, no visible CoffeeDex copy, no clipped/overlapping brand text at desktop and mobile widths, and story/PDF/public-share flows remain discoverable.
  QA scenarios: Run dev server with `/Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3000`; then run `/Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/@playwright/test/cli.js test --config=playwright.config.ts test/behavior.test.ts test/product-copy.test.ts test/payment-dialog.test.ts test/story-export.test.ts test/public-share.test.ts`; save stdout and screenshots to `.omo/evidence/task-T8-browser-brand-qa.txt`, `.omo/evidence/task-T8-home.png`, `.omo/evidence/task-T8-dashboard.png`, and `.omo/evidence/task-T8-public-share.png`.
  Commit: N | no git repository detected | Files: UI files touched in T4/T5/T6 plus Playwright tests if assertions need alignment

## Final verification wave (after ALL todos)
> Runs in parallel. ALL must APPROVE. Surface results and wait for the user's explicit okay before declaring complete.

- [ ] F1. Plan compliance audit
  Tool + invocation: `/Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test test/brand-contract.test.mjs test/brand-leak.test.mjs test/smoke.test.mjs test/product-copy.test.mjs test/checkout-products.test.mjs test/pdf-route.test.mjs test/public-share-contract.test.mjs test/artifact-quality.test.mjs`
  Expected result: every plan-required Node test passes and asserts Hyangmi identity.
  Evidence: `.omo/evidence/final-F1-plan-compliance.txt`.

- [ ] F2. Code quality review
  Tool + invocation: `/Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/typescript/bin/tsc --noEmit`; then inspect `rg -n "CoffeeDex|coffeedex|Coffee Dex|CoffeeDex\\.app|Starter SaaS|Official SaaS Layer|marketplace|roaster analytics|print fulfillment|poster" app components hooks lib docs test package.json`.
  Expected result: typecheck passes; remaining CoffeeDex/coffeedex hits are either removed, under `.omo/`, historical migration notes, or explicitly justified internal compatibility names.
  Evidence: `.omo/evidence/final-F2-code-quality.txt`.

- [ ] F3. Real browser QA
  Tool + invocation: run the dev server command, then `/Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/@playwright/test/cli.js test --config=playwright.config.ts test/behavior.test.ts test/product-copy.test.ts test/payment-dialog.test.ts test/story-export.test.ts test/public-share.test.ts`.
  Expected result: home, dashboard, onboarding, payment, story export, and public share render Hyangmi branding with no layout overlap or stale visible CoffeeDex copy.
  Evidence: `.omo/evidence/final-F3-browser-qa.txt` plus screenshots.

- [ ] F4. Scope fidelity
  Tool + invocation: compare changed files against this plan; run `rg -n "CREATE TABLE|ALTER TABLE|DROP TABLE|marketplace|public social graph|roaster analytics|shipping|print fulfillment|poster SKU" app components hooks lib docs test package.json supabase`.
  Expected result: no Supabase schema rename for branding only; no unsupported marketplace/social/print/shipping scope; every changed file maps to a todo.
  Evidence: `.omo/evidence/final-F4-scope-fidelity.txt`.

## Commit strategy

This workspace currently has no usable git repository as completion evidence in the existing productization plan, so commits are not required. Each work unit must produce:

- changed-file summary,
- command output evidence,
- browser or artifact evidence where applicable,
- explicit no-commit reason: `not a git repository`.

If a git repository becomes available later, use one atomic commit:

`refactor(brand): migrate CoffeeDex surfaces to Hyangmi`

## Success criteria

- User-facing product identity is Hyangmi / 향미.
- CoffeeDex no longer appears in visible app copy, paid labels, public share pages, story exports, PDF output, SEO metadata, package description, or docs.
- Generated story/PDF filenames use a Hyangmi slug.
- Brand constants define the approved names and are covered by tests.
- Database tables, Supabase migrations, API paths, and stable item identifiers are not renamed for cosmetic reasons.
- Product scope remains Korea-first specialty coffee memory and artifact monetization.
- Node tests pass.
- Typecheck passes.
- Next build passes or produces exact remediation evidence.
- Playwright browser QA passes for the rebranded surfaces.

# CoffeeDex First-Value Flow 8.5 Plan

## TL;DR
> Summary:      Recenter CoffeeDex on the promise `좋았던 원두를 다시 살 수 있게 20초 만에 저장` by making `/capture` the primary entry, reducing first save to four default fields, and rewarding the first saved card with an immediate rebuy clue.
> Deliverables: landing CTA to `/capture`; four-field quick capture; Taste Finder as quick-record preset; first-save dashboard reward; trust/free-vs-Premium copy; mobile/desktop Playwright QA; consumer score evidence >= 8.5.
> Effort:       Medium
> Risk:         Medium - multiple UI surfaces and tests already have dirty, partially future-facing changes that must be preserved instead of reverted.

## Scope
### Must have
- Landing first viewport centers the `/capture` CTA and the exact core promise: `좋았던 원두를 다시 살 수 있게 20초 만에 저장`.
- `/capture` default state shows only bean name, roaster, repurchase intent, and one-line note; photo scan and deeper package/taste fields are secondary/collapsed, not default.
- Dashboard quick-add uses the same four-field quick-record contract and no longer defaults to purchase URL, purchase note, flavor chips, origin, process, image URL, or taste sliders.
- Taste Finder becomes a quick-record preset that routes to `/capture?intent=first_card&source=...&mode=quick&taste_profile=...` and preloads only helpful hidden defaults or copy, not extra required fields.
- First saved card dashboard reward shows a concrete rebuy clue, search keywords, and next action from the saved card.
- Trust and pricing copy clearly says photo originals are not stored by CoffeeDex routes, records are private, login is required only at save, free recording exists, and Premium is optional scan/report expansion.
- Agent-executed mobile and desktop browser QA captures evidence and records a consumer first-value score >= 8.5.

### Must NOT have (guardrails, anti-slop, scope boundaries)
- Do not add marketplace, ordering, referral, roaster partnership, delivery, community, or affiliate claims.
- Do not hit live Supabase or live Stripe in tests or QA; route mocks and local fixtures only.
- Do not rewrite applied migrations or weaken owner-scoped API/RLS behavior.
- Do not store raw photo/base64 data in localStorage, sessionStorage, API persistence, analytics, or evidence.
- Do not make Taste Passport, AI scoring, scan credits, PDF export, or Premium the primary first-value action.
- Do not revert unrelated dirty changes; re-read every touched dirty file before editing and preserve user work.
- Do not edit `.agents/`, `.claude/`, or generated/source command surfaces.

## Verification strategy
> Zero human intervention - all verification is agent-executed.
- Test decision: TDD + Node contract tests and Playwright browser tests. Every behavior change starts with a failing targeted proof before production edits.
- QA policy: every task has agent-executed scenarios with explicit evidence artifacts.
- Evidence: `.omo/evidence/task-<N>-<slug>.<ext>`

## Execution strategy
### Parallel execution waves
> Target 5-8 tasks per wave. <3 per wave (except final) = under-splitting.
> Extract shared dependencies as Wave-1 tasks to maximize parallelism.

Wave 1 (no dependencies):
- Task 1: Shared quick-record data contract
- Task 2: Landing CTA, trust, and price framing
- Task 3: Activation/Taste Finder routing contract

Wave 2 (after Wave 1):
- Task 4: `/capture` four-field quick save, depends [1, 3]
- Task 5: Dashboard quick-record modal parity, depends [1]
- Task 6: First-save dashboard reward, depends [1]

Wave 3 (after Wave 2):
- Task 7: Product truth docs and smoke guards, depends [2, 4, 5, 6]
- Task 8: Mobile/desktop QA and consumer score, depends [2, 3, 4, 5, 6, 7]

Critical path: Task 1 -> Task 4 -> Task 7 -> Task 8

### Dependency matrix
| Task | Depends on | Blocks | Can parallelize with |
|------|------------|--------|----------------------|
| 1    | none       | 4, 5, 6 | 2, 3 |
| 2    | none       | 7, 8   | 1, 3 |
| 3    | none       | 4, 8   | 1, 2 |
| 4    | 1, 3       | 7, 8   | 5, 6 |
| 5    | 1          | 7, 8   | 4, 6 |
| 6    | 1          | 7, 8   | 4, 5 |
| 7    | 2, 4, 5, 6 | 8      | none |
| 8    | 2, 3, 4, 5, 6, 7 | none | none |

## Todos
> Implementation + Test = ONE task. Never separate.
> Every task MUST have: References + Acceptance Criteria + QA Scenarios + Commit.

- [ ] 1. Shared quick-record data contract

  What to do: Create one reusable quick-record contract for bean name, roaster, repurchase intent, and one-line note. Move the current `buildQuickAddMemoryPayload` behavior behind that contract or replace it with a helper that returns executable `CreateTastingCardInput` defaults: `imageUrl: null`, metrics all `3`, `tags: []`, package fields `null`, purchase fields `null`, `scanSource: "manual"`, `confirmed: true`, and `repurchaseReasons` equal to `[note]` only when the note is nonblank. Update tests first so the old purchase/chip/origin behavior fails.
  Must NOT do: Do not require a migration, do not remove API compatibility fields, and do not fabricate package/process/purchase data from the note.

  Parallelization: Can parallel: YES | Wave 1 | Blocks: [4, 5, 6] | Blocked by: []

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `components/quick-add-memory-form.tsx:52` - current payload builder includes too many optional quick-add fields.
  - API/Type: `hooks/useTastingCards.ts:181` - `CreateTastingCardInput` contract used by create-card mutations.
  - API/Type: `app/api/v1/cards/route.ts:18` - API already defaults optional fields and requires `confirmed` only for memory input.
  - API/Type: `stores/tastingStore.ts:4` - current broad wizard form state; quick contract must not force all fields into default UI.
  - Test:     `test/quick-add-contract.test.mjs:103` - current contract tests should be rewritten failing-first around four default fields.
  - External: `https://github.com/vercel/next.js/blob/v16.2.9/docs/01-app/01-getting-started/05-server-and-client-components.mdx` - keep pure contract helpers outside client components where possible.

  Acceptance criteria (agent-executable only):
  - [ ] Before implementation, `node --test test/quick-add-contract.test.mjs` fails because the expected four-field payload rejects purchase/chip/origin/process defaults.
  - [ ] After implementation, `node --test test/quick-add-contract.test.mjs` exits 0 and asserts no `purchaseUrl`, `purchaseNote`, `packageOrigin`, `packageProcess`, `tags`, or non-default metric values are produced from the four default fields.
  - [ ] `npm run typecheck` exits 0.

  QA scenarios (MANDATORY - task incomplete without these):
  > Name the exact tool AND its exact invocation - not "verify it works". Browser use: in Codex, use `browser:control-in-app-browser` first when available and no authenticated/persistent user browser profile is required; otherwise use Chrome to drive the page, or agent-browser (https://github.com/vercel-labs/agent-browser) when Chrome is unavailable. Computer use: OS-level GUI automation for a non-browser desktop app.
  ```
  Scenario: four-field payload happy path
    Tool:     bash
    Steps:    mkdir -p .omo/evidence && node --test test/quick-add-contract.test.mjs | tee .omo/evidence/task-1-quick-record-contract.log
    Expected: Exit 0; log includes the quick-record payload test and no assertion mentions purchaseUrl/purchaseNote/packageOrigin/packageProcess as populated values.
    Evidence: .omo/evidence/task-1-quick-record-contract.log

  Scenario: blank bean validation
    Tool:     bash
    Steps:    node --test test/quick-add-contract.test.mjs --test-name-pattern "empty quick add title" | tee .omo/evidence/task-1-quick-record-validation.log
    Expected: Exit 0; assertion message remains `원두 이름을 입력해야 빠른 기록을 저장할 수 있어요.`
    Evidence: .omo/evidence/task-1-quick-record-validation.log
  ```

  Commit: YES | Message: `refactor(capture): share quick record payload contract` | Files: [`components/quick-add-memory-form.tsx`, `hooks/useTastingCards.ts`, `stores/tastingStore.ts`, `test/quick-add-contract.test.mjs`, optional `lib/quick-record.ts`]

- [ ] 2. Landing CTA, trust, and price framing

  What to do: Rework the first viewport of `app/page.tsx` so the primary CTA is centered, labeled `20초 기록 시작`, and links to `/capture`; replace Taste Passport/AI-first hero copy with the core promise and trust line. Keep Premium/pricing available but secondary, with clear free-vs-Premium distinction in `components/landing-pricing-section.tsx` and `lib/commerce.ts`. Update Playwright/product-copy tests before edits.
  Must NOT do: Do not lead with scan credits, AI precision, Taste Passport, PDF, or Premium; do not use black/gold gallery styling if it conflicts with `DESIGN.md`.

  Parallelization: Can parallel: YES | Wave 1 | Blocks: [7, 8] | Blocked by: []

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `app/page.tsx:29` - nav currently sends the prominent CTA to `/onboarding`.
  - Pattern:  `app/page.tsx:54` - hero currently leads with AI scan/Taste Passport copy.
  - Pattern:  `app/page.tsx:58` - primary hero CTA already links `/capture` but is not centered around the required promise.
  - Pattern:  `components/landing-pricing-section.tsx:51` - price section already frames optional additional features.
  - API/Type: `lib/commerce.ts:22` - Premium and credit copy currently emphasizes scan limits.
  - Design:   `DESIGN.md:1` - Warm Private Archive direction; first screen should answer what was drunk and what may be bought again.
  - Design:   `DESIGN.md:72` - avoid AI-first vocabulary and ecommerce patterns.
  - Test:     `test/product-operations.test.ts:70` - already expects `/capture`, trust copy, and visible price guidance.
  - Test:     `test/product-copy.test.ts:253` - visible product-copy assertions need updating away from Taste Finder-first links.
  - External: `https://github.com/vercel/next.js/blob/v16.2.9/docs/01-app/03-api-reference/02-components/link.mdx` - use `next/link` for route navigation.

  Acceptance criteria (agent-executable only):
  - [ ] Before implementation, `npx playwright test test/product-operations.test.ts --grep "tracks landing pricing intent"` fails on the current landing hero.
  - [ ] After implementation, `npm run build && npx playwright test test/product-operations.test.ts --grep "tracks landing pricing intent" --reporter=line` exits 0.
  - [ ] `npx playwright test test/product-copy.test.ts --grep "positions the home page" --reporter=line` exits 0 with screenshot evidence.

  QA scenarios (MANDATORY - task incomplete without these):
  ```
  Scenario: desktop landing first-value CTA
    Tool:     playwright(real Chrome)
    Steps:    npm run build && npx playwright test test/product-operations.test.ts --grep "tracks landing pricing intent" --reporter=line
    Expected: The test clicks the landing page, sees `다시 살 원두를 20초 만에 기억`, sees `사진 원본은 저장하지 않고, 저장할 때만 로그인해요.`, and verifies the primary CTA href is `/capture`.
    Evidence: .omo/evidence/task-2-landing-desktop.log

  Scenario: mobile landing no secondary-product dominance
    Tool:     playwright(real Chrome)
    Steps:    npx playwright test test/product-copy.test.ts --grep "positions the home page" --reporter=line
    Expected: Screenshot shows centered `/capture` CTA above secondary pricing/feature sections; body does not contain unsupported marketplace/referral/community/print claims.
    Evidence: .omo/evidence/task-2-landing-mobile.png
  ```

  Commit: YES | Message: `feat(landing): center first value capture promise` | Files: [`app/page.tsx`, `components/landing-pricing-section.tsx`, `lib/commerce.ts`, `test/product-operations.test.ts`, `test/product-copy.test.ts`]

- [ ] 3. Activation/Taste Finder routing contract

  What to do: Change first-card activation helpers and onboarding/Taste Finder CTAs so Taste Finder is a quick-record preset into `/capture`, not a detour into dashboard or full wizard. Preserve public-card token handling and supported `taste_profile` values. Update tests first.
  Must NOT do: Do not require auth before the `/capture` route renders; do not expose raw `source`, `token`, or `mode=quick` text in visible auth/dashboard copy.

  Parallelization: Can parallel: YES | Wave 1 | Blocks: [4, 8] | Blocked by: []

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `lib/activation-intent.ts:86` - current builder returns `/dashboard?...`.
  - Pattern:  `lib/activation-intent.ts:108` - onboarding already defaults to quick mode.
  - Pattern:  `app/onboarding/page.tsx:42` - onboarding builds `dashboardHref` for the Taste Finder.
  - Pattern:  `components/onboarding-taste-finder.tsx:13` - helper appends `taste_profile`.
  - Pattern:  `components/onboarding-taste-finder.tsx:155` - primary onboarding CTA currently uses `dashboardHref`.
  - Test:     `test/activation-intent.test.mjs:109` - quick-mode builder coverage.
  - Test:     `test/activation-loop.test.ts:104` - future-facing Playwright assertions already expect `/capture?intent=first_card...`.
  - External: `https://github.com/vercel/next.js/blob/v16.2.9/docs/01-app/03-api-reference/02-components/link.mdx` - App Router `Link href` contract.

  Acceptance criteria (agent-executable only):
  - [ ] Before implementation, `node --test test/activation-intent.test.mjs --test-name-pattern "first-card activation builder"` fails if expected href is changed to `/capture?...`.
  - [ ] After implementation, `node --test test/activation-intent.test.mjs` exits 0.
  - [ ] After implementation, `npx playwright test test/activation-loop.test.ts --grep "prefills first-card" --reporter=line` reaches `/capture?intent=first_card&source=onboarding&mode=quick&taste_profile=sweet`.

  QA scenarios (MANDATORY - task incomplete without these):
  ```
  Scenario: onboarding Taste Finder quick preset
    Tool:     playwright(real Chrome)
    Steps:    npm run build && npx playwright test test/activation-loop.test.ts --grep "prefills first-card" --reporter=line
    Expected: CTA href is `/capture?intent=first_card&source=onboarding&mode=quick&taste_profile=sweet`; after click, URL matches `/capture?intent=first_card`.
    Evidence: .omo/evidence/task-3-taste-finder-routing.log

  Scenario: public-card token stays sanitized
    Tool:     bash
    Steps:    node --test test/activation-intent.test.mjs --test-name-pattern "public-card source" | tee .omo/evidence/task-3-public-card-token.log
    Expected: Exit 0; public-card token is preserved in the generated `/capture?...token=public-token-001` href and unsupported values are ignored.
    Evidence: .omo/evidence/task-3-public-card-token.log
  ```

  Commit: YES | Message: `feat(onboarding): route taste finder into quick capture` | Files: [`lib/activation-intent.ts`, `app/onboarding/page.tsx`, `components/onboarding-taste-finder.tsx`, `test/activation-intent.test.mjs`, `test/activation-loop.test.ts`]

- [ ] 4. `/capture` four-field quick save

  What to do: Make `/capture` open directly into a four-field quick save by default. Show bean name, roaster, repurchase intent, and one-line note; show trust cues `사진 원본은 저장하지 않아요`, `비공개 기록으로 저장돼요`, and `저장할 때만 로그인해요`. Keep photo scan as an optional secondary action and deeper package/taste fields behind a clearly collapsed `자세히 추가` affordance. Consume `intent`, `source`, `token`, and `taste_profile` query params from Task 3 for preset copy without adding extra required fields.
  Must NOT do: Do not default to package origin/process, flavor chips, sliders, purchase URL, purchase note, or confirmation checkbox friction; do not put raw image data into drafts.

  Parallelization: Can parallel: YES | Wave 2 | Blocks: [7, 8] | Blocked by: [1, 3]

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `app/capture/page.tsx:1` - `/capture` renders `GuestCaptureClient`.
  - Pattern:  `components/guest-capture-client.tsx:155` - manual entry currently opens the editor only after button click.
  - Pattern:  `components/guest-capture-client.tsx:216` - current hero and upload-first layout.
  - Pattern:  `components/coffee-memory-editor.tsx:60` - current default editor exposes package fact fields.
  - Pattern:  `components/coffee-memory-editor.tsx:84` - current default editor exposes taste sliders.
  - Pattern:  `components/coffee-memory-editor.tsx:104` - current repurchase and reason section.
  - Pattern:  `components/coffee-memory-editor.tsx:124` - current confirmation/save block.
  - API/Type: `lib/guest-draft.ts:35` - draft schema forbids image data in text fields.
  - API/Type: `components/guest-capture-client.tsx:83` - current save body maps guest draft to `POST /api/v1/cards`.
  - Test:     `test/guest-capture.test.ts:27` - browser flow covers scan, auth-at-save, and no raw photo persistence.
  - Test:     `test/activation-loop.test.ts:104` - preset handoff should render on `/capture`.
  - External: `https://github.com/microsoft/playwright/blob/main/docs/src/emulation.md` - viewport/screenshot checks.

  Acceptance criteria (agent-executable only):
  - [ ] Before implementation, `npx playwright test test/guest-capture.test.ts --grep "opens a blank manual draft" --reporter=line` fails because default `/capture` does not show the four-field state and trust cues.
  - [ ] After implementation, `npm run build && npx playwright test test/guest-capture.test.ts --reporter=line` exits 0.
  - [ ] After implementation, `npx playwright test test/activation-loop.test.ts --grep "prefills first-card|routes public-card" --reporter=line` exits 0.
  - [ ] Stored guest draft assertions prove no `data:image` or `guest-photo` string is stored.

  QA scenarios (MANDATORY - task incomplete without these):
  ```
  Scenario: mobile four-field capture
    Tool:     playwright(real Chrome)
    Steps:    npm run build && npx playwright test test/guest-capture.test.ts --grep "opens a blank manual draft" --reporter=line
    Expected: At 375x812, `/capture` shows labels `원두 이름`, `로스터`, `다시 살까요?`, `한 줄 메모`; does not show `원산지`, `가공 방식`, `산미`, `구매 단서`, or `한국어 향미 단어` until `자세히 추가`.
    Evidence: .omo/evidence/task-4-capture-mobile.png

  Scenario: save requests login only at save
    Tool:     playwright(real Chrome)
    Steps:    npx playwright test test/guest-capture.test.ts --grep "asks for auth only when saving" --reporter=line
    Expected: User can fill the four fields unauthenticated; after save receives `/auth?redirect=%2Fcapture%3Fresume%3D1`; localStorage draft contains no raw image data.
    Evidence: .omo/evidence/task-4-capture-auth-save.png
  ```

  Commit: YES | Message: `feat(capture): reduce first save to four fields` | Files: [`app/capture/page.tsx`, `components/guest-capture-client.tsx`, `components/coffee-memory-editor.tsx`, `lib/guest-draft.ts`, `test/guest-capture.test.ts`, `test/activation-loop.test.ts`]

- [ ] 5. Dashboard quick-record modal parity

  What to do: Update the dashboard quick-add path so `빠른 기록` and `빠른 커피 기록` use the same four default fields as `/capture`, with optional details hidden. Keep the full scan/manual wizard available as the secondary mode. Update preview copy so it does not suggest AI note generation or flavor chips are required for first value.
  Must NOT do: Do not remove the full wizard, scan entitlement checks, or existing payment modal; do not make Premium required for quick record.

  Parallelization: Can parallel: YES | Wave 2 | Blocks: [7, 8] | Blocked by: [1]

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `components/CardCreatorWizard.tsx:366` - current quick/full segmented control.
  - Pattern:  `components/CardCreatorWizard.tsx:405` - current quick mode renders `QuickAddMemoryForm`.
  - Pattern:  `components/quick-add-memory-form.tsx:154` - current quick form fields.
  - Pattern:  `components/quick-add-memory-form.tsx:190` - current purchase URL/note fields must not be default.
  - Pattern:  `components/quick-add-memory-form.tsx:215` - current flavor chips must not be default.
  - Pattern:  `components/card-creator-wizard-parts.tsx:138` - preview uses quick payload and repurchase intent.
  - Test:     `test/dashboard-growth.test.ts:148` - current dashboard quick-add browser test.
  - Test:     `test/wizard-errors.test.ts` - existing wizard error patterns must remain green.

  Acceptance criteria (agent-executable only):
  - [ ] Before implementation, `npx playwright test test/dashboard-growth.test.ts --grep "quick add" --reporter=line` fails after tests expect only four default fields.
  - [ ] After implementation, `node --test test/quick-add-contract.test.mjs` exits 0.
  - [ ] After implementation, `npm run build && npx playwright test test/dashboard-growth.test.ts --grep "quick add" --reporter=line` exits 0.
  - [ ] `npx playwright test test/wizard-errors.test.ts --reporter=line` exits 0.

  QA scenarios (MANDATORY - task incomplete without these):
  ```
  Scenario: dashboard quick record happy path
    Tool:     playwright(real Chrome)
    Steps:    npm run build && npx playwright test test/dashboard-growth.test.ts --grep "quick add" --reporter=line
    Expected: Quick modal opens with `빠른 커피 기록` pressed and only bean name, roaster, repurchase intent, and one-line note visible by default.
    Evidence: .omo/evidence/task-5-dashboard-quick-record.png

  Scenario: full wizard remains available
    Tool:     playwright(real Chrome)
    Steps:    npx playwright test test/wizard-errors.test.ts --reporter=line
    Expected: Full scan/manual mode still handles validation and error states; quick-record changes do not remove scan entitlement/payment behavior.
    Evidence: .omo/evidence/task-5-full-wizard-regression.log
  ```

  Commit: YES | Message: `feat(dashboard): align quick record with capture defaults` | Files: [`components/quick-add-memory-form.tsx`, `components/CardCreatorWizard.tsx`, `components/card-creator-wizard-parts.tsx`, `test/dashboard-growth.test.ts`, `test/wizard-errors.test.ts`]

- [ ] 6. First-save dashboard reward

  What to do: Add or update a dashboard reward surface that appears after the first saved card or when exactly one confirmed card exists in the first-value flow. It must show: a rebuy clue from repurchase intent/note, search keywords built from roaster + bean name, and one concrete next action (`재구매 검색 열기`, `다시 살 단서 보기`, or `다음 원두도 20초 기록`). Use existing card data and `window.open` search behavior where appropriate.
  Must NOT do: Do not claim CoffeeDex orders, recommends marketplace products, contacts roasters, or sends background notifications.

  Parallelization: Can parallel: YES | Wave 2 | Blocks: [7, 8] | Blocked by: [1]

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `components/dashboard-client.tsx:198` - dashboard summary strip already surfaces `다시 살 단서`.
  - Pattern:  `components/dashboard-shelf-view.tsx:124` - Rebuy Intelligence panel already belongs near shelf content.
  - Pattern:  `components/dashboard-retention-loop.tsx:18` - existing owned-data return loop.
  - Pattern:  `components/dashboard-retention-loop.tsx:69` - existing `다시 살 이유` card.
  - Pattern:  `components/dashboard-rebuy-intelligence-panel.tsx:120` - existing external search action pattern.
  - Pattern:  `components/TastingCard.tsx:22` - existing fallback Google search URL format.
  - API/Type: `hooks/useTastingCards.ts:49` - card fields available for reward derivation.
  - Test:     `test/dashboard-growth.test.ts:162` - saved-card dashboard coverage.
  - Test:     `test/rebuy-intelligence.test.mjs:224` - safe onboarding prompts for no saved memories.

  Acceptance criteria (agent-executable only):
  - [ ] Before implementation, a new/updated `test/dashboard-growth.test.ts` first-save reward assertion fails because no rebuy clue/search keywords/next action trio is visible.
  - [ ] After implementation, `npm run build && npx playwright test test/dashboard-growth.test.ts --grep "first-save reward|return loop|private rebuy" --reporter=line` exits 0.
  - [ ] `node --test test/rebuy-intelligence.test.mjs` exits 0; no marketplace/community/order wording appears.

  QA scenarios (MANDATORY - task incomplete without these):
  ```
  Scenario: first-save reward shows rebuy clue
    Tool:     playwright(real Chrome)
    Steps:    npm run build && npx playwright test test/dashboard-growth.test.ts --grep "first-save reward" --reporter=line
    Expected: Mock one-card dashboard shows `복숭아 단맛`, search keywords containing `프릳츠 커피 Ethiopia Guji 원두`, and a visible next-action button.
    Evidence: .omo/evidence/task-6-first-save-reward.png

  Scenario: empty dashboard does not fabricate reward
    Tool:     playwright(real Chrome)
    Steps:    npx playwright test test/dashboard-growth.test.ts --grep "empty state" --reporter=line
    Expected: Empty dashboard still shows first-record activation only and no fake rebuy clue/search keywords.
    Evidence: .omo/evidence/task-6-empty-dashboard-no-fake-reward.log
  ```

  Commit: YES | Message: `feat(dashboard): reward first save with rebuy clue` | Files: [`components/dashboard-client.tsx`, `components/dashboard-shelf-view.tsx`, `components/dashboard-retention-loop.tsx`, optional `components/dashboard-first-save-reward.tsx`, `test/dashboard-growth.test.ts`, `test/rebuy-intelligence.test.mjs`]

- [ ] 7. Product truth docs and smoke guards

  What to do: Synchronize docs and smoke/product-copy tests with the new first-value contract. Update `docs/golden-flows.md`, `docs/api-spec.md`, `docs/deploy.md`, and product truth tests so Quick Add/Quick Capture default fields are exactly bean name, roaster, repurchase intent, and one-line note, while optional photo scan/details/Premium remain secondary. Keep privacy wording aligned with existing legal/deploy boundaries.
  Must NOT do: Do not update docs ahead of implementation in a way that claims unsupported behavior; do not remove existing secondary compatibility docs for checkout/PDF/share.

  Parallelization: Can parallel: NO | Wave 3 | Blocks: [8] | Blocked by: [2, 4, 5, 6]

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `docs/golden-flows.md:3` - recall/repurchase is the primary product truth.
  - Pattern:  `docs/golden-flows.md:9` - currently says optional Korean flavor helper chips are part of Quick Add default.
  - Pattern:  `docs/golden-flows.md:17` - raw scan images are not persisted and text drafts are browser-local.
  - Pattern:  `docs/golden-flows.md:47` - Rebuy Intelligence boundary.
  - Pattern:  `docs/golden-flows.md:79` - future marketplace/community boundary.
  - Pattern:  `docs/api-spec.md:51` - current boundary list.
  - Pattern:  `docs/api-spec.md:346` - free JSON/CSV export distinction.
  - Pattern:  `docs/deploy.md:48` - guest scan deployment boundary and no raw image persistence.
  - Test:     `test/product-copy.test.mjs:70` - product truth copy contract.
  - Test:     `test/smoke.test.mjs:142` - smoke suite checks quick-add/onboarding copy.

  Acceptance criteria (agent-executable only):
  - [ ] Before implementation, `npm run test:product-truth` fails after tests are updated to reject flavor chips as default quick-record requirements.
  - [ ] After implementation, `npm run test:product-truth` exits 0.
  - [ ] `npm run test:smoke` exits 0.
  - [ ] `rg -n "marketplace|referral|roaster partnership|community social graph|print fulfillment|무제한" app components docs test` returns no unsupported current-capability claim except explicit future-bound/guard text.

  QA scenarios (MANDATORY - task incomplete without these):
  ```
  Scenario: product truth tests
    Tool:     bash
    Steps:    npm run test:product-truth | tee .omo/evidence/task-7-product-truth.log
    Expected: Exit 0; product truth asserts four-field quick record, trust/privacy copy, and secondary Premium/PDF/checkout boundaries.
    Evidence: .omo/evidence/task-7-product-truth.log

  Scenario: forbidden claim sweep
    Tool:     bash
    Steps:    rg -n "marketplace|referral|roaster partnership|community social graph|print fulfillment|무제한" app components docs test | tee .omo/evidence/task-7-forbidden-claims.log
    Expected: Output contains only explicit future-bound guardrails or test rejection patterns; no user-facing current-capability claim.
    Evidence: .omo/evidence/task-7-forbidden-claims.log
  ```

  Commit: YES | Message: `docs(product): lock first value capture truth` | Files: [`docs/golden-flows.md`, `docs/api-spec.md`, `docs/deploy.md`, `test/product-copy.test.mjs`, `test/smoke.test.mjs`]

- [ ] 8. Mobile/desktop QA and consumer score

  What to do: Add a focused Playwright first-value QA spec or script that drives the real rendered app through landing -> `/capture` -> save/auth gate -> Taste Finder preset -> dashboard first-save reward using mocked APIs. Capture mobile and desktop screenshots plus an action log and score JSON. Score rubric must be explicit and agent-executable: route directness, field friction, trust clarity, reward usefulness, mobile fit/CJK wrapping, and free/Premium clarity. Overall score must be >= 8.5.
  Must NOT do: Do not rely on a green test suite alone; do not use screenshots older than the final source edit; do not include raw photo data in evidence.

  Parallelization: Can parallel: NO | Wave 3 | Blocks: [] | Blocked by: [2, 3, 4, 5, 6, 7]

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `playwright.config.ts:1` - project uses Playwright with `baseURL` and `next start` webServer.
  - Pattern:  `package.json:9` - `test:e2e` runs `playwright test`; `validate:full` builds then runs e2e.
  - Pattern:  `test/product-copy.test.ts:246` - existing screenshot evidence helper writes `.omo/evidence`.
  - Pattern:  `.agent/audit-consumer-2026-07-02/landing-mobile.png` - prior consumer audit evidence shows current long landing/secondary emphasis.
  - Pattern:  `.agent/audit-consumer-2026-07-02/capture-mobile-manual.png` - prior consumer audit evidence shows current overloaded capture default.
  - External: `https://github.com/microsoft/playwright/blob/main/docs/src/emulation.md` - viewport and screenshot APIs.
  - External: `https://github.com/microsoft/playwright/blob/main/docs/src/release-notes-js.md` - `--grep` command filtering.

  Acceptance criteria (agent-executable only):
  - [ ] `npm run build && npx playwright test test/first-value-flow.test.ts --reporter=line` exits 0.
  - [ ] `.omo/evidence/task-8-consumer-score.json` exists and contains `"overall": 8.5` or higher.
  - [ ] Evidence exists at `.omo/evidence/task-8-landing-mobile.png`, `.omo/evidence/task-8-capture-mobile.png`, `.omo/evidence/task-8-dashboard-reward-mobile.png`, `.omo/evidence/task-8-landing-desktop.png`, `.omo/evidence/task-8-capture-desktop.png`, and `.omo/evidence/task-8-dashboard-reward-desktop.png`.
  - [ ] `npm run validate:full` exits 0 after the focused QA passes.

  QA scenarios (MANDATORY - task incomplete without these):
  ```
  Scenario: first-value mobile QA score
    Tool:     playwright(real Chrome)
    Steps:    npm run build && npx playwright test test/first-value-flow.test.ts --grep "mobile first value" --reporter=line
    Expected: At 375x812, landing primary CTA goes to `/capture`; capture default shows only four fields; save redirects to auth only at save; score JSON mobile section is >= 8.5.
    Evidence: .omo/evidence/task-8-capture-mobile.png

  Scenario: first-value desktop QA score
    Tool:     playwright(real Chrome)
    Steps:    npx playwright test test/first-value-flow.test.ts --grep "desktop first value" --reporter=line
    Expected: At 1280x900, landing centered CTA, capture four-field form, Taste Finder preset, and dashboard first-save reward are visible without overlap; score JSON desktop section is >= 8.5.
    Evidence: .omo/evidence/task-8-dashboard-reward-desktop.png
  ```

  Commit: YES | Message: `test(first-value): score capture flow across viewports` | Files: [`test/first-value-flow.test.ts`, optional `test/support/first-value-fixtures.ts`]

## Final verification wave (MANDATORY - after all implementation tasks)
> Runs in PARALLEL. ALL must APPROVE. Surface results to the caller and wait for an explicit "okay" before declaring complete.
- [ ] F1. Plan compliance audit - every task done, every acceptance criterion met
- [ ] F2. Code quality review - diagnostics clean, idioms match, no dead code
- [ ] F3. Real manual QA - every QA scenario executed with evidence captured
- [ ] F4. Scope fidelity - nothing extra shipped beyond Must-Have, nothing Must-NOT-Have introduced

## Commit strategy
- One logical change per commit. Conventional Commits (`<type>(<scope>): <subject>` body + footer).
- Atomic: every commit builds and passes tests on its own.
- No "WIP" / "fix typo squash later" commits on the final branch - clean up before merge.
- Reference the plan file path in the final commit footer: `Plan: .omo/plans/coffeedex-first-value-flow-85.md`.

## Success criteria
- Landing mobile and desktop first viewport show the core promise, centered `/capture` CTA, and trust/free-vs-Premium copy.
- `/capture` default UI has only bean name, roaster, repurchase intent, and one-line note before optional details are opened.
- Taste Finder routes to `/capture` quick preset and does not force auth before save.
- First save produces a dashboard reward with rebuy clue, search keywords, and next action.
- Exact command succeeds: `npm run build && npx playwright test test/first-value-flow.test.ts --reporter=line`.
- Exact command succeeds: `npm run validate:full`.
- `.omo/evidence/task-8-consumer-score.json` reports overall consumer first-value score >= 8.5.
- All Must-Have shipped; all QA scenarios pass with captured evidence; F1-F4 approved; commit history clean.

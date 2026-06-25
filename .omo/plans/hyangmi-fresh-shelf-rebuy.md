# Hyangmi Fresh Shelf + Rebuy Timing Slice

## TL;DR
> Summary:      Build the first executable Fresh Shelf slice by turning existing `coffee_shelf_items`, linked tasting-card repurchase memory, and recent brewing logs into deterministic freshness/rebuy signals visible in the dashboard. Keep it conservative: no schema migration, no marketplace, no reminder jobs, no external rebuy links.
> Deliverables:
> - Deterministic Fresh Shelf signal engine with contract tests
> - Shelf API response contract carrying `wait`, `drink_now`, `finish_soon`, and `rebuy` action signals
> - Typed React Query shelf client and dashboard-visible Fresh Shelf UI copy
> - AI Barista and brewing-log consumers aligned to the same signals
> - Docs, smoke/copy contracts, CLI evidence, and real-browser evidence
> Effort:       Medium
> Risk:         Medium - the shelf UI exists but is currently not wired into the dashboard, and the shelf route has no dedicated contract coverage.

## Scope
### Must have
- Turn the product-direction synthesis recommendation into one first slice: private Korea-first coffee memory plus Fresh Shelf + Rebuy Timing. Source: `.omo/ultraresearch/20260619-115257/SYNTHESIS.md:7`, `.omo/ultraresearch/20260619-115257/SYNTHESIS.md:13`, `.omo/ultraresearch/20260619-115257/SYNTHESIS.md:46`.
- Derive signals from existing shelf data only: `roast_date`, `opened_date`, `fill_level`, `is_finished`, optional linked `tasting_cards.repurchase_intent`, and optional latest `brewing_logs.brewed_at`. Source: `supabase/migrations/20260617000000_create_coffee_shelf_and_logs.sql:5`, `supabase/migrations/20260617000000_create_coffee_shelf_and_logs.sql:49`, `docs/api-spec.md:79`.
- Use four user-facing states for the first slice:
  - `wait`: roast date is 0-4 days old, bag is not opened, and fill is above 25%.
  - `drink_now`: opened 0-14 days ago, or roast age is 5-28 days, and fill is above 25%.
  - `finish_soon`: fill is 1-25%, or opened at least 15 days ago, or roast age is at least 29 days.
  - `rebuy`: `is_finished` is true, fill is 0%, or fill is 1-25% with linked tasting-card `repurchase_intent === "again"`.
- Add a missing-data fallback that still returns one of the four states from fill/finished values and explains in Korean that dates improve accuracy.
- Make Fresh Shelf visible from `/dashboard` without removing the existing tasting-card archive/search flow. Current dashboard shelf tab renders `DashboardShelfView`, which renders tasting-card archive content only: `components/dashboard-client.tsx:173`, `components/dashboard-shelf-view.tsx:103`, `components/dashboard-cards-section.tsx:86`.
- Replace the current shelf component's Supabase-client gate and unchecked `any` usage with typed fetch/React Query state. Current problem points: `components/coffee-shelf-grid.tsx:126`, `components/coffee-shelf-grid.tsx:152`, `components/coffee-shelf-grid.tsx:153`.
- Keep Korean-first copy and warm premium coffee visual language. Source: `AGENTS.md:64`, `DESIGN.md:25`, `DESIGN.md:47`, `app/globals.css:246`.
- Add contract tests and browser tests that can run without hitting real Supabase, live Stripe, or external AI. Source: `AGENTS.md:83`, `test/AGENTS.md:20`, `test/AGENTS.md:22`.
- Keep docs truth synchronized with executable behavior. Source: `AGENTS.md:63`, `app/api/AGENTS.md:28`, `app/api/AGENTS.md:51`.

### Must NOT have (guardrails, anti-slop, scope boundaries)
- Must not add, rewrite, or weaken Supabase migrations for this slice; the implementation must be additive at API/UI/type level only. Source: `AGENTS.md:38`, `docs/PRD-Hyangmi-v2.md:64`.
- Must not touch Stripe checkout, Stripe webhooks, subscriptions, entitlement audit, account deletion, public sharing, or PDF/story export flows.
- Must not hit real Supabase, live Stripe, external OpenAI/Gemini, or production-like state from tests/QA. Source: `AGENTS.md:83`, `docs/deploy.md:59`.
- Must not add marketplace, community, referral, affiliate catalog, roaster partnership, roaster analytics, or public social graph claims. Source: `docs/api-spec.md:52`, `docs/golden-flows.md:53`, `docs/PRD-Hyangmi-v2.md:51`, `.omo/ultraresearch/20260619-115257/SYNTHESIS.md:27`.
- Must not create reminder scheduling, notifications, background jobs, email/push delivery, brew timers, subscriptions, or external rebuy links.
- Must not rename legacy PascalCase files or modify `components/ui/` for feature-specific styling. Source: `components/AGENTS.md:21`, `components/AGENTS.md:29`.
- Must not use `any`, `@ts-ignore`, `@ts-expect-error`, skipped tests, or source-only browser proof for user-visible behavior. Source: `AGENTS.md:61`, `test/AGENTS.md:39`.
- Must not edit `.agents/`, `.claude/`, external Orchestrator symlink surfaces, or unrelated untracked files.

Risks to manage:
- `CoffeeShelfGrid` exists but is unmounted, so product work must include dashboard wiring, not just component polish. Evidence: `rg` found only its own definition at `components/coffee-shelf-grid.tsx:107`.
- Shelf route responses are currently raw Supabase rows and no dedicated shelf route contract tests were found; add route tests before route changes.
- `playwright.config.ts` uses `next start`, so browser QA requires a successful build or an existing compatible server. Source: `playwright.config.ts:14`.
- Worktree was dirty during planning with untracked `.omo/`, `.agent/evidence/`, `.playwright-mcp/`, `artifacts/`, and `fix_*.py` files; executor must preserve unrelated changes.

## Verification strategy
> Zero human intervention - all verification is agent-executed.
- Test decision: TDD + Node `node:test` contract tests and Playwright browser tests.
- QA policy: every task has agent-executed scenarios; browser-facing behavior must be driven through a real browser surface.
- Evidence: `.omo/evidence/task-<N>-hyangmi-fresh-shelf-rebuy.<ext>`

## Execution strategy
### Parallel execution waves
> Target 5-8 tasks per wave. <3 per wave (except final) = under-splitting.
> Extract shared dependencies as Wave-1 tasks to maximize parallelism.

Wave 1 (no dependencies):
- Task 1: Define deterministic Fresh Shelf signal engine and tests
- Task 2: Lock the shelf API response contract and route tests
- Task 7: Prepare docs/product-truth contract expectations

Wave 2 (after Wave 1):
- Task 3: Implement shelf API signal decoration
- Task 4: Add typed Fresh Shelf client hook and mutation contract
- Task 6: Align AI Barista and brewing-log consumers to the signal contract

Wave 3 (after Wave 2):
- Task 5: Render dashboard Fresh Shelf UI with Korean action copy
- Task 8: Run real browser/CLI evidence and full validation

Critical path: Tasks 1 and 2 -> Task 3 -> Task 4 -> Task 5 -> Task 8

### Dependency matrix
| Task | Depends on | Blocks | Can parallelize with |
|------|------------|--------|----------------------|
| 1    | none       | 3, 4, 5, 6, 8 | 2, 7 |
| 2    | none       | 3, 8 | 1, 7 |
| 3    | 1, 2       | 4, 5, 6, 8 | none |
| 4    | 1, 3       | 5, 8 | 6, 7 |
| 5    | 1, 3, 4    | 8 | 7 |
| 6    | 1, 3       | 8 | 4, 7 |
| 7    | none       | 8 | 1, 2, 4, 5, 6 |
| 8    | 3, 4, 5, 6, 7 | final verification | none |

## Todos
> Implementation + Test = ONE task. Never separate.
> Every task MUST have: References + Acceptance Criteria + QA Scenarios + Commit.

- [ ] 1. Define deterministic Fresh Shelf signal engine

  What to do: Add `lib/fresh-shelf-signals.ts` with exported types and pure functions for `FreshShelfSignalState`, `FreshShelfSignal`, `FreshShelfSignalInput`, and `deriveFreshShelfSignal(input, options)`. Use an injectable `today` date so tests are deterministic. Encode the four-state thresholds listed in Scope. Include Korean labels/reasons/actions in the returned object, not in the UI only. Add `test/fresh-shelf-signals.test.mjs` using the transpile/import pattern from `test/coffee-memory-contract.test.mjs`.
  Must NOT do: Do not read env vars, call Supabase, import React, add a migration, add timers, add notifications, or infer flavor/quality from origin text.

  Parallelization: Can parallel: YES | Wave 1 | Blocks: [3, 4, 5, 6, 8] | Blocked by: []

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `lib/coffee-memory.ts:1` - pure Zod/domain contract module style.
  - Pattern:  `test/coffee-memory-contract.test.mjs:12` - transpile a TypeScript domain module into a temp ESM module for Node contract tests.
  - API/Type: `supabase/migrations/20260617000000_create_coffee_shelf_and_logs.sql:5` - current shelf item columns available without schema work.
  - API/Type: `supabase/migrations/20260617000000_create_coffee_shelf_and_logs.sql:49` - current brewing-log columns available for optional latest brew context.
  - API/Type: `lib/coffee-memory.ts:3` - existing `RepurchaseIntent` values.
  - External: `.omo/ultraresearch/20260619-115257/SYNTHESIS.md:46` - recommended Fresh Shelf states.

  Acceptance criteria (agent-executable only):
  - [ ] Run `node --test test/fresh-shelf-signals.test.mjs` and see all cases pass: wait, drink now, finish soon, rebuy from finished/0%, rebuy from low fill + `again`, missing-date fallback, future-date clamp, invalid date handling.
  - [ ] Run `npm run typecheck` and confirm no type errors from the new module.

  QA scenarios (MANDATORY - task incomplete without these):
  > Name the exact tool AND its exact invocation - not "verify it works". Browser use: use Chrome to drive the page; if Chrome is not available, download and use agent-browser (https://github.com/vercel-labs/agent-browser). Computer use: OS-level GUI automation for a non-browser desktop app.
  ```text
  Scenario: deterministic state matrix
    Tool:     bash
    Steps:    mkdir -p .omo/evidence && node --test test/fresh-shelf-signals.test.mjs > .omo/evidence/task-1-hyangmi-fresh-shelf-rebuy.txt 2>&1
    Expected: command exits 0 and output includes passing subtests for wait, drink_now, finish_soon, rebuy, and missing-date fallback
    Evidence: .omo/evidence/task-1-hyangmi-fresh-shelf-rebuy.txt

  Scenario: invalid/future dates do not crash or produce NaN
    Tool:     bash
    Steps:    node --test test/fresh-shelf-signals.test.mjs --test-name-pattern "invalid|future" > .omo/evidence/task-1-hyangmi-fresh-shelf-rebuy-error.txt 2>&1
    Expected: command exits 0 and assertions confirm a valid fallback signal with `daysSinceRoast`/`daysSinceOpen` as null or clamped non-negative numbers
    Evidence: .omo/evidence/task-1-hyangmi-fresh-shelf-rebuy-error.txt
  ```

  Commit: YES | Message: `feat(fresh-shelf): add deterministic freshness signals` | Files: [`lib/fresh-shelf-signals.ts`, `test/fresh-shelf-signals.test.mjs`]

- [ ] 2. Lock the shelf API response contract with failing-first route tests

  What to do: Add `test/shelf-route-contract.test.mjs` before route implementation changes. Use temp ESM transpilation and runtime mocks like `test/export-route.test.mjs`. Cover `GET /api/v1/shelf?include_finished=false`, `GET /api/v1/shelf?include_finished=true`, unauthenticated `401`, `POST` validation failure, owner filters, and the expected `freshness` object shape on shelf rows. Mock Supabase query chains; do not use real Supabase.
  Must NOT do: Do not weaken existing route envelopes, do not remove application-level owner filters, and do not use source-only assertions for route behavior.

  Parallelization: Can parallel: YES | Wave 1 | Blocks: [3, 8] | Blocked by: []

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `test/export-route.test.mjs:22` - temp runtime mocks for NextResponse and Supabase.
  - Pattern:  `test/export-route.test.mjs:186` - owner-scoped route contract assertion pattern.
  - Pattern:  `app/api/AGENTS.md:37` - protected route auth convention.
  - Pattern:  `app/api/AGENTS.md:40` - `{ data: ... }` success envelope and structured error convention.
  - API/Type: `app/api/v1/shelf/route.ts:17` - current GET route.
  - API/Type: `app/api/v1/shelf/route.ts:61` - current POST route.
  - API/Type: `app/api/v1/shelf/[id]/route.ts:18` - current PATCH route.
  - API/Type: `app/api/v1/shelf/[id]/route.ts:100` - current DELETE route.
  - Test:     `test/AGENTS.md:20` - Node contract tests use `*.test.mjs`.

  Acceptance criteria (agent-executable only):
  - [ ] Before route implementation, run `node --test test/shelf-route-contract.test.mjs` and capture a RED failure proving `freshness` is absent.
  - [ ] After route implementation in Task 3, rerun the same command and confirm it exits 0.

  QA scenarios (MANDATORY - task incomplete without these):
  ```text
  Scenario: route contract RED proof
    Tool:     bash
    Steps:    mkdir -p .omo/evidence && node --test test/shelf-route-contract.test.mjs > .omo/evidence/task-2-hyangmi-fresh-shelf-rebuy-red.txt 2>&1; test $? -ne 0
    Expected: command sequence exits 0 because the test command failed before implementation, and the log shows missing `freshness` contract
    Evidence: .omo/evidence/task-2-hyangmi-fresh-shelf-rebuy-red.txt

  Scenario: auth and validation edge contracts
    Tool:     bash
    Steps:    node --test test/shelf-route-contract.test.mjs --test-name-pattern "unauthenticated|validation|owner" > .omo/evidence/task-2-hyangmi-fresh-shelf-rebuy-error.txt 2>&1
    Expected: after Task 3, command exits 0 and asserts 401 before data access, 400 for invalid POST, and `.eq("user_id", user.id)` is preserved
    Evidence: .omo/evidence/task-2-hyangmi-fresh-shelf-rebuy-error.txt
  ```

  Commit: YES | Message: `test(shelf): lock freshness response contract` | Files: [`test/shelf-route-contract.test.mjs`]

- [ ] 3. Decorate shelf API rows with freshness/rebuy signals

  What to do: Update `app/api/v1/shelf/route.ts` to import the Task 1 helper and return decorated rows from `GET`, `POST`, and any row-returning mutations. For `GET`, preserve the existing owner filter and `include_finished` behavior, then fetch latest `brewing_logs` for returned shelf ids and pass `lastBrewedAt` into the signal helper. If the Supabase mock or runtime cannot support `.in(...)`, use the simplest production-safe query the existing Supabase client supports and cover it in tests. Update `app/api/v1/shelf/[id]/route.ts` so `PATCH` returns the same decorated shape and replace `Record<string, any>` with a typed update object. Keep Korean error messages stable.
  Must NOT do: Do not add columns, weaken RLS/owner filters, change DELETE response shape, expose service-role credentials, or return raw unknown errors to clients beyond the established `details` pattern already present.

  Parallelization: Can parallel: NO | Wave 2 | Blocks: [4, 5, 6, 8] | Blocked by: [1, 2]

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `app/api/v1/cards/route.ts:57` - route-level normalization helper before returning data.
  - Pattern:  `app/api/v1/cards/route.ts:72` - protected GET route shape.
  - Pattern:  `app/api/v1/brewing-logs/route.ts:40` - brewing logs query owner filter and shelf join.
  - API/Type: `app/api/v1/shelf/route.ts:34` - current owner-scoped shelf query.
  - API/Type: `app/api/v1/shelf/route.ts:39` - current `include_finished=false` filter.
  - API/Type: `app/api/v1/shelf/route.ts:87` - current shelf insert mapping.
  - API/Type: `app/api/v1/shelf/[id]/route.ts:48` - current typed-update gap using `any`.
  - Test:     `test/shelf-route-contract.test.mjs` - contract added by Task 2.

  Acceptance criteria (agent-executable only):
  - [ ] `node --test test/shelf-route-contract.test.mjs` exits 0.
  - [ ] `rg -n "Record<string, any>|useState<any>|\\bany\\b" app/api/v1/shelf components/coffee-shelf-grid.tsx hooks/useFreshShelf.ts lib/fresh-shelf-signals.ts` returns no matches after Task 4/5 cleanup.
  - [ ] `npm run typecheck` exits 0.

  QA scenarios (MANDATORY - task incomplete without these):
  ```text
  Scenario: GET shelf returns decorated active rows
    Tool:     bash
    Steps:    mkdir -p .omo/evidence && node --test test/shelf-route-contract.test.mjs --test-name-pattern "active shelf rows" > .omo/evidence/task-3-hyangmi-fresh-shelf-rebuy.txt 2>&1
    Expected: command exits 0 and assertions confirm each returned row has `freshness.state`, `labelKo`, `reasonKo`, `actionLabelKo`, and owner-filtered Supabase calls
    Evidence: .omo/evidence/task-3-hyangmi-fresh-shelf-rebuy.txt

  Scenario: unauthenticated request never queries shelf data
    Tool:     bash
    Steps:    node --test test/shelf-route-contract.test.mjs --test-name-pattern "unauthenticated" > .omo/evidence/task-3-hyangmi-fresh-shelf-rebuy-error.txt 2>&1
    Expected: command exits 0, response status is 401, and Supabase table calls are empty
    Evidence: .omo/evidence/task-3-hyangmi-fresh-shelf-rebuy-error.txt
  ```

  Commit: YES | Message: `feat(shelf): return freshness action signals` | Files: [`app/api/v1/shelf/route.ts`, `app/api/v1/shelf/[id]/route.ts`, `test/shelf-route-contract.test.mjs`]

- [ ] 4. Add typed Fresh Shelf client state and mutations

  What to do: Add `hooks/useFreshShelf.ts` with React Query queries/mutations for active shelf, archived shelf, create, update fill level, archive/reactivate, and delete. Reuse the response-reading patterns from `hooks/useTastingCards.ts`; keep server state in React Query, not local duplicated fetches. Export `FreshShelfItemData` from the domain or hook layer with `freshness` included. Add `test/fresh-shelf-client-contract.test.mjs` to assert endpoint paths, query keys, mutation invalidation, and no unchecked `any` in the new hook.
  Must NOT do: Do not initialize a Supabase browser client in the component for API fetch gating, do not duplicate tasting-card fetches unless required for the create dialog, and do not add Zustand for server state.

  Parallelization: Can parallel: YES | Wave 2 | Blocks: [5, 8] | Blocked by: [1, 3]

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `hooks/useTastingCards.ts:10` - resilient JSON response reader.
  - Pattern:  `hooks/useTastingCards.ts:27` - `{ data: ... }` extraction.
  - Pattern:  `hooks/useTastingCards.ts:124` - React Query query style.
  - Pattern:  `hooks/useTastingCards.ts:159` - mutation style and query invalidation.
  - Convention: `components/AGENTS.md:23` - React Query owns server state.
  - API/Type: `app/api/v1/shelf/route.ts:17` - active/archived list endpoint.
  - API/Type: `components/coffee-shelf-grid.tsx:136` - current direct fetch logic to replace.
  - Test:     `test/cards-create-contract.test.mjs:38` - static client contract test style when runtime hook execution is unnecessary.

  Acceptance criteria (agent-executable only):
  - [ ] `node --test test/fresh-shelf-client-contract.test.mjs` exits 0.
  - [ ] `npm run typecheck` exits 0.
  - [ ] `rg -n "createStarterBrowserClient|useState<any>|\\bany\\b" components/coffee-shelf-grid.tsx hooks/useFreshShelf.ts` returns no matches after Task 5.

  QA scenarios (MANDATORY - task incomplete without these):
  ```text
  Scenario: hook contract uses API routes and invalidates shelf queries
    Tool:     bash
    Steps:    mkdir -p .omo/evidence && node --test test/fresh-shelf-client-contract.test.mjs > .omo/evidence/task-4-hyangmi-fresh-shelf-rebuy.txt 2>&1
    Expected: command exits 0 and assertions confirm `/api/v1/shelf?include_finished=false`, `/api/v1/shelf?include_finished=true`, `/api/v1/shelf/:id`, and shelf query invalidation are present
    Evidence: .omo/evidence/task-4-hyangmi-fresh-shelf-rebuy.txt

  Scenario: no direct Supabase client gate remains in shelf UI path
    Tool:     bash
    Steps:    rg -n "createStarterBrowserClient|useState<any>|\\bany\\b" components/coffee-shelf-grid.tsx hooks/useFreshShelf.ts > .omo/evidence/task-4-hyangmi-fresh-shelf-rebuy-error.txt 2>&1; test $? -ne 0
    Expected: command sequence exits 0 because no matches are found
    Evidence: .omo/evidence/task-4-hyangmi-fresh-shelf-rebuy-error.txt
  ```

  Commit: YES | Message: `feat(shelf): add typed fresh shelf client state` | Files: [`hooks/useFreshShelf.ts`, `test/fresh-shelf-client-contract.test.mjs`, `components/coffee-shelf-grid.tsx`]

- [ ] 5. Render dashboard Fresh Shelf UI with Korean action copy

  What to do: Rework `components/coffee-shelf-grid.tsx` to consume `useFreshShelf`, render the `freshness` badge/reason/action for each shelf item, keep create/fill/archive/delete workflows, and preserve loading, empty, error, archived, and mobile states. Wire the component into `/dashboard` so users see Fresh Shelf above or beside the existing tasting-card archive without removing search/filter retrieval. Update `components/dashboard-shelf-view.tsx` and `components/dashboard-client.tsx` as needed. Keep UI dense and app-like, not a landing hero.
  Must NOT do: Do not replace the tasting-card archive, do not hide repurchase search filters, do not nest card containers unnecessarily, do not use generic purple/blue gradients, and do not add visible instructional copy about implementation.

  Parallelization: Can parallel: NO | Wave 3 | Blocks: [8] | Blocked by: [1, 3, 4]

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `components/dashboard-client.tsx:173` - current shelf tab composition.
  - Pattern:  `components/dashboard-shelf-view.tsx:103` - current archive layout composition.
  - Pattern:  `components/dashboard-cards-section.tsx:64` - loading/error/empty branch structure.
  - Pattern:  `components/TastingCard.tsx:19` - Korean repurchase label mapping.
  - Pattern:  `components/dashboard-empty-state.tsx:19` - Korean first-shelf empty-state tone.
  - Pattern:  `app/globals.css:246` - existing mobile-first shelf grid classes.
  - Pattern:  `DESIGN.md:26` - Pocket Shelf layout direction.
  - API/Type: `components/coffee-shelf-grid.tsx:88` - current shelf item fields.
  - API/Type: `components/coffee-shelf-grid.tsx:217` - current fill-level update action.
  - API/Type: `components/coffee-shelf-grid.tsx:233` - current archive/reactivate action.
  - API/Type: `components/coffee-shelf-grid.tsx:255` - current delete action.
  - Test:     `test/product-copy.test.ts:147` - dashboard browser copy test pattern with mocked `/api/v1/**`.
  - External: `.omo/ultraresearch/20260619-115257/SYNTHESIS.md:60` - near-term Korean positioning line.

  Acceptance criteria (agent-executable only):
  - [ ] Add/update `test/fresh-shelf-dashboard.test.ts`; `npx playwright test test/fresh-shelf-dashboard.test.ts --browser=chromium` exits 0.
  - [ ] The browser test asserts all four visible labels/actions: `조금 기다려요`, `지금 마시기`, `마무리 권장`, `재구매 메모`.
  - [ ] The browser test asserts existing archive/search copy still appears: `내 커피 다시 찾기` and `다시 살래요`.
  - [ ] `npm run typecheck` exits 0.

  QA scenarios (MANDATORY - task incomplete without these):
  ```text
  Scenario: dashboard displays Fresh Shelf signals and preserves archive retrieval
    Tool:     playwright(real Chrome)
    Steps:    mkdir -p .omo/evidence && npx playwright test test/fresh-shelf-dashboard.test.ts --browser=chromium --grep "Fresh Shelf signals" > .omo/evidence/task-5-hyangmi-fresh-shelf-rebuy.txt 2>&1
    Expected: command exits 0; test captures `.omo/evidence/task-5-hyangmi-fresh-shelf-rebuy.png`; page shows all four signal labels and `내 커피 다시 찾기`
    Evidence: .omo/evidence/task-5-hyangmi-fresh-shelf-rebuy.txt

  Scenario: shelf API failure renders Korean error without breaking archive
    Tool:     playwright(real Chrome)
    Steps:    npx playwright test test/fresh-shelf-dashboard.test.ts --browser=chromium --grep "shelf API failure" > .omo/evidence/task-5-hyangmi-fresh-shelf-rebuy-error.txt 2>&1
    Expected: command exits 0; mocked `/api/v1/shelf` returns 500; page shows `원두 보관함 정보를 불러오지 못했습니다` or equivalent stable Korean error and archive search remains visible
    Evidence: .omo/evidence/task-5-hyangmi-fresh-shelf-rebuy-error.txt
  ```

  Commit: YES | Message: `feat(dashboard): surface fresh shelf actions` | Files: [`components/coffee-shelf-grid.tsx`, `components/dashboard-shelf-view.tsx`, `components/dashboard-client.tsx`, `test/fresh-shelf-dashboard.test.ts`]

- [ ] 6. Align AI Barista and brewing-log consumers to Fresh Shelf signals

  What to do: Update `app/api/v1/ai-barista/route.ts` to use the same signal helper when ordering/recommending active beans and to include freshness/rebuy context in local fallback text and provider prompt. Update `components/ai-barista-panel.tsx` and `components/daily-brewing-calendar.tsx` only as needed to display or preserve signal-aware active shelf names without introducing new UI scope. Add `test/ai-barista-fresh-shelf-contract.test.mjs` with mocked Supabase and no external AI key to assert local fallback prioritizes `finish_soon`/`rebuy` candidates over arbitrary first-created rows.
  Must NOT do: Do not make external AI calls in tests, do not add new prompt claims about marketplace/community/roaster partnerships, and do not turn the brewing calendar into a brew timer.

  Parallelization: Can parallel: YES | Wave 2 | Blocks: [8] | Blocked by: [1, 3]

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `app/api/v1/ai-barista/route.ts:21` - local fallback generator to make deterministic.
  - Pattern:  `app/api/v1/ai-barista/route.ts:79` - active shelf query.
  - Pattern:  `app/api/v1/ai-barista/route.ts:124` - no-AI-key fallback path.
  - Pattern:  `app/api/v1/ai-barista/route.ts:140` - provider prompt shelf context.
  - Pattern:  `components/ai-barista-panel.tsx:44` - client active shelf fetch.
  - Pattern:  `components/daily-brewing-calendar.tsx:60` - calendar fetches shelf plus logs.
  - API/Type: `app/api/v1/brewing-logs/route.ts:40` - existing joined log query.
  - Test:     `test/export-route.test.mjs:22` - route mock harness pattern.
  - Guardrail: `docs/golden-flows.md:53` - future roaster/community boundary.

  Acceptance criteria (agent-executable only):
  - [ ] `node --test test/ai-barista-fresh-shelf-contract.test.mjs` exits 0.
  - [ ] The test proves local fallback does not call fetch when `AI_API_KEY` is absent and chooses a finish-soon/rebuy candidate.
  - [ ] `npm run typecheck` exits 0.

  QA scenarios (MANDATORY - task incomplete without these):
  ```text
  Scenario: local AI Barista fallback prioritizes Fresh Shelf actions
    Tool:     bash
    Steps:    mkdir -p .omo/evidence && node --test test/ai-barista-fresh-shelf-contract.test.mjs > .omo/evidence/task-6-hyangmi-fresh-shelf-rebuy.txt 2>&1
    Expected: command exits 0 and assertions confirm the recommendation mentions the finish-soon/rebuy bean, not the arbitrary newest safe bean
    Evidence: .omo/evidence/task-6-hyangmi-fresh-shelf-rebuy.txt

  Scenario: no external AI request happens without key
    Tool:     bash
    Steps:    node --test test/ai-barista-fresh-shelf-contract.test.mjs --test-name-pattern "no external AI" > .omo/evidence/task-6-hyangmi-fresh-shelf-rebuy-error.txt 2>&1
    Expected: command exits 0 and the mock global fetch for OpenAI/Gemini remains uncalled
    Evidence: .omo/evidence/task-6-hyangmi-fresh-shelf-rebuy-error.txt
  ```

  Commit: YES | Message: `feat(ai-barista): use fresh shelf timing context` | Files: [`app/api/v1/ai-barista/route.ts`, `components/ai-barista-panel.tsx`, `components/daily-brewing-calendar.tsx`, `test/ai-barista-fresh-shelf-contract.test.mjs`]

- [ ] 7. Synchronize docs and product-truth contracts

  What to do: Update `docs/api-spec.md` with `GET/POST/PATCH /api/v1/shelf` response contracts and the four signal states. Update `docs/golden-flows.md` with a new current flow for Fresh Shelf + Rebuy Timing, preserving existing flows and future boundaries. Update `docs/deploy.md` only if verification commands or deploy truth need the new shelf contract mentioned. Update `test/product-copy.test.mjs` and `test/smoke.test.mjs` so docs/copy truth protects Fresh Shelf without allowing marketplace/community/roaster partnership claims.
  Must NOT do: Do not claim reminders, push/email notifications, rebuy links, partner inventory, marketplace, public community, or distributed production scheduling.

  Parallelization: Can parallel: YES | Wave 1 | Blocks: [8] | Blocked by: []

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `docs/api-spec.md:17` - endpoint table to extend.
  - Pattern:  `docs/api-spec.md:54` - data contract section style.
  - Pattern:  `docs/golden-flows.md:5` - golden flow wording style.
  - Pattern:  `docs/golden-flows.md:55` - smoke verification command block.
  - Pattern:  `docs/deploy.md:61` - deploy verification section.
  - Pattern:  `test/product-copy.test.mjs:67` - docs boundary assertions.
  - Pattern:  `test/smoke.test.mjs:52` - docs/golden-flow smoke assertions.
  - Guardrail: `docs/api-spec.md:52` - future roaster/community boundary.
  - Guardrail: `.omo/ultraresearch/20260619-115257/SYNTHESIS.md:27` - what not to lead with.

  Acceptance criteria (agent-executable only):
  - [ ] `node --test test/product-copy.test.mjs test/smoke.test.mjs` exits 0.
  - [ ] `rg -n "marketplace|community|roaster partnership|referral|affiliate|push|email reminder|external rebuy|partner inventory" docs app components test` shows no new current-capability claims; allowed matches must be future-boundary guardrails only.
  - [ ] Docs contain the exact four API state ids: `wait`, `drink_now`, `finish_soon`, `rebuy`.

  QA scenarios (MANDATORY - task incomplete without these):
  ```text
  Scenario: docs and smoke protect Fresh Shelf truth
    Tool:     bash
    Steps:    mkdir -p .omo/evidence && node --test test/product-copy.test.mjs test/smoke.test.mjs > .omo/evidence/task-7-hyangmi-fresh-shelf-rebuy.txt 2>&1
    Expected: command exits 0 and output includes CoffeeDex docs/smoke tests passing
    Evidence: .omo/evidence/task-7-hyangmi-fresh-shelf-rebuy.txt

  Scenario: forbidden future-current claims are absent
    Tool:     bash
    Steps:    rg -n "live marketplace|public social graph|roaster analytics|partner inventory|external rebuy link|push reminder|email reminder" docs app components test > .omo/evidence/task-7-hyangmi-fresh-shelf-rebuy-error.txt 2>&1; test $? -ne 0
    Expected: command sequence exits 0 because no forbidden current-capability claims are found
    Evidence: .omo/evidence/task-7-hyangmi-fresh-shelf-rebuy-error.txt
  ```

  Commit: YES | Message: `docs(product): document fresh shelf timing slice` | Files: [`docs/api-spec.md`, `docs/golden-flows.md`, `docs/deploy.md`, `test/product-copy.test.mjs`, `test/smoke.test.mjs`]

- [ ] 8. Capture full CLI and real-browser evidence

  What to do: Run the complete slice verification after Tasks 1-7 land. Ensure every task evidence file exists. Capture real-browser screenshots from `test/fresh-shelf-dashboard.test.ts` at mobile 390px and desktop 1280px. Run full static and build validation with the bundled/runtime-compatible Node path if system Node fails, per `docs/deploy.md`.
  Must NOT do: Do not mark complete from unit tests alone, do not leave dev servers or tmux sessions running, and do not commit generated screenshots/traces unless the plan explicitly lists `.omo/evidence/` evidence as local runtime artifacts only.

  Parallelization: Can parallel: NO | Wave 3 | Blocks: [final verification] | Blocked by: [3, 4, 5, 6, 7]

  References (executor has NO interview context - be exhaustive):
  - Command: `package.json:10` - `npm run typecheck`.
  - Command: `package.json:11` - `npm run test:smoke`.
  - Command: `package.json:12` - `npm run test:e2e`.
  - Command: `package.json:13` - `npm run validate:full`.
  - Config:  `playwright.config.ts:14` - Playwright starts Next with `next start`.
  - Docs:    `docs/deploy.md:69` - bundled Node verification note.
  - Test:    `test/product-copy.test.ts:113` - screenshot evidence pattern.
  - Test:    `test/dashboard-retrieval.test.ts:86` - multi-viewport dashboard browser pattern.

  Acceptance criteria (agent-executable only):
  - [ ] `node --test test/fresh-shelf-signals.test.mjs test/shelf-route-contract.test.mjs test/fresh-shelf-client-contract.test.mjs test/ai-barista-fresh-shelf-contract.test.mjs test/product-copy.test.mjs test/smoke.test.mjs` exits 0.
  - [ ] `npm run typecheck` exits 0.
  - [ ] `npm run build` exits 0.
  - [ ] `npx playwright test test/fresh-shelf-dashboard.test.ts --browser=chromium` exits 0 and writes mobile/desktop screenshots.
  - [ ] Every `.omo/evidence/task-<N>-hyangmi-fresh-shelf-rebuy*` path referenced in Tasks 1-8 exists.

  QA scenarios (MANDATORY - task incomplete without these):
  ```text
  Scenario: full CLI contract and build verification
    Tool:     bash
    Steps:    mkdir -p .omo/evidence && node --test test/fresh-shelf-signals.test.mjs test/shelf-route-contract.test.mjs test/fresh-shelf-client-contract.test.mjs test/ai-barista-fresh-shelf-contract.test.mjs test/product-copy.test.mjs test/smoke.test.mjs > .omo/evidence/task-8-hyangmi-fresh-shelf-rebuy-cli.txt 2>&1 && npm run typecheck >> .omo/evidence/task-8-hyangmi-fresh-shelf-rebuy-cli.txt 2>&1 && npm run build >> .omo/evidence/task-8-hyangmi-fresh-shelf-rebuy-cli.txt 2>&1
    Expected: command exits 0; evidence contains passing Node tests, typecheck, and production build
    Evidence: .omo/evidence/task-8-hyangmi-fresh-shelf-rebuy-cli.txt

  Scenario: real browser Fresh Shelf proof
    Tool:     playwright(real Chrome)
    Steps:    npx playwright test test/fresh-shelf-dashboard.test.ts --browser=chromium > .omo/evidence/task-8-hyangmi-fresh-shelf-rebuy-browser.txt 2>&1
    Expected: command exits 0; screenshots exist at `.omo/evidence/task-8-hyangmi-fresh-shelf-rebuy-mobile.png` and `.omo/evidence/task-8-hyangmi-fresh-shelf-rebuy-desktop.png`
    Evidence: .omo/evidence/task-8-hyangmi-fresh-shelf-rebuy-browser.txt
  ```

  Commit: YES | Message: `test(fresh-shelf): prove dashboard freshness slice` | Files: [`test/fresh-shelf-dashboard.test.ts`, `.omo/plans/hyangmi-fresh-shelf-rebuy.md`]

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
- Reference the plan file path in the final commit footer: `Plan: .omo/plans/hyangmi-fresh-shelf-rebuy.md`.

## Success criteria
- All Must-Have shipped; all QA scenarios pass with captured evidence; F1-F4 approved; commit history clean.

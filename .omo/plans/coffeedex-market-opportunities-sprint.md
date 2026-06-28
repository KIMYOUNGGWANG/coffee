# coffeedex-market-opportunities-sprint - Work Plan

## TL;DR (For humans)

**What you'll get:** CoffeeDex will get a faster "quick memory" capture path for saving a cup without filling the full wizard, plus approachable Korean flavor prompts and a private rebuy/recipe memory view for coffees the user wants again.

**Why this approach:** The market brief identified logging friction as the top user pain, and the current product already has the storage/API shape for private cards, repurchase intent, flavor tags, and brewing notes. This ships the smallest useful slice without widening into marketplace or community promises.

**What it will NOT do:** It will not add marketplace, referral, roaster partnership, community feed, public taste matching, external integrations, auth changes, RLS changes, or DB migrations.

**Effort:** Medium
**Risk:** Medium - the main risk is changing an already complex wizard while preserving guest scan, checkout, and existing card creation behavior.
**Decisions I made for you:** Ship Quick Add first; reuse existing `tasting_cards` fields; keep recipe/rebuy recall private; defer all discovery/marketplace/social features; preserve the dirty worktree and avoid unrelated mobile work.

Your next move: execution has already been requested through start-work bootstrap. Full execution detail follows below.

---

> TL;DR (machine): Medium-risk HEAVY sprint: add Quick Add Memory Mode, Korean flavor guidance, private rebuy/recipe recall, and contract/browser proof without DB or external integrations.

## Scope

### Must have

- A one-screen Quick Add Memory Mode reachable from existing dashboard card creation entry points.
- Quick Add must create a confirmed private coffee card through the existing `POST /api/v1/cards` contract.
- Quick Add fields: bean name, roaster, one-line note, would-buy-again choice, optional Korean flavor chips, and optional brew summary using existing payload fields.
- Korean flavor helper must use approachable Korean sensory groups and must not require expert SCA vocabulary.
- Saved cards marked "again" must surface a private rebuy/last-good-brew memory affordance using existing card/footer/brewing-note data.
- Docs/tests must stay aligned with current product truth: private recall and repurchase first, public/community/marketplace deferred.
- Evidence must be recorded under `.omo/evidence/coffeedex-market-opportunities-sprint/` and ledger entries under `.omo/start-work/ledger.jsonl`.

### Must NOT have (guardrails, anti-slop, scope boundaries)

- No DB migrations, no RLS/auth/session changes, no Stripe/Supabase live calls, no AI provider calls in tests, no external roaster integrations.
- No marketplace, referral, roaster partnership, public community, public taste-match, social graph, deals, drops, or subscription discovery claims.
- No mobile app implementation in this sprint.
- No reverts of unrelated dirty files. Workers must read dirty in-scope files before editing and preserve unrelated changes.
- No test weakening, skipped tests, `as any`, `@ts-ignore`, or broad refactors.

## Verification strategy

> Zero human intervention - all verification is agent-executed.
- Test decision: TDD. Each implementation todo must capture a failing-first proof before production edits, then make it green.
- Automated proof commands:
  - `npm run typecheck`
  - `npm run test:smoke`
  - `npx playwright test test/dashboard-growth.test.ts test/wizard-errors.test.ts`
  - Targeted Node tests when route contracts are touched: `node --test test/memory-crud-contract.test.mjs test/product-copy.test.mjs`
- Manual QA surface: browser-facing work must use Playwright/Chromium against a real Next server on a non-conflicting port. Use mocked `/api/v1/**` routes, not live services.
- Primary artifact directory: `.omo/evidence/coffeedex-market-opportunities-sprint/`.
- Cleanup: every server PID, temp script, screenshot, browser context, and occupied port check must have a cleanup receipt.

## Execution strategy

### Parallel execution waves

- Wave 1: Todo 1 only. Establish failing-first tests and contracts before production code.
- Wave 2: Todos 2 and 3 may run in parallel only if they use disjoint sections of the wizard or shared helper files are assigned to one worker. Otherwise serialize Todo 2 then Todo 3.
- Wave 3: Todo 4 after card payload/display semantics from Todos 2-3 are known.
- Wave 4: Todo 5 after all user-visible behavior is implemented.
- Final wave: F1-F4 review/QA lanes in parallel after every todo is complete.

### Dependency matrix

| Todo | Depends on | Blocks | Can parallelize with |
| --- | --- | --- | --- |
| 1 | none | 2, 3, 4, 5 | none |
| 2 | 1 | 4, 5 | 3 only if write sets do not overlap |
| 3 | 1 | 4, 5 | 2 only if write sets do not overlap |
| 4 | 2, 3 | 5 | none |
| 5 | 2, 3, 4 | final wave | none |

## Todos

- [x] 1. Add failing-first contracts for Quick Add, Korean flavor guidance, and private rebuy recall
  What to do / Must NOT do: Add or update tests that fail on the current product because there is no one-screen Quick Add mode, no explicit Korean flavor helper in that mode, and no compact rebuy/last-good-brew recall affordance. Do not implement production behavior in this todo.
  Parallelization: Wave 1 | Blocked by: none | Blocks: 2, 3, 4, 5
  References (executor has NO interview context - be exhaustive): `docs/market-opportunities-2026-06-26.md`; `docs/golden-flows.md`; `docs/api-spec.md`; `components/CardCreatorWizard.tsx`; `components/dashboard-client.tsx`; `components/TastingCard.tsx`; `components/CardDetailModal.tsx`; `hooks/useTastingCards.ts`; `test/dashboard-growth.test.ts`; `test/wizard-errors.test.ts`; `test/product-copy.test.mjs`; `test/memory-crud-contract.test.mjs`; `test/AGENTS.md`.
  Acceptance criteria (agent-executable): A new Node contract test fails before production changes with missing `빠른 기록`, `한국어 향미`, `confirmed: true`, `repurchaseIntent: "again"`, and one-line reason wiring; a targeted Playwright test is added for the later browser surface but must not be counted as RED proof if local port 3000 is already hung. Feature failures are captured in `.omo/evidence/coffeedex-market-opportunities-sprint/task-1-red.txt`.
  QA scenarios (name the exact tool + invocation): Auxiliary RED proof: `node --test test/quick-add-contract.test.mjs` must exit 1 before production code with assertion failure against `components/CardCreatorWizard.tsx`; rerun `node --test test/quick-add-contract.test.mjs` once and confirm the same missing-feature signature. Optional browser preflight: `npx playwright test test/dashboard-growth.test.ts test/wizard-errors.test.ts --grep "quick add|빠른 기록"` may be captured, but a `page.goto` timeout caused by port 3000 is recorded as environment contamination, not feature evidence. Binary observable: Node command exits 1 for missing Quick Add/flavor/rebuy strings. Evidence: `.omo/evidence/coffeedex-market-opportunities-sprint/task-1-red.txt`.
  Adversarial classes: dirty_worktree applies, record `git status --short` before edits; misleading_success_output applies, capture full failing Node command and exit code; flaky_tests applies, rerun the failing Node command once to confirm the same failure signature; hung_or_long_commands applies if Playwright preflight hits port 3000 timeout and must be labeled non-proof; stale_state not applicable because no generated artifacts are used yet.
  Cleanup: remove no files; record no live process in `.omo/evidence/coffeedex-market-opportunities-sprint/task-1-cleanup.txt`.
  Commit: Y | `test(quick-add): capture market-opportunity memory contracts`

- [x] 2. Implement Quick Add Memory Mode in the existing dashboard wizard path
  What to do / Must NOT do: Add a Quick Add mode to the existing card creation path, preferably inside `CardCreatorWizard` or a small child component owned by it. Reuse existing `useCreateTastingCard`, `useTastingStore`, analytics, and modal lifecycle. Quick Add must not bypass auth handling, not create a new route, and not remove scan/manual full wizard behavior.
  Parallelization: Wave 2 | Blocked by: 1 | Blocks: 4, 5
  References (executor has NO interview context - be exhaustive): `components/CardCreatorWizard.tsx`; `stores/tastingStore.ts`; `hooks/useTastingCards.ts`; `components/dashboard-client.tsx`; `components/dashboard-empty-state.tsx`; `components/dashboard-header.tsx`; tests from Todo 1.
  Acceptance criteria (agent-executable): The failing Quick Add tests from Todo 1 pass; Quick Add can submit bean name, roaster, note, repurchase intent, and reason into the existing create card mutation with `confirmed: true`; the full wizard scan/manual path remains accessible and existing wizard error tests still pass.
  QA scenarios (name the exact tool + invocation): Browser use with Playwright. Exact invocation: `npm run build > .omo/evidence/coffeedex-market-opportunities-sprint/task-2-build.log 2>&1`; then `PORT=3106 npm run start -- --hostname 127.0.0.1 > .omo/evidence/coffeedex-market-opportunities-sprint/task-2-server.log 2>&1 & echo $! > .omo/evidence/coffeedex-market-opportunities-sprint/task-2-server.pid`; then `node .omo/evidence/coffeedex-market-opportunities-sprint/task-2-quick-add-qa.mjs > .omo/evidence/coffeedex-market-opportunities-sprint/task-2-quick-add-qa.log 2>&1`. The QA script must launch Chromium, open `http://127.0.0.1:3106/dashboard`, route `/api/v1/cards`, `/api/v1/profile`, `/api/v1/profile/analytics`, `/api/v1/subscription`, `/api/v1/coffee-dna`, and `/api/v1/analytics`, click `page.getByRole("button", { name: /빠른 기록|빠른 커피 기록/ })`, fill `page.getByLabel(/원두 이름/)` with `Ethiopia Guji`, fill `page.getByLabel(/로스터/)` with `Fritz Coffee`, fill `page.getByLabel(/한 줄 메모|오늘의 기억/)` with `복숭아 단맛`, click `page.getByRole("button", { name: /다시 살래요|다시 살/ })`, click submit `page.getByRole("button", { name: /저장|기록 저장/ })`, and assert the intercepted `POST /api/v1/cards` JSON has `confirmed === true`, `repurchaseIntent === "again"`, and `repurchaseReasons.length > 0`. Binary observable: script exits 0 and `.omo/evidence/coffeedex-market-opportunities-sprint/task-2-quick-add.png` exists.
  Adversarial classes: malformed_input applies, submit empty bean and assert inline validation blocks network request; dirty_worktree applies; misleading_success_output applies, capture intercepted payload not just success toast; hung_or_long_commands applies, server start and Playwright script must have bounded timeout and PID cleanup.
  Cleanup: kill port 3106 server, close browser, record `lsof -nP -iTCP:3106` empty in `task-2-cleanup.txt`.
  Commit: Y | `feat(quick-add): add fast coffee memory capture`

- [x] 3. Add Korean flavor helper chips without expert-language friction
  What to do / Must NOT do: Add Korean-first flavor helper chips or clusters for Quick Add and, if low-risk, the full wizard tag step. Use existing tag arrays and raw note fields; do not add external taxonomy packages or AI calls. Copy must be approachable and not claim objective tasting expertise.
  Parallelization: Wave 2 | Blocked by: 1 | Blocks: 4, 5
  References (executor has NO interview context - be exhaustive): `docs/market-opportunities-2026-06-26.md`; `components/CardCreatorWizard.tsx`; `stores/tastingStore.ts`; `test/product-copy.test.mjs`; `test/dashboard-growth.test.ts`.
  Acceptance criteria (agent-executable): Korean flavor helper text/chips are visible in Quick Add; clicking chips updates submitted tags or note content; unsupported product copy tests remain clean; no English-only expert jargon is required to save.
  QA scenarios (name the exact tool + invocation): Browser use with Playwright. Exact invocation: `npm run build > .omo/evidence/coffeedex-market-opportunities-sprint/task-3-build.log 2>&1`; then `PORT=3106 npm run start -- --hostname 127.0.0.1 > .omo/evidence/coffeedex-market-opportunities-sprint/task-3-server.log 2>&1 & echo $! > .omo/evidence/coffeedex-market-opportunities-sprint/task-3-server.pid`; then `node .omo/evidence/coffeedex-market-opportunities-sprint/task-3-flavor-qa.mjs > .omo/evidence/coffeedex-market-opportunities-sprint/task-3-flavor-qa.log 2>&1`. The QA script must launch Chromium, open `http://127.0.0.1:3106/dashboard`, route `/api/v1/**`, click `page.getByRole("button", { name: /빠른 기록|빠른 커피 기록/ })`, assert `page.getByText(/한국어 향미|향미 단어/)` is visible, click chip buttons named `복숭아` and `초콜릿`, submit a valid quick record, and assert the intercepted `POST /api/v1/cards` JSON contains `tags` with both `복숭아` and `초콜릿` or `rawNote`/`aiDescription` containing both values. Binary observable: script exits 0 and `.omo/evidence/coffeedex-market-opportunities-sprint/task-3-flavor.png` exists.
  Adversarial classes: malformed_input applies, chip toggling must not duplicate tags indefinitely; dirty_worktree applies; prompt_injection not applicable because chips are local static copy; misleading_success_output applies, capture request payload.
  Cleanup: close browser/server used for QA and record receipt in `task-3-cleanup.txt`.
  Commit: Y | `feat(quick-add): add Korean flavor prompts`

- [x] 4. Surface private rebuy and last-good-brew memory from saved cards
  What to do / Must NOT do: Add a compact display in existing card/detail/dashboard surfaces that helps users remember why they would buy a coffee again and how they last liked brewing it. Reuse `repurchase_intent`, `repurchase_reasons`, `footer_meta.extraInfo`, and existing brewing notes/log data if already available. Do not add order buttons, affiliate links, partner claims, or marketplace language.
  Parallelization: Wave 3 | Blocked by: 2, 3 | Blocks: 5
  References (executor has NO interview context - be exhaustive): `components/TastingCard.tsx`; `components/CardDetailModal.tsx`; `components/dashboard-shelf-view.tsx`; `hooks/useTastingCards.ts`; `docs/golden-flows.md`; `docs/api-spec.md`.
  Acceptance criteria (agent-executable): A saved card with `repurchase_intent: "again"` and `repurchase_reasons` shows a compact private rebuy reason; a card with brew metadata shows a last-good-brew summary; cards without those fields do not show fake or fabricated reasons; public marketplace/referral copy does not appear.
  QA scenarios (name the exact tool + invocation): Browser use with Playwright. Exact invocation: `npm run build > .omo/evidence/coffeedex-market-opportunities-sprint/task-4-build.log 2>&1`; then `PORT=3107 npm run start -- --hostname 127.0.0.1 > .omo/evidence/coffeedex-market-opportunities-sprint/task-4-server.log 2>&1 & echo $! > .omo/evidence/coffeedex-market-opportunities-sprint/task-4-server.pid`; then `node .omo/evidence/coffeedex-market-opportunities-sprint/task-4-rebuy-qa.mjs > .omo/evidence/coffeedex-market-opportunities-sprint/task-4-rebuy-qa.log 2>&1`. The QA script must launch Chromium, open `http://127.0.0.1:3107/dashboard`, mock `/api/v1/cards` with one card `{ title: "Ethiopia Guji", repurchase_intent: "again", repurchase_reasons: ["복숭아 단맛"], footer_meta: { extraInfo: "V60 · 15g:250g · 92C" } }` and one card `{ title: "Brazil Natural", repurchase_intent: "undecided", repurchase_reasons: [], footer_meta: {} }`, assert `page.getByText(/다시 살 이유/)` and `page.getByText("복숭아 단맛")` are visible near the Ethiopia card, assert no fabricated reason appears for Brazil, open the Ethiopia detail dialog by role/name, and assert `page.getByText(/마지막 좋았던 추출|좋았던 추출/)` and `page.getByText(/V60/)` are visible. Binary observable: script exits 0 and `.omo/evidence/coffeedex-market-opportunities-sprint/task-4-rebuy.png` plus `task-4-detail.png` exist.
  Adversarial classes: stale_state applies, mock both `again` and non-again cards in same run; dirty_worktree applies; misleading_success_output applies, screenshot and locator assertions required; generated_or_cached artifacts not applicable beyond screenshots.
  Cleanup: kill port 3107 server and record empty port check in `task-4-cleanup.txt`.
  Commit: Y | `feat(rebuy): show private memory recall`

- [x] 5. Sync docs, smoke/product copy tests, and final browser coverage
  What to do / Must NOT do: Update docs and tests so the new behavior is truthful and bounded. Keep `docs/api-spec.md`, `docs/golden-flows.md`, product copy tests, and smoke tests synchronized. Do not promote future discovery/community/marketplace layers as shipped behavior.
  Parallelization: Wave 4 | Blocked by: 2, 3, 4 | Blocks: final verification wave
  References (executor has NO interview context - be exhaustive): `docs/api-spec.md`; `docs/golden-flows.md`; `docs/market-opportunities-2026-06-26.md`; `test/product-copy.test.mjs`; `test/smoke.test.mjs`; `test/dashboard-growth.test.ts`; `package.json`.
  Acceptance criteria (agent-executable): Docs mention Quick Add, Korean flavor helper, and private rebuy/recipe recall as current capabilities; docs retain future-boundary language for marketplace/community/referrals; `npm run test:smoke`, `node --test test/product-copy.test.mjs`, and targeted Playwright coverage pass.
  QA scenarios (name the exact tool + invocation): Auxiliary docs/contract proof: `node --test test/product-copy.test.mjs test/smoke.test.mjs` exits 0 and `rg -n "marketplace|referral|community|파트너|제휴" docs app components test` shows only future-boundary or explicit not-current wording. Binary observable: command exits 0 and boundary grep output is saved. Evidence: `task-5-docs-tests.txt`, `task-5-boundary-grep.txt`.
  Adversarial classes: misleading_success_output applies, capture full test output and grep output; dirty_worktree applies; prompt_injection not applicable because market research sources are not runtime input; stale_state applies, rerun smoke after docs edits.
  Cleanup: no live process expected; record `task-5-cleanup.txt`.
  Commit: Y | `docs(product): document quick memory boundary`

## Final verification wave

> Runs in parallel after ALL todos. ALL must APPROVE through evidence-gated reviewer verdicts before declaring complete; no additional user approval is required because start-work was explicitly requested.

- [x] F1. Plan compliance audit
  Exact invocation: spawn a `lazycodex-gate-reviewer` with the full plan, ledger, final diff, and artifact list; additionally run `node -e "const fs=require('fs'); const p=fs.readFileSync('.omo/plans/coffeedex-market-opportunities-sprint.md','utf8'); const unchecked=[...p.matchAll(/^- \\[ \\] \\d+\\./gm)].map(m=>m[0]); if (unchecked.length) { console.error(unchecked.join('\\n')); process.exit(1); }"` and `test -s .omo/start-work/ledger.jsonl`. Binary observable: reviewer returns `APPROVE` or `OKAY`, both commands exit 0, and evidence is saved to `.omo/evidence/coffeedex-market-opportunities-sprint/f1-plan-compliance.md`.

- [x] F2. Code quality review
  Exact invocation: spawn `lazycodex-code-reviewer` with `git diff -- components/CardCreatorWizard.tsx components/TastingCard.tsx components/CardDetailModal.tsx components/dashboard-client.tsx components/dashboard-empty-state.tsx hooks/useTastingCards.ts stores/tastingStore.ts docs/api-spec.md docs/golden-flows.md test/dashboard-growth.test.ts test/wizard-errors.test.ts test/product-copy.test.mjs test/smoke.test.mjs`. The reviewer must check type safety, no `as any`/suppression, owner boundaries, dirty worktree preservation, and copy honesty. Binary observable: reviewer returns unconditional `APPROVE`/`OKAY`; evidence saved to `.omo/evidence/coffeedex-market-opportunities-sprint/f2-code-review.md`.

- [x] F3. Real manual QA
  Exact invocation: `npm run build > .omo/evidence/coffeedex-market-opportunities-sprint/f3-build.log 2>&1`; `PORT=3108 npm run start -- --hostname 127.0.0.1 > .omo/evidence/coffeedex-market-opportunities-sprint/f3-server.log 2>&1 & echo $! > .omo/evidence/coffeedex-market-opportunities-sprint/f3-server.pid`; `node .omo/evidence/coffeedex-market-opportunities-sprint/f3-combined-browser-qa.mjs > .omo/evidence/coffeedex-market-opportunities-sprint/f3-browser-qa.log 2>&1`. The script must run desktop 1280 and mobile 390 viewports, route `/api/v1/**`, prove Quick Add happy path, empty validation no-network path, flavor chips payload, rebuy card/detail display, and absence of marketplace/referral/community copy. Binary observable: script exits 0 and screenshots `f3-desktop.png`, `f3-mobile.png`, `f3-rebuy-detail.png` exist.

- [x] F4. Scope fidelity
  Exact invocation: `git diff --name-only > .omo/evidence/coffeedex-market-opportunities-sprint/f4-changed-files.txt`; `! git diff --name-only | rg '^(supabase/migrations|app/api/v1/webhooks|app/api/v1/checkout|lib/supabase|mobile/)'`; `! git diff | rg -i 'marketplace|referral|affiliate|partner|제휴|파트너|커뮤니티|social graph'`; `git diff --check`. Also spawn `lazycodex-gate-reviewer` with the scope guardrails and changed-files list. Binary observable: shell checks exit 0 and reviewer returns unconditional `APPROVE`/`OKAY`; evidence saved to `.omo/evidence/coffeedex-market-opportunities-sprint/f4-scope-fidelity.md`.

## Commit strategy

- Do not auto-commit unless explicitly asked later.
- Keep changes stageable as logical commits matching each todo's commit line.
- Final suggested commit bundle:
  1. `test(quick-add): capture market-opportunity memory contracts`
  2. `feat(quick-add): add fast coffee memory capture`
  3. `feat(quick-add): add Korean flavor prompts`
  4. `feat(rebuy): show private memory recall`
  5. `docs(product): document quick memory boundary`
- Do not include unrelated dirty files in any staging recommendation.

## Success criteria

- Quick Add creates a confirmed private card through existing APIs and is visibly faster than the full wizard.
- Korean flavor prompts help users save approachable tags without expert vocabulary.
- Cards marked "again" display private rebuy/recipe recall without marketplace or referral claims.
- Existing scan/manual wizard, dashboard, guest boundaries, and product copy contracts remain intact.
- All automated verification commands pass or any pre-existing environment failure is named with evidence.
- Manual browser QA artifacts prove the user-visible flows on desktop and mobile.

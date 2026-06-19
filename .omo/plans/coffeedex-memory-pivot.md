# coffeedex-memory-pivot - Work Plan

## TL;DR (For humans)
<!-- Fill this LAST, after the detailed plan below is written, so it summarizes the REAL plan. -->
<!-- Plain English for a non-engineer: NO file paths, NO todo numbers, NO wave/agent/tool names. -->

**What you'll get:** CoffeeDex becomes a fast, truthful coffee-memory product: scan or manually capture a bag before signup, confirm what is real, mark whether you would buy it again, retrieve it later, and receive an evidence-labeled taste snapshot only when enough records exist. Data export and account deletion are free trust features; existing payment, PDF, and sharing continue from secondary surfaces.

**Why this approach:** The existing app already implements the expensive artifact and commerce surfaces, but research shows recall and repurchase are the stronger job. An additive Supabase migration and contract-first rollout preserve current work while removing false AI certainty and premature monetization from the core path.

**What it will NOT do:** It will not migrate to Firebase, delete existing PDF/Stripe/share code, add a marketplace or community feed, expand brew-timer scope, promise background uploads, or sell unconditional unlimited AI.

**Effort:** XL
**Risk:** High - the change crosses schema, auth, AI boundaries, a heavily modified UI, privacy operations, and browser behavior.
**Decisions to sanity-check:** Guest images are processed ephemerally and drafts stay in the browser; persistence still requires auth. CSV and JSON are separate free downloads. Historical database identifiers remain unchanged while user-visible branding becomes CoffeeDex.

Your next move: Execution is approved through the user's explicit OMO loop request. Full execution detail follows below.

---

> TL;DR (machine): XL/high-risk additive pivot across contracts, schema, guest capture, retrieval, passport, trust operations, analytics, and browser QA.

## Scope
### Must have
- Canonical CoffeeDex user-facing brand and memory/repurchase product contract.
- Additive tasting-card memory fields: package claims, process, repurchase intent/reasons, scan provenance/confidence/corrections, confirmation timestamp.
- Truthful scan response with nullable fields, explicit unavailable/uncertain states, image MIME/size bounds, and no random sample fallback.
- Browser-local guest draft, photo/manual capture, auth only at durable save, and safe resume after auth.
- Retrieval across roaster, bean, origin, process, notes/tags, and repurchase intent.
- Progressive passport state machine for 0, 1-2, 3-4, 5-9, and 10+ memories with literal evidence/coverage.
- Free JSON/CSV export, confirmed account deletion, expanded validated-memory analytics, and accurate privacy copy.
- Existing PDF, Stripe, story export, and public share remain operational from secondary surfaces.
### Must NOT have (guardrails, anti-slop, scope boundaries)
- No destructive rewrite of old migrations, RLS weakening, fabricated scan values, silent fallback samples, or implicit confirmation.
- No Firebase migration, marketplace, affiliate catalog, feed, new brew-timer features, background upload guarantee, or lifetime-unlimited AI promise.
- No reverting or cleaning unrelated dirty-worktree changes. No commit without an explicit Git request.

## Verification strategy
> Zero human intervention - all verification is agent-executed.
- Test decision: TDD for domain/schema/API contracts using Node test + existing route-fixture patterns; tests-after for React wiring using Playwright because existing UI seams are browser-observable.
- Evidence: `.omo/evidence/task-<N>-coffeedex-memory-pivot.*` plus `.omo/ulw-loop/evidence/G<goal>-C<criterion>.*`.
- Baseline gates: `npm run test:smoke`, `npm run typecheck`, focused `node --test`, `npm run build`, then production-mode Playwright.
- Browser QA: real Chrome at 375, 768, and 1280; happy, low-confidence/error, empty, loading, auth-resume, export, deletion, and secondary-offer states.

## Execution strategy
### Parallel execution waves
> Target 5-8 todos per wave. Fewer than 3 (except the final) means you under-split.
- Wave 1 (contract foundation): Todos 1-5 run with narrow ownership; Todo 2 blocks all persisted-memory work, Todo 1 blocks user-visible brand work.
- Wave 2 (core journey): Todos 6-10; guest draft/auth depends on scan and memory contracts, while retrieval and trust APIs can proceed once schema lands.
- Wave 3 (experience integration): Todos 11-14; dashboard/passport/settings/docs integration, then full verification.

### Dependency matrix
| Todo | Depends on | Blocks | Can parallelize with |
| --- | --- | --- | --- |
| 1 | none | 8, 11, 13 | 2, 3, 4, 5 |
| 2 | none | 3, 6, 9, 10, 12 | 1, 4, 5 |
| 3 | 2 | 7, 8 | 4, 5, 6 |
| 4 | none | 11 | 1, 2, 3, 5 |
| 5 | none | 12 | 1, 2, 3, 4 |
| 6 | 2 | 8, 9, 10 | 3, 7 |
| 7 | 3 | 8 | 6, 9, 10 |
| 8 | 1, 3, 6, 7 | 11, 14 | 9, 10 |
| 9 | 2, 6 | 11, 14 | 7, 8, 10 |
| 10 | 2, 6 | 12, 14 | 7, 8, 9 |
| 11 | 1, 4, 8, 9 | 14 | 12, 13 |
| 12 | 5, 10 | 14 | 11, 13 |
| 13 | 1-12 contracts | 14 | 11, 12 |
| 14 | 1-13 | final gate | none |

## Todos
> Implementation + Test = ONE todo. Never separate.
<!-- APPEND TASK BATCHES BELOW THIS LINE WITH edit/apply_patch - never rewrite the headers above. -->
- [ ] 1. Invert the brand and product contracts to CoffeeDex
  What to do / Must NOT do: Pin CoffeeDex in `lib/brand.ts`, brand tests, package metadata, landing/auth/onboarding copy, PRD/API/golden-flow headings. Describe recall/repurchase as primary and artifact/payment as deferred. Preserve historical SQL identifiers and route paths.
  Parallelization: Wave 1 | Blocked by: none | Blocks: 8, 11, 13
  References: `lib/brand.ts:1-25`; `test/brand-leak.test.mjs:8-18`; `test/brand-contract.test.mjs:31-64`; `docs/PRD-Hyangmi-v2.md:1-53`; `docs/api-spec.md:1-45`; `docs/golden-flows.md:1-61`; `.omo/ultraresearch/20260617-coffeedex-prd/SYNTHESIS.md:21-79`.
  Acceptance criteria: brand contract expects CoffeeDex; user-facing scan finds no canonical Hyangmi copy outside explicit migration/compatibility allowlist; `node --test test/brand-contract.test.mjs test/brand-leak.test.mjs test/product-copy.test.mjs test/smoke.test.mjs` passes.
  QA scenarios: Playwright happy: `/`, `/onboarding`, `/auth` show CoffeeDex memory copy. Failure: source audit detects an injected Hyangmi string. Evidence `.omo/evidence/task-1-coffeedex-memory-pivot.txt`.
  Commit: N | User did not request Git commits; preserve dirty worktree.

- [ ] 2. Add the additive coffee-memory schema and typed domain contract
  What to do / Must NOT do: New migration adds `package_origin`, `package_process`, `repurchase_intent`, `repurchase_reasons`, `scan_source`, `scan_confidence`, `corrected_fields`, `confirmed_at`; default existing rows to `undecided` and nullable provenance. Add shared Zod schemas/types. Do not edit old migrations or relax RLS.
  Parallelization: Wave 1 | Blocked by: none | Blocks: 3, 6, 9, 10, 12
  References: `supabase/migrations/20260614000000_create_tasting_cards.sql:8-46`; `app/api/v1/cards/route.ts:6-23`; `hooks/useTastingCards.ts:44-82`; `supabase/migrations/AGENTS.md`.
  Acceptance criteria: migration contract proves additive columns/check constraints/indexes and owner RLS; strict types compile; legacy fixtures parse with defaults.
  QA scenarios: CLI parsed SQL happy and invalid repurchase value failure. Evidence `.omo/evidence/task-2-coffeedex-memory-pivot.txt`.
  Commit: N | User did not request Git commits.

- [ ] 3. Make package scanning truthful and bounded
  What to do / Must NOT do: Change scan result fields to nullable package claims with per-field uncertainty; remove sensory estimates and random sample fallback; return explicit `unavailable` state; validate base64 MIME and 5 MiB decoded limit; allow ephemeral unauthenticated scan with a bounded per-IP process-local limit and deployment warning. Never persist guest images.
  Parallelization: Wave 1 | Blocked by: 2 | Blocks: 7, 8
  References: `app/api/v1/cards/scan/route.ts:7-20,65-77,198-256`; `docs/api-spec.md:129-163`; `test/scan-trust.test.mjs`.
  Acceptance criteria: PIN existing authenticated scan first; RED tests prove unknown fields and provider failure; GREEN returns no invented facts and rejects invalid/oversized/rate-limited requests.
  QA scenarios: HTTP happy with deterministic fixture; failure with malformed image and missing provider. Evidence `.omo/evidence/task-3-coffeedex-memory-pivot.txt`.
  Commit: N | User did not request Git commits.

- [ ] 4. Introduce the progressive passport state machine
  What to do / Must NOT do: Pure typed function maps 0, 1-2, 3-4, 5-9, 10+ confirmed memories to empty/collage/first-signals/early-snapshot/current-snapshot; expose literal sample count, distinct origins/processes/tags, and narrow/mixed/broad coverage. No causal or taste-DNA claims.
  Parallelization: Wave 1 | Blocked by: none | Blocks: 11
  References: `app/api/v1/profile/analytics/route.ts:38-55,127-150`; `components/FluidRadarChart.tsx`; `.omo/ultraresearch/20260617-coffeedex-prd/SYNTHESIS.md:42-54`.
  Acceptance criteria: table-driven unit tests cover every threshold and missing-coverage case; typecheck passes.
  QA scenarios: CLI happy for 10 diverse records; failure/edge for 3 identical records. Evidence `.omo/evidence/task-4-coffeedex-memory-pivot.txt`.
  Commit: N | User did not request Git commits.

- [ ] 5. Define validated-memory analytics and persistence
  What to do / Must NOT do: Extend event schema for scan start/result/failure, field correction, draft confirmation, validated save, archive view/search, second/third distinct bag. Add a service-role-backed `product_events` table with safe scalar properties, idempotent event id, optional user/anonymous id, and no raw image/note content.
  Parallelization: Wave 1 | Blocked by: none | Blocks: 12
  References: `lib/analytics-events.ts:3-30`; `app/api/v1/analytics/route.ts:1-32`; `hooks/use-analytics-events.ts`; `docs/api-spec.md`.
  Acceptance criteria: malformed/private payloads fail; duplicate event id is idempotent; permitted event persists in fixture; existing analytics tests pass.
  QA scenarios: HTTP happy event and failure with raw image property. Evidence `.omo/evidence/task-5-coffeedex-memory-pivot.txt`.
  Commit: N | User did not request Git commits.

- [ ] 6. Extend card CRUD and hooks for confirmed memories
  What to do / Must NOT do: Update create/update/list contracts and hooks for new memory fields; require explicit confirmation to set `confirmed_at`; preserve compatibility for legacy cards. Do not accept client-supplied `user_id` or provenance outside schemas.
  Parallelization: Wave 2 | Blocked by: 2 | Blocks: 8, 9, 10
  References: `app/api/v1/cards/route.ts:6-123`; `app/api/v1/cards/[id]/route.ts`; `hooks/useTastingCards.ts:44-178`; `test/cards-create-contract.test.mjs`.
  Acceptance criteria: CRUD route tests cover again/maybe/no/undecided, optional reasons, correction fields, auth, and malformed input.
  QA scenarios: HTTP fixture happy create/update/read; failure without confirmation/auth. Evidence `.omo/evidence/task-6-coffeedex-memory-pivot.txt`.
  Commit: N | User did not request Git commits.

- [ ] 7. Add an expiring browser-local guest draft and auth resume contract
  What to do / Must NOT do: Create a small sessionStorage adapter with Zod parsing, version, created-at, 24-hour expiry, clear-on-success, and safe redirect token. Keep image/draft local; no anonymous database rows. Resume the draft after sign-in/signup in the same tab.
  Parallelization: Wave 2 | Blocked by: 3 | Blocks: 8
  References: `lib/auth-redirect.ts`; `app/auth/page.tsx`; `components/auth-gate-client.tsx`; `stores/tastingStore.ts`; `test/auth-resume.test.ts`.
  Acceptance criteria: unit tests cover round trip, expiry, corruption, clear, and sanitized redirect; auth resume Playwright test passes.
  QA scenarios: browser happy resume and corrupted/expired draft failure. Evidence `.omo/evidence/task-7-coffeedex-memory-pivot.txt`.
  Commit: N | User did not request Git commits.

- [ ] 8. Rebuild the capture wizard around guest review and explicit confirmation
  What to do / Must NOT do: Wizard opens from landing/onboarding before auth, supports image and manual paths, shows source/confidence/unknowns, records user-perceived metrics separately, requires coffee name + roaster + repurchase intent, tracks corrected fields, saves local draft, then opens auth only at persistence. Split oversized wizard into focused components under 250 pure LOC.
  Parallelization: Wave 2 | Blocked by: 1, 3, 6, 7 | Blocks: 11, 14
  References: `components/CardCreatorWizard.tsx:1-780`; `app/onboarding/page.tsx`; `components/landing-playground-client.tsx`; `DESIGN.md`; `test/wizard-errors.test.ts`.
  Acceptance criteria: RED/green Playwright tests for guest scan/manual, low-confidence/manual fallback, required confirmation, auth resume, and authenticated save.
  QA scenarios: Chrome 375 happy and provider-unavailable failure screenshots. Evidence `.omo/evidence/task-8-coffeedex-memory-pivot.png`.
  Commit: N | User did not request Git commits.

- [ ] 9. Make the dashboard a repurchase retrieval surface
  What to do / Must NOT do: Default to memory cards, demote brew calendar/AI barista/physical shelf to secondary navigation, extend normalized search across bean/roaster/origin/process/tags/note, add repurchase filter/sort and clear empty states. Do not remove adjacent modules.
  Parallelization: Wave 2 | Blocked by: 2, 6 | Blocks: 11, 14
  References: `components/dashboard-client.tsx:180-280`; `components/dashboard-navigation.tsx:6-61`; `lib/dashboard-card-filter.ts:1-53`; `components/dashboard-filters-panel.tsx`; `components/dashboard-cards-section.tsx`.
  Acceptance criteria: table-driven filter tests and Playwright retrieval at three breakpoints; intended card is found by each supported field.
  QA scenarios: browser happy retrieval and zero-results reset. Evidence `.omo/evidence/task-9-coffeedex-memory-pivot.png`.
  Commit: N | User did not request Git commits.

- [ ] 10. Add free JSON/CSV export and safe account deletion APIs
  What to do / Must NOT do: Separate authenticated export endpoints produce RFC 4180 CSV and versioned JSON without premium checks. Account deletion requires explicit confirmation, uses service role server-side, revokes owned public card access/cascades rows, and fails closed if admin credentials or cleanup fail. Current app owns no uploaded storage objects, so document that media URLs are references rather than pretending to delete external files.
  Parallelization: Wave 2 | Blocked by: 2, 6 | Blocks: 12, 14
  References: `app/api/v1/pdf/route.ts`; `lib/pdf-generator.ts`; `app/api/v1/profile/route.ts`; `lib/env.ts:1-17`; `app/api/v1/webhooks/stripe/route.ts:75-90`; migrations with `ON DELETE CASCADE`.
  Acceptance criteria: route tests cover JSON/CSV content disposition/escaping, no premium gate, confirmation mismatch, missing service key, cleanup failure, and successful admin deletion.
  QA scenarios: HTTP happy export/delete and failure-safe deletion. Evidence `.omo/evidence/task-10-coffeedex-memory-pivot.txt`.
  Commit: N | User did not request Git commits.

- [ ] 11. Render the progressive passport and move offers to secondary surfaces
  What to do / Must NOT do: Dashboard uses the state machine and shows literal evidence/coverage; radar is hidden for sparse states and secondary for mature state. Remove payment/PDF/share from landing/empty-state/primary dashboard CTA, retaining them in card detail or settings. Do not delete commerce/share modules.
  Parallelization: Wave 3 | Blocked by: 1, 4, 8, 9 | Blocks: 14
  References: `components/dashboard-analytics-panel.tsx`; `components/FluidRadarChart.tsx`; `components/dashboard-empty-state.tsx`; `components/dashboard-usage-panel.tsx`; `components/dashboard-billing-status-panel.tsx`; `components/CardDetailModal.tsx`; `lib/revenue-funnel.ts`.
  Acceptance criteria: component/Playwright tests cover all passport states and assert primary CTAs are capture/retrieve while deferred features remain accessible secondarily.
  QA scenarios: Chrome state fixtures + secondary-offer regression. Evidence `.omo/evidence/task-11-coffeedex-memory-pivot.png`.
  Commit: N | User did not request Git commits.

- [ ] 12. Add trust settings, analytics wiring, and privacy disclosure
  What to do / Must NOT do: Add a settings surface for free export/account deletion; wire validated-memory events without raw content; update privacy/legal copy for Gemini processing, local drafts, retention, deletion, and external image URLs. No fabricated compliance claim.
  Parallelization: Wave 3 | Blocked by: 5, 10 | Blocks: 14
  References: `components/dashboard-billing-status-panel.tsx`; `hooks/use-analytics-events.ts`; `app/legal/privacy/page.tsx`; `components/legal-document.tsx`; `docs/deploy.md`.
  Acceptance criteria: settings Playwright happy/failure tests; analytics contract tests; source audit confirms no raw image/note in event properties.
  QA scenarios: browser export/delete confirmations and service failure. Evidence `.omo/evidence/task-12-coffeedex-memory-pivot.png`.
  Commit: N | User did not request Git commits.

- [ ] 13. Synchronize authoritative docs and release operations
  What to do / Must NOT do: Finalize CoffeeDex PRD, API spec, golden flows, deploy/env docs, DESIGN.md component additions, and migration notes to match actual code. Keep deferred routes documented as secondary compatibility, not deleted/current wedge.
  Parallelization: Wave 3 | Blocked by: implemented contracts 1-12 | Blocks: 14
  References: `docs/PRD-Hyangmi-v2.md`; `docs/api-spec.md`; `docs/golden-flows.md`; `docs/deploy.md`; `DESIGN.md`; scoped `AGENTS.md` files.
  Acceptance criteria: docs contract smoke test passes and every named route/event/field exists in code/schema.
  QA scenarios: CLI cross-reference happy and intentionally missing symbol failure. Evidence `.omo/evidence/task-13-coffeedex-memory-pivot.txt`.
  Commit: N | User did not request Git commits.

- [ ] 14. Run full release verification and visual QA
  What to do / Must NOT do: Re-read original brief and plan; run focused tests, smoke, typecheck, build, full Playwright; start production server; drive real Chrome at 375/768/1280 through guest capture, auth boundary, retrieval, passport, export/delete failure and deferred offers; capture screenshots/action logs; clean all processes/ports/contexts; run code/QA/gate/scope reviewers. Do not count tests alone as done.
  Parallelization: Wave 3 final | Blocked by: 1-13 | Blocks: final quality gate
  References: `package.json:6-12`; `playwright.config.ts`; `test/AGENTS.md`; `.omo/ulw-loop/.../goals.json`.
  Acceptance criteria: all ULW criteria evidence exists and is non-empty; all reviewers approve; no changed TS file violates strict/no-excuse rules or 250 pure-LOC ceiling; no runtime cleanup remains.
  QA scenarios: production browser happy/failure plus CLI full suite. Evidence `.omo/evidence/task-14-coffeedex-memory-pivot.txt` and breakpoint PNGs.
  Commit: N | User did not request Git commits.

## Final verification wave
> Runs in parallel after ALL todos. ALL must APPROVE. Surface results and wait for the user's explicit okay before declaring complete.
- [ ] F1. Plan compliance audit
- [ ] F2. Code quality review
- [ ] F3. Real manual QA
- [ ] F4. Scope fidelity

## Commit strategy

- No commits in this run because the user requested implementation, not Git history changes, and the worktree contains broad pre-existing edits. Each work unit records a no-commit reason and its exact changed paths. If the user later requests commits, use git-master to separate pivot changes from prior dirty work by hunk.

## Success criteria

- CoffeeDex is the sole user-visible canonical brand; historical schema identifiers remain compatible.
- A guest can produce and correct a truthful draft before auth; persistence remains owner-scoped.
- No scan outage or invisible label field becomes fabricated coffee data.
- Confirmed memories store repurchase intent and are retrievable across all promised fields.
- Passport language and visualization reflect record count and coverage at every threshold.
- JSON/CSV export is free; account deletion fails closed and revokes owned access.
- PDF/Stripe/share remain operational but do not lead onboarding, empty state, or primary dashboard actions.
- Focused tests, smoke, typecheck, build, full Playwright, production real-browser QA, and final reviewers all pass with captured cleanup receipts.

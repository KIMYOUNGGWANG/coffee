# coffeedex-launch-readiness - Work Plan

## TL;DR (For humans)
**What you'll get:** CoffeeDex will be moved from "feature-complete sprint" toward launch-ready by removing real trust blockers first, then making the validation gate match the actual product surface. The first implementation slice fixes authenticated profile access and stale activation/auth expectations before any new feature work.

**Why this approach:** The current web golden flows are mostly shipped, but direct source inspection found a hard-coded mock user in the profile API and the QA map found that the declared full validation command skips important product-boundary tests. Launch readiness should harden trust and gates before adding more surface area.

**What it will NOT do:** It will not touch the unrelated mobile/design dirty files, ship community/marketplace/referral/print claims, or use live Supabase/Stripe state in tests.

**Effort:** Medium
**Risk:** Medium - auth/profile and validation gates affect launch-critical trust surfaces.
**Decisions I made for you:** I treated "launch-ready" as the current web app golden flows, prioritized trust/gate blockers over new features, and kept mobile work out of scope because it is already dirty and unrelated.

Your next move: execution has been authorized by the user's OMO start-work request. Full execution detail follows below.

---

> TL;DR (machine): Medium-risk launch-readiness hardening: P0 profile auth, stale activation tests, validation gate alignment, route-contract coverage, browser golden-flow verification.

## Scope
### Must have
- Remove mocked server identity from `/api/v1/profile` and prove unauthenticated requests fail closed.
- Keep public-card/onboarding/dashboard activation resume on the current `mode=quick` flow.
- Make local launch validation include product-copy, brand, route-contract, typecheck, build, and browser E2E gates.
- Preserve export/delete/checkout/webhook/account route contracts without live external mutation.
- Capture browser evidence for the launch golden flows.
### Must NOT have (guardrails, anti-slop, scope boundaries)
- Do not edit or stage unrelated `DESIGN.md`, `mobile/**`, `next-env.d.ts`, `artifacts/**`, or `mobile/assets/**`.
- Do not add claims for marketplace, referral, roaster partnership, community social graph, or print fulfillment.
- Do not hit live Supabase or live Stripe from tests.
- Do not weaken RLS/owner filters or remove Korean auth/copy contracts to make tests pass.

## Verification strategy
> Zero human intervention - all verification is agent-executed.
- Test decision: TDD/tests-first for P0 profile auth and gate drift, tests-after only for script/docs alignment where the assertion is a source contract.
- Evidence: `.omo/evidence/coffeedex-launch-readiness/task-<N>-...` logs/screenshots plus `.omo/start-work/ledger.jsonl`.

## Execution strategy
### Parallel execution waves
> Target 5-8 todos per wave. Fewer than 3 (except the final) means you under-split.
- Wave 1 serial first: P0 auth/profile correction because it can affect dashboard and payment dialogs.
- Wave 1 parallel after Todo 1: validation gate alignment and launch route-contract bundle can proceed independently.
- Wave 2: browser golden-flow QA and docs/scope audit after code/script changes.

### Dependency matrix
| Todo | Depends on | Blocks | Can parallelize with |
| --- | --- | --- | --- |
| 1 | none | 2, 4, final | none |
| 2 | 1 for final command truth, can draft independently | 4, final | 3 |
| 3 | none | final | 2 |
| 4 | 1, 2, 3 | final | none |
| 5 | 2, 3 | final | 4 |
| 6 | 2, 3 | final | 4 |
| 7 | 2, 3 | final | 4 |

## Todos
> Implementation + Test = ONE todo. Never separate.
<!-- APPEND TASK BATCHES BELOW THIS LINE WITH edit/apply_patch - never rewrite the headers above. -->
- [x] 1. Remove profile API mock auth and repair activation auth-gate drift
  What to do / Must NOT do: Replace the hard-coded `mock-user-123` in `app/api/v1/profile/route.ts` with the same `supabase.auth.getUser()` pattern used by `app/api/v1/profile/analytics/route.ts`. Add or update route-level tests that fail against the current mock bypass and pass only when unauthenticated profile calls return 401 and authenticated calls query `profiles.id = user.id`. Update stale browser tests for the current onboarding CTA text and `mode=quick` dashboard activation URL if needed. Must not weaken owner filters, change profile defaults, or edit unrelated files.
  Parallelization: Wave 1 | Blocked by: none | Blocks: 2, 4, final
  References (executor has NO interview context - be exhaustive): `app/api/v1/profile/route.ts:5-47` currently has `TEMPORARY BYPASS: mock user`; `app/api/v1/profile/analytics/route.ts:49-57` is the correct auth pattern; `app/api/v1/cards/[id]/route.ts:116-131` is the owner-scope pattern; `test/auth-gate.test.ts` still references old public-card activation URL/text and may need alignment with `components/onboarding-taste-finder.tsx`; `test/auth-resume.test.ts` covers auth resume.
  Acceptance criteria (agent-executable): A new or updated Node route-contract test proves unauthenticated `/api/v1/profile` returns 401 and authenticated `/api/v1/profile` returns the profile for the real `user.id`; `rg "TEMPORARY BYPASS|mock-user-123" app/api/v1/profile/route.ts test -n` returns no production bypass; `npx playwright test test/auth-gate.test.ts test/auth-resume.test.ts` passes after `npm run build`.
  QA scenarios (name the exact tool + invocation): Happy/failure route proof with exact command `node --test <new-or-updated-profile-route-test>` saved to `.omo/evidence/coffeedex-launch-readiness/task-1-profile-route.log`; browser proof `npm run build > .omo/evidence/coffeedex-launch-readiness/task-1-build.log 2>&1 && npx playwright test test/auth-gate.test.ts test/auth-resume.test.ts > .omo/evidence/coffeedex-launch-readiness/task-1-auth-playwright.log 2>&1`; failure scenario must include unauthenticated route fixture returning 401, not a mocked success. Cleanup: no persistent server beyond Playwright webServer.
  Commit: Y | `fix(profile): require real auth for profile summary`

- [ ] 2. Make launch validation command match product truth
  What to do / Must NOT do: Update `package.json` scripts and `docs/deploy.md` so one authoritative local launch gate includes product-copy, brand, smoke, route-contract, typecheck, build, and Playwright E2E coverage. Keep commands bounded and npm-free beyond existing dependencies. Must not remove existing `test:smoke`, `typecheck`, `build`, or `test:e2e` scripts.
  Parallelization: Wave 1 | Blocked by: Todo 1 for final validation rerun | Blocks: 4, final
  References (executor has NO interview context - be exhaustive): `package.json` currently defines `validate:full` as `npm run test:smoke && npm run typecheck && npm run build && npm run test:e2e`; `docs/deploy.md` currently documents only `product-copy + smoke` and `typecheck`; QA explorer report says product-copy/brand/route contracts are not in the composite gate.
  Acceptance criteria (agent-executable): `npm run validate:full` runs the strengthened gate; `docs/deploy.md` names the same command as authoritative; product-copy, brand, smoke, route-contract, typecheck, build, and E2E are all represented in scripts; `node --test test/product-copy.test.mjs test/smoke.test.mjs test/brand-contract.test.mjs test/brand-leak.test.mjs` passes.
  QA scenarios (name the exact tool + invocation): Auxiliary proof `npm run validate:full > .omo/evidence/coffeedex-launch-readiness/task-2-validate-full.log 2>&1`; failure scenario `node -e "const p=require('./package.json'); if (!/product-copy|brand|route/.test(JSON.stringify(p.scripts))) process.exit(1)"` saved to `.omo/evidence/coffeedex-launch-readiness/task-2-script-contract.log`.
  Commit: Y | `chore(validation): align launch readiness gate`

- [ ] 3. Add launch route-contract bundle for trust surfaces
  What to do / Must NOT do: Add a single npm script or documented Node command bundle for launch-critical route contracts: profile, export, account deletion, checkout API, PDF entitlement, credit lifecycle, scan trust, memory CRUD, Stripe webhook idempotency, and subscription lifecycle. If Todo 1 adds a profile route test, include it. Must not make route tests touch live Supabase/Stripe.
  Parallelization: Wave 1 | Blocked by: none | Blocks: 4, final
  References (executor has NO interview context - be exhaustive): Tests discovered by QA explorer: `test/export-route.test.mjs`, `test/account-route.test.mjs`, `test/checkout-api-contract.test.mjs`, `test/pdf-route.test.mjs`, `test/credit-lifecycle.test.mjs`, `test/scan-trust.test.mjs`, `test/memory-crud-contract.test.mjs`, `test/stripe-webhook-idempotency.test.mjs`, `test/subscription-lifecycle.test.mjs`, plus Todo 1 profile route test.
  Acceptance criteria (agent-executable): One command runs all listed route contracts with `node --test`; the command exits 0; docs mention it under launch verification; no test requires real secrets.
  QA scenarios (name the exact tool + invocation): `npm run test:routes > .omo/evidence/coffeedex-launch-readiness/task-3-routes.log 2>&1` or exact equivalent; failure scenario inspect logs for any live env/secret dependency and save `env | rg 'SUPABASE|STRIPE'` redacted summary only, never raw values.
  Commit: Y | `test(routes): add launch contract gate`

- [ ] 4. Run and repair web golden-flow launch QA
  What to do / Must NOT do: Run browser and Node verification after Todos 1-3, repair only failures in the current web product scope, and capture artifacts. Must not touch mobile or add new product claims.
  Parallelization: Wave 2 | Blocked by: 1, 2, 3 | Blocks: final
  References (executor has NO interview context - be exhaustive): `docs/golden-flows.md`; `test/guest-capture.test.ts`; `test/dashboard-growth.test.ts`; `test/public-share.test.ts`; `test/checkout-return.test.ts`; `test/account-data-controls.test.ts`; `test/payment-dialog.test.ts`; `test/story-export.test.ts`; `playwright.config.ts`.
  Acceptance criteria (agent-executable): `npm run validate:full` exits 0; targeted Playwright golden-flow suite exits 0; screenshots/evidence are saved under `.omo/evidence/coffeedex-launch-readiness/`; `git diff --check` exits 0.
  QA scenarios (name the exact tool + invocation): `npm run validate:full > .omo/evidence/coffeedex-launch-readiness/task-4-validate-full.log 2>&1`; targeted browser rerun `npx playwright test test/guest-capture.test.ts test/dashboard-growth.test.ts test/public-share.test.ts test/checkout-return.test.ts test/account-data-controls.test.ts > .omo/evidence/coffeedex-launch-readiness/task-4-browser-golden.log 2>&1`; failure scenario: if a flow fails, save Playwright trace/error-context paths and repair with a minimal regression test.
  Commit: Y | `chore(launch): verify web golden flows`

- [ ] 5. Resolve deploy readiness truth gaps
  What to do / Must NOT do: Audit `docs/deploy.md`, `lib/env.ts`, Stripe/Supabase checklist docs, and runtime env validation so launch docs classify required versus optional observability/email variables correctly. Add source-contract tests if docs and env schema disagree. Must not require live secrets in local validation and must not print env values.
  Parallelization: Wave 2 | Blocked by: 2, 3 | Blocks: final
  References (executor has NO interview context - be exhaustive): `docs/deploy.md`; `lib/env.ts`; Metis finding that `RESEND_API_KEY`, `NEXT_PUBLIC_POSTHOG_KEY`, and `NEXT_PUBLIC_SENTRY_DSN` may be optional in code but required in docs; Stripe checklist in `docs/deploy.md`; Supabase checklist in `docs/deploy.md`.
  Acceptance criteria (agent-executable): Docs and env schema agree on required versus optional launch variables; route/build tests do not require live secrets; product-copy/smoke tests cover the boundary.
  QA scenarios (name the exact tool + invocation): `node --test test/product-copy.test.mjs test/smoke.test.mjs > .omo/evidence/coffeedex-launch-readiness/task-5-product-truth.log 2>&1`; `npm run typecheck > .omo/evidence/coffeedex-launch-readiness/task-5-typecheck.log 2>&1`; failure scenario: source test must fail if docs claim a variable is required while schema treats it optional without explaining the difference.
  Commit: Y | `docs(deploy): align launch environment truth`

- [ ] 6. Audit scan/PDF compatibility boundaries
  What to do / Must NOT do: Verify `app/api/v1/cards/scan/route.ts` response fields, `docs/api-spec.md`, smoke/product-copy tests, and `app/api/v1/pdf/route.ts` font fallback behavior so secondary compatibility surfaces are honest. Either document/test `matchScore` as compatibility or remove it if unshipped; verify PDF has a local asset or graceful failure. Must not expand product scope beyond coffee memory.
  Parallelization: Wave 2 | Blocked by: 2, 3 | Blocks: final
  References (executor has NO interview context - be exhaustive): Metis finding about `matchScore: 87` in `app/api/v1/cards/scan/route.ts`; `docs/api-spec.md`; `app/api/v1/pdf/route.ts`; `test/scan-trust.test.mjs`; `test/pdf-route.test.mjs`.
  Acceptance criteria (agent-executable): API docs and route contracts agree on scan response fields; PDF route tests prove entitlement/failure behavior without network surprises; no copy implies match scoring or PDF fulfillment beyond implemented behavior.
  QA scenarios (name the exact tool + invocation): `node --test test/scan-trust.test.mjs test/pdf-route.test.mjs test/product-copy.test.mjs > .omo/evidence/coffeedex-launch-readiness/task-6-scan-pdf.log 2>&1`; failure scenario: contract test must catch undocumented scan response fields or PDF unavailable state.
  Commit: Y | `fix(contracts): align scan and pdf launch boundaries`

- [ ] 7. Add launch rollback and observability checklist
  What to do / Must NOT do: Add a concise launch checklist doc section covering Vercel rollback, Supabase migration status/rollback notes, Stripe test-mode webhook event checks, and failure observability for checkout/webhook/scan/account deletion. Add tests only if this touches product copy contracts. Must not add new observability vendor integration unless already configured.
  Parallelization: Wave 2 | Blocked by: 2, 3 | Blocks: final
  References (executor has NO interview context - be exhaustive): `docs/deploy.md`; Metis findings on observability and rollback gaps; `app/api/v1/webhooks/stripe/route.ts`; `app/api/v1/cards/scan/route.ts`; `lib/account-deletion.ts`.
  Acceptance criteria (agent-executable): Deploy guide has binary prelaunch and rollback checklist; no secrets are included; checklist distinguishes local validation from production operator actions; smoke/product-copy tests still pass.
  QA scenarios (name the exact tool + invocation): `node --test test/product-copy.test.mjs test/smoke.test.mjs > .omo/evidence/coffeedex-launch-readiness/task-7-docs.log 2>&1`; failure scenario: grep new docs for raw secret examples and future shipped claims.
  Commit: Y | `docs(launch): add rollback and observability checklist`

## Final verification wave
> Runs in parallel after ALL todos. ALL must APPROVE. Surface results and wait for the user's explicit okay before declaring complete.
- [ ] F1. Plan compliance audit
  Exact invocation: spawn `lazycodex-gate-reviewer` with this plan, `.omo/start-work/ledger.jsonl`, final diff, and evidence list. Also run `node -e "const fs=require('fs'); const p=fs.readFileSync('.omo/plans/coffeedex-launch-readiness.md','utf8'); const unchecked=[...p.matchAll(/^- \\[ \\] (?:\\d+\\.|F\\d\\.)/gm)]; if (unchecked.length) { console.error(unchecked.map(m=>m[0]).join('\\n')); process.exit(1); }"` after checkboxes are marked.
- [ ] F2. Code quality review
  Exact invocation: spawn `lazycodex-code-reviewer` with changed files and verification logs. Reviewer must check auth correctness, no `as any`/suppression, dirty worktree preservation, route-test isolation, and no live secret leakage.
- [ ] F3. Real manual QA
  Exact invocation: `npm run validate:full` plus targeted Playwright golden-flow rerun after production build. Evidence must include at least one browser screenshot or Playwright artifact for auth/activation and one for a dashboard/account/share flow.
- [ ] F4. Scope fidelity
  Exact invocation: `git diff --name-only` must not include `mobile/**`, `DESIGN.md`, `next-env.d.ts`, or `artifacts/**` unless they are pre-existing unstaged files; `git diff --cached --name-only` must contain only launch-readiness files; `git diff | rg -i 'marketplace|referral|affiliate|partner|제휴|파트너|커뮤니티|social graph|print fulfillment|배송|인쇄'` must not show new shipped claims.

## Commit strategy
- One commit per completed todo unless two adjacent todos only modify scripts/docs.
- Do not stage unrelated dirty files.
- Suggested commits:
  1. `fix(profile): require real auth for profile summary`
  2. `chore(validation): align launch readiness gate`
  3. `test(routes): add launch contract gate`
  4. `chore(launch): verify web golden flows`

## Success criteria
- `/api/v1/profile` no longer contains a mock user bypass and is covered by route-contract tests.
- The current public-card/onboarding/auth/dashboard activation flow uses the quick-record intent and passes browser tests.
- One local launch gate command covers product truth, route contracts, typecheck, build, and E2E.
- Route contracts prove trust-sensitive export/delete/checkout/payment/scan surfaces without live external mutation.
- Browser QA proves the launch golden flows through real pages.
- Final diff preserves unrelated dirty worktree changes and avoids out-of-scope product claims.

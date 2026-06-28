---
slug: coffeedex-launch-readiness
status: drafting
intent: unclear
pending-action: write .omo/plans/coffeedex-launch-readiness.md
approach: <fill: the approach you intend to plan>
---

# Draft: coffeedex-launch-readiness

## Components (topology ledger)
<!-- Lock the SHAPE before depth. One row per top-level component that can succeed or fail independently. -->
<!-- id | outcome (one line) | status: active|deferred | evidence path -->
- C1 | Authenticated launch gate: no mocked server identity; auth resume/activation stays Korean and safe | active | codegraph: app/api/v1/profile/route.ts; app/api/v1/profile/analytics/route.ts; app/api/v1/cards/[id]/route.ts
- C2 | Verification truth: one local command covers product copy, brand, route contracts, typecheck, build, and E2E | active | package.json; docs/deploy.md; QA explorer report
- C3 | Trust controls: export/delete/checkout/webhook route contracts remain fail-closed and owner-scoped | active | docs/golden-flows.md; tests listed in launch route-contract todo
- C4 | Browser golden flows: onboarding, quick add, dashboard retention, public share, checkout return, account controls observable in Playwright | active | test/*.test.ts map from QA explorer report
- C5 | Scope honesty: no community/marketplace/referral/print fulfillment shipped claims | active | docs/golden-flows.md; test/product-copy.test.mjs

## Open assumptions (announced defaults)
<!-- Intent is UNCLEAR: research resolves ambiguity, defaults are adopted (not asked), and each is surfaced in the plan's human TL;DR for veto. -->
<!-- assumption | adopted default | rationale | reversible? -->
- "Launch-ready" means web product readiness for the existing CoffeeDex golden flows, not mobile app completion | The repository overview defines the Next.js web app as the current product surface; mobile files are dirty unrelated work and remain out of scope | reversible
- Highest ROI first | Fix any mock-auth or gate drift before adding features | Launch trust beats more growth loops | reversible
- Composite local gate should become authoritative | `validate:full` should include product-copy/brand/route-contract gates, not only smoke/typecheck/build/E2E | Prevents a false local "green" before launch | reversible
- No live Supabase/Stripe mutations in tests | Continue test-mode mocks and route contract fixtures only | Project anti-patterns forbid live state from smoke checks | not reversible without owner approval

## Findings (cited - path:lines)
- P0 discovered by direct codegraph: `app/api/v1/profile/route.ts:9-12` authenticates with a hard-coded `mock-user-123` instead of `supabase.auth.getUser()`.
- Existing safe auth pattern: `app/api/v1/profile/analytics/route.ts:49-57` uses `supabase.auth.getUser()` and returns a Korean 401.
- Existing owner-scope pattern: `app/api/v1/cards/[id]/route.ts:116-131` authenticates and filters by `user.id`.
- Golden flows define current scope: `docs/golden-flows.md` makes capture, retrieval, shelf, snapshot, export/delete primary and sharing/PDF/checkout secondary compatibility.
- Deploy guide verification is narrower than package composite validation: `docs/deploy.md` lists product-copy + smoke + typecheck; `package.json` `validate:full` runs smoke + typecheck + build + E2E only.
- Dirty worktree risk: unrelated `DESIGN.md`, `mobile/**`, `next-env.d.ts`, `artifacts/**`, and `mobile/assets/**` changes exist and must not be staged by this work.

## Decisions (with rationale)
- Treat `profile` mock auth bypass as P0 despite one explorer not flagging it; direct source inspection is stronger evidence than flow-level route mocks.
- Start with a narrow auth/profile worker because it is a real launch correctness issue and touches few files.
- Then harden launch gate scripts/docs so future PRs cannot claim readiness while skipping product-copy, brand, and route-contract tests.
- Keep new growth/product feature work paused until auth and validation gates are clean.

## Scope IN
- Web app launch readiness for the current CoffeeDex golden flows.
- Auth/profile correctness, local validation scripts, docs alignment, route contract coverage, Playwright golden flow coverage.
- Existing PR branch `codex/market-opportunities-sprint`.

## Scope OUT (Must NOT have)
- No mobile redesign or edits under `mobile/**`.
- No marketplace, community social graph, referral, roaster B2B, or print fulfillment claims.
- No live Supabase or live Stripe mutations from tests.
- No reverting or staging unrelated dirty files.

## Open questions
- None for implementation. Adopted defaults are reversible and surfaced in plan TL;DR.

## Approval gate
status: approved-by-start-work-bootstrap
pending action: execute .omo/plans/coffeedex-launch-readiness.md from Todo 1
<!-- When exploration is exhausted and unknowns are answered, set status: awaiting-approval. -->
<!-- That durable record is the loop guard: on a later turn read it and resume at the gate instead of re-running exploration. -->

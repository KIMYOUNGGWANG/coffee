---
slug: coffeedex-memory-pivot
status: approved
intent: clear
pending-action: write .omo/plans/coffeedex-memory-pivot.md
approach: Contract-first migration of the existing Supabase app: pin CoffeeDex product truths, add truthful memory schema, implement guest draft and progressive auth, pivot dashboard/passport, then add trust operations and full browser verification.
---

# Draft: coffeedex-memory-pivot

## Components (topology ledger)
<!-- Lock the SHAPE before depth. One row per top-level component that can succeed or fail independently. -->
<!-- id | outcome (one line) | status: active|deferred | evidence path -->
1 | CoffeeDex contracts and canonical brand | active | docs/PRD-Hyangmi-v2.md; docs/api-spec.md; docs/golden-flows.md
2 | Truthful scan and repurchase memory model | active | app/api/v1/cards/scan/route.ts; app/api/v1/cards/route.ts; supabase/migrations
3 | Guest-first capture and progressive persistence auth | active | components/CardCreatorWizard.tsx; app/onboarding/page.tsx; lib/auth-redirect.ts
4 | Retrieval-first shelf and progressive passport | active | components/dashboard-client.tsx; lib/dashboard-card-filter.ts; app/api/v1/profile/analytics/route.ts
5 | Export, deletion, analytics, privacy and release QA | active | app/api/v1/profile/route.ts; lib/analytics-events.ts; app/legal/privacy/page.tsx; test
6 | PDF, Stripe, public share and story export | deferred | lib/commerce.ts; app/api/v1/pdf/route.ts; components/StoryExportModal.tsx

## Open assumptions (announced defaults)
<!-- Record any default you adopt instead of asking, so the user can veto it at the gate. -->
<!-- assumption | adopted default | rationale | reversible? -->
Backend | Keep Supabase and RLS | Current repo and contracts are Supabase-based; Firebase migration adds risk without user value | yes
Deferred features | Keep code, remove primary placement | User explicitly chose 후순위 | yes
Brand | CoffeeDex in user-visible copy/contracts; preserve historical DB identifiers | User explicitly chose CoffeeDex; schema renames would be destructive | yes
Guest model | Local ephemeral draft, authenticated persistence only | Preserves RLS and limits anonymous abuse | yes
Testing | TDD for contracts/domain/API; Playwright after UI wiring | Existing repository uses node tests and Playwright | yes
Git | No commits | User asked for development, not Git history operations; dirty tree contains prior work | yes

## Findings (cited - path:lines)

- Current PRD leads with viral passport/share and marketplace direction: docs/PRD-Hyangmi-v2.md:10-44.
- Current API contract requires authentication on all product routes: docs/api-spec.md:11-15.
- Existing scan schema forces strings/numeric taste estimates and prompt explicitly asks for educated guesses: app/api/v1/cards/scan/route.ts:9-20,198-199.
- Existing card schema has no repurchase intent, provenance, uncertainty, or process field: supabase/migrations/20260614000000_create_tasting_cards.sql:8-24.
- Existing analytics are checkout/share-led: lib/analytics-events.ts:3-19.
- Existing taste analytics generate a complete profile from any non-zero card count: app/api/v1/profile/analytics/route.ts:38-55,127-150.
- Smoke and typecheck pass before this work; worktree has broad pre-existing modifications that must be preserved.
- Research synthesis recommends recall/repurchase as the wedge, five-record preview, ten-record normal passport, rate-limited AI, and machine-readable export: .omo/ultraresearch/20260617-coffeedex-prd/SYNTHESIS.md.

## Decisions (with rationale)

- Define package claims independently from user-perceived metrics; AI never invents sensory scores.
- Add repurchase intent as `again | maybe | no | undecided`, defaulting to `undecided` for existing rows.
- Guest scanning uses a local/browser draft path; database writes remain authenticated and owner-scoped.
- Progressive passport is deterministic and evidence-labeled; AI prose cannot override sample-size state.
- CSV/JSON export is free. Existing designed PDF remains a secondary paid artifact.
- Account deletion is a deliberate confirmed operation that removes owned product rows/public access before deleting auth identity.

## Scope IN

- Docs/contracts, non-destructive migration, Zod schemas, API routes, hooks, wizard/onboarding, dashboard/search/passport, export/delete, analytics/privacy, tests and browser QA.

## Scope OUT (Must NOT have)

- No Firebase migration, marketplace, affiliate catalog, community feed, new brew-timer scope, background-upload promise, unconditional unlimited AI, or deletion of deferred monetization/share modules.

## Open questions

None. User resolved the surviving product forks: defer monetization/share surfaces and use CoffeeDex as the canonical brand.

## Approval gate
status: approved
approved-by: user message on 2026-06-18 ("1.후순위 2. CoffeeDex로가자" plus explicit OMO loop execution request)
<!-- When exploration is exhausted and unknowns are answered, set status: awaiting-approval. -->
<!-- That durable record is the loop guard: on a later turn read it and resume at the gate instead of re-running exploration. -->

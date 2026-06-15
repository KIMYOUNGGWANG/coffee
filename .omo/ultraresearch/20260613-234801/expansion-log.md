# Ultraresearch Expansion Log

Session: `.omo/ultraresearch/20260613-234801`
Core question: What direction should this product take to become a fully monetizable product, based on competitor research and the current codebase, then what execution plan should be prepared before ULW implementation?

## Phase 0 Decomposition

Axes:
- Codebase product reality: current CoffeeDex surfaces, API routes, data model, tests, and mismatch against Orchestrator Hub/starter docs.
- Monetization readiness: Stripe, credits, premium scan limits, PDF export, webhooks, entitlement states, and purchase UX.
- Competitive landscape: coffee journal apps, coffee subscription/ecommerce, roaster/community products, and general AI journaling/share-card patterns.
- Wedge and positioning: consumer coffee diary vs prosumer tasting lab vs roaster/community tool vs generalized "Dex" collectible journal platform.
- Technical risk and verification: build/test failures, auth-dependent routes, contract drift, API/schema mismatches, missing docs/env, and real-surface QA paths.

Codebase relevant: yes.
External research: yes.
Browsing: yes if dynamic pricing/app pages require it.
Verification likely: yes, especially build/test and API schema claims.
Report requested: no explicit report format; Markdown synthesis will be produced.

## Wave 1 Planned Workers

- explore/codebase-product-surface
- explore/backend-data-payments
- explore/frontend-ux-monetization
- explore/tests-docs-contract-drift
- librarian/consumer-coffee-journal-competitors
- librarian/coffee-subscription-roaster-market
- librarian/ai-ocr-photo-note-products
- librarian/social-share-card-and-creator-tools
- librarian/pricing-and-monetization-benchmarks
- librarian/korea-asia-specialty-coffee-sweep
- browsing/app-store-and-dynamic-landing-pages
- browsing/pricing-pages-and-paywalls
- repo-dive/open-source-coffee-or-tasting-apps
- repo-dive/next-supabase-stripe-starter-patterns

Convergence target: at least two expansion waves, then stop when no unchecked actionable leads remain or three consecutive waves produce no new actionable leads.

## Wave 1 Results

Spawn attempt: 14 workers planned. Tool concurrency allowed 6 workers; 8 additional spawn attempts failed with `agent thread limit reached`. Direct web browsing and local execution filled missing axes.

Completed workers:
- `019ec4e5-0c63-7e51-a297-bc61d5d6db59` product surface.
- `019ec4e5-16e3-7422-a061-a2c534d42618` backend/payments.
- `019ec4e5-2072-7f02-9f9d-bdaa17b676c6` frontend UX/monetization.
- `019ec4e5-2a2f-7e12-a93a-a57039e33d41` tests/contract drift.
- `019ec4e5-34c0-7242-8303-85246cbc7ce1` consumer coffee journal competitors.
- `019ec4e5-3d3a-7772-85e8-9b7fd2c10f79` subscription/roaster market.

Direct verification:
- `verify-local-commands.md`
- `verify-card-create-contract.md`

New lead clusters opened for Wave 2:
- Product action gaps: PDF export trigger, real story image download, checkout result handling, credit top-up UI, poster mismatch.
- Revenue integrity: webhook idempotency, subscription cancellation/revocation, profiles base table, PDF audit trail.
- Positioning: cloud-synced shareable coffee memory, local roaster lead-gen, affiliate/subscription routing.
- Trust/readiness: stale tests/docs, starter-vs-CoffeeDex identity cleanup, user-visible error states.

## Wave 2 Results

Completed workers:
- `019ec4e8-c90f-76f3-bfa5-11c78f09e95f` premium UX action gaps.
- `019ec4e8-d401-76a1-8028-6add50a6efaf` revenue integrity and database lifecycle.
- `019ec4e8-de0c-76a2-87a4-394c3a5307be` AI scan and trust analogues.
- `019ec4e8-e75a-74e2-a3c1-a921349d9d1b` share-card, recap, and B2B analogues.
- `019ec4e8-f118-7021-80a0-1292df15df37` Korea and Asia specialty coffee sweep.
- `019ec4e8-fa36-7a83-b70c-4303ccbbb9a2` pricing and packaging benchmark.

Converged lead clusters:
- CoffeeDex should not compete as a generic brew logger; Beanconqueror and Filtru already cover deep logging and brew assistance.
- The strongest wedge is a Korean-friendly AI coffee memory product: package scan, editable taste record, polished share artifact, personal taste map, and later roaster/referral layer.
- Monetization should protect high-cost/high-value workflows: AI scan enrichment, premium analytics, export templates, PDF/story artifacts, and eventually roaster lead-gen.
- Current code is not production-billing ready because webhook fulfillment is not idempotent, subscription lifecycle is one-way, profile bootstrap is synthetic, and paid export UX is incomplete.
- Current verification is not launch-grade: `npm` is missing from PATH, smoke tests are stale starter tests, typecheck passes through bundled Node, and Next build is blocked by environment/dependency issues.

Open execution decisions:
- Whether to make Korea-first specialty coffee and roaster discovery the explicit product wedge now, or keep it global-consumer-first.
- Whether to remove/defer the poster product until a real export/print flow exists, or implement a complete poster SKU.
- Whether to choose tests-after for the first stabilization pass, or stricter TDD before touching each surface.

## Convergence Verdict

Two expansion waves produced no new independent strategic direction after Wave 2; later leads collapsed into implementation work. Proceed to synthesis and approval brief before creating the ULW plan file.

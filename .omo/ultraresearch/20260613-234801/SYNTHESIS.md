# CoffeeDex Productization And Monetization Synthesis

## Decision

CoffeeDex should become an AI coffee memory and collector artifact product, not a generic brew logger.

The winning wedge is:

1. Scan a coffee bag or enter a bean manually.
2. Convert it into a structured, editable tasting memory.
3. Generate a beautiful share card, taste map, and archive.
4. Monetize premium exports, AI enrichment, analytics, and later roaster/referral surfaces.

The strongest market angle is Korea-first specialty coffee with global-ready architecture. Korean roasters already run subscription, wholesale, education, and community motions; CoffeeDex can become the missing consumer-to-roaster memory layer.

## Competitor Map

Direct coffee tools:
- [Beanconqueror](https://beanconqueror.com/) already covers deep brew logs, bean tracking, roast management, statistics, device integration, and local/offline storage.
- [Filtru](https://filtru.coffee/) covers brew guidance, espresso tools, bean journal, Bluetooth support, and roaster/business surfaces.
- [Aeromatic](https://aeromatic.app/) owns a focused AeroPress recipe/stopwatch/logging niche.
- [Acaia apps](https://acaia.co/pages/apps) connect brew recipes, scales, and roaster workflows to hardware.

Adjacent scan/community products:
- [Vivino](https://www.vivino.com/en/app) proves scan works when it leads into identity resolution, tasting notes, personal taste tracking, recommendations, and commerce.
- [Delectable](https://www.delectable.com/) is a scan-to-expert-notes and shop path analogue.
- [Untappd](https://untappd.com/) shows that ratings, badges, venue context, and business dashboards can monetize a hobby log.

Share/identity/recap products:
- [Letterboxd Pro](https://letterboxd.com/pro/) sells identity, stats, filtering, and visual control around a collection habit.
- [Spotify Wrapped](https://newsroom.spotify.com/2025-wrapped/) shows that polished personalized recaps can become user-driven acquisition.
- [Day One](https://dayoneapp.com/plans/) and [Bear](https://bear.app/) validate free journaling with paid media, sync, export, OCR, AI, themes, and advanced workflows.

Roaster and subscription market:
- [Trade Coffee](https://www.drinktrade.com/) and [Atlas Coffee Club](https://atlascoffeeclub.com/) validate quiz, personalization, recurring delivery, and roaster discovery.
- Korean roaster sites such as [TERAROSA](https://www.terarosa.com/), [Fritz](https://fritz.co.kr/), [Momos](https://www.momos.co.kr/), and [Anthracite](https://www.anthracitecoffee.com/) expose subscription, wholesale, collaboration, business purchase, education, and community surfaces.

## Monetization Direction

Recommended ladder:

- Free: manual cards, limited monthly scans, basic notes, one story theme, basic archive.
- Credits: non-subscriber AI scan/enrichment/export packs.
- Premium: unlimited or much higher scan limits, advanced taste maps, yearly recap, more export themes, PDF generation, batch operations, and richer analytics.
- One-time artifacts: single PDF/export purchase first; poster only after a real print-ready export path exists.
- Later B2B/affiliate: roaster profiles, referral links, branded recipe pages, coupons, lead-gen, and roaster analytics.

Do not paywall basic truthfulness or manual logging. Paywall repeated compute, polished presentation, durable exports, and power-user analysis.

## Current Code Reality

Highest-risk gaps found:

- Card creation contract mismatch: `components/CardCreatorWizard.tsx:144-160` sends snake_case fields, while `app/api/v1/cards/route.ts:6-21` accepts camelCase and maps only `imageUrl`, `aiDescription`, and `footerMeta`.
- Webhook idempotency is missing: `app/api/v1/webhooks/stripe/route.ts:35-118` mutates entitlements with no processed-event ledger or Stripe object dedupe.
- Credit top-up can over-credit: `app/api/v1/webhooks/stripe/route.ts:59-80` fetches current credits and writes `currentCredits + 10`.
- Subscription lifecycle is incomplete: premium only sets `is_premium: true`; no `invoice.*`, `customer.subscription.*`, cancellation, expiry, or failed-payment handling.
- Profile bootstrap is synthetic: `app/api/v1/profile/route.ts:24-35` returns defaults if no row exists, but does not insert a profile.
- PDF product is incomplete: `app/api/v1/pdf/route.ts:52-60` returns JSON, not a PDF file.
- Story export is incomplete: `components/StoryExportModal.tsx:268-271` only alerts instead of downloading an image.
- Poster SKU is misleading: `components/PaymentDialog.tsx:135-166` says poster but sends `pdf_book`.
- Tests and docs still reference the starter product: `test/smoke.test.mjs:14-67` asserts SaaS starter flows, missing `docs/golden-flows.md`, and stale copy such as `Official SaaS Layer`.
- Local verification is uneven: bundled Node typecheck passed, but smoke tests failed and Next build is blocked by missing `npm` / SWC environment issues.

## Build Path

Phase 1: Stabilize the product contract.
- Fix card create payload mapping.
- Rewrite stale tests and docs around CoffeeDex.
- Resolve the local build environment and Next root/SWC issue.
- Remove or quarantine starter SaaS surfaces that are not part of CoffeeDex.

Phase 2: Make paid value real.
- Add checkout success/cancel handling.
- Convert story export from alert to image download.
- Add a real PDF download/export path or downgrade the claim until it exists.
- Remove/defer poster SKU unless a complete poster flow is implemented.
- Add visible credit top-up only if credit spend is wired end-to-end.

Phase 3: Make billing production-safe.
- Add Stripe event/fulfillment ledger.
- Make credit grants idempotent.
- Add subscription lifecycle handlers and live subscription endpoint.
- Add profile bootstrap migration and entitlement audit records.

Phase 4: Make the product sticky.
- Add scan confidence and correction workflow.
- Add taste map, yearly recap, and shareable public card/recap surfaces.
- Add Korean specialty coffee vocabulary and local roaster catalog hooks.

Phase 5: Add ecosystem revenue.
- Start with affiliate/reorder links.
- Then build claimed roaster pages and branded recipes.
- Add roaster analytics only after consumer logs create demand.

## Recommended Default Choices

- Product wedge: Korea-first AI coffee memory with later roaster/referral layer.
- First paid promise: premium scan/export/taste-map bundle, not generic "unlimited cards".
- Artifact priority: story image export first, PDF second, poster later.
- Test strategy: tests-after stabilization for the first pass, then TDD for billing lifecycle work.
- Poster: remove/defer until real.
- Credits: expose after spend/decrement is wired, not before.

## Remaining Approval Questions

1. Confirm the wedge: Korea-first consumer + roaster lead-gen, or global consumer-only?
2. Confirm artifact scope: remove/defer poster now, or implement a real poster SKU?
3. Confirm test posture: tests-after for stabilization, or strict TDD for every change?

## Sources

- Beanconqueror: https://beanconqueror.com/
- Filtru: https://filtru.coffee/
- Filtru Business: https://business.filtru.coffee/
- Aeromatic: https://aeromatic.app/
- Acaia apps: https://acaia.co/pages/apps
- Vivino app: https://www.vivino.com/en/app
- Vivino marketplace: https://www.vivino.com/en/
- Delectable: https://www.delectable.com/
- Untappd: https://untappd.com/
- Untappd for Business pricing: https://utfb.untappd.com/how-much-is-untappd-for-business/
- Letterboxd Pro: https://letterboxd.com/pro/
- Spotify Wrapped newsroom: https://newsroom.spotify.com/2025-wrapped/
- Trade Coffee: https://www.drinktrade.com/
- Atlas Coffee Club: https://atlascoffeeclub.com/
- TERAROSA: https://www.terarosa.com/
- Fritz Coffee Company: https://fritz.co.kr/
- Momos Coffee: https://www.momos.co.kr/
- Anthracite Coffee: https://www.anthracitecoffee.com/
- Google Vision docs: https://docs.cloud.google.com/vision/docs
- Google Vision pricing: https://cloud.google.com/vision/pricing
- Stripe webhooks: https://docs.stripe.com/webhooks
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security

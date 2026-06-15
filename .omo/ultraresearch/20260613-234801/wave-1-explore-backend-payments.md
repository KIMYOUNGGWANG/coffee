# Wave 1 Explore: Backend, Supabase, Payments

Worker: `019ec4e5-16e3-7422-a061-a2c534d42618`

## Digest

- Protected CoffeeDex API routes consistently call `supabase.auth.getUser()`.
- Supabase migrations define `tasting_cards`, `brewing_notes`, credit/PDF/premium/scan fields, and RPCs for credit/scan flows.
- `profiles` base table is assumed but not created in this repo.
- Stripe checkout and webhook are wired, but webhook fulfillment has no processed-event store, no idempotency guard, and no subscription cancellation/expiry handling.
- `/api/v1/subscription` is a starter stub, not real billing state.
- Important correction: the worker claimed card creation payloads were aligned. Direct code review refuted this for the actual wizard submit path:
  - `components/CardCreatorWizard.tsx:144-160` sends `image_url`, `ai_description`, and `footer_meta`.
  - `app/api/v1/cards/route.ts:6-21` accepts `imageUrl`, `aiDescription`, and `footerMeta`.
  - `hooks/useTastingCards.ts:63-68` passes the object through unchanged.

## EXPAND

- LEAD: Stripe webhook has no event deduplication or processed-event store - WHY: duplicate `checkout.session.completed` deliveries can over-credit `credits_10` purchases - ANGLE: inspect whether any table or log exists for Stripe event IDs or payment intent IDs outside `/app/api/v1/webhooks/stripe/route.ts`
- LEAD: Premium entitlement is never revoked - WHY: `is_premium` is only set true on purchase completion, so cancellation/expiry cannot be reflected - ANGLE: search for invoice, subscription, or downgrade handlers across `/app/api`, `/lib`, and `/supabase`
- LEAD: Base `profiles` table is missing from this repo - WHY: all entitlement migrations assume an existing table, so true schema shape may differ in the deployed database - ANGLE: search the wider project or Supabase SQL history for `CREATE TABLE profiles`
- LEAD: Scan result contract does not directly feed card creation - WHY: scan output uses `metric1_acidity`/`metric2_sweetness`/`metric3_body` while card create expects `metric1`/`metric2`/`metric3` plus `aiDescription` and `footerMeta` - ANGLE: search the UI for a transform from scan result to `/api/v1/cards` payload
- LEAD: PDF entitlement has no audit or revocation path - WHY: `has_pdf_access` is a simple boolean flag with no server-side lifecycle beyond the webhook update - ANGLE: search for PDF export logging, entitlement checks, or refund handling in the app
- LEAD: Brewing-note insert path uses `|| null` on optional numeric fields - WHY: falsey numeric values would be coerced to null if schema constraints ever changed - ANGLE: review whether client forms can submit zero-like values or whether the schema should use nullish coalescing instead

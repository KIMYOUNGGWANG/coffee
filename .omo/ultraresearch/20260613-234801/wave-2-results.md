# Wave 2 Results

## Product UX Gaps

- PDF checkout exists, but the dashboard does not consume `checkout_status` / `item_type` return params.
- `/api/v1/pdf` returns JSON bundle metadata, not a downloadable PDF artifact.
- Story export preview is real UI, but the download button only shows an alert.
- `credits_10` exists in checkout/webhook code, but no visible payment UI exposes it.
- Poster purchase is a mock: the UI says poster but calls `handleCheckout("pdf_book")`; loading state checks `poster`.
- AI note generation and final card submission failures are console-only, so recovery is weak.

## Revenue Integrity

- Stripe webhook handles only `checkout.session.completed`.
- No processed-event ledger, `event.id` dedupe, checkout session dedupe, or payment intent dedupe.
- Credit top-up uses read-modify-write (`currentCredits + 10`), so duplicate webhook delivery can over-credit.
- Premium entitlement only sets `is_premium: true`; no subscription cancellation, payment failure, expiry, refund, or downgrade path.
- PDF access is a one-way boolean flag with no audit/revocation table.
- Profile API returns synthetic defaults when the row is missing instead of bootstrapping the row.
- The migration set alters `profiles` but does not create it.

## Scan And Trust Analogues

- Vivino and Delectable show scan is the entry point, not the product.
- Strong loop: scan -> identify -> confirm/correct -> save -> compare -> recommend/reorder.
- CoffeeDex needs confidence display, correction UX, immutable scan payloads, and a canonical coffee/roaster layer over raw OCR.
- Premium limits should protect compute-heavy enrichment and batch workflows, not basic manual logging.

## Share, Recap, And Artifact Analogues

- Letterboxd Pro monetizes identity, stats, filters, and visual control.
- Spotify Wrapped proves that polished personalized recap cards become acquisition loops.
- Untappd shows a consumer check-in loop can become B2B menu/venue analytics.
- CoffeeDex cards should be treated as share units, and PDFs/posters as serious collector artifacts.

## Korea / Asia Market

- Korean specialty roasters already expose subscription, wholesale, collaboration, business purchase, education, and community surfaces.
- TERAROSA, Fritz, Momos, and Anthracite validate subscription plus B2B/wholesale behavior.
- Korea-first positioning is stronger than generic global launch because language, local roaster catalog, subscription cadence, and mobile payment expectations matter.

## Pricing And Packaging

- Recommended ladder: useful free tier, credit packs, premium monthly/annual, one-time PDF/export purchases, and later B2B/affiliate.
- Benchmarks point to exports, sync, media, AI, analytics, and templates as acceptable paid gates.
- Suggested first public pricing after feature alignment: free, $4.99 credit pack, $6.99-$7.99 premium monthly, $59.99-$69.99 annual, $2.99-$9.99 one-time exports.

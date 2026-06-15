# CoffeeDex Productization Approval Draft

## Recommendation

Proceed with CoffeeDex as a Korea-first AI coffee memory product.

Positioning:
- Not "another coffee logger."
- Not "a coffee subscription marketplace" yet.
- Yes: scan/manual record -> tasting memory -> share card -> taste map/export -> roaster/referral layer.

## Why This Direction

- Deep coffee logging is already crowded by Beanconqueror, Filtru, Aeromatic, and hardware-linked apps.
- Vivino, Delectable, and Untappd show that scan/check-in products monetize after they become identity, trust, recommendations, and commerce loops.
- Letterboxd and Spotify Wrapped show that polished personal artifacts can become retention and acquisition surfaces.
- Korean specialty roasters already expose subscription, wholesale, classes, libraries, and collaboration flows, so a local roaster graph is credible later.

## First Productization Plan Shape

1. Stabilize truth:
   - Fix card creation contract mismatch.
   - Replace stale starter tests/docs with CoffeeDex tests/docs.
   - Fix local build verification.

2. Make paid promises real:
   - Story image download.
   - PDF export/download.
   - Checkout return feedback.
   - Honest payment dialog copy.

3. Make billing safe:
   - Stripe idempotency ledger.
   - Credit grant/spend lifecycle.
   - Subscription cancellation/revocation handlers.
   - Profile bootstrap and entitlement audit trail.

4. Make the loop sticky:
   - Scan confidence/correction.
   - Taste map.
   - Yearly/monthly recap.
   - Shareable card/recap pages.

5. Add ecosystem revenue:
   - Affiliate/reorder links.
   - Roaster profiles.
   - Branded recipe pages.
   - Roaster analytics after demand exists.

## Recommended Defaults For Plan

- Wedge: Korea-first consumer app plus later roaster lead-gen.
- Tests: tests-after for stabilization; TDD for billing lifecycle.
- Poster: remove/defer until a real poster export or print flow exists.
- Credits: keep backend concept, but expose UI only after spend/decrement and idempotent fulfillment are wired.
- Pricing: useful free tier, $4.99 credit pack, $6.99-$7.99 premium monthly, $59.99-$69.99 annual, $2.99-$9.99 one-time exports.

## Approved Defaults

The user approved the recommended defaults on 2026-06-14:

- Use Korea-first consumer productization with a later roaster lead-gen layer.
- Remove/defer poster until a real poster export or print flow exists.
- Use tests-after for stabilization and TDD for billing lifecycle.
- Keep credits as a backend concept, but expose credit purchase UI only after spend/decrement and idempotent fulfillment are wired.
- First implementation scope is productization stabilization and paid-feature truthfulness; live roaster marketplace/community features stay out of scope for this pass.

# Wave 1 Explore: Product Surface

Worker: `019ee13b-e23f-7f20-81b3-84b967c3ed20`

## Key Findings

- Current shipped product is a Korea-first coffee memory product centered on recall and repurchase.
- Main surfaces: landing, onboarding Taste Finder, dashboard shelf/log/passport/settings, tasting-card CRUD, AI note, package scan, analytics/passport, auth resume, Stripe checkout, webhook entitlements.
- Current brand identity is CoffeeDex in code/docs, while the user and older docs still call it Hyangmi.
- Current capability boundaries are defined by `/Users/kim-young-gwang/Desktop/projects/dex/docs/api-spec.md`, `/Users/kim-young-gwang/Desktop/projects/dex/docs/golden-flows.md`, `/Users/kim-young-gwang/Desktop/projects/dex/docs/deploy.md`, and copy/smoke tests.
- Product must not claim generic SaaS/workspaces, live marketplace, referral network, community feed, roaster partnership, distributed guest-scan rate limiting, raw scan image retention, storage cleanup, AI certainty, quality guarantees, or purchase guarantees.

## Code Sources

- `/Users/kim-young-gwang/Desktop/projects/dex/app/page.tsx`
- `/Users/kim-young-gwang/Desktop/projects/dex/app/onboarding/page.tsx`
- `/Users/kim-young-gwang/Desktop/projects/dex/components/dashboard-client.tsx`
- `/Users/kim-young-gwang/Desktop/projects/dex/app/api/v1/cards/route.ts`
- `/Users/kim-young-gwang/Desktop/projects/dex/app/api/v1/cards/scan/route.ts`
- `/Users/kim-young-gwang/Desktop/projects/dex/app/api/v1/profile/analytics/route.ts`
- `/Users/kim-young-gwang/Desktop/projects/dex/docs/api-spec.md`
- `/Users/kim-young-gwang/Desktop/projects/dex/docs/golden-flows.md`
- `/Users/kim-young-gwang/Desktop/projects/dex/test/product-copy.test.mjs`
- `/Users/kim-young-gwang/Desktop/projects/dex/test/smoke.test.mjs`

## Verbatim EXPAND Markers

- LEAD: `components/dashboard-billing-status-panel.tsx` and `app/api/v1/subscription/route.ts` current subscription surface - WHY: pricing/entitlement claims are part of the shipped dashboard and can overstate what is actually active - ANGLE: inspect the visible copy and the subscription response contract
- LEAD: `components/PaymentDialog.tsx` vs `lib/commerce.ts` product catalog - WHY: checkout CTA labels and item types need to stay aligned with the paid claims surfaced on landing/dashboard - ANGLE: compare checkout button copy, item types, and success/cancel handling
- LEAD: `app/api/v1/pdf/route.ts` and `components/story-export`/PDF export surfaces - WHY: PDF/export is explicitly secondary, but still a claim-bearing user flow that may need tighter boundary wording - ANGLE: verify whether export is reachable from the dashboard and whether the copy matches the “secondary compatibility” contract
- LEAD: `app/api/v1/account/route.ts` and `lib/account-deletion.ts` - WHY: account deletion and retention claims are user-trust critical and must match privacy/terms copy exactly - ANGLE: trace delete order, redaction behavior, and storage-object handling
- LEAD: `app/api/v1/public/cards/[token]/route.ts` and public share components - WHY: public sharing is listed as secondary compatibility and may still expose claim language that needs audit - ANGLE: search public-card/share routes and modal copy for “story card” or “share” promises

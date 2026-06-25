# Wave 1 Explore: Checkout And Entitlements

Worker: `019ee13b-e6cc-7633-85f2-cab2062d408e`

## Key Findings

- Sellable today: `premium_subscription`, `credits_10`, and `pdf_book`.
- Prices are app-defined constants in `/Users/kim-young-gwang/Desktop/projects/dex/lib/commerce.ts`, not a dynamic Stripe catalog.
- Real infrastructure exists for checkout sessions, webhook verification, event dedupe, entitlement state updates, audit rows, subscription status read-model, PDF gating, checkout return UX, and support intake.
- Starter/scaffold residue remains in workspaces/profile/contracts and should not be treated as product direction.
- Unsupported claims: mature subscription orchestration, generalized Stripe ingestion, live Stripe pricing catalog, storage cleanup, PDF for all users, enterprise/marketplace/community/referral/wholesale/roaster monetization.

## Sources

- `/Users/kim-young-gwang/Desktop/projects/dex/app/api/v1/checkout/route.ts`
- `/Users/kim-young-gwang/Desktop/projects/dex/app/api/v1/webhooks/stripe/route.ts`
- `/Users/kim-young-gwang/Desktop/projects/dex/lib/commerce.ts`
- `/Users/kim-young-gwang/Desktop/projects/dex/lib/stripe-fulfillment.ts`
- `/Users/kim-young-gwang/Desktop/projects/dex/components/PaymentDialog.tsx`
- `/Users/kim-young-gwang/Desktop/projects/dex/components/landing-pricing-section.tsx`
- `/Users/kim-young-gwang/Desktop/projects/dex/test/checkout-products.test.mjs`
- `/Users/kim-young-gwang/Desktop/projects/dex/test/subscription-lifecycle.test.mjs`

## Verbatim EXPAND Markers

none - worker ended with `## EXPAND tail` but no actionable markers.

# Wave 1 Explore: Frontend UX and Monetization

Worker: `019ec4e5-2072-7f02-9f9d-bdaa17b676c6`

## Digest

- Paywall entry exists in `app/dashboard/page.tsx`; modal is `components/PaymentDialog.tsx`.
- Payment options visible: premium subscription, PDF book, and a poster card. Poster incorrectly calls `handleCheckout("pdf_book")` while spinner checks `loadingItem === "poster"`.
- Onboarding page is informational only: no state, submit handler, persistence, or activation flow.
- Dashboard has card list loading/error/empty states, but profile/analytics errors are weakly surfaced.
- Card wizard has a strong two-pane creation flow but poor surfaced failure states; AI note failure only logs to console.
- Story export visually exists but image download is not real; it only alerts the user to screenshot manually.
- Checkout redirects include `checkout_status` query params, but dashboard does not consume them.

## EXPAND

- LEAD: Add checkout success/cancel handling on the dashboard - WHY: Stripe redirects back with query params but the page does not consume them, so purchase completion has no visible confirmation or recovery - ANGLE: search for `checkout_status` handling in `app/dashboard/page.tsx` and any toast/banner patterns in the repo
- LEAD: Fix the poster checkout mismatch - WHY: the poster CTA posts `pdf_book` and spinner state checks `poster`, so the UI promise and the actual product are inconsistent - ANGLE: inspect `components/PaymentDialog.tsx` and `app/api/v1/checkout/route.ts` for a distinct poster item type
- LEAD: Replace the story download alert with a real export pipeline - WHY: the export modal currently advertises download but only shows an alert, which is a conversion and trust break - ANGLE: search for `html2canvas`, `canvas`, `toDataURL`, or any image export utility in `components` and `app`
- LEAD: Add surfaced error states for AI note generation and scan failures - WHY: current failures are mostly console-only or generic, so users can get stuck without a retry path - ANGLE: search `components/CardCreatorWizard.tsx` for `catch` blocks and compare to toast/error patterns elsewhere
- LEAD: Turn onboarding into an actual first-run flow - WHY: the onboarding page is only a checklist with dead buttons, so it does not move users toward activation - ANGLE: search for onboarding persistence, redirect, or signup hooks connected to `/onboarding`
- LEAD: Audit premium/paywall copy versus product reality - WHY: the dashboard and landing page sell multiple paid benefits, but some are not fully implemented in the frontend, which can inflate expectations - ANGLE: cross-check `app/page.tsx`, `app/dashboard/page.tsx`, `components/PaymentDialog.tsx`, and `app/api/v1/pdf/route.ts`

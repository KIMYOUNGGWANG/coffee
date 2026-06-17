# Wave 1 Codebase Digest: Conversion Surfaces

Worker: explorer `019ec984-6137-7513-817d-f54b57fa9230`

## Key Findings

- Conversion surfaces are concentrated in landing/pricing, PaymentDialog, auth gate, billing support, onboarding, dashboard funnel, checkout notices, and public share.
- Most generic surfaces: `components/landing-pricing-section.tsx`, `components/PaymentDialog.tsx`, `components/auth-gate-client.tsx`, `app/onboarding/page.tsx`, `components/revenue-funnel-panel.tsx`, `components/billing-support-form.tsx`.
- Existing regression coverage is strong: pricing/event routing, payment dialog auth/error states, checkout return notices, auth resume, public share, and funnel logic.
- Minimal high-impact direction: replace generic three-card pricing/paywall treatment with an editorial “choose your path” hierarchy; make the auth gate feel like a resume gate; make support a guided recovery flow.

## Verbatim EXPAND

- LEAD: Payment dialog is the weakest brand surface and most template-like — WHY: it repeats three near-identical product rows with a generic “packages” header — ANGLE: redesign `components/PaymentDialog.tsx` with product-specific hierarchy and check `test/payment-dialog.test.ts`
- LEAD: Landing pricing is functional but visually generic — WHY: the three-card grid reads like a SaaS starter pricing block, not a Hyangmi conversion moment — ANGLE: rework `components/landing-pricing-section.tsx` and keep `test/product-operations.test.ts` intact
- LEAD: Onboarding still looks like starter scaffolding — WHY: it uses generic shell/panel/checklist layout and only weakly activates the funnel — ANGLE: replace `app/onboarding/page.tsx` with a stronger activation sequence and confirm the auth activation path with `test/auth-gate.test.ts`
- LEAD: Auth gate needs to feel like resume, not login — WHY: current form is standard and the redirect context is under-emphasized — ANGLE: redesign `components/auth-gate-client.tsx` while preserving `test/auth-resume.test.ts`
- LEAD: Dashboard funnel should become a clearer conversion sequence — WHY: the funnel panel is a good logic layer but still reads as a generic widget — ANGLE: adjust `components/revenue-funnel-panel.tsx` and verify with `test/revenue-funnel.test.mjs`
- LEAD: Checkout return states need more product-specific outcomes — WHY: success/cancel notices are useful but still generic in tone — ANGLE: update `components/dashboard-checkout-notice.tsx` and re-run `test/checkout-return.test.ts`
- LEAD: Support intake is a plain form that can be more guided — WHY: the page and form are correct but visually ordinary for a recovery flow — ANGLE: reshape `app/support/billing/page.tsx` plus `components/billing-support-form.tsx` and keep the support API contract stable


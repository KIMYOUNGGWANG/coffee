# Wave 1 Explore: Product Surface

Worker: `019ec4e5-0c63-7e51-a297-bc61d5d6db59`

## Digest

- Current user-facing funnel is `/` landing -> `/dashboard` -> modal-driven create/detail/share/payment flows.
- CoffeeDex-specific UI files:
  - `/Users/kim-young-gwang/Desktop/projects/dex/app/page.tsx`
  - `/Users/kim-young-gwang/Desktop/projects/dex/app/dashboard/page.tsx`
  - `/Users/kim-young-gwang/Desktop/projects/dex/components/CardCreatorWizard.tsx`
  - `/Users/kim-young-gwang/Desktop/projects/dex/components/CardDetailModal.tsx`
  - `/Users/kim-young-gwang/Desktop/projects/dex/components/PaymentDialog.tsx`
  - `/Users/kim-young-gwang/Desktop/projects/dex/components/StoryExportModal.tsx`
  - `/Users/kim-young-gwang/Desktop/projects/dex/hooks/useTastingCards.ts`
- Real API surface centers on `/api/v1/cards`, `/api/v1/cards/ai-note`, `/api/v1/cards/scan`, `/api/v1/profile`, `/api/v1/profile/analytics`, `/api/v1/checkout`, `/api/v1/webhooks/stripe`, and `/api/v1/pdf`.
- Starter leftovers still exist: `/api/v1/workspaces`, `/api/v1/subscription`, `/app/onboarding/page.tsx`, and `/lib/contracts.ts`.
- Largest productization gaps: `/api/v1/pdf` is implemented but unreachable from dashboard UI, poster purchase is a mock over `pdf_book`, `checkout_status` redirect state is not consumed, `useUpdateTastingCard` is unused, and starter docs/stubs conflict with CoffeeDex.

## EXPAND

- LEAD: `POST /api/v1/pdf` is implemented but unreachable from the dashboard UI - WHY: this is the clearest missing premium product action - ANGLE: search for any hidden PDF button, menu action, or modal trigger in `app/dashboard/page.tsx`, `components/*`, and `app/page.tsx`
- LEAD: `checkout_status=success|cancel` is written by Stripe but not consumed anywhere - WHY: purchase UX likely lacks success/cancel state handling or entitlement refresh - ANGLE: search for query-param handling in `app/dashboard/page.tsx` and any redirect/success notice components
- LEAD: `useUpdateTastingCard` exists but has no consumer - WHY: edit/update card UX may be missing despite backend support - ANGLE: search for card edit affordances, inline mutation usage, or modal form reuse in `components/*`
- LEAD: `credits_10` billing path exists in checkout/webhook but no user-facing trigger is present - WHY: top-up monetization is partially built but not productized - ANGLE: search for `credits_10`, "10-pack", "credit", or "top-up" in UI and docs
- LEAD: `app/onboarding/page.tsx` is starter scaffolding, not CoffeeDex onboarding - WHY: public route inventory includes non-product noise that can mislead route maps - ANGLE: search for any CoffeeDex-specific onboarding or auth redirect flow elsewhere in the repo
- LEAD: `app/api/v1/subscription/route.ts` and `app/api/v1/workspaces/route.ts` are starter stubs - WHY: they are route noise unless the product intends workspace/subscription primitives - ANGLE: search for any CoffeeDex UI or API consumer of these endpoints

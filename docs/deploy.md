# CoffeeDex Deploy Guide

This guide records the current deploy truth for CoffeeDex, a Korea-first AI specialty coffee memory and artifact product built on Next.js, Supabase, Stripe, and an optional AI provider key.

## Runtime

- App host: Vercel
- Framework: Next.js 16 App Router
- Data/auth/storage: Supabase
- Payments: Stripe Checkout and Stripe webhooks
- AI note and package scan provider: Gemini through `AI_API_KEY` for package extraction; the existing note adapter also reads this key
- Product boundary: private tasting archive, assisted scan/note drafts, digital story/PDF exports. Roaster partnership, referral, and community layers are future work, not deploy-time capabilities.

## Required Environment

Set these variables in Vercel and in the local shell used for build or route verification:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_APP_URL` | Absolute app URL for Stripe return links. |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL used by browser and server clients. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public Supabase anon key. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side Supabase service key for privileged route work. |
| `STRIPE_SECRET_KEY` | Stripe server key for Checkout sessions. |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret. |
| `STORAGE_BUCKET_UPLOADS` | Supabase Storage bucket name for uploaded images. |

## Optional / Recommended Production Environment

The current runtime schema accepts these variables as optional. Configure them for production quality when the matching provider is enabled, but do not treat them as required by local validation or route-contract tests:

| Variable | Purpose |
| --- | --- |
| `RESEND_API_KEY` | Optional email provider key for outbound support or transactional email paths when enabled. |
| `NEXT_PUBLIC_POSTHOG_KEY` | Optional analytics key for production product instrumentation when enabled. |
| `NEXT_PUBLIC_SENTRY_DSN` | Optional Sentry DSN for production error reporting when enabled. |
| `AI_API_KEY` | Optional AI provider key for tasting notes and package scans; routes must fall back or return manual-entry states when it is absent. |

## Supabase Checklist

- Apply the database migrations for `tasting_cards`, coffee-memory/provenance fields, product events, profile credits/access fields, scan limits, shelf items, brewing logs, and brewing notes.
- Confirm row-level security keeps `tasting_cards.user_id` scoped to the authenticated user.
- Confirm profile defaults provide one free credit, PDF access off, premium off, zero scans used, and the configured monthly scan limit.
- Confirm Storage has the upload bucket named by `STORAGE_BUCKET_UPLOADS`.
- Verify free JSON and CSV exports can owner-filter `tasting_cards`, `brewing_notes`, `coffee_shelf_items`, and `brewing_logs`.
- Verify `SUPABASE_SERVICE_ROLE_KEY` is server-only and account deletion can redact audit rows before deleting owned rows, the profile, and finally the Auth identity.

## Guest Scan Deployment Boundary

- The scan route accepts only JPEG, PNG, or WebP data URLs that pass canonical base64, decoded 5 MiB size, MIME, and magic-byte checks.
- Raw scan images are passed to the provider in request memory and are not persisted by the CoffeeDex route. Guest text drafts use browser storage for less than 24 hours and exclude raw image data.
- The anonymous one-trial map is process-local and IP-derived. It resets on instance restart and is not distributed across Vercel instances. Do not present it as production distributed rate limiting or an abuse-security boundary.
- A production distributed limit would require a shared store and trusted edge identity handling; that is not implemented here.

## Privacy And Analytics Boundary

- Product events contain allowlisted operational fields such as event name, path, surface, session identifier, and attribution/checkout identifiers. Do not add raw images, tasting notes, package claims, or arbitrary user payloads.
- Account deletion anonymizes product-event ownership and redacts Stripe event identifiers/payloads before deleting owned product data. Retained rows are limited to audit, dispute, security, and aggregate operational needs.
- The current deletion implementation does not delete Storage objects; deployment and legal copy must not claim storage cleanup until an executable cleanup contract exists.

## Stripe Checklist

- Configure Checkout products for CoffeeDex Premium, tasting-card credits, and PDF export using the prices currently represented in the app.
- Point the Stripe webhook endpoint at `/api/v1/webhooks/stripe`.
- Store the webhook signing secret in `STRIPE_WEBHOOK_SECRET`.
- Use test-mode fixtures for local verification; do not use live-mode mutation for smoke checks.

## Verification

The authoritative local launch gate is:

```bash
npm run validate:full
```

It runs product-copy, brand, smoke, route-contract, typecheck, build, and Playwright E2E coverage using existing local fixtures. Product-truth verification alone is:

```bash
npm run test:product-truth
```

Route-contract verification alone is:

```bash
npm run test:routes
```

Use the npm scripts above for this workspace. They do not require live Supabase or Stripe mutation.

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
- The anonymous one-trial map and request throttles for guest scan, analytics, and support intake are process-local and IP-derived. They reset on instance restart and are not distributed across Vercel instances. Do not present them as production distributed rate limiting or an abuse-security boundary.
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

## Launch Rollback And Observability Checklist

Use this as the binary prelaunch gate after local validation passes. Local validation proves source contracts and build behavior; production operator actions prove the deployed Vercel, Supabase, and Stripe control planes are ready. Do not paste raw secrets, live customer payloads, or provider tokens into evidence.

### Local Validation Gate

- [ ] `npm run validate:full` exits 0 on the release candidate.
- [ ] `npm run test:routes` exits 0 without live Supabase or Stripe mutation.
- [ ] Product-copy checks still reject marketplace, referral, roaster partnership, community social graph, and print-fulfillment claims.

### Production Operator Gate

- [ ] Vercel has a known previous healthy production deployment available for instant rollback; record only the deployment id, timestamp, and operator.
- [ ] Supabase migration status matches the repository migration history before launch. Rollback is a forward repair migration or a restore from the approved database backup point; do not rewrite applied migrations.
- [ ] Stripe is in test mode for launch rehearsal, and the webhook endpoint shows successful delivery for `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, and `invoice.payment_failed`.
- [ ] Stripe webhook retries are clear or explained before launch; any duplicate event is expected to resolve as idempotent rather than grant duplicate entitlements.

### Failure Observability Gate

- [ ] Checkout failures can be traced from the Checkout API response and Vercel function logs without exposing key material.
- [ ] Webhook failures can be traced by Stripe event id, `stripe_events.processing_status`, and any stored `error_message`; expected terminal states are `processed`, `ignored`, or `failed`.
- [ ] Scan failures can be distinguished as validation errors, guest trial limit, entitlement denial, provider unconfigured, provider error, or request failure. Provider and request exceptions should appear in Vercel logs with the CoffeeDex scan log prefix.
- [ ] Account deletion failures report the failed operation name from `deleteCoffeeDexAccount`, including Stripe redaction, product-event anonymization, owned-row deletion, profile deletion, or Auth identity deletion.
- [ ] Optional Sentry, PostHog, or email tooling is used only when already configured in the environment; launch readiness does not require adding a new vendor.

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

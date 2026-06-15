# Hyangmi Deploy Guide

This guide records the current deploy truth for Hyangmi, a Korea-first AI specialty coffee memory and artifact product built on Next.js, Supabase, Stripe, and an optional AI provider key.

## Runtime

- App host: Vercel
- Framework: Next.js 16 App Router
- Data/auth/storage: Supabase
- Payments: Stripe Checkout and Stripe webhooks
- AI note and package scan provider: OpenAI-compatible key or Gemini key through `AI_API_KEY`
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
| `RESEND_API_KEY` | Email provider key expected by the current env schema. |
| `NEXT_PUBLIC_POSTHOG_KEY` | Analytics key expected by the current env schema. |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN expected by the current env schema. |
| `STORAGE_BUCKET_UPLOADS` | Supabase Storage bucket name for uploaded images. |
| `AI_API_KEY` | Optional AI provider key for tasting notes and package scans. |

## Supabase Checklist

- Apply the database migrations for `tasting_cards`, profile credits/access fields, scan limits, and brewing notes.
- Confirm row-level security keeps `tasting_cards.user_id` scoped to the authenticated user.
- Confirm profile defaults provide one free credit, PDF access off, premium off, zero scans used, and the configured monthly scan limit.
- Confirm Storage has the upload bucket named by `STORAGE_BUCKET_UPLOADS`.

## Stripe Checklist

- Configure Checkout products for Hyangmi Premium, tasting-card credits, and PDF export using the prices currently represented in the app.
- Point the Stripe webhook endpoint at `/api/v1/webhooks/stripe`.
- Store the webhook signing secret in `STRIPE_WEBHOOK_SECRET`.
- Use test-mode fixtures for local verification; do not use live-mode mutation for smoke checks.

## Verification

T2 smoke verification is:

```bash
/Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test test/smoke.test.mjs
```

The broader local validation path uses bundled Node directly:

```bash
/Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test test/smoke.test.mjs
/Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/typescript/bin/tsc --noEmit
/Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/next/dist/bin/next build
```

Use the bundled Node command above for this workspace.

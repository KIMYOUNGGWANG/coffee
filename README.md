# CoffeeDex

CoffeeDex is a Korea-first specialty-coffee memory product for saving the coffees worth finding again. The current product boundary is private coffee notes, package-assisted drafts, Fresh Shelf rebuy timing, Rebuy Intelligence, exports, and Stripe-backed digital entitlements.

Future marketplace, community, referral, roaster partnership, and print-fulfillment ideas are not shipped behavior.

## Stack

- Next.js 16 App Router and React 19
- TypeScript, Tailwind CSS, Zustand, TanStack Query
- Supabase Auth, Postgres, Storage, and RLS
- Stripe Checkout and webhooks
- Optional Gemini-compatible `AI_API_KEY` for package scan and note draft assistance

## Local Setup

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Environment

`docs/deploy.md` is the deploy truth. The required local and Vercel variables are:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STORAGE_BUCKET_UPLOADS`

Optional production-quality integrations:

- `AI_API_KEY`
- `RESEND_API_KEY`
- `NEXT_PUBLIC_POSTHOG_KEY`
- `NEXT_PUBLIC_SENTRY_DSN`
- `ADMIN_EMAIL_ALLOWLIST`

Do not use live Supabase or live Stripe mutation for smoke checks.

## Verification

```bash
npm run test:smoke
npm run test:product-truth
npm run test:routes
npm run typecheck
npm run build
npm run test:e2e
```

The full local release gate is:

```bash
npm run validate:full
```

Playwright starts the already-built Next app with `npx next start`. Run `npm run build` before `npm run test:e2e` unless an existing server is reused with `PLAYWRIGHT_REUSE_SERVER=1`.

## Product Direction

CoffeeDex should feel like a private coffee drawer, not a brewing cockpit or ecommerce catalog. Lead with:

- a 20-second memory capture;
- the latest saved bean and searchable roaster/bean phrase;
- private rebuy clues from the user's own notes and shelf state.

Keep docs and tests aligned with executable behavior when changing user-facing Korean copy or route contracts.

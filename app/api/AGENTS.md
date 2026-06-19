# API ROUTE KNOWLEDGE

## OVERVIEW

Next.js route handlers for the public health check and the versioned CoffeeDex product API under `/api/v1`.

## STRUCTURE

```text
api/
|- health/        # Public static health contract
`- v1/
   |- cards/      # Card CRUD, notes, AI note, scan, and sharing
   |- profile/    # Credits, entitlements, and taste analytics
   |- checkout/   # Stripe Checkout session creation
   |- webhooks/   # Stripe signature verification and fulfillment
   |- shelf/, brewing-logs/  # Coffee shelf and brew history
   |- ai-barista/, pdf/      # Assisted guidance and export data
   |- analytics/, support/   # Validated event and support intake
   |- subscription/, workspaces/  # Account and workspace summaries
   `- public/     # Explicit unauthenticated token reads
```

## WHERE TO LOOK

| Task | Location | Notes |
| --- | --- | --- |
| Contract source | `../../docs/api-spec.md` | Keep implementation and docs aligned |
| Canonical authenticated CRUD | `v1/cards/route.ts`, `v1/cards/[id]/route.ts` | Auth, owner filters, Zod, JSON envelopes |
| Billing entry | `v1/checkout/route.ts` | Validate item type and return URL |
| Webhook fulfillment | `v1/webhooks/stripe/route.ts` | Raw body, signature, service role, idempotency |
| Public exception | `v1/public/cards/[token]/route.ts` | Validate token and outbound row shape |
| AI fallback routes | `v1/ai-barista/route.ts`, `v1/profile/analytics/route.ts` | Preserve local fallback and warning contract |

## CONVENTIONS

- Protected routes create the server Supabase client, call `auth.getUser()`, and return `401` before data access on failure.
- Keep explicit `.eq("user_id", user.id)` owner filters in addition to database RLS.
- For client-correctable validation failures, use Zod `safeParse` and return a structured `400` response.
- Prefer `{ data: ... }` for new CRUD success responses and structured `{ error: { code, message, details? } }` failures.
- Preserve established special response shapes for checkout, scan, AI, subscription, acknowledgements, and deletes.
- Use `getErrorMessage()` for internal logging or classification only; return a stable sanitized client message for unknown failures.
- Match HTTP status to the response error semantics and keep user-facing Korean messages stable where tested.

## ANTI-PATTERNS

- Do not copy mock-user, fallback, public, health, analytics-ingest, or support-logging exceptions into protected CRUD routes.
- Do not parse webhook bodies as JSON before Stripe signature verification; the raw request body is required.
- Do not acknowledge a Stripe event before its idempotency and entitlement state are durably recorded.
- Do not use service-role credentials outside narrow server-only integration paths.
- Do not change a route envelope without updating `docs/api-spec.md` and its contract/browser tests.
- Do not rely on RLS as a reason to remove application-level ownership filters.

# LIBRARY KNOWLEDGE

## OVERVIEW

Shared domain contracts, pure transformations, environment validation, and server/browser integration adapters.

## WHERE TO LOOK

| Task | Location | Notes |
| --- | --- | --- |
| Shared API shapes | `contracts.ts` | Broadest shared type/data surface |
| Checkout catalog | `commerce.ts` | Item keys, products, and Zod schemas |
| Stripe fulfillment | `stripe-fulfillment.ts` | Idempotency, audit, and status helpers |
| Auth continuation | `auth-redirect.ts` | Sanitizes internal redirect destinations |
| Activation and returns | `activation-intent.ts`, `checkout-return.ts` | Parses cross-route state |
| Environment contract | `env.ts` | Server-only Supabase, Stripe, and AI variables |
| Supabase adapters | `supabase/server.ts`, `supabase/browser.ts` | Runtime-specific client creation |
| Taste and public-card data | `taste-profile.ts`, `public-card.ts` | Domain parsing and projections |

## CONVENTIONS

- Default to deterministic, side-effect-free modules with one domain responsibility.
- Keep React components and hooks out of `lib/`; runtime adapters under `lib/supabase/` are the explicit integration exception.
- Accept `unknown` at trust boundaries and narrow with Zod or focused guards.
- Keep URL/query parsing centralized in the existing intent, auth, and checkout modules.
- Export domain types beside the functions or schemas that enforce them.
- Return structured results for recoverable billing and fulfillment outcomes; reserve throws for impossible or fatal states.

## ANTI-PATTERNS

- Do not read server secrets at module import time outside the environment adapter pattern.
- Do not duplicate commerce item keys, brand strings, response contracts, or error normalization in route files.
- Do not import client-only browser modules into server helpers.
- Do not add React state, JSX, or presentation copy to this directory.
- Do not use unchecked casts to force external data into domain types.

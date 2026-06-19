# APP ROUTER KNOWLEDGE

## OVERVIEW

Next.js App Router surface for public pages, authenticated flows, layouts, legal pages, and server route handlers.

## STRUCTURE

```text
app/
|- api/        # HTTP contracts; see api/AGENTS.md
|- auth/       # Sign-in gate and sanitized continuation
|- onboarding/ # Activation and taste-profile setup
|- dashboard/  # Authenticated product workspace
|- cards/      # Public shared-card page
|- quiz/       # Tokenized public quiz flow
|- legal/      # Static legal documents
`- support/    # Billing-support page
```

## WHERE TO LOOK

| Task | Location | Notes |
| --- | --- | --- |
| Global metadata and providers | `layout.tsx` | Wraps every route |
| Landing composition | `page.tsx` | Server entry with client feature sections |
| Authentication continuation | `auth/page.tsx`, `lib/auth-redirect.ts` | Sanitize redirect targets |
| Activation state | `onboarding/page.tsx`, `lib/activation-intent.ts` | Preserve deep-link intent |
| Dashboard entry | `dashboard/page.tsx` | Hands composition to `DashboardClient` |
| Shared public artifacts | `cards/[token]/page.tsx`, `quiz/[token]/page.tsx` | Token is untrusted input |

## CONVENTIONS

- Keep `layout.tsx`, `page.tsx`, `loading.tsx`, and `error.tsx` responsibilities aligned with App Router semantics.
- Fetch initial server data in route components when it avoids a client waterfall.
- Parse `searchParams` and dynamic params before use; keep auth and checkout continuation URLs sanitized.
- Page modules compose feature components. Move reusable stateful UI into `components/`.

## ANTI-PATTERNS

- Do not mark an entire route client-side for one interactive child.
- Do not duplicate redirect, activation, or checkout-return parsing inside pages; use the matching `lib/` module.
- Do not expose server environment values or service-role credentials to client components.
- Do not put reusable HTTP contract logic in page modules; route handlers belong under `api/`.

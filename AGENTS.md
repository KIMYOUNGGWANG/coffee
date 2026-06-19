# PROJECT KNOWLEDGE BASE

**Generated:** 2026-06-17
**Commit:** 49a84ed
**Branch:** main

## OVERVIEW

Hyangmi is a Korea-first specialty-coffee memory product built with Next.js 16, React 19, TypeScript, Tailwind CSS, Supabase, Stripe, Zustand, and TanStack Query. This checkout is also a connected client for Orchestrator Hub 7.5: Codex-primary planning/building, bounded UltraPlan automation, and Antigravity verification are linked from the sibling `orchestrator` repository.

## STRUCTURE

```text
dex/
|- app/                  # App Router pages, layouts, and route handlers
|- components/           # Shared and feature UI; Shadcn primitives under ui/
|- hooks/                # React Query data access and browser-side effects
|- stores/               # Zustand client state
|- lib/                  # Domain contracts, integrations, and pure helpers
|- supabase/migrations/  # Ordered schema, RLS, trigger, and RPC changes
|- test/                 # Node contract tests and Playwright browser flows
|- docs/                 # API, deployment, product, and golden-flow truth
|- .agent/               # Local memory, runtime evidence, and surface manifest
`- .agents/              # Symlinks to the external Orchestrator source surface
```

## WHERE TO LOOK

| Task | Location | Notes |
| --- | --- | --- |
| Product scope and current capabilities | `docs/api-spec.md`, `docs/golden-flows.md` | Do not promote future roaster/community ideas as shipped behavior |
| Landing and application shell | `app/page.tsx`, `app/layout.tsx` | Metadata and providers start at the root layout |
| Auth, onboarding, dashboard | `app/auth`, `app/onboarding`, `app/dashboard` | Activation and checkout-return state cross these routes |
| API behavior | `app/api/v1`, `docs/api-spec.md` | Route contracts are covered by `app/api/AGENTS.md` |
| Checkout and entitlements | `lib/commerce.ts`, `app/api/v1/checkout`, `app/api/v1/webhooks/stripe` | Webhook idempotency is contract-critical |
| Shared response shapes | `lib/contracts.ts` | Keep consumers and route payloads aligned |
| Client data and state | `hooks/useTastingCards.ts`, `stores/` | React Query owns server state; Zustand owns client state |
| Database changes | `supabase/migrations` | Append ordered migrations; do not rewrite applied history |
| UI direction | `DESIGN.md`, `.design-context.md`, `app/globals.css` | Warm premium coffee system, Korean-first copy |
| Verification | `package.json`, `playwright.config.ts`, `test/` | No checked-in GitHub Actions workflow |
| Agent surface ownership | `.agent/agent-surfaces.json` | Vendor descriptors are mirrors or generated outputs |

## CODE MAP

TypeScript LSP is not installed; reach below comes from repository import search.

| Symbol / Module | Type | Location | Reach | Role |
| --- | --- | --- | ---: | --- |
| `RootLayout` | entry | `app/layout.tsx` | all routes | Metadata, fonts, global providers |
| `DashboardClient` | component | `components/dashboard-client.tsx` | dashboard | Authenticated UI composition root |
| `getErrorMessage` | helper | `lib/api-errors.ts` | API handlers | Extracts unknown error text; sanitize before response |
| brand exports | constants | `lib/brand.ts` | metadata/routes | Product naming and metadata |
| `readStarterEnv` | validator | `lib/env.ts` | API/checkout | Supabase, Stripe, and AI environment contract |
| contract exports | types/data | `lib/contracts.ts` | shared | Shared API and starter response shapes |
| fulfillment exports | domain helpers | `lib/stripe-fulfillment.ts` | Stripe webhook | Webhook context, audits, status, idempotency |
| `POST` | route entry | `app/api/v1/webhooks/stripe/route.ts` | Stripe | Billing fulfillment orchestration |

## CONVENTIONS

- Server Components are the default. Add `"use client"` only for browser APIs, interactive state, or client data libraries.
- Validate untrusted input and external payloads with Zod. Do not introduce `any` or suppress type errors.
- Follow FSD Lite grouping, descriptive names, single-responsibility units, and the existing directory ownership boundaries.
- Keep `docs/api-spec.md`, `docs/deploy.md`, and `docs/golden-flows.md` synchronized with executable behavior.
- Korean user-facing copy is part of the browser and product contract; update matching tests when copy intentionally changes.
- Use descriptive names, small single-purpose helpers, and `@/` imports for cross-directory modules.
- Treat `.agents/commands` and `.agents/skills` as the source command surfaces even though this checkout links them externally.

## ORCHESTRATION SURFACES

- Discovery commands: `brainstorm`, `office-hours`. Use them before `plan` when user, pain, or wedge is still unclear.
- Lean primary commands: `status`, `plan`, `develop`, `qa`, `ship`, `fix`.
- Codex owns requirements, architecture, implementation, fixes, final review, and task-board memory.
- Gemini CLI / Antigravity owns mission control, QA, E2E, gate verification, and ship verification; Claude review is optional.
- Pipeline: `Codex(Plan+Build) -> Antigravity(Verify) -> Codex(Fix) -> Antigravity(Ship)`.
- Revenue OS remains template-pack work inside the primary loop. Evidence lives under `.agent/memory/revenue/experiments/`; the latest score is `.agent/memory/revenue/latest-score.json`.
- External `oma` and `oh-my-openagent` runtimes are not default dependencies.

## ANTI-PATTERNS (THIS PROJECT)

- Do not describe commands, routes, integrations, or product capabilities that do not exist.
- Do not create or track `.agents/skills/source-command-*`; those are generated wrappers.
- Do not hand-edit `.codex/agents` or `.gemini/agents` as source. Update their authoritative surface and regenerate.
- Do not hit a real Supabase database or live Stripe state from tests and smoke checks.
- Do not bypass owner filters or weaken RLS to make a route pass locally.
- Do not add marketplace, community, referral, or print-fulfillment claims without implemented product support.
- Keep UltraPlan recoverable: dry-run, clean-tree, and no-auto-ship defaults stay intact.

## UNIQUE STYLES

- Visual language: warm canvas, espresso text, caramel accents, ceramic surfaces, restrained motion.
- Accessibility floor: WCAG AA, visible focus, reduced-motion support, and mobile touch targets.
- Smoke tests cover product truth, docs, copy, package scripts, and route surfaces, not only runtime code.
- Command flow: Codex plans/builds, Antigravity verifies, Codex fixes, Antigravity ships; Claude review is optional.

## COMMANDS

```bash
npm run dev
npm run test:smoke
npm run typecheck
npm run build
npm run test:e2e
npm run validate:full
bash scripts/verify-npm-free.sh
```

Use the bundled Node runtime documented in `docs/deploy.md` when the system runtime is unavailable or incompatible.

## NOTES

- `.agents/commands`, `.agents/skills`, `.claude/commands`, `.claude/skills`, and parts of `.agent` are symlinks to `/Users/kim-young-gwang/Desktop/projects/orchestrator`; edits there affect the external source checkout.
- `docs/deploy.md` is authoritative for required environment variables and test-mode verification.
- `test:smoke` and `validate:full` are contract-checked by `test/smoke.test.mjs`; change scripts and tests together.
- The worktree may contain active user changes. Never revert unrelated modifications while updating this knowledge base.

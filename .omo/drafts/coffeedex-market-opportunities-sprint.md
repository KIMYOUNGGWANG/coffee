---
slug: coffeedex-market-opportunities-sprint
status: decision-complete
intent: unclear
pending-action: keep .omo/plans/coffeedex-market-opportunities-sprint.md as the executable plan
approach: Smallest high-leverage market-opportunity slice: Quick Add Memory Mode with Korean flavor guidance and private rebuy/recipe recall affordances, without schema migrations or external integrations.
---

# Draft: coffeedex-market-opportunities-sprint

## Components (topology ledger)
| id | outcome | status | evidence path |
| --- | --- | --- | --- |
| C1 | Quick Add one-screen memory capture saves a confirmed private card through existing card APIs | active | .omo/evidence/task-2-coffeedex-market-opportunities-sprint.* |
| C2 | Korean flavor language helps casual users choose approachable taste words | active | .omo/evidence/task-1-coffeedex-market-opportunities-sprint.* |
| C3 | Rebuy and recipe recall are visible from saved private memories without marketplace/referral claims | active | .omo/evidence/task-4-coffeedex-market-opportunities-sprint.* |
| C4 | Dashboard entry points make Quick Add the fastest first-memory path | active | .omo/evidence/task-5-coffeedex-market-opportunities-sprint.* |
| C5 | Product docs and smoke contracts remain honest about current capabilities | active | .omo/evidence/task-6-coffeedex-market-opportunities-sprint.* |
| C6 | Dirty worktree and verification discipline prevent reverts, stale state, and self-report completion | active | .omo/evidence/final-coffeedex-market-opportunities-sprint-* |

## Open assumptions (announced defaults)
| assumption | adopted default | rationale | reversible? |
| --- | --- | --- | --- |
| Which of six market opportunities to ship first | Quick Add Memory Mode first, plus a small amount of Korean flavor language and rebuy/recipe recall | The opportunity doc ranks Quick Add first and identifies logging friction as the top pain; recipe/rebuy and flavor language make the slice useful without expanding scope | Yes |
| Storage model | Reuse `tasting_cards`, `footer_meta`, `repurchase_intent`, `repurchase_reasons`, and existing brewing note/log displays | API spec and route schemas already support confirmed memory fields and recipe-ish footer metadata | Yes |
| Backend scope | No migrations, no new RLS, no new external API calls | Root and API instructions forbid weakening owner filters and future marketplace/community claims; the slice can be UI plus existing API payloads | Yes |
| Browser proof channel | Playwright plus real Chrome manual scripts for visible flows | Test conventions already use Playwright browser flows and route mocks; official Playwright docs support single-file and browser-targeted runs | Yes |
| Worktree handling | Preserve all current dirty files; no reverts; read current contents before editing dirty in-scope files | Root instructions explicitly warn active user changes may exist | Yes |

## Findings (cited - path:lines)
- Market doc: logging friction is the biggest repeated pain signal; users want fast mobile capture, not database chores (`docs/market-opportunities-2026-06-26.md:17-23`).
- Market doc: Quick Add Memory Mode is proposed as a one-screen save flow with photo, bean/roaster, one-line note, would-buy-again, optional flavor chips, and collapsed advanced variables (`docs/market-opportunities-2026-06-26.md:36-42`).
- Market doc: grind/recipe recall and Korean flavor language are the next best fits, and rebuy memory should stay a bridge without marketplace/referral claims (`docs/market-opportunities-2026-06-26.md:44-64`).
- Market doc priority ranks Quick Add, Grind/Recipe Recall, Korean Flavor Language, then Rebuy Memory Card before broader funnel or taste-match work (`docs/market-opportunities-2026-06-26.md:80-87`).
- Golden flows already center capture/confirm, retrieve worth-buying-again, fresh shelf rebuy timing, and future boundary guardrails (`docs/golden-flows.md:5-29`, `docs/golden-flows.md:57-59`).
- API spec centers private coffee memory, Supabase auth, owner-scoped rows, and future marketplace/community boundaries (`docs/api-spec.md:1-14`, `docs/api-spec.md:47-60`).
- `TastingCard` already includes `repurchase_intent`, `repurchase_reasons`, package claims, and confirmation timestamps (`docs/api-spec.md:64-107`, `docs/api-spec.md:280-292`).
- `POST /api/v1/cards` already accepts coffee card inputs and `app/api/v1/cards/route.ts` validates optional memory fields only when `confirmed: true` is sent (`docs/api-spec.md:132-158`, `app/api/v1/cards/route.ts:16-58`).
- The collection route authenticates first, filters by `user_id`, inserts memory fields, and returns `{ data }` (`app/api/v1/cards/route.ts:75-103`, `app/api/v1/cards/route.ts:112-177`).
- API route instructions require Zod validation, explicit owner filters, structured envelopes, stable Korean messages, and no weakening RLS (`app/api/AGENTS.md:35-52`).
- Current wizard owns the long 4-step capture flow, scan handling, AI note generation, final submission, and preview card (`components/CardCreatorWizard.tsx:36-68`, `components/CardCreatorWizard.tsx:160-319`, `components/CardCreatorWizard.tsx:321-405`, `components/CardCreatorWizard.tsx:740-855`).
- Store state already holds fields needed for a quick memory: title, subtitle, image URL, tags, raw note, origin, date, and extraInfo (`stores/tastingStore.ts:4-22`, `stores/tastingStore.ts:66-89`).
- Client hook already supports `CreateTastingCardInput` fields for package claims, repurchase intent/reasons, scan source, corrected fields, and confirmed cards (`hooks/useTastingCards.ts:49-107`, `hooks/useTastingCards.ts:168-195`).
- Dashboard client opens the wizard from existing create actions and passes it through runtime overlays (`components/dashboard-client.tsx:102-113`, `components/dashboard-client.tsx:159-215`, `components/dashboard-modals.tsx:36-41`).
- Shelf view renders filters, shelf grid, cards, and featured archive card from existing data (`components/dashboard-shelf-view.tsx:89-151`).
- Card display already shows repurchase labels and a brewing guide back face (`components/TastingCard.tsx:22-27`, `components/TastingCard.tsx:41-101`, `components/TastingCard.tsx:134-166`).
- Detail modal already lists brewing notes and recipe variables, but also contains broad AI/ghost recipe areas that should not be expanded by this slice (`components/CardDetailModal.tsx:17-40`, `components/CardDetailModal.tsx:520-665`, `components/CardDetailModal.tsx:779-849`).
- Browser tests mock `/api/v1/**` with `page.route`, use roles/text/test IDs, and should not rely on test order (`test/AGENTS.md:18-26`, `test/AGENTS.md:28-35`).
- Existing Playwright dashboard tests provide route-mocking patterns and screenshot evidence capture (`test/dashboard-growth.test.ts:86-132`, `test/dashboard-retrieval.test.ts:86-135`, `test/wizard-errors.test.ts:93-118`).
- Node route tests already verify memory compatibility, confirmed memory mapping, validation rejection, and owner filters (`test/memory-crud-contract.test.mjs:145-258`, `test/memory-crud-contract.test.mjs:260-316`).
- Package scripts and Playwright config define `test:smoke`, `typecheck`, `build`, `test:e2e`, and local web server behavior (`package.json:6-14`, `playwright.config.ts:6-18`).
- Dirty worktree now includes in-scope risk files `components/dashboard-client.tsx` and `test/dashboard-growth.test.ts`; unrelated dirty paths include `DESIGN.md`, `components/dashboard-settings-view.tsx`, `components/settings-usage-billing.tsx`, `mobile/app/(tabs)/_layout.tsx`, `mobile/app/(tabs)/index.tsx`, `mobile/app/(tabs)/passport.tsx`, `mobile/app/(tabs)/scan.tsx`, `mobile/app/(tabs)/settings.tsx`, `mobile/app/_layout.tsx`, `mobile/app/note/create.tsx`, `mobile/components/TastingCard.tsx`, `mobile/tailwind.config.js`, `next-env.d.ts`, `.omo/ultrawork/`, `artifacts/rebrand-mockups/`, `components/dashboard-operations-snapshot.tsx`, `docs/market-opportunities-2026-06-26.md`, `mobile/assets/coffee-bag.png`, and `mobile/assets/coffee-room.png` (`git status --short`, 2026-06-26).
- External doc check: official Playwright documentation supports `npx playwright test <file>`, headed mode, project selection, and screenshot capture patterns (Context7 `/microsoft/playwright`, queried 2026-06-26).

## Decisions (with rationale)
- Implement only Quick Add first, with enough flavor/rebuy/recipe surface to validate the market wedge; defer the other market opportunities.
- Keep all persistence on existing card and brewing-note/log surfaces; no migrations and no live Supabase/Stripe calls in tests or smoke checks.
- Put Quick Add in or directly beside `CardCreatorWizard` because it already owns wizard state, card creation, error handling, and dashboard modal lifecycle.
- Use Korean-first copy and approachable flavor clusters; avoid expert-only SCA language as the default surface.
- Prove behavior with failing-first browser tests and route contracts before production edits; use real Chrome manual QA scripts for visible task evidence.
- Treat current dirty worktree state as user work. Executors must preserve, not revert, every unrelated dirty path.

## Scope IN
- One-screen Quick Add Memory Mode.
- Korean flavor language chips or helper copy that maps approachable Korean sensory clusters to existing tag values.
- Confirmed private memory creation through `POST /api/v1/cards` using existing fields.
- Would-buy-again choice and reason capture using existing `repurchase_intent` and `repurchase_reasons`.
- Compact rebuy and recipe recall affordance using existing card/footer/brewing-note data.
- Dashboard entry copy and docs/tests synchronized with shipped behavior.
- Evidence under `.omo/evidence/` and task cleanup receipts.

## Scope OUT (Must NOT have)
- No marketplace, referrals, community/social graph, public taste match, live roaster partnership, deal/drop/subscription claims, or "open roaster site" unless an existing user-entered URL already exists and is not branded as a partner/referral.
- No database migrations, no RLS changes, no service-role scope changes, no auth bypasses, and no owner-filter removal.
- No live Supabase, Stripe, AI provider, or roaster network calls from tests or manual QA.
- No broad redesign, no mobile app implementation, no generated `.agents/skills/source-command-*`, no hand edits to `.codex/agents` or `.gemini/agents`.
- No reverts or formatting churn on unrelated dirty paths.

## Open questions
- None blocking. The user explicitly authorized the smallest high-leverage slice and the start-work bootstrap approval path.

## Approval gate
status: approved-by-start-work-bootstrap
Decision-complete plan written to `.omo/plans/coffeedex-market-opportunities-sprint.md`. Execution remains worker-owned; this planner does not implement product code.

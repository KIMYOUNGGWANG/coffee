---
slug: hyangmi-fresh-shelf-rebuy
status: drafting
intent: unclear
pending-action: write .omo/plans/hyangmi-fresh-shelf-rebuy.md
approach: Convert the ultraresearch direction into the smallest verified product slice: existing coffee_shelf_items become Korean freshness and rebuy action signals in the shelf UI, backed by deterministic helper tests and docs/smoke truth. Treat the user's request for ulw-loop as approval to execute after this plan is written.
---

# Draft: hyangmi-fresh-shelf-rebuy

## Components (topology ledger)
<!-- Lock the SHAPE before depth. One row per top-level component that can succeed or fail independently. -->
<!-- id | outcome (one line) | status: active|deferred | evidence path -->
| C1 | Fresh Shelf domain helper converts roast date, opened date, fill level, and finished state into wait/drink-now/finish-soon/rebuy states. | active | test/fresh-shelf.test.ts |
| C2 | Coffee shelf cards show Korean action labels and reasons without adding marketplace/community claims. | active | components/coffee-shelf-grid.tsx |
| C3 | Docs and smoke contract name shelf/rebuy as current private memory behavior while preserving future roaster/community boundary. | active | docs/api-spec.md, docs/golden-flows.md, test/smoke.test.mjs |
| C4 | ULW evidence proves helper behavior, UI copy surface, type safety, smoke contract, and cleanup. | active | .omo/ulw-loop/evidence/ |

## Open assumptions (announced defaults)
<!-- Intent is UNCLEAR: research resolves ambiguity, defaults are adopted (not asked), and each is surfaced in the plan's human TL;DR for veto. -->
<!-- assumption | adopted default | rationale | reversible? -->
| Outcome routing | UNCLEAR, execute best-practice default from research. | User asked for plan then loop after open-ended product-direction research, not a named feature spec. | yes |
| First product slice | Fresh Shelf + Rebuy Timing inside existing authenticated shelf. | Research synthesis says this is strongest near-term bet; repo already has coffee_shelf_items and shelf UI. | yes |
| Freshness model | Deterministic local helper, not AI or reminders. | Smallest testable step; avoids provider cost and notification consent. | yes |
| Thresholds | waiting <= 4 days after roast when unopened, drink-now days 5-21 after roast or opened <= 14 days, finish-soon opened >= 21 days or fill <= 25%, rebuy fill <= 10% or finished. | Specialty coffee shelf-life defaults are directional and reversible; dates are advisory, not medical/food-safety claims. | yes |
| Scope boundary | No marketplace, community, referral, roaster partner, notification, or DB schema work. | Current docs mark these as future-only and the first slice can use existing fields. | yes |

## Findings (cited - path:lines)
- `.omo/ultraresearch/20260619-115257/SYNTHESIS.md`: recommends Korea-first private coffee memory, Fresh Shelf + Rebuy Timing, No-App Coffee Memory, and Korean Taste Compass; explicitly says not to lead with marketplace/community/roaster partnerships.
- `components/coffee-shelf-grid.tsx:88-99`: shelf item already carries roaster, bean, roast date, opened date, fill level, finished state, and optional tasting card link.
- `components/coffee-shelf-grid.tsx:546-603`: current cards display dates and fill controls but no action timing state.
- `app/api/v1/shelf/route.ts:1-116`: authenticated shelf GET/POST already persists existing fields; no schema change is required.
- `docs/api-spec.md:21-38`: endpoint table currently omits shelf endpoints even though export already includes shelf data.
- `docs/golden-flows.md:1-22`: golden flows emphasize recall/repurchase and can absorb a shelf/rebuy flow without changing the future boundary.
- `test/smoke.test.mjs:33-97`: smoke suite protects docs and current page/route copy, so docs changes need matching assertions.

## Decisions (with rationale)
- Implement the first slice as a pure helper plus UI copy, not as a new database field. This keeps state derived, reversible, and owner-scoped.
- Keep dates and thresholds advisory in Korean copy: "권장" and "기억" language, not hard claims.
- Add tests through Playwright's TS runner for the helper because the repo already uses `*.test.ts` for browser/product behavior and `npm run typecheck` for TS safety.
- Update docs and smoke checks so the shipped contract reflects the shelf/rebuy surface without exaggerating future product layers.

## Scope IN
- `lib/fresh-shelf.ts` with typed `evaluateFreshShelfStatus`.
- `components/coffee-shelf-grid.tsx` display of a compact Korean status badge and reason on active shelf cards.
- `test/fresh-shelf.test.ts` helper coverage for wait, drink now, finish soon, rebuy, invalid date fallback, and finished override.
- `docs/api-spec.md`, `docs/golden-flows.md`, and `test/smoke.test.mjs` contract updates.
- ULW evidence artifacts for RED/GREEN, targeted Playwright test, smoke, typecheck, and a real static/CLI surface check.

## Scope OUT (Must NOT have)
- No roaster marketplace, community, referral, partnership, or subscription discovery claims.
- No notification/reminder scheduler, email, push, calendar, Stripe, Supabase migration, or RLS change.
- No live Supabase or Stripe calls in verification.
- No broad redesign, landing-page rewrite, or unrelated copy sweep.

## Open questions
- None. The open-ended intent is resolved to the reversible best-practice default above.

## Approval gate
status: approved-by-user-ulw-loop-request
<!-- When exploration is exhausted and unknowns are answered, set status: awaiting-approval. -->
<!-- That durable record is the loop guard: on a later turn read it and resume at the gate instead of re-running exploration. -->

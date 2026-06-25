# Hyangmi Fresh Shelf/Rebuy ULW Loop Brief

Deliver one verified product slice from the 2026-06-19 ultraresearch:

Objective: existing authenticated coffee shelf items should produce a Korean next-action signal for freshness and rebuy timing. Users should see whether a bean is `waiting`, `drink_now`, `finish_soon`, or `rebuy` from existing roast date, opened date, fill level, and finished state.

Success criteria:

1. Add `lib/fresh-shelf.ts` with a deterministic `evaluateFreshShelfStatus` helper and Korean labels/reasons. Prove RED first, then GREEN with `npx playwright test test/fresh-shelf.test.ts`. Evidence: `.omo/ulw-loop/evidence/G001-C001-red.txt` and `.omo/ulw-loop/evidence/G001-C001-green.txt`.
2. Integrate the helper into `components/coffee-shelf-grid.tsx` so active shelf cards show a compact Korean action badge and reason without changing persisted data. Prove with `npm run typecheck` and a source/static surface check. Evidence: `.omo/ulw-loop/evidence/G001-C002-typecheck.txt` and `.omo/ulw-loop/evidence/G001-C002-surface.txt`.
3. Update `docs/api-spec.md`, `docs/golden-flows.md`, and `test/smoke.test.mjs` so shelf/rebuy is described as current private behavior and future marketplace/community/roaster partnership claims remain future-only. Prove with `npm run test:smoke` and a scope scan. Evidence: `.omo/ulw-loop/evidence/G001-C003-smoke.txt` and `.omo/ulw-loop/evidence/G001-C003-scope.txt`.
4. Final regression: run targeted helper test, smoke, typecheck, `git diff --check`, and record cleanup/no-runtime receipt. Evidence: `.omo/ulw-loop/evidence/G001-C004-regression.txt`.

Must not have: no Supabase migration, no RLS change, no live Supabase/Stripe call, no notification scheduler, no marketplace/community/referral/roaster-partner claim, no unrelated redesign.

Tier: HEAVY because this touches product direction, UI, docs, and tests across multiple surfaces, but implementation should remain a small reversible slice.

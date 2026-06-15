# Wave 1 Explore: Tests and Contract Drift

Worker: `019ec4e5-2a2f-7e12-a93a-a57039e33d41`

## Digest

- `test/smoke.test.mjs` is stale and references missing `docs/golden-flows.md`, `docs/deploy.md`, and `.env.example`.
- `test/behavior.e2e.ts` expects starter copy: `Starter SaaS Next Supabase`, `Official SaaS Layer`, and `Open dashboard shell`, while `app/page.tsx` renders CoffeeDex.
- `package.json` and `lib/contracts.ts` still carry starter identity.
- `docs/api-spec.md` describes CoffeeDex tasting card APIs but does not document starter stub routes used by stale tests.
- `validate:full` is blocked by stale smoke tests before later verification can run.

## EXPAND

- LEAD: Check whether `docs/golden-flows.md` and `docs/deploy.md` exist in another branch or were deleted recently - WHY: the smoke suite hard-requires them, so their absence is the primary failure cause - ANGLE: inspect git history for those exact paths and related docs rename commits
- LEAD: Compare `test/behavior.e2e.ts` against the current UI copy in `app/page.tsx` and `app/dashboard/page.tsx` - WHY: the starter-branded selectors are stale and probably need a full assertion rewrite - ANGLE: search for all `Starter SaaS Next Supabase`, `Official SaaS Layer`, and `Open dashboard shell` occurrences
- LEAD: Audit `.agent/memory` for stale starter-vs-CoffeeDex language - WHY: memory may be steering future automation toward the wrong product identity - ANGLE: grep for `starter`, `CoffeeDex`, `workspace`, and `subscription` across `.agent/memory`
- LEAD: Verify whether `npm run typecheck` and `npm run build` currently pass in this workspace - WHY: `validate:full` is blocked early, so later script health is unknown - ANGLE: run each command independently after fixing or bypassing the missing-doc smoke failure
- LEAD: Reconcile `docs/api-spec.md` with implemented route handlers under `app/api/v1` - WHY: docs currently describe tasting-card APIs, not the seeded workspace/subscription contract used by tests - ANGLE: search for `/api/v1/cards`, `/api/v1/workspaces`, and `/api/v1/subscription` in docs and route files

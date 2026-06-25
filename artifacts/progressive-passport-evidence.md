# Progressive CoffeeDex Passport Evidence

Recorded: 2026-06-18

## API and state thresholds

- Scenario: confirmed memories exclude drafts; response returns literal sample/diversity counts, counted top notes, all repurchase decisions, and total saved cards.
- Invocation: `node --test test/passport-api-contract.test.mjs test/passport-state.test.mjs`
- Observable: 6 tests passed, 0 failed. Threshold cases cover 0, 1-2, 3-4, 5-9, and 10+ confirmed memories; narrow, mixed, and broad coverage are asserted.
- Artifact: `test/passport-api-contract.test.mjs`, `test/passport-state.test.mjs`

## Sparse-state browser behavior

- Scenario: one confirmed coffee renders a memory collage with sample and coverage disclosure, a counted user-entered note, and no taste-DNA claim.
- Invocation: `npx playwright test test/passport-states.test.ts`
- Observable: 1 test passed, 0 failed; screenshot shows `커피 기억 콜라주`, `확정 기록 1개`, `좁은 범위`, and `복숭아 1회`. Existing card share control and PDF entitlement surface remain visible as secondary actions.
- Artifact: `artifacts/passport-collage-state.png`

## Static correctness

- Scenario: changed route and UI compile against the concurrent four-tab dashboard contract.
- Invocation: `npm run typecheck`
- Observable: exit code 0 with no TypeScript diagnostics.
- Artifact: `artifacts/progressive-passport-evidence.md`

- Scenario: changed TypeScript files contain no forbidden escape hatches.
- Invocation: `NODE_PATH="$PWD/node_modules" bun /Users/kim-young-gwang/.codex/plugins/cache/sisyphuslabs/omo/4.11.1/skills/programming/scripts/typescript/check-no-excuse-rules.ts app/api/v1/profile/analytics/route.ts components/dashboard-analytics-panel.tsx components/dashboard-header.tsx test/passport-states.test.ts`
- Observable: `No violations in 4 file(s).`
- Artifact: `artifacts/progressive-passport-evidence.md`

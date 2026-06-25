# Mobile-First Fresh Shelf Visual Fix

## TL;DR
Fix the current mobile visual QA blockers on the dashboard Fresh Shelf without broad product refactors: remove horizontal overflow from the shelf card ledge/shadow and keep shelf controls clear of the fixed mobile bottom navigation.

## Scope
- Target route: `/dashboard` shelf tab.
- Target files: `components/coffee-shelf-grid.tsx` first; only touch adjacent dashboard/mobile style code if required.
- Preserve the existing Korean Fresh Shelf copy, rebuy badge, modal behavior, and tasting-card archive composition.
- Do not touch Supabase, Stripe, migrations, checkout, public cards, or unrelated onboarding work.
- Respect dirty worktree state and do not revert unrelated user changes.

## TODOs
- [x] Fix mobile Fresh Shelf overflow and bottom-nav overlap

  Acceptance criteria:
  - [ ] A baseline mobile browser proof captures the current failure before the fix: `392px` viewport produces horizontal overflow and/or shelf controls overlap the fixed bottom navigation.
  - [ ] After the fix, the same browser proof shows `document.documentElement.scrollWidth <= window.innerWidth` and `document.body.scrollWidth <= window.innerWidth` at `392x844`.
  - [ ] After the fix, shelf quick-action controls are not covered by the fixed mobile nav/scan action in the captured mobile view.
  - [ ] Fresh Shelf rebuy badge still renders with Korean copy.
  - [ ] Add or update a focused Playwright assertion so this mobile layout regression is executable.
  - [ ] `COFFEEDEX_E2E_BASE_URL=http://localhost:3120 npx playwright test test/dashboard-fresh-shelf.test.ts` exits 0.
  - [ ] `npm run typecheck` exits 0.

  Manual QA:
  - Tool: Playwright/Chromium script against `http://localhost:3120/dashboard`
  - Viewport: `392x844`
  - API mocks: same fixture shape as `test/dashboard-fresh-shelf.test.ts`
  - Artifact path: `.omo/evidence/mobile-first-fresh-shelf-visual-fix/`

  Adversarial classes:
  - dirty_worktree: applicable because this repo already has user changes in scope; verify only intended files changed.
  - stale_state: applicable because visual artifacts and dev server state can be stale; restart/use fresh browser context and record artifact timestamps.
  - misleading_success_output: applicable because passing tests alone do not prove visual layout; capture browser metrics and screenshot.
  - flaky_tests: applicable because Playwright timing is involved; use deterministic API mocks and explicit selectors.
  - hung_or_long_commands: applicable for dev server/build commands; use bounded waits and cleanup receipts.

## Final Verification Wave
- [x] Run final visual QA and global review gate

  Acceptance criteria:
  - [ ] Capture desktop and mobile screenshots after the fix.
  - [ ] Run the visual QA skill criteria for the changed web surface: browser evidence, overflow metrics, CJK visual check, and functional interaction check.
  - [ ] Independent reviewer confirms the DoneClaim or returns exact fixes.
  - [ ] `.omo/start-work/ledger.jsonl` contains implementation, verification, adversarial, and cleanup evidence.
  - [ ] `.omo/boulder.json` is marked completed for this work.

# CoffeeDex export API evidence

## Route and serializer contracts

- Scenario: unsupported format returns 400 before auth/data access; unauthenticated JSON returns 401 before querying; free authenticated JSON and CSV exports use explicit `user_id` filters for tasting cards, brewing notes, shelf items, and brewing logs; any query failure returns no partial attachment; archive serialization is strict and formula-safe.
- Invocation: `node --test test/export-route.test.mjs test/data-export.test.mjs`
- Binary observable: exit code 0; 9 tests passed, 0 failed.
- Artifact: `artifacts/export-api/node-contracts.log`

## Browser download

- Scenario: browser follows `/api/v1/export?format=csv`, receives an attachment, uses the safe CoffeeDex filename, and saves non-empty CSV content containing the expected memory.
- Invocation: `npx playwright test test/export-download.test.ts --output=artifacts/export-api/playwright --reporter=line`
- Binary observable: exit code 0; 1 test passed; downloaded file is 34 bytes and identified as ASCII text with CRLF line terminators.
- Artifacts: `artifacts/export-api/playwright.log` and `artifacts/export-api/playwright/export-download-downloads--c79b2-ty-CoffeeDex-CSV-attachment/coffeedex-memories-2026-06-18.csv`

## Repository typecheck

- Invocation: `npm run typecheck`
- Binary observable: exit code 1 due to unrelated concurrent dashboard navigation and prop errors. No export file diagnostic was emitted.
- Artifact: `artifacts/export-api/typecheck.log`

## Export-focused typecheck

- Scenario: compile the export route, serializer, and their imported TypeScript dependencies under the repository compiler settings.
- Invocation: `npx tsc --noEmit -p artifacts/export-api/tsconfig.export.json`
- Binary observable: exit code 0; no TypeScript diagnostics.
- Artifact: `artifacts/export-api/export-typecheck.log`

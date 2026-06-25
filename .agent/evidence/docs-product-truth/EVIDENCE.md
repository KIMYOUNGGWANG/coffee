# Docs Product Truth Evidence

Date: 2026-06-18

## Success Criteria

| Criterion | Scenario | Invocation | Binary observable | Artifact |
| --- | --- | --- | --- | --- |
| Guest scan and draft truth | Anonymous scan validation, ephemeral response, one process-local trial, and local draft expiry | `node --test test/guest-draft.test.mjs test/guest-scan-contract.test.mjs` (included in the 48-test command) | PASS; zero failed tests | `contracts.log` |
| Memory, provenance, repurchase, and retrieval truth | Legacy defaults, confirmed scanned memory fields, schema and CRUD contracts | `node --test test/coffee-memory-contract.test.mjs test/coffee-memory-schema.test.mjs test/memory-crud-contract.test.mjs` (included in the 48-test command) | PASS; zero failed tests | `contracts.log` |
| Progressive passport truth | Confirmed-only counts, thresholds, coverage, top notes, repurchase breakdown, and legacy keys | `node --test test/passport-state.test.mjs test/passport-api-contract.test.mjs` (included in the 48-test command) | PASS; zero failed tests | `contracts.log` |
| Free export and account deletion truth | Owner-filtered four-table JSON/CSV export and ordered fail-closed account deletion | `node --test test/data-export.test.mjs test/export-route.test.mjs test/account-deletion-contract.test.mjs` (included in the 48-test command) | PASS; zero failed tests | `contracts.log` |
| Docs and Korean legal copy | Product-copy and repository smoke contracts assert the synchronized claims | `node --test test/product-copy.test.mjs test/smoke.test.mjs` (included in the 48-test command) | PASS; 48/48 combined tests passed | `contracts.log` |
| Canonical smoke command | Package smoke script | `npm run test:smoke` | PASS; 4/4 tests passed | `npm-test-smoke.log` |
| Type safety | Repository TypeScript compile check | `npm run typecheck` | Exit 0; `tsc --noEmit` | `typecheck.log` |
| TypeScript hygiene | No-excuse audit of modified legal TSX files | `node .agent/evidence/docs-product-truth/check-no-excuse-rules.ts app/legal/privacy/page.tsx app/legal/terms/page.tsx` using an exact temporary copy of the skill checker | PASS; no violations in 2 files | `no-excuse-audit.log` |
| Patch hygiene | Assigned-file whitespace/error audit | `git diff --check -- docs/api-spec.md docs/golden-flows.md docs/deploy.md docs/PRD-Hyangmi-v2.md app/legal/privacy/page.tsx app/legal/terms/page.tsx test/product-copy.test.mjs test/smoke.test.mjs` | Exit 0; empty output | `diff-check.log` |

Complete 48-test invocation:

```bash
node --test test/product-copy.test.mjs test/smoke.test.mjs test/guest-draft.test.mjs test/guest-scan-contract.test.mjs test/coffee-memory-contract.test.mjs test/coffee-memory-schema.test.mjs test/memory-crud-contract.test.mjs test/passport-state.test.mjs test/passport-api-contract.test.mjs test/data-export.test.mjs test/export-route.test.mjs test/account-deletion-contract.test.mjs
```

Its TAP output is in `contracts.log`. All tests use local fakes or static contracts and do not mutate live Supabase or Stripe state.

# F2 Final Repair Notepad

Tier: LIGHT - bounded changes in existing Quick Add UI, detail rendering predicate, docs, tests, and evidence files; no new layer, auth, DB, or external integration.

Skills used:
- clean-code: local naming/scope discipline for code edits.
- lint-and-validate: required validation commands after edits.
- testing-strategy: regression coverage and docs/smoke validation.
- omo:programming: mandatory for TypeScript/TSX edits; loaded TypeScript reference.
- omo:remove-ai-slops: user requested quality artifact for remove-ai-slops/programming concerns.

Success criteria:
1. Blank Quick Add note with repurchaseIntent "again" saves without fallback repurchaseReasons or footerMeta.extraInfo; proof is RED/GREEN `node --test test/quick-add-contract.test.mjs` artifact.
2. Card detail only renders `마지막 좋았던 추출` for brew-like extraInfo, not generic quick notes; proof is typecheck and targeted contract coverage/docs alignment.
3. Docs distinguish one-line note, repurchase reason, and brew recall; proof is product-copy/smoke artifact.
4. Required evidence files capture quick-add contract, docs tests, typecheck, diff check, and updated quality/done claim artifacts.

Scenario plan:
- RED: run `node --test test/quick-add-contract.test.mjs > .omo/evidence/coffeedex-market-opportunities-sprint/f2-repair-quick-add-contract-red.log 2>&1` before production edits. Binary observable: exit code nonzero due missing blank-note no-fallback assertion.
- GREEN: rerun required command to `f2-repair-quick-add-contract.log`. Binary observable: exit code 0.
- Docs: `node --test test/product-copy.test.mjs test/smoke.test.mjs > .../f2-repair-docs-tests.log 2>&1`. Binary observable: exit code 0.
- Types: `npm run typecheck > .../f2-repair-typecheck.log 2>&1`. Binary observable: exit code 0.
- Diff whitespace: `git diff --check > .../f2-repair-diff-check.log 2>&1`. Binary observable: exit code 0.

Execution notes:

- RED captured: `f2-repair-quick-add-contract-red.log`, exit 1, blank-note subtest failed against fallback recall generation.
- GREEN captured: `f2-repair-quick-add-contract.log`, exit 0.
- Docs/smoke captured: `f2-repair-docs-tests.log`, exit 0.
- Typecheck captured: `f2-repair-typecheck.log`, exit 0.
- Browser QA rerun not required: existing F3 uses nonblank note for rebuy recall and brew-like `V60 · 15g:250g · 92C` detail metadata, which remains allowed by the predicate; blank validation/no-network behavior is unchanged.
- Self-review: LIGHT still holds; no new layer, external integration, DB/auth/security behavior, or broad refactor was introduced. The new predicate is intentionally small and scoped to display gating.

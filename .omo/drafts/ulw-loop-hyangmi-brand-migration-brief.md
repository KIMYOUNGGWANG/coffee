# ULW Loop Aggregate Brief: Hyangmi Brand Migration

Implement the approved Hyangmi brand migration plan at `.omo/plans/hyangmi-brand-migration.md` as one aggregate ULW goal. The plan file is authoritative for all implementation tasks, QA commands, evidence paths, constraints, and final verification.

Use this aggregate objective:

Rebrand CoffeeDex to Hyangmi / 향미 across visible product, paid artifacts, exports, docs, and tests while preserving stable API/database contracts.

Success criteria:

1. Execute plan todos T1-T4: brand constants, package/app metadata, internal product constants, docs, and visible app surfaces. Evidence must include `.omo/evidence/task-T1-brand-contract.txt`, `.omo/evidence/task-T2-metadata-contracts.txt`, `.omo/evidence/task-T3-docs.txt`, and `.omo/evidence/task-T4-visible-copy.txt`.
2. Execute plan todos T5-T8: commerce/checkout copy, public sharing, story/PDF artifacts, leak guard, and browser brand QA. Evidence must include `.omo/evidence/task-T5-commerce.txt`, `.omo/evidence/task-T6-artifacts.txt`, `.omo/evidence/task-T7-tests-leak-guard.txt`, `.omo/evidence/task-T8-browser-brand-qa.txt`, and screenshots where available.
3. Execute final verification wave F1-F4 from the plan: plan compliance, code quality, real browser QA, and scope fidelity. Evidence must include `.omo/evidence/final-F1-hyangmi-plan-compliance.txt`, `.omo/evidence/final-F2-hyangmi-code-quality.txt`, `.omo/evidence/final-F3-hyangmi-browser-qa.txt`, and `.omo/evidence/final-F4-hyangmi-scope-fidelity.txt`.

Global constraints:

- Use bundled Node commands from the plan; do not require `npm`.
- No Supabase schema/table/route renames for branding only.
- No live Stripe mutation.
- No unsupported marketplace, public social graph, shipping, print fulfillment, poster, or roaster analytics scope.
- No git commits are required because this workspace is not a git repository.
- Every criterion must record observable evidence and cleanup receipts before pass.
- Tests alone are supporting evidence; browser and artifact checks are required for user-facing branding.

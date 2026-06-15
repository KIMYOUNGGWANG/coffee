# ULW Loop Brief: CoffeeDex Productization

Execute the approved plan at `.omo/plans/coffeedex-productization.md`.

Use these five ULW goals only:

1. Wave 1 foundation: complete T1-T4 from the plan.
   - Fix card create contract.
   - Replace stale starter tests/docs/package identity.
   - Make payment UI honest by removing/defering poster and hiding unsafe credit CTA.
   - Establish npm-free local verification and build remediation evidence.

2. Wave 2 paid product UX: complete T5-T8 from the plan.
   - Checkout success/cancel return UX.
   - Real story image download.
   - Downloadable PDF artifact.
   - Inline wizard errors for scan/AI/submit failure.

3. Wave 3 billing and database safety: complete T9-T12 from the plan.
   - Profile bootstrap, entitlement audit, Stripe event schema.
   - Idempotent Stripe fulfillment.
   - Subscription lifecycle state.
   - Credit grant/spend lifecycle before credit top-up UI.

4. Wave 4 product trust and Korea-first polish: complete T13-T14 from the plan.
   - Scan confidence/correction groundwork.
   - Korean specialty coffee positioning and scoped taste/recap copy.

5. Final verification: complete F1-F4 from the plan.
   - Plan compliance audit.
   - Code quality review.
   - Agent-executed browser QA.
   - Scope fidelity.

Global constraints:
- Follow `.omo/plans/coffeedex-productization.md` as the authoritative todo/QA source.
- Use bundled Node commands from the plan; do not require `npm`.
- Use Stripe fixture/test-mode behavior only; no live Stripe mutation.
- No git commits are required because this workspace is not a git repository.
- Every criterion must record observable evidence and cleanup receipts before pass.

# Hyangmi Brand Migration Approval Brief

## Recommendation

Rebrand CoffeeDex to **Hyangmi** (`향미`) before the next productization loop.

Default brand system:

- Brand: `Hyangmi`
- Category: `Coffee Taste Archive`
- Tagline: `마신 원두가 취향의 기록이 되는 곳`
- Paid artifact: `Taste Passport`
- Free artifact: `Taste Card`
- Dashboard: `Archive`
- Analytics: `Taste Map`
- Public share page: `Shared Taste Card`

## Why This Direction

CoffeeDex sounds like a database. The current product is not strongest as a database. It is strongest as a memory/artifact product: scan or enter coffee bags, preserve what you loved, summarize your taste, and sell polished exports.

The competitor scan also makes simple replacement names risky. `Beanfolio`, `Brewfolio`, `Cupfolio`, `Cupnote`, `PourLog`, `RoastNote`, and `BrewMark` are already active or adjacent. A Korean-rooted name is more distinctive and better aligned with the Korea-first wedge.

## Proposed Plan Scope After Approval

- Add centralized brand constants.
- Rename user-facing CoffeeDex copy to Hyangmi across home, onboarding, dashboard, payment, public card, story export, PDF, and checkout notices.
- Rename artifact filenames from `coffeedex-*` to `hyangmi-*`.
- Update package description and docs.
- Update test assertions.
- Preserve stable API/database names unless user-facing or externally visible.
- Add regression tests so old CoffeeDex copy does not leak into visible surfaces.

## Test Strategy Question

Recommended default: **tests-after with targeted TDD for brand constants and filename/copy assertions**.

Reason: this is mostly a controlled migration across many surfaces. The risky part is missing a visible string or exported filename, so a small pre-change test around brand constants plus post-change smoke/product-copy tests gives the best speed-to-confidence ratio.

## Approval Gate

`omo:ulw-plan` requires explicit approval before creating `.omo/plans/<slug>.md`.

Approval received from user: "스인!" interpreted as "승인!".

If approved, create:

`.omo/plans/hyangmi-brand-migration.md`

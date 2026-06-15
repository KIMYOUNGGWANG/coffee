# Wave 1 Brand Landscape

## Internal PRD Signals

- The attached PRD argues CoffeeDex has market potential only if it avoids becoming "another coffee log app."
- The recommended wedge is: coffee bag photos + short ratings -> taste profile -> PDF/card/passport artifact.
- That means the brand must signal:
  - low-friction memory,
  - taste interpretation,
  - personal archive,
  - premium digital artifact,
  - Korea-first specialty coffee culture.

## Current App Naming Surface

`CoffeeDex` is currently present across:

- `app/page.tsx`
- `app/layout.tsx`
- `app/onboarding/page.tsx`
- `components/dashboard-client.tsx`
- `components/PaymentDialog.tsx`
- `components/StoryExportModal.tsx`
- `components/public-card-page.tsx`
- `components/TastingCard.tsx`
- `lib/contracts.ts`
- `lib/pdf-generator.ts`
- `app/api/v1/checkout/route.ts`
- `app/api/v1/pdf/route.ts`
- `app/api/v1/analytics/route.ts`
- `docs/api-spec.md`
- `docs/golden-flows.md`
- `docs/deploy.md`
- many test assertions and generated filenames.

Brand migration is therefore not a text-only exercise. It touches product contracts, Stripe item names, PDF filenames, public share copy, tests, and docs.

## Competitor Brand Signals

- Deep brew tools use functional/logging language: Beanconqueror, Filtru, RoastNote, PourLog, Cupnote, Tastify.
- Newer coffee memory/social tools use shelf/folio/social language: BeanBook, Beanfolio, Brewfolio, Cupfolio, Coffi Passport.
- Korean competitor Hururup uses a local sound/ritual cue rather than a database cue.

## Naming Collision Notes

The most obvious replacement names are already crowded:

- `Beanfolio`: active coffee app/service.
- `Brewfolio`: active coffee brewing journal/app.
- `Cupfolio`: active coffee social/waitlist product.
- `Cupnote`: active coffee cupping app.
- `PourLog`: active Korean coffee tasting app.
- `RoastNote`: active roasting app.
- `Brewmark`: active grind-index/brew app and cafe name.
- `Brewprint` / `Cupprint`: existing coffee/printing brands.

Therefore the safest direction is not another `Bean*`, `Brew*`, `Cup*`, `*folio`, `*note`, or `*log` compound.

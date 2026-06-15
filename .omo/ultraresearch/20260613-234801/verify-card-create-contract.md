# Verification: Card Create Contract

## Claim

The card creation payload from the UI matches the API schema.

## Evidence

- UI submit sends snake_case fields:
  - `/Users/kim-young-gwang/Desktop/projects/dex/components/CardCreatorWizard.tsx:144`
  - `/Users/kim-young-gwang/Desktop/projects/dex/components/CardCreatorWizard.tsx:148`
  - `/Users/kim-young-gwang/Desktop/projects/dex/components/CardCreatorWizard.tsx:154`
  - `/Users/kim-young-gwang/Desktop/projects/dex/components/CardCreatorWizard.tsx:155`
- The hook passes `newCard` through unchanged:
  - `/Users/kim-young-gwang/Desktop/projects/dex/hooks/useTastingCards.ts:63`
  - `/Users/kim-young-gwang/Desktop/projects/dex/hooks/useTastingCards.ts:67`
- The API create schema expects camelCase fields:
  - `/Users/kim-young-gwang/Desktop/projects/dex/app/api/v1/cards/route.ts:10`
  - `/Users/kim-young-gwang/Desktop/projects/dex/app/api/v1/cards/route.ts:16`
  - `/Users/kim-young-gwang/Desktop/projects/dex/app/api/v1/cards/route.ts:17`
- The API maps only camelCase `validatedData` into DB columns:
  - `/Users/kim-young-gwang/Desktop/projects/dex/app/api/v1/cards/route.ts:96`
  - `/Users/kim-young-gwang/Desktop/projects/dex/app/api/v1/cards/route.ts:102`
  - `/Users/kim-young-gwang/Desktop/projects/dex/app/api/v1/cards/route.ts:103`

## Verdict

REFUTED. The actual wizard submit payload does not match the create route's schema for image, AI description, and footer metadata. Because Zod strips unknown keys by default and the route supplies defaults, this can silently drop key fields rather than hard-fail.

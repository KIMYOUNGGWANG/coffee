# Hyangmi Golden Flows

These are the executable product truths the smoke suite protects for T2. They describe Hyangmi as a Korea-first specialty coffee memory and artifact product, not a generic project template or expanded commerce/community platform.

## Flow 1. Record First Coffee Card

Given a logged-in coffee drinker opens the dashboard, when they choose `새로운 카드 기록하기`, then Hyangmi collects bean/roaster identity, acidity, sweetness, body, flavor tags, image, and footer metadata for a private `tasting_cards` row.

Evidence surfaces:
- `/dashboard`
- `hooks/useTastingCards.ts`
- `POST /api/v1/cards`

## Flow 2. Scan Bean Package To Draft Card

Given the user has a coffee package image, when they scan it, then Hyangmi extracts a draft title, roaster, origin, process, flavor tags, acidity, sweetness, and body for user review before saving.

Evidence surfaces:
- `POST /api/v1/cards/scan`
- `useScanCoffeePackage`
- Fallback sample beans and Korean roaster cues such as Fritz Ethiopia Sidama, Terarosa Colombia Huila, and Momos Kenya Nyeri

## Flow 3. Generate SCA Tasting Note

Given the user has tags and an optional raw note, when they request an AI note, then Hyangmi returns a concise SCA-style tasting sentence and keeps a local fallback available if the AI provider is not configured.

Evidence surfaces:
- `POST /api/v1/cards/ai-note`
- `useGenerateAiNote`
- `aiDescription`

## Flow 4. Review Taste Analytics Dashboard

Given the user has saved tasting cards, when they open the dashboard, then Hyangmi summarizes average acidity, sweetness, body, top flavor tags, and a saved-record taste recap.

Evidence surfaces:
- `/dashboard`
- `GET /api/v1/profile/analytics`
- `useTasteAnalytics`

## Flow 5. Share Story Card

Given the user selects a saved card, when they open the share/export experience, then Hyangmi presents a digital story card using the recorded bean identity and tasting metadata.

Evidence surfaces:
- `StoryExportModal`
- `TastingCard`
- Hyangmi card details

## Flow 6. Export Home Cafe PDF

Given a user has PDF access, when they request the archive export, then Hyangmi returns their card bundle for a digital home-cafe tasting book.

Evidence surfaces:
- `GET /api/v1/pdf`
- `has_pdf_access`
- `Hyangmi 홈카페 도서관`

## Future Boundary

Roaster partnership, referral, and community layers are future product layers only. They are not part of the current golden flows and must not be represented as current capabilities until separate contracts and verification exist.

## Smoke Verification

Run the T2 smoke assignment with:

```bash
/Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test test/smoke.test.mjs
```

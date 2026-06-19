# COMPONENT KNOWLEDGE

## OVERVIEW

Shared primitives and feature UI for landing, auth, onboarding, dashboard, checkout, cards, analytics, and story export.

## WHERE TO LOOK

| Task | Location | Notes |
| --- | --- | --- |
| Global client providers | `providers.tsx` | React Query provider boundary |
| Dashboard composition | `dashboard-client.tsx` | Coordinates authenticated feature panels |
| Card authoring | `CardCreatorWizard.tsx`, `TastingCard.tsx` | Legacy PascalCase files; avoid opportunistic renames |
| Checkout UX | `PaymentDialog.tsx`, `landing-pricing-section.tsx` | Preserve return and entitlement states |
| Story artifacts | `StoryExportModal.tsx`, `story-export-assets.ts` | 9:16 export and share contracts |
| Design primitives | `ui/` | Shadcn base layer; wrap instead of editing directly |
| Visual analytics | `FluidRadarChart.tsx`, `dashboard-analytics-panel.tsx` | Respect reduced motion and empty states |

## CONVENTIONS

- New feature filenames use kebab-case; exported component names use PascalCase. Existing PascalCase modules are legacy-compatible.
- Declare local prop types near the top of the module and keep externally sourced data typed or Zod-validated.
- Keep server state in React Query hooks, shared client state in Zustand stores, and short-lived interaction state local.
- Use tokens and utilities from `app/globals.css`; follow the warm canvas, espresso, caramel, and ceramic design language.
- Prefer focused subcomponents when a feature file accumulates unrelated rendering or state responsibilities.

## ANTI-PATTERNS

- Do not modify `components/ui/` for feature-specific styling; compose or wrap its primitives.
- Do not fetch the same resource independently in sibling panels when an existing hook/query key owns it.
- Do not add generic purple-blue gradients, pervasive glassmorphism, or motion without reduced-motion behavior.
- Do not hide loading, empty, entitlement, error, or disabled states behind a happy-path-only component.
- Do not rename legacy files as drive-by cleanup; imports and browser contracts are active across the suite.

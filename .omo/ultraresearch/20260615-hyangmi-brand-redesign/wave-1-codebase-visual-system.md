# Wave 1 Codebase Digest: Visual System

Worker: explorer `019ec984-3283-7741-82b8-86e0c4581969`

## Key Findings

- Main brand surfaces are `/Users/kim-young-gwang/Desktop/projects/dex/app/page.tsx`, `/Users/kim-young-gwang/Desktop/projects/dex/components/landing-pricing-section.tsx`, `/Users/kim-young-gwang/Desktop/projects/dex/app/globals.css`, dashboard composition files, card/detail/story export components, and legal/support shells.
- Current system is warm editorial archive: cream, espresso, caramel, warm-gray; many translucent white cards, rounded-3xl/2xl, serif display headings, and soft glass panels.
- The landing is the strongest public-brand canvas, but it repeats many similar rounded cards and a split hero that reads closer to SaaS/editorial template than a distinctive coffee object.
- Highest leverage redesign entry points: `app/page.tsx`, `components/landing-pricing-section.tsx`, `components/dashboard-client.tsx`, `components/StoryExportModal.tsx`, `components/CardCreatorWizard.tsx`, `components/TastingCard.tsx`, `components/dashboard-usage-panel.tsx`, `app/globals.css`.

## Verbatim EXPAND

- LEAD: `app/page.tsx` landing + hero + product boundary are the primary public-brand canvas — WHY: they define first impression, scope framing, and the visual identity outside the app — ANGLE: audit the hero composition, CTA hierarchy, and artifact cards for any redesign
- LEAD: `components/dashboard-client.tsx` is the dashboard orchestrator and densest UX shell — WHY: it composes all key panels and modals, so layout changes here cascade everywhere — ANGLE: inspect section hierarchy, sidebar density, and modal entry points
- LEAD: `app/globals.css` owns the color tokens and reusable shell primitives — WHY: changing tokens here will re-skin the full product faster than editing individual components — ANGLE: search for token usage and shared class reliance before altering the palette
- LEAD: `components/StoryExportModal.tsx` and `components/public-card-page.tsx` are the shareable artifact surfaces — WHY: they are the most brand-visible outputs and the best place for a premium redesign — ANGLE: review the story skin system, preview layout, and public-link presentation
- LEAD: `components/CardCreatorWizard.tsx` and `components/TastingCard.tsx` define the core product interaction language — WHY: they establish the archive/editorial feel that users will experience most often — ANGLE: inspect form density, tag chip style, and card framing for consistency and simplification
- LEAD: `components/landing-pricing-section.tsx` and `components/PaymentDialog.tsx` define the monetization tone — WHY: payment framing is a leverage point for perceived product quality and clarity — ANGLE: compare featured product emphasis, CTA labels, and pricing hierarchy against the landing story
- LEAD: `components/dashboard-usage-panel.tsx` is the strongest branded premium panel — WHY: it sets the look of the paid experience and can anchor a broader visual refresh — ANGLE: evaluate its gradient, badge style, and metric card language as a reusable premium motif
- LEAD: `components/legal-document.tsx` plus `app/support/billing/page.tsx` are the support/legal surfaces — WHY: they carry trust and policy consistency, and are easy to overlook during redesign — ANGLE: check whether these pages should inherit the same editorial shell or be simplified for clarity
- LEAD: `lib/brand.ts` is the canonical brand vocabulary source — WHY: it is the cleanest place to update names, taglines, and artifact labels without hunting through copy — ANGLE: search for other hard-coded brand phrases to align with this source of truth


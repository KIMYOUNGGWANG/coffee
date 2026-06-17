# Ultraresearch Synthesis: Hyangmi Brand and Web Redesign

## Executive Summary

Hyangmi should not compete as another coffee brewing logger or generic AI assistant. The strongest market gap is a Korea-rooted, artifact-first personal coffee taste archive: a place where the user’s tasted beans, roasters, flavor notes, photos, and PDF/story outputs become a durable collection.

The current landing is coherent but too safe: warm neutral gradient, glass cards, rounded panels, icon grids, and SaaS-style pricing cards. This matches many "AI slop" markers: predictable hero, repeated boxes, timid palette, and rounded card sameness. The redesign direction should be editorial, tactile, and artifact-heavy: tasting cards, origin labels, flavor ledgers, receipt-like notes, and dense-but-elegant coffee metadata.

## Market Findings

- Tasting Grounds positions around community, brew logging, roaster discovery, and public proof through counts like roasters, coffees, and brews logged.
- Beanconqueror owns the power-user lane with deep brew/bean tracking, device integration, offline data, open-source trust, and many customizable parameters.
- Filtru owns guided ritual: brew methods, AR tutorials, espresso tools, Bluetooth support, and camera-based coffee journal capture.
- Tastify owns professional sensory visualization: cupping sample management, reports, and flavor wheels.
- Trade and Atlas own subscription commerce: quiz, curation, origin storytelling, and recurring discovery.

## Brand/Design Findings

- SCA frames coffee design as branding, packaging, and spaces, not just websites. Hyangmi should make its digital artifacts feel like packaging and editorial objects.
- Onyx shows that coffee brands can use origin stories, spaced display type, art direction, awards, and producer/source information to feel premium.
- SEY shows restraint: calm pages, taste-forward copy, and supply-chain seriousness.
- Momos gives a Korean-rooted commerce precedent: world champion authority, Busan roasting, farm counts, and fresh-roasted promises.
- Cosmos, Are.na, Readwise, Reflection, and Mesh show the non-generic AI pattern: lead with the collected artifact or workflow, then show AI as an embedded capability.

## Direction

Name stays: Hyangmi.

Brand idea: "마신 커피가 취향의 기록이 되는 곳."

Aesthetic: Quiet Editorial Archive.

Visual language:
- off-black ink, roasted barley, mineral blue, paper cream, pale peach accent;
- ledger lines, label stamps, catalog numbers, origin tags;
- serif display paired with a more editorial sans/mono rhythm;
- fewer glass cards, more paper panels and overlapping artifact sheets;
- no purple, no centered SaaS hero, no equal-weight three-card feature grid.

## Implementation Focus

This pass should redesign:
- `app/page.tsx`: first viewport, features, artifact story, product boundary.
- `components/landing-pricing-section.tsx`: replace generic pricing cards with editorial "choose your path" hierarchy.
- `app/globals.css`: introduce tactile paper/noise/ledger utility classes and new palette variables while keeping existing class compatibility.

Dashboard/payment/support are next-wave candidates after the public brand is reset.


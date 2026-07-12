# Office Hours - CoffeeDex Private Taste Memory

## Mode

Startup mode. The next decision is about repeat use and trust in a private coffee-memory product, not a public collection, social loop, or marketplace launch.

## Locked Problem

### User

Home brewers who buy one to two bags a week. They may repeat-buy an espresso daily driver while also exploring different roasters, but they want to develop and remember a personal bean preference.

### Current workaround and recent failure

They leave bean-bag photos in their photo library and taste notes in a memo app. Later, when they want to buy beans again, they cannot reliably reconnect the photo, bean/roaster name, and the reason the coffee was good. The failure is both directions: a remembered taste has no identifiable bean, or an identifiable bag has no remembered taste.

### JTBD

When I drink a coffee worth remembering, help me preserve the bean, the moment, and my subjective taste in under 20 seconds, so that at the next purchase I can reopen the right memories and choose with my own preference instead of guessing.

## Smallest Wedge

CoffeeDex should turn a private photo-first memory into a later purchase decision card:

1. At the good-cup moment, the user takes or selects a bag photo.
2. The product proposes bean and roaster details from the photo; the user confirms rather than trusting an invented result.
3. The user saves a minimal preference signal (`again` / `maybe` / `no`) and may add taste tags or a voice note.
4. At the next purchase moment, CoffeeDex shows up to three photo-backed memories and three user-derived choice conditions.

The default capture must stay light. Taste tags and voice are progressive enhancements, not fields required on every save. CoffeeDex must never infer a user's perceived taste solely from a package image.

## Explicit Exclusions

- public coffee encyclopedia, cards-as-collection, badges, rankings, or social sharing;
- marketplace, roaster partnership, affiliate ordering, checkout-led recommendation, or public reviews;
- generic AI taste claims not confirmed by the user;
- a full brewing-variable database as the default capture path.

## Evidence and Why Now

External coffee-user research repeatedly shows fragmented notes, photos, spreadsheets, and difficulty recalling a favorite bean's roaster, taste, or prior purchase context. Existing CoffeeDex implementation already supports private quick capture, photos/package assistance, rebuy clues, shelf memory, and direct new-bag continuation.

The external market-timing claim is **not yet locked**. The immediate reason to prioritize this wedge is product evidence: CoffeeDex has the capture and rebuy surfaces, but must prove that a saved memory is reopened when the user makes the next buying decision.

## Assumptions and Disproof

| Assumption | Disproof signal |
| --- | --- |
| Photo-first capture is low-friction enough to create durable memories. | Users start capture but rarely confirm a private memory, or photo-backed records do not improve later reopening. |
| A small user-confirmed taste signal is trusted. | Users frequently correct, dismiss, or avoid taste conditions generated from their own saved records. |
| Photo-backed recall changes the next purchase decision. | Users with three or more qualifying memories do not reopen CoffeeDex, purchase clues, or rebuy surfaces more often than comparable users without them. |

Any threshold must be set against the existing event baseline before declaring the wedge validated. Product events must remain owner-safe and must not include raw bean names, roasters, photos, URLs, notes, or opaque tokens.

## Event-Data Validation Plan

Before building another large feature, analyze the current owner-safe event funnel:

`confirmed memory -> later dashboard/rebuy visit -> purchase clue open -> will_rebuy or rebought -> new shelf bag`

Segment by users with one, two, and three or more confirmed memories. Compare time to return, purchase-clue opens, completed rebuy decisions, and explicit new-bag starts. Distinguish missing instrumentation from genuine drop-off before proposing a UI change.

## Handoff Questions for /plan

1. Which existing analytics events and admin aggregates can measure each funnel stage without adding raw coffee-memory data to event properties?
2. Where is the largest observed drop-off: capture confirmation, later return, clue opening, rebuy decision, or new-bag start?
3. What is the smallest owner-safe instrumentation addition if a stage is currently invisible?
4. How should the next-purchase card choose at most three memories and three conditions while representing uncertainty and allowing correction?
5. What baseline and post-change threshold will count as meaningful improvement in purchase-moment reopening and trust?
6. Which existing quick-capture, rebuy, and shelf components can deliver the experiment without introducing a separate social or marketplace surface?

## Selected Experiment

The first bounded implementation is the private Next Purchase Memory surface: reuse Rebuy Timing Memory to show up to three confirmed photo-backed rebuy memories and up to three flavor conditions derived from the user's own saved tags. Measure only card/purchase-clue opens with privacy-safe categorical properties.

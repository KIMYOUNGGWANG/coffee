# Next Cup Plan Research

## Decision

CoffeeDex should add **Next Cup Plan** as the next retention feature. It answers the daily question: "Which bean should I brew now, and what should I do after this cup?"

The feature stays inside CoffeeDex's current positioning. It uses only owned shelf items and owned brew logs to pick a private next cup. It does not create community recommendations, partner offers, marketplace listings, roaster orders, or push notifications.

## Research Summary

- [Beanconqueror](https://beanconqueror.com/) positions itself as a brewing companion for optimizing brewing and tracking beans, showing that serious home users value bean + brew state in one place.
- [Beanconqueror on the App Store](https://apps.apple.com/us/app/beanconqueror/id1445297158) highlights keeping track of beans, preparation methods, and running bean totals so users know when they are running low.
- [Filtru](https://getfiltru.com/) pairs a coffee beans journal with guided brew methods, and its own testimonial copy says daily use comes from balancing simplicity with enough control.
- A [r/pourover rotation discussion](https://www.reddit.com/r/pourover/comments/1gy215s/ive_seen_a_few_people_talk_about_rotation_curious/) shows users keep multiple bags open and rotate cups by moment and method.
- A [r/pourover inventory discussion](https://www.reddit.com/r/pourover/comments/1kd4gcj/how_do_you_manage_a_rotation_like_this/) shows the pain of having too many beans open and not finishing them in time.
- A [r/espresso grind-setting thread](https://www.reddit.com/r/espresso/comments/1o9xnre/how_do_you_lot_keep_track_of_grind_settings_for/) points to a practical habit: users look at the last brew for a bean, then tweak from there.
- A [r/espresso app thread](https://www.reddit.com/r/espresso/comments/1iaf25r/app_to_dial_in_beansgrind_settings/) describes the complexity of dialing in different beans and tracking dose, grind, time, yield, ratings, and notes.

## Candidate Scoring

Scores use 1-5 where higher is better, except difficulty where higher means harder. ROI favors retention and painkiller strength while penalizing implementation risk.

| Candidate | Retention | Painkiller | Difficulty | Monetization | ROI | Decision |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Next Cup Plan | 5 | 4 | 2 | 3 | 4.6 | Build now |
| Equipment-aware recipe presets | 4 | 4 | 4 | 3 | 3.7 | Later |
| Freezer / cellar queue | 3 | 4 | 3 | 2 | 3.5 | Later |
| Brew timer runner | 4 | 3 | 4 | 3 | 3.4 | Later |
| Community recipe matching | 4 | 3 | 5 | 4 | 2.8 | Exclude for now |

## Product Spec

Next Cup Plan should produce one private daily action:

- Pick an active shelf bean.
- Prefer beans that are in peak, open too long, low enough to finish soon, or recently brewed poorly.
- Avoid paused and finished beans.
- Use the latest owned brew log for the chosen bean to suggest the method label.
- Return a title, subtitle, reason, action label, priority, suggested method, shelf item ID, and last brew log ID.

## UX Flow

1. User opens the shelf dashboard.
2. Rebuy Intelligence shows "Next Cup" as the first card.
3. The card names the bean, roaster, suggested method, and why it should be brewed today.
4. Tapping the card opens the record tab so the user can save a brew and keep the shelf state current.

## DB/API Changes

No migration is required. `GET /api/v1/rebuy-intelligence` already reads owner-scoped `coffee_shelf_items` and `brewing_logs`. The API response now includes `nextCupPlan` and a `next_cup_plan` feature score.

## Verification

The selection logic is covered in `test/rebuy-intelligence.test.mjs`. The API route owner-scoping test remains in `test/rebuy-intelligence-route.test.mjs`.

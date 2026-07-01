# Peak Window Research

## Decision

CoffeeDex should add **Peak Window** guidance as the next retention feature after Brew-to-Shelf consumption and Grind Memory. It uses the shelf bean's existing roast/open dates to show whether a bean is still resting, in a good drinking window, should be finished now, or has moved past peak.

This stays inside CoffeeDex's current positioning: private coffee memory, better next cups, and easier rebuy decisions. It is not a community feed, marketplace, roaster referral, or push-notification system.

## Research Summary

- BeanBook added Rest & Peak reminders that nudge users when a bean finishes resting and before its peak flavor window closes. New beans with a roast date receive the reminders automatically: https://apps.apple.com/be/app/beanbook-coffee-tracker/id6499280064
- Timer.Coffee 3.6.5 added freshness peak alerts, days-since-roast on bean details, and brew reminders: https://www.timer.coffee/blog/timer-coffee-3-6-5-release-notes?slug=timer-coffee-3-6-5-release-notes
- r/pourover inventory discussions show users managing bean queues around rest time and peak timing, including light roast rest windows of multiple weeks and freezer workflows: https://www.reddit.com/r/pourover/comments/1njo7hk/lets_talk_inventory_management/
- r/pourover discussions repeatedly describe roast-date timing as roast-style dependent, with many users waiting from a few days to several weeks before a bag tastes best: https://www.reddit.com/r/pourover/comments/1o2mf71/how_long_should_i_wait_after_roast_date/ and https://www.reddit.com/r/pourover/comments/15yzkdt/coffee_peak_weeks_after_opening/

## Candidate Scoring

Scores use 1-5 where higher is better, except difficulty where higher means harder. ROI favors retention and painkiller strength while penalizing implementation risk.

| Candidate | Retention | Painkiller | Difficulty | Monetization | ROI | Decision |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Peak Window / Rest-to-Drink Loop | 4 | 4 | 2 | 3 | 4.2 | Build now |
| Equipment-aware Recipe Memory | 4 | 4 | 4 | 3 | 3.7 | Later |
| Brew Timer / Step Runner | 4 | 3 | 4 | 3 | 3.5 | Later |
| Freezer Inventory | 3 | 3 | 3 | 2 | 3.1 | Later |
| Community Recipes | 4 | 3 | 5 | 4 | 2.7 | Exclude for now |

## Product Spec

Peak Window should answer: "Should I open this bag now, drink it now, or finish it before it fades?"

Phases:

- `unknown`: No valid roast date; ask the user to add one.
- `resting`: Roast age is 0-4 days; suggest the first check date.
- `peak`: Roast age is 5-21 days; say this is a good flavor check window.
- `enjoy_now`: Roast age is 22-35 days; nudge the user to finish before the cup gets dull.
- `fading`: Roast age is over 35 days; treat it as past peak and connect it to rebuy memory if the record was good.

## UX Flow

1. User opens the shelf and flips a bean card.
2. Fresh Shelf shows the immediate action signal.
3. Peak Window shows the roast-date timing cue and target date when available.
4. Shelf Runway still shows remaining grams, cups, and suggested rebuy date.
5. The user can apply the rebuy date, save a purchase clue, or continue logging brews.

## DB/API Changes

No migration or route contract change is required. Peak Window is derived from existing owned `coffee_shelf_items.roast_date` and `coffee_shelf_items.opened_date` fields.

## Verification

The core date logic is covered by `test/fresh-shelf.test.ts`. Golden-flow and API docs now list `evaluateFreshPeakWindow` as an advisory render-time product surface.

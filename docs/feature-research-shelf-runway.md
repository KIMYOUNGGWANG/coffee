# Shelf Runway Research

## Research Summary

CoffeeDex already stores bean weight, remaining fill level, opened date, and rebuy reminder state. The next highest-ROI retention feature is to turn that static shelf into an operational countdown: how many cups are left, when the bag will run out, and when to set the next private rebuy reminder.

Sources reviewed:

- Beanconqueror emphasizes tracking beans, brews, and preparation parameters, showing that serious home coffee users already treat bean inventory as part of the brew system.
- Filtru positions itself around guided repeatable brewing, reinforcing that repeatability and timing are stronger loops than social discovery for home brewers.
- r/espresso and r/pourover discussions commonly mention logging dose, yield, grind setting, beans, and recipes in notebooks, spreadsheets, or apps.
- Korean home-cafe and specialty-coffee discussions similarly revolve around bean freshness, opened bags, brew recipes, and remembering which beans to buy again.

## Candidate Scoring

Scores use 1-5 where higher is better, except difficulty where 1 is easier.

| Candidate | Retention | Painkiller | Difficulty | Monetization | ROI | Reason |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Shelf Runway | 5 | 4 | 2 | 3 | 4.5 | Makes the private shelf actionable every day using existing weight, fill level, and opened date. |
| Push Rebuy Reminder | 5 | 4 | 4 | 4 | 4.0 | Strong, but requires notification permission and production delivery reliability. |
| Taste Match Criteria | 3 | 3 | 2 | 3 | 3.4 | Useful for shopping, but less urgent than managing beans already owned. |
| Receipt OCR Price Memory | 3 | 4 | 4 | 4 | 3.3 | Valuable, but OCR and privacy risk are higher. |
| Community Recipe Feed | 4 | 3 | 5 | 4 | 2.7 | Outside current private memory positioning and requires moderation. |

## Selected Feature

**Shelf Runway: cups-left and rebuy-date estimate**

The shelf card now estimates:

- grams remaining;
- cups remaining, using 15g as the default cup dose;
- expected days left when opened date and consumed amount are available;
- suggested private rebuy reminder date, usually three days before the bag is expected to run out.

## UX Flow

1. User opens Dashboard > Shelf.
2. User flips a shelf item card.
3. CoffeeDex shows Shelf Runway with cups remaining and a suggested rebuy date.
4. User taps the suggested date button to pin the bean and set the in-app rebuy reminder.

## DB/API Contract

No migration is required. Shelf Runway derives from existing private fields:

- `coffee_shelf_items.total_weight`
- `coffee_shelf_items.fill_level`
- `coffee_shelf_items.opened_date`
- `coffee_shelf_items.rebuy_priority`
- `coffee_shelf_items.rebuy_reminder_date`

The existing `PATCH /api/v1/shelf/:id` endpoint persists the suggested reminder date.

## Out Of Scope

- No push notifications.
- No order flow.
- No roaster marketplace or affiliate referral.
- No public community inventory comparison.

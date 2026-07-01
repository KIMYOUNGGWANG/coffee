# Brew-to-Shelf Consumption Research

## Research Summary

CoffeeDex should continue to avoid community, marketplace, and roaster-order scope until there is stronger evidence. The strongest repeated pain is private memory: beans, roast/open timing, grind or dose settings, running inventory, and what to adjust next.

Sources reviewed:

- [Beanconqueror](https://beanconqueror.com/) emphasizes recording many brew parameters such as grind size, brew time, and water amount, plus statistics and bean tracking. Its [app listing](https://apps.apple.com/us/app/beanconqueror/id1445297158) also highlights running bean totals so users know when they are running low.
- [BeanBook](https://apps.apple.com/us/app/beanbook-coffee-tracker/id6499280064) frames the pain as scattered screenshots, spreadsheets, forgotten grind settings, scanned bags, and a personal coffee shelf.
- [DripHub](https://apps.apple.com/kr/app/driphub/id6746667484)'s Korean listing centers on remembering what coffee was bought, roast date, brew method, aroma, flavor, recipes, and bean weight.
- r/pourover and r/espresso threads repeatedly mention tracking bean weight, grind settings, dose, yield, tasting notes, roast dates, and too many bags across notes, labels, spreadsheets, or dedicated apps.

## Candidate Scoring

Scores use 1-5 where higher is better, except difficulty where 1 is easier.

| Candidate | Retention | Painkiller | Difficulty | Monetization | ROI | Reason |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Brew-to-Shelf Consumption | 5 | 5 | 2 | 3 | 4.9 | Every saved cup updates the shelf, runway, and rebuy loop without another inventory chore. |
| Grinder Setting Memory | 4 | 4 | 3 | 2 | 3.9 | Strong espresso/pourover pain, but needs equipment modeling to avoid messy free text. |
| Recipe Timer / Step Runner | 4 | 3 | 4 | 3 | 3.6 | Increases sessions, but competes with mature brew timer apps and adds interaction risk. |
| Taste Match Purchase Criteria | 3 | 3 | 2 | 3 | 3.5 | Helpful for shopping, but weaker daily loop than current beans running out. |
| Community Recipe Feed | 4 | 3 | 5 | 4 | 2.7 | Higher moderation and marketplace drift; outside current private-memory wedge. |

## Selected Feature

**Brew-to-Shelf Consumption**

When a user saves a brewing log connected to a shelf bean and includes the coffee dose, CoffeeDex automatically subtracts that dose from the shelf item's estimated remaining grams. Fresh Shelf, Shelf Runway, Rebuy Intelligence, and Dial-in Coach then refresh from the updated fill level.

## Product Spec

- Input: owned `shelfItemId`, shelf `total_weight`, shelf `fill_level`, and `parameters.coffeeAmount`.
- Output: updated shelf `fill_level`, finished state at 0%, and `shelfConsumption` metadata in the brewing-log response.
- Empty or invalid dose leaves the shelf unchanged.
- The update is owner-scoped by both `id` and `user_id`.
- This is an inventory-memory loop, not an order, referral, marketplace, public statistic, or push-notification system.

## UX Flow

1. User opens the dashboard record tab or Dial-in Coach.
2. User chooses a shelf bean and enters or accepts a recipe with coffee dose.
3. CoffeeDex previews that saving the log will reduce the shelf fill level.
4. User saves the log.
5. Dashboard refreshes and Fresh Shelf / Rebuy Intelligence read the updated shelf state.

## DB/API Contract

No migration is required. Existing `coffee_shelf_items.total_weight`, `coffee_shelf_items.fill_level`, `coffee_shelf_items.is_finished`, and `brewing_logs.parameters` already support the behavior.

API changes:

- `POST /api/v1/brewing-logs` now fetches the owned shelf item when `shelfItemId` and `parameters.coffeeAmount` are present.
- The route calculates remaining grams from bag weight and fill percentage.
- The route updates the owned shelf row with the next fill level and finished state.
- The response includes optional `shelfConsumption` metadata.

## Out Of Scope

- No external marketplace.
- No roaster checkout or referral.
- No community feed.
- No push notification delivery in this iteration.

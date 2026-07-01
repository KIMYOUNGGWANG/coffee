# Grind Memory Research

## Research Summary

After Brew-to-Shelf Consumption, the strongest remaining retention pain is repeatability: users forget the exact grind setting, dose, yield, time, and method that worked for a bean. This is especially visible when switching between beans or keeping several bags open.

Sources reviewed:

- [r/espresso discussion](https://www.reddit.com/r/espresso/comments/1ltqp85/how_do_you_keep_track_of_your_espresso_settings/) mentions tracking coffee name, grind size, dose, ratio, time, comments, and then saving good recipes per bean.
- [r/pourover discussion](https://www.reddit.com/r/pourover/comments/1s2ytqv/best_app_to_track_beans_recipes_etc/) frames the bar as being simple enough to use early in the morning, while still logging bean/roaster, tasting notes, exact recipe, grind size, ratio, method, and time.
- [r/espresso grind setting discussion](https://www.reddit.com/r/espresso/comments/1o9xnre/how_do_you_lot_keep_track_of_grind_settings_for/) says Beanconqueror shows what was done last by bean so users can tweak from there.
- [BeanBook](https://apps.apple.com/us/app/beanbook-coffee-tracker/id6499280064) explicitly positions around avoiding forgotten grind settings and also promotes rest/peak reminders.
- [DripHub](https://apps.apple.com/kr/app/driphub/id6746667484) records brewing tool, bean dose, water, extraction time, temperature, grind size, and whether a recipe worked.
- [Coffee Recipes & Grind Tracker](https://play.google.com/store/apps/details?hl=ko&id=com.carloscondor.beansinventory) says users struggle to remember optimal grind settings by coffee type and need recipe/result records.

## Candidate Scoring

Scores use 1-5 where higher is better, except difficulty where 1 is easier. Brew-to-Shelf Consumption is treated as already selected in PR #13.

| Candidate | Retention | Painkiller | Difficulty | Monetization | ROI | Reason |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Grind Memory / Last Good Recipe Recall | 5 | 4 | 2 | 3 | 4.6 | Users repeatedly ask how to remember grind settings and good recipes; existing brew logs already contain the needed data. |
| Rest / Peak Flavor Window | 4 | 4 | 2 | 3 | 4.2 | Strong shelf loop, but CoffeeDex already has Fresh Shelf and runway timing. |
| Equipment-Aware Recipes | 4 | 4 | 4 | 3 | 3.7 | Useful, but requires equipment models and can become setup-heavy. |
| Brew Timer / Step Runner | 4 | 3 | 4 | 3 | 3.5 | Increases sessions, but competes with mature timer apps and adds live interaction complexity. |
| Community Recipes | 4 | 3 | 5 | 4 | 2.7 | Marketplace/community drift and moderation risk remain too high for the current wedge. |

## Selected Feature

**Grind Memory / Last Good Recipe Recall**

Dial-in Coach now returns the latest successful owned brew log for the selected shelf bean as `grindMemory`. The dashboard shows the last-good method, grind setting, dose, water, temperature, and brew time beside the starting recipe.

## Product Spec

- Source: owner-scoped `brewing_logs` already read by `GET /api/v1/dial-in-coach`.
- Eligibility: latest selected-bean log with `rating >= 4`.
- Empty state: if no successful log exists, prompt the user to save a 4-5 star cup.
- Output: `grindMemory` object with method, grind size, dose, water, temperature, brew time, rating, and timestamp.
- Scope: private repeatability memory only.

## UX Flow

1. User opens dashboard record tab.
2. Dial-in Coach selects the current shelf bean.
3. If the bean has a successful brew log, CoffeeDex shows "마지막으로 잘 된 세팅".
4. User starts from that setting or saves the suggested log.
5. Future good cups become the new private memory.

## DB/API Contract

No migration is required. Existing `brewing_logs.rating`, `brewing_logs.shelf_item_id`, and `brewing_logs.parameters` provide the needed memory.

API changes:

- `GET /api/v1/dial-in-coach` response includes `grindMemory`.
- `buildDialInCoach` derives `grindMemory` from the latest successful selected-bean log.
- The UI renders the memory inside the Starting Recipe card.

## Out Of Scope

- No public recipe feed.
- No grinder calibration database.
- No marketplace or roaster recommendation.
- No equipment setup model in this iteration.

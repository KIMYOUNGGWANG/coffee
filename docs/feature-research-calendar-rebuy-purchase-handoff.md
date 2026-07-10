# Feature Research: Calendar Rebuy Purchase Handoff

Date: 2026-07-10

## Decision

After a private calendar return resolves the exact shelf bean, open the user's own saved purchase link directly. When no link exists, provide an explicit generic bean search. This is a continuation of private memory into a real repurchase decision, not an ordering, affiliate, marketplace, or recommendation feature.

## Evidence And Gate

The prior calendar-return evidence ledger establishes repeated purchase and scattered-memory pain. Repository review found the exact return flow already recovered a bean and saved a decision but stopped before the user's saved buying clue; card-oriented Rebuy Clue Rescue already owns missing-clue entry, so a second clue-entry surface would duplicate it.

| Return behavior | Retention | Painkiller | Fit | Effort | Monetization | Weighted | Evidence | Decision |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Exact calendar return opens saved buying clue before a decision | 4 | 5 | 5 | 4 | 4 | 4.6 | 3 | Build now |
| Add another purchase-clue form on calendar return | 2 | 3 | 3 | 2 | 2 | 2.7 | 3 | Reject: duplicates Rebuy Clue Rescue |
| Generic weekly purchase suggestions | 3 | 3 | 3 | 3 | 3 | 3.0 | 2 | Later |

Measure `rebuy_purchase_clue_opened` using only `source` and `clue` (`saved_link` or `search`). Revisit if calendar-return users rarely open the clue after enough production volume; the current evidence confidence remains moderate because CoffeeDex has no customer analytics or interviews.

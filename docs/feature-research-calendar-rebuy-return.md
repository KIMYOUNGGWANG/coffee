# Feature Research: Exact Calendar Rebuy Return

Date: 2026-07-10

## Evidence Ledger

| Source | Date | Observation | Relevance |
| --- | --- | --- | --- |
| [r/pourover: How do you remember your favorite coffee beans?](https://www.reddit.com/r/pourover/comments/1kakpdv/how_do_you_remember_your_favorite_coffee_beans/) | 2025-03-26 | First-person question about preserving favorite-bean memory. | Supports recall pain, not calendar demand. |
| [r/pourover: Do you keep track of the coffees you try?](https://www.reddit.com/r/pourover/comments/1sh0pcp/do_you_keep_track_of_the_coffees_you_try_i_always/) | 2026-04-10 | Users describe scattered or incomplete coffee records. | Supports a low-friction return to one remembered record. |
| [r/pourover: Do you ever buy the same coffee again?](https://www.reddit.com/r/pourover/comments/1fx1abm/do_you_ever_buy_the_same_coffee_again/) | 2024-11 | Repeat purchasing is an explicit user behavior. | Supports a decisive rebuy action rather than collection mechanics. |
| CoffeeDex repository audit | 2026-07-10 | Existing calendar return captured only `source=rebuy_calendar`, so the cue lost which owned bean initiated it. | Direct implementation gap in the memory-to-repurchase loop. |

Evidence gap: no first-person source establishes that users specifically want `.ics` export. Calendar remains an optional delivery surface; the selected work only repairs the private recall and decision step after a user returns.

## Candidate Score

Scores use 1-5. Weighted score: retention 30%, painkiller 30%, strategic fit 20%, implementation effort 10% (smaller is higher), monetization connection 10%.

| User return behavior | Retention | Painkiller | Fit | Effort | Monetization | Weighted | Evidence | Decision |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Calendar return opens the exact remembered bean and saves a rebuy decision | 4 | 5 | 5 | 4 | 3 | 4.5 | 3 | Build now |
| Dashboard returns a generic weekly rebuy shortlist | 3 | 3 | 4 | 3 | 3 | 3.3 | 3 | Later |
| Remind users to add more tasting notes | 2 | 2 | 3 | 4 | 2 | 2.5 | 2 | Reject |
| Publicly compare favorite beans | 3 | 2 | 1 | 2 | 3 | 2.3 | 3 | Reject: product boundary |

## Selection And Falsification

Selected: when a user follows their private calendar reminder back to CoffeeDex, recover the exact owner-scoped bean with an opaque token and let them save `will_rebuy` or `rebought` immediately.

Return trigger: a user opens the calendar event. Expected cadence: each self-scheduled rebuy date. Measurement: owner-linked export, return, and later shelf decision within the existing 14-day calendar funnel. Premium/rebuy link: the decision preserves the private purchase memory that can lead to a later real repurchase; no checkout claim is made.

Falsify or revisit if fewer than 20% of authenticated calendar returns resolve the exact memory successfully, or fewer than 10% of resolved returns save a rebuy decision after enough production volume. The current evidence confidence is moderate because CoffeeDex has no user analytics or interview data yet.

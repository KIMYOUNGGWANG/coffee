# Feature Research: Rebuy Action Loop

Date: 2026-07-03

## Research Signals

- Reddit espresso users ask for lightweight bean tracking with basic notes and grind settings, and explicitly call Beanconqueror powerful but too complex for their needs: https://www.reddit.com/r/espresso/comments/1nm3hgi/whats_your_goto_app_for_tracking_coffee_beans/
- Reddit espresso and pourover users repeatedly ask how to remember grind settings, recipes, and which beans they liked instead of relying on notes or post-its: https://www.reddit.com/r/espresso/comments/vb82ew/does_anyone_know_of_a_decent_app_for_storing/ and https://www.reddit.com/r/espresso/comments/1o9xnre/how_do_you_lot_keep_track_of_grind_settings_for/
- Korean-language app listings show local products are emphasizing bean management, freshness tracking, taste-assistant adjustments, and grinder conversion rather than public community as the core daily utility: https://apps.apple.com/kz/app/%EA%B7%B8%EB%83%A5-%EC%BB%A4%ED%94%BC-%EC%9B%90%EB%91%90-%EA%B4%80%EB%A6%AC-%EC%BB%A4%ED%94%BC-%EB%A0%88%EC%8B%9C%ED%94%BC/id6759592085
- Beanconqueror's store copy highlights tracking beans, importing roaster information, and running totals so users know when beans are low: https://apps.apple.com/us/app/beanconqueror/id1445297158
- Siip's 2026 comparison frames the category split clearly: Beanconqueror is strongest for detailed brew parameters, while recommendation products need enough tracked ratings first: https://www.siip.coffee/guides/best-coffee-apps-2026

## Candidate Score

Scores use 1-5 where 5 is strongest. Difficulty is inverted in ROI: lower difficulty is better.

| Candidate | Retention | Painkiller | Difficulty | Monetization | ROI | Decision |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Rebuy Action Loop | 5 | 5 | 2 | 4 | 4.7 | Build now |
| Last Good Grind shortcut | 5 | 4 | 3 | 3 | 4.2 | Backup |
| Korean flavor language coach v2 | 3 | 4 | 3 | 2 | 3.2 | Later |
| Guest-to-saved funnel analytics | 4 | 3 | 3 | 3 | 3.4 | Operator value, not user-facing enough |
| Roaster/community discovery | 4 | 3 | 5 | 5 | 2.8 | Deferred by product boundary |

## Selected Feature

Rebuy Action Loop lets a user save the next rebuy state directly from the Rebuy Intelligence panel:

- `will_rebuy`: pins the selected shelf item as a private follow-up.
- `rebought`: marks the purchase completed and clears the reminder date.

## Product Boundary

This feature stays inside private coffee memory and repurchase. It uses owner-scoped shelf rows and the existing `PATCH /api/v1/shelf/:id` contract. It does not create a roaster order, marketplace listing, referral, public recommendation, social feed, or push notification.

## UX Flow

1. User opens `/dashboard`.
2. Rebuy Intelligence picks a shelf-backed candidate from owned cards, shelf, or brew logs.
3. The panel shows a compact saved-loop strip.
4. User taps `다시 살래요` or `다시 샀음`.
5. CoffeeDex saves the private shelf action and refreshes Rebuy Intelligence for the next visit.

## Implementation Notes

No migration is required. Existing columns already support the behavior:

- `coffee_shelf_items.rebuy_action`
- `coffee_shelf_items.rebuy_action_at`
- `coffee_shelf_items.rebuy_priority`
- `coffee_shelf_items.rebuy_reminder_date`

UI and client API changes are covered by `test/dashboard-fresh-shelf.test.ts`.

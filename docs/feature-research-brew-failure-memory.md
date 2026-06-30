# Brew Failure Memory Research

## Research Summary

CoffeeDex should stay focused on private coffee memory, rebuy, and next-cup improvement. Community and marketplace features remain out of scope because the strongest user pain is not discovery by strangers; it is remembering beans, brew variables, and how to improve the next cup.

Sources reviewed:

- Beanconqueror positions itself around optimizing brewing and tracking beans, with many customizable brew parameters.
- Filtru positions itself as a guided brew companion for making repeatable coffee at home.
- r/espresso and r/pourover threads repeatedly mention tracking beans, grinder settings, dose, yield, brew time, and recipes in notes apps, notebooks, spreadsheets, or dedicated apps.
- App discussions praise bean inventory and detailed brew logs, but also show that generic notes are free and easy; CoffeeDex needs a more direct loop than another blank log.

## Candidate Scoring

Scores use 1-5 where higher is better, except difficulty where 1 is easier.

| Candidate | Retention | Painkiller | Difficulty | Monetization | ROI | Reason |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Brew Failure Memory | 5 | 5 | 2 | 3 | 4.8 | Converts a bad cup into the next action and uses existing `brewing_logs.coach_feedback`. |
| Rebuy Reminder push | 5 | 4 | 4 | 4 | 4.0 | Strong loop, but real notification delivery adds permissions and production risk. |
| Bag scan purchase memory | 4 | 4 | 3 | 3 | 3.9 | Useful, already partially present through purchase URL and scan flows. |
| Taste Match criteria | 3 | 3 | 2 | 3 | 3.4 | Helpful for shopping, but less urgent than fixing the cup already in hand. |
| Community recipe feed | 4 | 3 | 5 | 4 | 2.7 | Higher moderation/product risk and outside current private-memory positioning. |

## Selected Feature

**Brew Failure Memory: one-tap next-cup correction**

When a user opens Dial-in Coach after brewing, they can tap one of five outcomes:

- 시다
- 쓰다
- 묽다
- 무겁다
- 좋았다

CoffeeDex saves the feedback as a private brewing log with `coach_feedback`. The next Dial-in Coach response reads the newest feedback and adjusts one variable in the suggested recipe.

## UX Flow

1. User opens `/dashboard` and goes to the 기록 tab.
2. Dial-in Coach shows the current bean, starting recipe, and next moves.
3. User taps a feedback chip after tasting.
4. CoffeeDex saves a private `brewing_logs` row.
5. The coach refreshes and the next recipe reflects the feedback.

## DB/API Contract

No new migration is required. The existing `20260629000000_add_brewing_log_coach_snapshot.sql` migration already provides `brewing_logs.coach_feedback`.

API changes:

- `GET /api/v1/dial-in-coach` now selects `coach_feedback`.
- `POST /api/v1/brewing-logs` already accepts `coachFeedback`.
- `buildDialInCoach` now uses recent `coach_feedback` before generic note parsing.

## Out Of Scope

- No public recipes.
- No community comparison.
- No roaster marketplace or order flow.
- No push notifications in this iteration.

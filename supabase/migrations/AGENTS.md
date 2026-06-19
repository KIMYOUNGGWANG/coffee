# MIGRATION KNOWLEDGE

## OVERVIEW

Ordered Supabase/Postgres schema history for cards, profiles, credits, scan limits, Stripe state, public sharing, shelf items, and brewing logs.

## WHERE TO LOOK

| Domain | Migration | Notes |
| --- | --- | --- |
| Card foundation | `20260614000000_create_tasting_cards.sql` | Shared `updated_at` trigger function starts here |
| Profile and credits | `20260614000001_add_credits_to_profiles.sql` | Profile bootstrap, auth trigger, atomic credit RPC |
| Notes and scan limits | `20260614000002_add_brewing_notes_and_scan_limits.sql` | Child rows and scan-usage RPC |
| Stripe audit | `20260614000003_add_stripe_events_and_entitlement_audit.sql` | Event ledger and append-only audit trail |
| Subscription state | `20260614000004_add_subscription_state_to_profiles.sql` | Stripe lifecycle columns and indexes |
| Public sharing | `20260614000005_add_public_card_sharing.sql` | Narrow opt-in public SELECT policy |
| Shelf and brewing logs | `20260617000000_create_coffee_shelf_and_logs.sql` | User-owned tables and shared trigger reuse |

## CONVENTIONS

- Add a new timestamp-prefixed migration; never rewrite an applied migration to change production state.
- Make additive changes replay-safe with `IF NOT EXISTS` or catalog-guarded `DO $$` blocks where Postgres lacks direct support.
- Qualify shared application objects with `public.` in new migrations and preserve lexical dependency order.
- Enable RLS on every user-owned table and define explicit operation policies scoped by `auth.uid()`.
- Add application owner indexes plus query-specific indexes in the same migration as the access path.
- Reuse `update_updated_at_column()` for timestamped tables instead of adding one-off trigger functions.
- Keep balance/usage mutations atomic in SQL RPCs with row locking; `SECURITY DEFINER` functions must set a safe `search_path`.
- Backfill existing rows when adding required profile state, then cover future users through the existing bootstrap trigger.
- Use `CHECK` constraints for bounded ratings and enum-like text states.

## ANTI-PATTERNS

- Do not weaken owner policies to add public access; add a narrow, separately named public SELECT policy.
- Do not create duplicate policies, triggers, indexes, or functions without replay guards.
- Do not split billing ownership: profiles hold current entitlement state, `stripe_events` holds processing state, and `entitlement_audit` holds history.
- Do not perform credit, scan, or entitlement read-modify-write sequences only in application code.
- Do not add a table without its RLS policy set, ownership index, and required timestamp trigger in the same migration.
- Do not test migrations against production or a live customer dataset.

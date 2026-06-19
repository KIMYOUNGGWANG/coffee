# PRD: CoffeeDex v2.0 - Coffee Memory and Repurchase

The filename is retained as a historical documentation path. CoffeeDex is the canonical product and user-facing brand.

## Product Promise

CoffeeDex is the fastest way to remember and find a coffee worth buying again.

> 좋았던 원두를 잊지 않고, 다시 찾는 가장 빠른 방법.

The primary job is recall and repurchase confidence, not detailed brew logging, social performance, or a premature marketplace. A user captures a bag, confirms what is true, records whether they would buy it again, and retrieves that memory later.

## Target User and JTBD

The initial user is a Korean specialty-coffee drinker who saves bags or photos but abandons high-effort logging.

When choosing a next coffee, they need to find the name of a previously enjoyed bean and why they liked it within 30 seconds, so they can confidently repurchase it or make a similar choice.

## Product Order

1. Capture and remember a coffee with minimal friction.
2. Search memories and decide whether to repurchase.
3. Reveal an evidence-labeled taste snapshot after enough confirmed records exist.
4. Offer sharing and paid artifacts only after the memory value is established.

## Current Foundation

- Private coffee memories are stored in the historical `tasting_cards` table. This identifier remains unchanged for database and route compatibility.
- Package claims and user-perceived taste are separate concepts. AI extraction creates an editable draft and never makes a package claim authoritative.
- Memory provenance records nullable package origin/process, scan source/confidence, corrected fields, and user confirmation time.
- Repurchase intent is explicit: `again`, `maybe`, `no`, or `undecided`.
- Retrieval covers coffee name, roaster, origin, process, notes, tags, and repurchase intent.
- Taste snapshots disclose sample count and coverage. Five records may show an early preview; ten or more diverse records may show a current snapshot. CoffeeDex never claims a fixed "taste DNA."

## Trust Requirements

- Durable persistence remains authenticated and owner-scoped.
- Guest text drafts stay in browser storage for less than 24 hours until the user chooses to save; raw images are processed ephemerally and are not stored in the draft.
- Unknown or low-confidence scan fields remain unknown and editable.
- Scan input is limited to 5 MiB JPEG, PNG, or WebP and must pass MIME and file-signature validation. The MVP guest trial is process-local and is not distributed rate limiting.
- JSON and CSV export of cards, brewing notes, shelf items, and brewing logs, plus account deletion, are free trust features.
- Account deletion privatizes public cards and redacts/detaches retained audit records before deleting owned rows, the profile, and the Auth identity last. Storage-object cleanup is not yet promised.
- Analytics use allowlisted operational event properties; images, notes, and package claims are not reused as hidden analytics payloads.

## Secondary Compatibility

Existing PDF export, Stripe checkout and entitlements, story export, and public share routes remain supported as secondary compatibility surfaces. They are not the primary landing, onboarding, empty-state, or dashboard action. Their historical route paths and entitlement identifiers are preserved.

## Explicitly Deferred

Marketplace, affiliate catalog, roaster partnership, community feed, follows, comments, and new brew-timer scope are deferred. No current screen or API may represent them as shipped product behavior.

## Validation Gates

- Activation: first user-confirmed durable coffee memory.
- Retention: second and third distinct bags plus later archive retrieval.
- Scan quality: critical-field correctness, correction time, failure rate, and p95 latency.
- Recall: a saved coffee can be found by a promised field within 30 seconds.
- Revenue: paid entitlement conversion is evaluated only among eligible retained users.

## Architecture Constraints

- Next.js, Supabase, Stripe, and the current AI adapter remain in place.
- Schema evolution is additive; applied migrations and owner RLS are never rewritten or weakened.
- `docs/api-spec.md` is the executable API source of truth.

# CoffeeDex Golden Flows

These are the executable product truths protected by the smoke suite. CoffeeDex leads with recall and repurchase; artifact, payment, and public-sharing behavior remains secondary compatibility.

## Flow 1. Capture and Confirm a Coffee Memory

Given a coffee drinker has a bag photo or knows the coffee details, when they review the editable draft, separate package claims from user-perceived taste, choose whether they would buy again, and confirm the record, then CoffeeDex can persist a private owner-scoped `tasting_cards` memory.

Quick Add Memory Mode is the current one-screen capture path for the same private contract. It lets the user enter bean name, roaster, a one-line note, a would-buy-again choice, and optional Korean flavor helper chips, then saves a confirmed card through `POST /api/v1/cards`. A nonblank one-line note is stored as note/description memory, but it is not last-good-brew evidence; blank notes do not generate fallback rebuy reasons or `footerMeta.extraInfo`.

Evidence surfaces: `/onboarding`, `/dashboard`, `POST /api/v1/cards`

## Flow 2. Scan a Package into an Editable Draft

Given a user selects a package image, when scanning succeeds, then CoffeeDex returns extracted package claims with provenance and uncertainty for review. Unknown values remain unknown; the user may correct the draft or use manual entry before saving.

For a guest, the image is processed without raw-image persistence and the text draft remains in local browser storage for less than 24 hours. JPEG, PNG, and WebP inputs must pass the 5 MiB decoded-size, MIME, and file-signature checks. The one-trial limit is process-local only, not distributed production rate limiting.

Evidence surfaces: `POST /api/v1/cards/scan`, `useScanCoffeePackage`

## Flow 3. Retrieve a Coffee Worth Buying Again

Given a user has confirmed memories, when they search or filter by coffee, roaster, origin, process, note, tag, or repurchase intent, then CoffeeDex returns the matching memory and its recorded reason.

Saved cards marked `again` can show private rebuy recall from the user's own `repurchase_reasons`. Last-good-brew recall is shown only when `footer_meta.extraInfo` contains actual brew-like metadata such as method, ratio, temperature, or grams, not from a generic one-line note. This is memory recall only, not an order, referral, or marketplace action.

Evidence surfaces: `/dashboard`, `GET /api/v1/cards`

## Flow 3A. Use Korean Flavor Helper Chips

Given a user wants to save a cup quickly, when they open Quick Add Memory Mode, then CoffeeDex offers Korean flavor helper chips such as fruit, chocolate, honey, citrus, nutty, and floral cues. The chips become editable private tags and do not claim expert SCA scoring.

Evidence surfaces: `/dashboard`, `QuickAddMemoryForm`, `POST /api/v1/cards`

## Flow 4. Use Fresh Shelf Rebuy Timing

Given a user has beans on the private shelf, when CoffeeDex renders the shelf card, then it derives a Korean next-action signal from roast date, opened date, fill level, and finished state: wait, drink now, finish soon, or rebuy. If the user saved a purchase link or buying note, the shelf keeps that private clue so the user can reopen it later; otherwise CoffeeDex falls back to a search URL. The user can also pin a bean as a personal rebuy candidate, set an in-app next-buy date, and mark it as drank, will-rebuy, or rebought. This guidance is local product memory, not a push notification, roaster order, marketplace listing, or partner referral.

Evidence surfaces: `/dashboard`, `GET /api/v1/shelf`, `PATCH /api/v1/shelf/:id`, `evaluateFreshShelfStatus`

## Flow 4A. Start a Dial-in Coach Recipe

Given a user has a current shelf bean, when they open the brewing log tab, then CoffeeDex derives a first-cup starting recipe from the owned shelf item, roast/open timing, and recent owned brew logs. The user can save that suggestion as a private `brewing_logs` row with a `coach_snapshot`, then tap a one-cup feedback button such as sour, bitter, weak, heavy, or balanced after tasting. CoffeeDex stores that private `coach_feedback` and uses it to change the next recipe by one variable. This is personal brew guidance only, not a community recipe feed, marketplace recommendation, or roaster order.

Evidence surfaces: `/dashboard`, `GET /api/v1/dial-in-coach`, `POST /api/v1/brewing-logs`, `buildDialInCoach`

## Flow 4B. Follow Rebuy Intelligence

Given a user has owned cards, shelf items, or brewing logs, when CoffeeDex opens the shelf dashboard, then it shows a private Rebuy Intelligence panel with four owner-data actions: a rebuy timing reminder, a taste-match criterion from liked cards, a package or shelf based repurchase memory, and a brew-failure adjustment prompt. Saved purchase URLs and buying notes take precedence over generic search links. This is a personal memory loop only; it does not claim community recommendations, partner offers, marketplace listings, roaster orders, or background notification delivery.

Evidence surfaces: `/dashboard`, `GET /api/v1/rebuy-intelligence`, `buildRebuyIntelligence`

## Flow 5. Review a Progressive Taste Snapshot

Given a user has confirmed memories, when they open the snapshot, then CoffeeDex displays literal sample count and coverage. One to two records form a collage, three to four show first signals, five to nine show an early preview, and ten or more sufficiently varied records show a current snapshot. Sparse data never appears complete.

Evidence surfaces: `/dashboard`, `GET /api/v1/profile/analytics`

## Flow 6. Export or Delete Owned Data

Given an authenticated user opens trust settings, when they export or confirm account deletion, then CoffeeDex provides free JSON and CSV downloads covering `tasting_cards`, `brewing_notes`, `coffee_shelf_items`, and `brewing_logs`, or performs owner-scoped deletion that stops on the first failure.

Deletion first removes public exposure and detaches retained audit/analytics records, then deletes owned product rows and the profile, and deletes the Auth identity last. Redacted Stripe audit data and anonymized product events may remain; storage-object cleanup is not promised by the current implementation.

Evidence surfaces: `GET /api/v1/export?format=json|csv`, `DELETE /api/v1/account`

## Secondary Compatibility Flow. Share a Story Card

Given a user deliberately opens a saved card's secondary share action, when they export or publish it, then CoffeeDex uses the confirmed coffee memory. Sharing is optional and does not replace capture or retrieval as the primary action.

Evidence surfaces: `StoryExportModal`, `TastingCard`, public card routes

## Secondary Compatibility Flow. Export PDF or Purchase an Entitlement

Given an eligible user deliberately opens a secondary offer, when they request PDF export or Stripe checkout, then the existing PDF, checkout, webhook, and entitlement contracts remain available. These routes are compatibility surfaces, not the core wedge.

Evidence surfaces: `GET /api/v1/pdf`, `POST /api/v1/checkout`, `POST /api/v1/webhooks/stripe`

## Future Boundary

Roaster partnership, referral, marketplace, and community layers are future product layers only. They are not part of the current golden flows and must not be represented as current capabilities until separate contracts and verification exist.

## Smoke Verification

```bash
node --test test/brand-contract.test.mjs test/brand-leak.test.mjs test/product-copy.test.mjs test/smoke.test.mjs
```

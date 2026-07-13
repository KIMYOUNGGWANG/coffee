# CoffeeDex Golden Flows

These are the executable product truths protected by the smoke suite. CoffeeDex leads with recall and repurchase; artifact, payment, and public-sharing behavior remains secondary compatibility.

## Flow 1. Capture and Confirm a Coffee Memory

Given a coffee drinker has a bag photo or knows the coffee details, when they review the editable draft, separate package claims from user-perceived taste, choose whether they would buy again, and confirm the record, then CoffeeDex can persist a private owner-scoped `tasting_cards` memory.

Quick Add Memory Mode is the current one-screen capture path for the same private contract. The default 20-second surface shows only bean name, roaster, would-buy-again choice, and a one-line note; purchase clues, origin, process, flavor tags, and acidity/sweetness/body stay behind optional detail disclosures. A nonblank one-line note is stored as note/description memory, but it is not last-good-brew evidence; blank notes do not generate fallback rebuy reasons or `footerMeta.extraInfo`.

Evidence surfaces: `/capture`, `/onboarding`, `/dashboard`, `POST /api/v1/cards`

## Flow 2. Scan a Package into an Editable Draft

Given a user selects a package image, when scanning succeeds, then CoffeeDex returns extracted package claims with provenance and uncertainty for review. Unknown values remain unknown; the user may correct the draft or use manual entry before saving.

For a guest, the image is processed without raw-image persistence and the text draft remains in local browser storage for less than 24 hours. JPEG, PNG, and WebP inputs must pass the 5 MiB decoded-size, MIME, and file-signature checks. The one-trial limit is process-local only, not distributed production rate limiting.

Evidence surfaces: `POST /api/v1/cards/scan`, `useScanCoffeePackage`

## Flow 3. Retrieve a Coffee Worth Buying Again

Given a user has confirmed memories, when they search or filter by coffee, roaster, origin, process, note, tag, or repurchase intent, then CoffeeDex returns the matching memory and its recorded reason.

Saved cards marked `again` can show private rebuy recall from the user's own `repurchase_reasons`. Last-good-brew recall is shown only when `footer_meta.extraInfo` contains actual brew-like metadata such as method, ratio, temperature, or grams, not from a generic one-line note. This is memory recall only, not an order, referral, or marketplace action.

Evidence surfaces: `/dashboard`, `GET /api/v1/cards`

## Flow 3A. Save a 20-Second Quick Record

Given a user wants to save a cup quickly, when they open Quick Add Memory Mode, then CoffeeDex shows bean name, roaster, whether they would buy again, and one-line note before optional detail fields. If the user opens the purchase-clue disclosure, CoffeeDex can save a private purchase note such as store, price, or bag size, plus an optional purchase URL, so the later Rebuy Timing and Rebuy Intelligence surfaces can reopen that clue. Purchase clues, flavor tags, package facts, and taste sliders stay outside the default quick-record surface.

Evidence surfaces: `/dashboard`, `QuickAddMemoryForm`, `POST /api/v1/cards`

## Flow 3B. Revisit Rebuy Timing Memory

Given a user has private cards marked `again` or `maybe`, or cards with saved purchase clues, when they open the dashboard, then CoffeeDex derives a Rebuy Timing Memory panel from the user's own card dates, roaster/bean labels, repurchase reasons, purchase URL, and buying note. The panel groups candidates as fresh memory, time to re-check, or easy-to-forget overdue memory, exposes a copyable search phrase built from the user's saved roaster, bean, purchase note, and tags, turns purchase notes into private purchase-memory chips such as store, price, and bag size when those clues are present, and derives a conservative bag-to-cup pace cue from saved bag size plus days since the memory. It opens either the saved card or the user's saved purchase/search clue. This is a private recall surface only; it is not a collection badge, public recommendation, marketplace listing, roaster order, referral, or push notification.

Evidence surfaces: `/dashboard`, `buildRebuyTimingMemory`, `buildRebuyPurchaseMemory`, `buildRebuyPaceMemory`, `DashboardRebuyTimingMemoryPanel`

## Flow 3C. Explain My Rebuy Taste

Given a user has private cards marked `again` or `maybe`, when they open the dashboard, then CoffeeDex derives a copyable Taste Rebuy Brief from the user's own liked cards, tags, acidity/sweetness/body scores, sample bean names, and saved rebuy reasons. The brief lets the user explain what they tend to buy again in Korean before searching, asking a barista, or choosing another bean. This is a private preference recall surface only; it is not AI marketplace recommendation, community taste matching, public profile, roaster ordering, or badge collection.

Evidence surfaces: `/dashboard`, `buildRebuyTasteBrief`, `DashboardRebuyTasteBriefPanel`

## Flow 3D. Turn A Rebuy Into Shelf Memory

Given a user has a private rebuy candidate card, when they actually buy that bean again from the remembered clue, then CoffeeDex can start a new private shelf memory from the existing card's roaster, bean name, origin, purchase URL, buying note, and parsed bag weight. The new shelf row starts with `rebuy_action: "none"` and a full fill level, so Fresh Shelf, Shelf Runway, and Rebuy Intelligence can continue the next retention loop as a current bag. The original card preserves the user's repurchase preference. This is a user-confirmed memory transfer only; it does not place an order, create a marketplace transaction, notify a roaster, or publish the purchase.

Evidence surfaces: `/dashboard`, `POST /api/v1/shelf`, `buildRebuyShelfTransferPayload`, `DashboardRebuyTimingMemoryPanel`

## Flow 3E. Rescue Missing Rebuy Clues

Given a user has private cards marked `again` or `maybe`, when CoffeeDex opens the dashboard, then it derives a Rebuy Clue Rescue queue from existing owner-scoped card fields and highlights records that would be hard to buy again because purchase place, price, purchase link, or rebuy reason is missing. The panel shows the clue that is already saved, the missing clue labels, and an inline form that can save purchase note, purchase URL, and rebuy reason back to the owned card through `PATCH /api/v1/cards/:id` only after at least one missing clue is filled. It can still reopen the full card when the user needs more context. This is a private memory-completion loop only; it is not a badge, collection quest, marketplace recommendation, roaster order, referral, community review, or push notification.

Evidence surfaces: `/dashboard`, `PATCH /api/v1/cards/:id`, `buildRebuyClueRescue`, `buildRebuyClueRescuePatch`, `DashboardRebuyClueRescuePanel`

## Flow 4. Use Fresh Shelf Rebuy Timing

Given a user has beans on the private shelf, when CoffeeDex renders the shelf card, then it derives a Korean next-action signal from roast date, opened date, fill level, and finished state: wait, drink now, finish soon, or rebuy. The card also derives a Peak Window cue from the owned roast/open dates so the user can see whether a bean is still resting, in its peak range, ready to finish now, or past its peak. The card also estimates Shelf Runway: grams left, cups remaining, likely run-out timing, and a suggested in-app rebuy reminder date from the user's own weight, fill level, and opened date. If the user saved a purchase link or buying note, the shelf keeps that private clue so the user can reopen it later; otherwise CoffeeDex falls back to a search URL. The user can also pin a bean as a personal rebuy candidate, apply the suggested next-buy date, and mark it as drank, will-rebuy, or rebought. When a saved rebuy date exists, the user can choose a user-initiated private calendar export through `GET /api/v1/shelf/:id/rebuy-calendar`; the all-day event returns to `/dashboard?source=rebuy_calendar&rebuy_token=:opaque_uuid`. After authentication, CoffeeDex rechecks the opaque token against the owner-scoped shelf row, shows the exact saved bean and purchase clue, and lets the user open their saved buying link or explicitly use a generic search before saving `will_rebuy` or `rebought`. A `rebought` decision never auto-duplicates the old bag: only then can the user explicitly add a separate new active bag, prefilled from their owned memory, so Fresh Shelf and the next rebuy decision continue from the new bag. Shelf IDs, tokens, bean labels, buying links, and notes never enter analytics. This is an inferred response to forgetting and timing pain, not direct first-person demand for `.ics` files. This guidance is local product memory, not a push notification, roaster order, marketplace listing, or partner referral.

Evidence surfaces: `/dashboard`, `GET /api/v1/shelf`, `PATCH /api/v1/shelf/:id`, `GET /api/v1/shelf/:id/rebuy-calendar`, `evaluateFreshShelfStatus`, `evaluateFreshPeakWindow`, `evaluateShelfRunway`

## Flow 4A. Start a Dial-in Coach Recipe

Given a user has a current shelf bean, when they open the brewing log tab, then CoffeeDex derives a first-cup starting recipe from the owned shelf item, roast/open timing, and recent owned brew logs. The user can save that suggestion as a private `brewing_logs` row with a `coach_snapshot`, then tap a one-cup feedback button such as sour, bitter, weak, heavy, or balanced after tasting. CoffeeDex stores that private `coach_feedback` and uses it to change the next recipe by one variable. This is personal brew guidance only, not a community recipe feed, marketplace recommendation, or roaster order.

Evidence surfaces: `/dashboard`, `GET /api/v1/dial-in-coach`, `POST /api/v1/brewing-logs`, `buildDialInCoach`

## Flow 4A-0. Recall The Last Good Grind Setting

Given a user has a 4-5 star brew log for the current shelf bean, when they open Dial-in Coach, then CoffeeDex shows the last-good method, dose, water, temperature, grind setting, and brew time next to the starting recipe. If no successful log exists, it asks the user to leave a high-rated brew so the setting can be remembered later. This is private repeatability memory only, not a public recipe feed, grinder calibration database, marketplace recommendation, or roaster order.

Evidence surfaces: `/dashboard`, `GET /api/v1/dial-in-coach`, `buildDialInCoach`

## Flow 4A-1. Let Brew Logs Update Shelf Runway

Given a user logs a brew for an owned shelf bean with a coffee dose, when `POST /api/v1/brewing-logs` saves the private brewing log, then CoffeeDex also decreases that owned shelf item's fill level from the dose and bag weight. The next dashboard refresh uses the updated fill level for Fresh Shelf, Shelf Runway, Rebuy Intelligence, and finished-state guidance. This is private inventory memory only, not a marketplace, public consumption statistic, roaster order, or push notification.

Evidence surfaces: `/dashboard`, `POST /api/v1/brewing-logs`, `GET /api/v1/shelf`, `calculateShelfConsumption`

## Flow 4B. Follow Rebuy Intelligence

Given a user has owned cards, shelf items, or brewing logs, when CoffeeDex opens the shelf dashboard, then it leads with private rebuy recall before inventory browsing: the first screen shows the current rebuy candidate, the latest saved bean, a 20-second record action, and then a private Rebuy Intelligence panel with five owner-data actions. Those actions are a Next Cup plan for what to brew today, a rebuy timing reminder, a taste-match criterion from liked cards, a package or shelf based repurchase memory, and a brew-failure adjustment prompt. Saved purchase URLs and buying notes take precedence over generic search links. If the selected loop points to an owned shelf item, the user can save an in-app rebuy action directly from the panel: `will_rebuy` pins the item for follow-up, and `rebought` clears the reminder after purchase. After `rebought`, the same panel offers an explicit new-bag action that carries the owned roaster, bean, origin, bag weight, tasting-card link, and purchase clues into a separate active shelf memory with reset fill and rebuy state. The source shelf ID makes retries idempotent. Each owner-verified successor also records the Korean purchase date and increments its visible purchase sequence, so the shelf shows that this is the second or later bag instead of losing the earlier memory. This is a personal memory loop only; it does not claim community recommendations, partner offers, marketplace listings, roaster orders, or background notification delivery.

Evidence surfaces: `/dashboard`, `GET /api/v1/rebuy-intelligence`, `PATCH /api/v1/shelf/:id`, `buildRebuyIntelligence`, `DashboardRebuyIntelligencePanel`

## Flow 4C. Reopen a photo-backed memory before buying

Given the user has confirmed private `again` or `maybe` records, when the shelf dashboard opens, then CoffeeDex shows up to three ranked memories with their saved bag photos and up to three flavor conditions derived only from those confirmed records. The user can reopen the private card, copy a search phrase, open a saved purchase clue or search, or explicitly start a new shelf memory after buying. The `next_purchase_memory_opened` event stores only the action and clue kind; it never stores coffee identity, image, note, URL, card ID, or shelf ID.

Evidence surfaces: `/dashboard`, `buildRebuyTimingMemory`, `DashboardRebuyTimingMemoryPanel`, `next_purchase_memory_opened`

## Flow 4D. Keep a personal taste sentence

Given the user has confirmed `again` or `maybe` memories, when CoffeeDex derives a taste brief, then the user can rewrite it in their own words, save up to 160 characters privately on their owner-scoped profile, copy it before choosing beans, or return to the automatic record-derived sentence. `taste_preference_saved` and `taste_preference_copied` record only the surface and whether the sentence was custom or automatic; the sentence, bean, roaster, photo, note, URL, and record identifiers never enter event properties.

Evidence surfaces: `/dashboard`, `GET/PATCH /api/v1/profile`, `DashboardRebuyTasteBriefPanel`, `taste_preference_saved`, `taste_preference_copied`

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

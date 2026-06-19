# Ultraresearch Synthesis: CoffeeDex PRD

Workers: 22 research turns · Waves: 3 · Sources: 40+ · Verifications: 2

## Executive Summary

CoffeeDex solves a credible problem: enthusiasts save bags or photos, want to remember what they liked, and abandon detailed logging when mobile entry becomes work. The visual, photo-first direction is strong. However, the current PRD overstates differentiation: BeanBook already offers AI bag scanning, visual shelves, tasting comparison and yearly insights, while other apps cover detailed logs, search, export and social discovery. [Source 1][Source 2][Source 3]

The sharper wedge is not “beautiful AI coffee shelf,” but **“the fastest way to remember and find a coffee worth buying again.”** Beauty should be the emotional experience layer; the taste passport should be earned after enough data; sharing should be an optional acquisition loop. This follows the strongest observed JTBD and avoids competing with broad coffee operating systems. [Source 1][Source 4][Source 5]

The technical plan is feasible, but the product promise needs measurable limits. Gemini can parse images into schema-shaped JSON but does not guarantee semantic accuracy; PWA works for foreground capture/share but not reliable iOS background work; Firebase is viable with strict ownership, deletion and abuse controls. [Source 6][Source 7][Source 8][Source 9]

## What Is Strong

1. The physical-bag-to-digital-memory problem is concrete and emotionally legible. Community evidence shows people save bag photos or packages for future recall and find Notion-style logging cumbersome. [Source 4][Source 5]
2. Photo-first capture matches the job and minimizes form fatigue. Guest-first capture, just-in-time permission and progressive authentication are sound patterns. [Source 10][Source 11]
3. The shelf metaphor is appropriate for collection pride and later retrieval. Visual shelves, owned/want states and selective share artifacts work in adjacent collection products. [Source 12][Source 13]
4. Data export and deletion increase trust, even though they are table stakes rather than a moat. [Source 14][Source 15]
5. PWA is a sensible launch surface when capture uses the system picker and foreground retry rather than assuming native-equivalent background execution. [Source 7][Source 16]

## Main Problems

### 1. Positioning Is Already Occupied

BeanBook already markets AI bag scanning, visual shelf/card views, tasting notes, yearly insights, recipes and discovery. “AI scan + beautiful shelf + taste insights” is feature parity, not a category claim. [Source 1][Source 2]

**Change:** Position around low-friction recall and repurchase:

> 좋았던 원두를 잊지 않고, 다시 찾는 가장 빠른 방법.

### 2. Three Product Bets Are Mixed Together

The PRD simultaneously bets on archive utility, social sharing and paid analytics. Evidence is strongest for memory/retrieval, weaker for sharing as a primary job, and absent for paid PDF demand. [Source 4][Source 5][Source 17]

**Change:** Order the value ladder:

1. Capture and remember.
2. Search and decide whether to repurchase.
3. Reveal an evidence-labeled taste recap.
4. Test sharing and payment after retained use.

### 3. Passport Is Too Early and Too Certain

Three to five self-selected coffees cannot support a “perfect taste profile.” A transparent simulation shows small samples poorly distinguish close preferences and leave many categories unseen. A filled radar chart visually manufactures completeness. [Verification 1][Source 18][Source 19]

**Change:** Use progressive states:

- 1–2 coffees: memory collage.
- 3–4: “first signals,” literal counts only.
- 5–9: early passport preview with missing areas visible.
- 10+: current taste snapshot with coverage checks.
- 20+: clearer pattern and drift, never “taste DNA.”

Use aligned dot plots, count chips and coverage indicators; keep radar charts decorative at most. [Source 19]

### 4. Monetization Is Asserted Before Value Is Proven

Normal scan costs are low, but unlimited AI is financially unbounded under automation. The base estimate is about KRW 5.20 per scan plus first-month saved card, while a KRW 14,900 lifetime purchase covers roughly 2,496 such base uses before support and other costs. [Verification 2][Source 20][Source 21]

**Change:** Keep free capture generous but rate-limited. Sell lifetime ownership of archive/themes/exports, not an unconditional lifetime AI liability. Test report packs, annual Pro and fair-use scan allowances only after third-bag retention and real checkout behavior.

### 5. KPI Hierarchy Is Backwards

Weekly paid output is a business outcome, not proof that users receive recurring value. A share-button click is not a viral coefficient, and edit-free saves are not objective scan accuracy. [Source 22][Source 23]

**Change:**

- Provisional North Star: weekly validated coffee memories.
- Activation: first user-confirmed durable card.
- Retention: second and third distinct bags, plus later archive retrieval.
- Scan quality: field accuracy, critical-card correctness, correction time, failure rate and p95 latency.
- Virality: share artifact → measurable view → referred activation.
- Revenue: paid entitlement per eligible retained user.

### 6. Privacy and Deletion Need Product Requirements

User images should not be processed through unpaid Gemini terms; paid processing, explicit provider disclosure, retention details, overseas-transfer handling where applicable, and idempotent deletion across Auth/database/storage/derived files are required design work. [Source 24][Source 25]

**Change:** Free CSV/JSON/media export must remain separate from paid designed PDF. Define image retention, model/provider, correction provenance, public-link revocation and deletion completion in the PRD.

## Recommended MVP

### Must

- Guest photo upload or system photo picker.
- Gemini extraction into an editable draft.
- Required fields limited to roaster, coffee name and photo; origin/process/roast date optional when absent.
- Explicit distinction between package claims and user-perceived taste.
- Rating, “would buy again,” reason tags and one-line note.
- Manual fallback, edit, delete, duplicate handling and retry.
- Private shelf plus search/filter by roaster, origin, process, notes and repurchase intent.
- Progressive authentication only when persistence/sync is requested.
- CSV/JSON plus original-media export; account/data deletion.
- Analytics for scan stages, corrections, validated save and later retrieval.

### Should

- Static 9:16 share card using native share/download.
- Offline/local draft and foreground upload retry.
- Korean/English normalization and low-confidence field highlighting.
- Five-record passport teaser with literal sample counts.

### Later

- Full passport at 10+ records with coverage gates.
- Premium shelf themes and high-resolution designed exports.
- Availability links or replacement suggestions after retrieval intent is proven.
- Paid reports/annual plan/fair-use scan packs after pricing validation.

### Remove From MVP

- Background removal as a required dependency.
- Elaborate flip/3D effects as acceptance criteria.
- PDF generation and payment infrastructure.
- “Perfect” or causal taste claims.
- Marketplace, feed, follows, comments, badges or brew timer.
- Unlimited lifetime AI promise.

## Revised JTBD

> 다음 원두를 고를 때, 예전에 좋았던 원두의 이름과 이유를 30초 안에 다시 찾아서 같은 원두나 비슷한 선택을 자신 있게 고르게 해달라.

Capture remains the enabling action; retrieval and repurchase confidence become the outcome.

## Revised User Flow

1. Landing: “빈 봉투 사진 한 장으로, 다시 사고 싶은 커피를 기억하세요.”
2. Guest chooses one photo; three-photo import is suggested, not required.
3. AI returns an editable draft with uncertain fields visibly marked.
4. User confirms package data, chooses “again / maybe / no,” adds optional reasons and saves.
5. Authentication appears only for persistence.
6. Shelf immediately supports search and repurchase filtering.
7. At five records, an “early taste snapshot” appears.
8. At ten diverse records, a fuller passport appears.
9. Share and paid outputs are offered after demonstrated value, not before it.

## Validation Gates

1. Scan benchmark: 48–100 Korean bags across language, glare, folds and typography. Hypothesis: ≥90% usable critical-field accuracy, ≤2% hallucinated mandatory fields, p95 ≤8 seconds.
2. Capture test: photo-first versus minimal manual quick-add. Hypothesis: photo-first ≥30% faster, ≥90% successful save, median ≤1 correction.
3. Positioning test: memory/repurchase versus show/share. Primary outcome is first validated card, not CTA click.
4. Retention test: third distinct bag within 45 days. Hypothesis: ≥35%, with a predeclared weak/fail band.
5. Payment test: real checkout/deposit among retained users. Survey willingness is diagnostic only.

These are decision hypotheses, not external benchmarks. [Source 26][Source 27]

## Final Verdict

**Proceed, but narrow the promise.** The PRD has a good problem, compelling interaction and feasible stack. Its weak point is not product quality; it is strategic breadth and unproven monetization. Build CoffeeDex as a quiet, fast, trustworthy memory/retrieval layer first. Let the shelf make it desirable, let the passport reward accumulated use, and let payment follow observed repurchase value.

## Sources Ranked

1. BeanBook product: https://beanbook.app/
2. BeanBook App Store: https://apps.apple.com/us/app/beanbook-coffee-tracker/id6499280064
3. Beanconqueror: https://beanconqueror.com/
4. Bag-saving JTBD discussion: https://www.reddit.com/r/espresso/comments/1er3qza/do_you_save_every_bean_bag_or_in_some_way_log/
5. Coffee logging discussion: https://www.reddit.com/r/pourover/comments/18r6s91/do_you_keep_track_of_the_coffee_beans_you_drink/
6. Gemini image understanding: https://ai.google.dev/gemini-api/docs/image-understanding
7. MDN Web Share: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share
8. Firestore pricing: https://firebase.google.com/docs/firestore/pricing
9. Firebase App Check: https://firebase.google.com/docs/app-check
10. Apple privacy UX: https://developer.apple.com/design/human-interface-guidelines/privacy
11. Android Photo Picker: https://developer.android.com/training/data-storage/shared/photo-picker
12. Discogs collection: https://support.discogs.com/hc/en-us/articles/360007331534-How-Does-The-Collection-Feature-Work
13. Letterboxd: https://letterboxd.com/welcome/
14. Beanconqueror backup/export: https://beanconqueror.com/blog/backup-and-import/
15. iBrewCoffee: https://play.google.com/store/apps/details?id=coffee.ibrew.ibrewcoffee
16. WebKit iOS web apps/push: https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/
17. RevenueCat 2025: https://www.revenuecat.com/state-of-subscription-apps-2025/
18. NIST confidence limits: https://www.itl.nist.gov/div898/handbook/eda/section3/eda352.htm
19. Cleveland & McGill graphical perception: https://doi.org/10.1080/01621459.1984.10478080
20. Gemini pricing: https://ai.google.dev/gemini-api/docs/pricing#gemini-2.5-flash
21. Cloud Storage pricing: https://cloud.google.com/storage/pricing
22. Amplitude North Star framework: https://amplitude.com/books/north-star/about-north-star-framework
23. Google precision/recall: https://developers.google.com/machine-learning/crash-course/classification/accuracy-precision-recall
24. Gemini API terms: https://ai.google.dev/gemini-api/terms
25. Firebase Storage security: https://firebase.google.com/docs/storage/security
26. ISO 9241-11: https://www.iso.org/standard/63500.html
27. Microsoft experimentation platform: https://www.microsoft.com/en-us/research/wp-content/uploads/2016/02/exp-platform-kdd2015.pdf

## Verified Claims

- Passport sample-size stress test: PARTIAL, product-design simulation, not population inference. See `wave-2-default-economics-passport.md`.
- Unit economics: PARTIAL, current official rates with explicit usage/FX assumptions. See `verify-unit-economics.md`.

## Contradictions Resolved

- Subscription-first versus one-time: external app benchmarks do not establish CoffeeDex willingness-to-pay. Keep multiple offers as tests; do not replace the PRD's one-time thesis with a subscription assertion.
- Three versus five versus ten logs: five is an engaging preview threshold; ten plus coverage is a more honest normal passport threshold.
- Unlimited free scans: normal-user cost is low, but automation risk makes literal unlimited unsafe.

## Gaps

- No representative Korean specialty-coffee app demand estimate.
- No real CoffeeDex bag benchmark, correction-time data, retention cohort or paid conversion.
- No verified roaster catalog/affiliate economics.
- Legal language and cross-border transfer details require provider contracts and Korean counsel.

## Expansion Trace

- Wave 1 mapped competitors, JTBD, technology, pricing, Korea, privacy, onboarding, metrics and sensory claims.
- Wave 2 investigated BeanBook, review pain points, unit economics, passport stability and positioning.
- Wave 3 converted unresolved claims into validation gates, audited trust as a wedge and ranked MVP scope.
- Convergence reason: remaining leads require primary experiments, contracts, real bags or users; desk research produced no new unchecked lead.

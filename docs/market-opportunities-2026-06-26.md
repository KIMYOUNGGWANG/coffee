# CoffeeDex Market Opportunities

Date: 2026-06-26

## What We Looked At

Signals came from specialty-coffee apps, Korean app-store competitors, and public discussion threads around coffee logs, bean tracking, brew recipes, tasting notes, grinder settings, and recommendation workflows.

## Competitor Patterns

- Beanconqueror is the power-user tracker: beans, multiple brew methods, scans/imports, inventory totals, water, 30+ brew parameters, statistics, and device integrations. Its strength is depth, but public thread comments repeatedly frame depth as a UX tax for casual drinkers.
- Filtru owns guided brewing: timers, brew methods, AR guides, bag camera journal, scale feedback, flow-rate feedback, and suggested grind/dose adjustments.
- BeanBook and Siip are moving toward AI bag scan plus discovery: scan bag, auto-fill origin/process/notes, match scores, deals, roaster drops, recipes, and recommendations.
- Roastguide and BrewBuds lean into catalog and social discovery: roaster catalogs, personal taste recommendations, social feed, profiles, and coffee discovery.
- Korean apps like BrewBuds, DripHub, and HyperCup already cover tasting logs, taste analysis, recipe/device tracking, recommendation, social feed, smart flavor tags, and easy/expert modes.

## User Pain Signals

1. Logging friction is the biggest repeated complaint.
   Users want fast mobile capture, not a database chore. Several threads mention leaving Notion or complex apps because opening a database and filling many properties becomes too cumbersome.

2. Detailed apps are respected but can kill enjoyment.
   Beanconqueror is admired for completeness, yet some users say it is too detailed or not friendly enough. This creates room for a gentler "coffee memory" product.

3. People lose grinder and recipe memory.
   Repeated posts ask how to remember grind settings across beans, grinders, and methods. Notes, receipts, spreadsheets, and Notion are common workarounds.

4. Tasting-note language is intimidating.
   Beginner threads keep asking how to taste notes. Tasting Grounds explicitly frames acidity, body, and sweetness as confusing for untrained drinkers, and Korean HyperCup uses smart flavor-tag suggestions to solve a similar problem.

5. Discovery is valuable only when connected to taste and action.
   Competitors are adding roaster catalogs, match scores, drops, deals, and subscriptions. For CoffeeDex, this is attractive but should remain future-bound until we have consent, commercial contracts, and enough user taste data.

## Best Fits For CoffeeDex

### 1. Quick Add Memory Mode

Add a one-screen save flow for "I just want to remember this cup."

Fields: photo, bean/roaster, one-line note, would-buy-again, optional flavor chips. Advanced recipe variables stay collapsed.

Why: directly answers logging friction while preserving CoffeeDex's memory wedge.

### 2. Grind And Recipe Recall

Attach a lightweight "last good brew" block to each bean.

Fields: grinder, grind setting, method, ratio, temperature, time, result, next adjustment.

Why: public-thread pain is concrete and frequent, and the product already has brewing logs and shelf items.

### 3. Korean Flavor Language Coach

When users type or choose tags, suggest Korean sensory words in approachable clusters.

Examples: citrus/stone fruit/floral/nutty/chocolate/fermenty, with "I tasted this because..." prompts.

Why: fits Korea-first positioning better than copying global coffee social apps.

### 4. Rebuy Memory Card

For cards marked "again", show a compact card with why, where, freshness timing, last good recipe, and "copy search query" or "open roaster site" action.

Why: this is the cleanest bridge between memory and purchase without claiming marketplace/referral capability.

### 5. Guest-To-Saved Funnel Dashboard

Keep the KPI snapshot just added, then add event-level funnel rows: scan started, draft reviewed, account connected, card saved, first rebuy signal.

Why: external founder lesson strongly supports avoiding forced login before value is felt.

### 6. Taste Match, Later

After enough saved records, add internal recommendations from the user's own archive first: "similar to coffees you bought again."

Do not launch public marketplace/community recommendations yet.

Why: competitors are racing toward catalogs and match scores, but CoffeeDex can earn trust first with private memory.

## Suggested Priority

1. Quick Add Memory Mode
2. Grind And Recipe Recall
3. Korean Flavor Language Coach
4. Rebuy Memory Card
5. Guest-To-Saved Funnel Dashboard
6. Taste Match, Later

## Current Sprint Status

The current CoffeeDex product now ships the smallest private-memory slice from this brief:

- Quick Add Memory Mode saves a confirmed private card from a one-screen flow.
- Korean flavor helper chips support approachable sensory words without expert cupping vocabulary.
- One-line quick notes remain card memory copy, not brew recall.
- Private rebuy recall surfaces the user's own repurchase reason from saved cards.
- Last-good-brew recall stays distinct and only appears when saved metadata contains actual compound brew provenance such as method plus ratio, dose, temperature, or time.

Marketplace, referral, roaster partnership, public community, public taste-match, deals, drops, and subscription discovery remain future-bound opportunities only. They are not current CoffeeDex product capabilities.

## Sources

- Beanconqueror: https://beanconqueror.com/
- Filtru: https://getfiltru.com/
- BeanBook: https://apps.apple.com/us/app/beanbook-coffee-tracker/id6499280064
- Siip 2026 coffee app comparison: https://www.siip.coffee/guides/best-coffee-apps-2026
- Roastguide: https://play.google.com/store/apps/details?id=org.lichstam.Bruw
- BrewBuds: https://apps.apple.com/kr/app/id6670744490
- DripHub: https://apps.apple.com/us/app/driphub/id6746667484
- HyperCup: https://apps.apple.com/us/app/hypercup/id6747720796
- Tasting Grounds guide: https://tastinggrounds.com/learn/tasting-notes
- Reddit, coffee log away from Notion: https://www.reddit.com/r/pourover/comments/1rwgvdq/moving_my_coffee_log_away_from_notion_looking_for/
- Reddit, Beanconqueror too detailed: https://www.reddit.com/r/pourover/comments/18r6s91/do_you_keep_track_of_the_coffee_beans_you_drink/
- Reddit, grind setting memory: https://www.reddit.com/r/pourover/comments/1som0rw/how_do_you_remember_your_grind_settings_when_you/

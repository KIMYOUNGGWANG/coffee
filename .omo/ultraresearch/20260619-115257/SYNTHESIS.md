# Ultraresearch Synthesis: Hyangmi / CoffeeDex Product Direction

Workers: 11 subagents + main browsing/repo verification. Waves: 2. Sources: 60+ inspected or worker-reported. Verifications: `verify-repo-surface.md`.

## Executive Summary

Hyangmi/CoffeeDex should not move first toward a broad community, marketplace, or roaster-partnership platform. The strongest evidence points to a narrower and more defensible direction: a Korea-first private coffee memory system that helps users capture a bean/cup quickly, understand it in plain Korean, track freshness and remaining stock, and know what to drink or rebuy next. This matches the repo's current memory/repurchase contract and avoids over-claiming future-only roaster/community layers. Sources: [docs/api-spec.md](/Users/kim-young-gwang/Desktop/projects/dex/docs/api-spec.md), [docs/golden-flows.md](/Users/kim-young-gwang/Desktop/projects/dex/docs/golden-flows.md), [verify-repo-surface.md](/Users/kim-young-gwang/Desktop/projects/dex/.omo/ultraresearch/20260619-115257/verify-repo-surface.md).

The priority product bet is **Fresh Shelf + Rebuy Timing**: users photograph or enter beans, Hyangmi tracks roast/open dates, remaining amount, taste memory, brew outcomes, and prompts "drink now / wait / finish soon / rebuy." The activation wedge should be **No-App Coffee Memory**: capture a useful coffee memory in under 30 seconds from a bag photo or quick entry. The differentiation layer should be **Korean Taste Compass**: convert roaster notes and user impressions into clear Korean taste language, using guided SCA-style broad-to-specific choices rather than blank free text. Sources: [DripHub App Store](https://apps.apple.com/kr/app/driphub/id6746667484), [빈로그 App Store](https://apps.apple.com/kr/app/%EB%B9%88%EB%A1%9C%EA%B7%B8-%EC%BB%A4%ED%94%BC-%EB%8B%A4%EC%9D%B4%EC%96%B4%EB%A6%AC/id6760758596), [SCA Flavor Wheel](https://sca.coffee/research/coffee-tasters-flavor-wheel), [WCR Sensory Lexicon](https://worldcoffeeresearch.org/resources/sensory-lexicon).

## Recommended Direction

### 1. Fresh Shelf + Rebuy Timing

Build around the private bean shelf already present in the codebase. Current code has authenticated `coffee_shelf_items`, `brewing_logs`, and AI barista recommendation surfaces, even though the docs still emphasize tasting-card memory as the canonical golden flow. This means the product has a real bridge from "remember coffee" to "manage the beans I own and decide what to drink next." Sources: [shelf route](/Users/kim-young-gwang/Desktop/projects/dex/app/api/v1/shelf/route.ts), [brewing logs route](/Users/kim-young-gwang/Desktop/projects/dex/app/api/v1/brewing-logs/route.ts), [AI barista route](/Users/kim-young-gwang/Desktop/projects/dex/app/api/v1/ai-barista/route.ts), [coffee shelf migration](/Users/kim-young-gwang/Desktop/projects/dex/supabase/migrations/20260617000000_create_coffee_shelf_and_logs.sql).

Why this wins: Korean users show repeated pains around bean choice, roast/freshness, brewing variables, and remembering what worked. Competitors validate these jobs, but many are either too technical, too discovery-first, or too fragmented. Sources: [Korean community digest](/Users/kim-young-gwang/Desktop/projects/dex/.omo/ultraresearch/20260619-115257/wave-1-librarian-korean-community.md), [competitor digest](/Users/kim-young-gwang/Desktop/projects/dex/.omo/ultraresearch/20260619-115257/wave-2-librarian-competitors.md).

### 2. No-App Coffee Memory

The first-use experience should be brutally light: bag photo, roaster/bean extraction, one taste choice, one repurchase intent. Global community evidence repeatedly says logging apps become too slow or cumbersome, and Korean App Store competitors are emphasizing "record briefly, keep taste longer" style positioning. Sources: [global community digest](/Users/kim-young-gwang/Desktop/projects/dex/.omo/ultraresearch/20260619-115257/wave-1-librarian-global-community.md), [DripHub App Store](https://apps.apple.com/kr/app/driphub/id6746667484).

### 3. Korean Taste Compass

Use a guided taste model that starts from broad categories and narrows: fruity -> citrus -> lemon, sweet -> caramel, nutty/cocoa -> chocolate. The SCA/WCR flavor system supports this structure, and users need plain Korean interpretation more than expert jargon. Sources: [SCA how-to guide](https://sca.coffee/sca-news/how-to-use-the-flavor-wheel-in-eight-steps), [WCR Sensory Lexicon](https://worldcoffeeresearch.org/resources/sensory-lexicon), [sensory-learning digest](/Users/kim-young-gwang/Desktop/projects/dex/.omo/ultraresearch/20260619-115257/wave-2-librarian-sensory-learning.md).

## What Not To Lead With

Do not lead with marketplace, community, referral, or roaster-partnership claims yet. The repo explicitly treats these as future-only; workers found market interest in roaster discovery and subscriptions, but not enough product evidence to claim a live partner network. Sources: [docs/api-spec.md](/Users/kim-young-gwang/Desktop/projects/dex/docs/api-spec.md), [docs/golden-flows.md](/Users/kim-young-gwang/Desktop/projects/dex/docs/golden-flows.md), [roaster ecosystem digest](/Users/kim-young-gwang/Desktop/projects/dex/.omo/ultraresearch/20260619-115257/wave-2-librarian-roaster-ecosystem.md).

Do not become Beanconqueror. Beanconqueror is the power-user benchmark for deep logging and device support, but that path risks cockpit complexity. Hyangmi's opening should be warmer and faster: "remember this coffee and make a better next decision." Sources: [Beanconqueror](https://beanconqueror.com/), [r/pourover app discussion](https://www.reddit.com/r/pourover/comments/1ot97sy/discussion_brewingbean_apps_ive_tried_or/).

Do not monetize as generic curation alone. Korea has high coffee frequency and subscription familiarity, but price sensitivity is real; paid value needs to reduce waste, improve repurchase confidence, or make the next bean choice easier. Sources: [aT FIS 2024 coffee report](https://www.atfis.or.kr/home/board/FB0027.do?act=read&bcaId=0&bpoId=4958&pageIndex=1&subSkinYn=N), [DailyPop coffee consumption/aT coverage](https://www.dailypop.kr/news/articleView.html?idxno=74204), [market monetization digest](/Users/kim-young-gwang/Desktop/projects/dex/.omo/ultraresearch/20260619-115257/wave-2-librarian-market-monetization.md).

## 90-Day Product Path

### Days 0-30: Prove Capture

- Landing test: "원두 봉투 한 장으로 다시 살 커피를 기억하세요."
- Success metric: 60%+ first capture completion, median under 45 seconds.
- Feature scope: bag photo/manual fallback, roast/open date, bean/roaster, broad taste choice, repurchase intent.
- Avoid: public feeds, partner marketplace, complex brew forms.

### Days 31-60: Prove Shelf Retention

- Add Fresh Shelf states: wait, drink now, finish soon, rebuy.
- Add simple reminders tied to roast date, open date, fill level, and last brew.
- Success metric: 40%+ users log a second bean, 25%+ reminder open, 10%+ rebuy-link click or saved rebuy intent.
- Feature scope: shelf cards, freshness timeline, one-tap "I would buy again."

### Days 61-90: Prove Taste Compass

- Add guided Korean note selection and taste glossary.
- Add compare-with-last-cup prompt.
- Add private taste profile summary based on confirmed records.
- Success metric: 20%+ lift in "I know whether I want this bean" confidence versus raw roaster-note page.

## Positioning

Best near-term line:

> 다시 사고 싶은 원두를 놓치지 않는 한국어 커피 기억장.

Support copy:

- "봉투 사진으로 시작해 로스팅일, 취향, 추출 기록까지 한 곳에 남깁니다."
- "산미·단맛·바디를 쉬운 한국어로 정리하고, 다음에 마실 원두를 덜 헤매게 합니다."
- "커뮤니티보다 먼저, 나의 선반과 재구매 기억을 정확하게 만듭니다."

## Source Reliability

Highest-confidence local product sources:

- [docs/api-spec.md](/Users/kim-young-gwang/Desktop/projects/dex/docs/api-spec.md)
- [docs/golden-flows.md](/Users/kim-young-gwang/Desktop/projects/dex/docs/golden-flows.md)
- [verify-repo-surface.md](/Users/kim-young-gwang/Desktop/projects/dex/.omo/ultraresearch/20260619-115257/verify-repo-surface.md)

Highest-confidence external sources:

- [aT FIS 2024 coffee report](https://www.atfis.or.kr/home/board/FB0027.do?act=read&bcaId=0&bpoId=4958&pageIndex=1&subSkinYn=N)
- [SCA Flavor Wheel](https://sca.coffee/research/coffee-tasters-flavor-wheel)
- [World Coffee Research Sensory Lexicon](https://worldcoffeeresearch.org/resources/sensory-lexicon)
- [DripHub App Store](https://apps.apple.com/kr/app/driphub/id6746667484)
- [빈로그 App Store](https://apps.apple.com/kr/app/%EB%B9%88%EB%A1%9C%EA%B7%B8-%EC%BB%A4%ED%94%BC-%EB%8B%A4%EC%9D%B4%EC%96%B4%EB%A6%AC/id6760758596)

## Final Decision

Hyangmi/CoffeeDex should become the **Korea-first coffee memory and fresh-shelf assistant**: private first, fast capture first, freshness/rebuy utility first, and Korean taste literacy as the moat. Roaster discovery can enter as saved links, event/calendar content, or watchlists after retention is proven; marketplace/community/network claims should remain deferred.

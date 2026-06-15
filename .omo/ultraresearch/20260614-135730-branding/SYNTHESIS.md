# CoffeeDex Branding Synthesis

## Decision

CoffeeDex should be rebranded before serious monetization. The product thesis is strong, but the name points in the wrong direction.

Recommended brand:

**Hyangmi**

Korean display:

**향미**

Product descriptor:

**Coffee Taste Archive**

Korean tagline:

**마신 원두가 취향의 기록이 되는 곳**

English tagline:

**Your coffee taste, beautifully remembered.**

This recommendation is intentionally not another `Bean*`, `Brew*`, `Cup*`, `*folio`, `*log`, or `*note` name. Those naming lanes are already crowded by active or emerging coffee apps.

## Why Not CoffeeDex

`CoffeeDex` has three problems:

1. It sounds like a database/catalog product, which pulls the product toward "collect every coffee" mechanics.
2. It feels derivative of "Pokédex" naming and slightly hobby-geek, while the paid product should feel polished, personal, and artifact-worthy.
3. It does not communicate the highest-value promise: "we help you understand and preserve your taste."

The PRD's own strongest line is not "database." It is "input a few coffee memories and get a beautiful interpretation/result." The name should serve that.

## Why Hyangmi

`Hyangmi` is a stronger default because:

- It directly means the arena this product owns: aroma/flavor/taste nuance.
- It is Korea-first without being locked to one city, roaster, or extraction method.
- It is more ownable than generic English coffee compounds.
- It can stretch from consumer artifacts to roaster-adjacent insights later.
- It gives the brand a warmer, more premium emotional center than `Dex`.

Brand architecture:

- Brand: `Hyangmi`
- Category line: `Coffee Taste Archive`
- Free object: `Taste Card`
- Paid object: `Taste Passport`
- Dashboard: `Archive`
- Analytics: `Taste Map`
- Public link: `Shared Taste Card`
- Old `CoffeeDex` can remain only as an internal codename during migration, then disappear from user-facing copy.

## Competitive Findings

The specialty coffee audience is real and growing. NCA reported in June 2025 that 46% of American adults drank specialty coffee in the past day, up 84% since 2011, and SCA's 2025 NCDT breakout highlights strong 25-39 adoption and consumer demand for quality/meaning in coffee.

Direct coffee apps already cover functional territory:

- Beanconqueror is broad and powerful: brew methods, bean tracking, roast tracking, water, Bluetooth scales, pressure/flow profiling, open-source positioning.
- Filtru owns "brew the perfect cup" with brew methods, tutorials, timer, and smart-scale flow.
- BeanBook already claims scan-to-memory: coffee bag snap, digital shelf/archive, recipes, discovery, roaster surfaces.
- Coffi already claims scan/rate/track/discover plus Coffi Passport.
- Hururup and PourLog show Korea has local app motion around cupping records, taste analysis, package scan, flavor wheels, sharing, and community.

The naming evidence is also clear: `Beanfolio`, `Brewfolio`, `Cupfolio`, `Cupnote`, `PourLog`, `RoastNote`, and `BrewMark` are already active or highly adjacent. A simple English compound would make Hyangmi look like another small coffee app rather than a distinct brand.

## Positioning

Hyangmi should not say:

- "The ultimate coffee tracking app"
- "Track every brew parameter"
- "Discover every roaster"
- "The coffee social network"
- "Your coffee database"

Hyangmi should say:

- "Turn your coffee memories into a taste archive."
- "Scan the bag, confirm the notes, keep the cup."
- "Your taste map, story cards, and coffee passport."
- "For Korean specialty coffee drinkers who want to remember what they loved."

## Product Direction After Rebrand

Default product path:

1. Preserve the current product wedge: Korea-first specialty coffee memory.
2. Rename the visible product from CoffeeDex to Hyangmi.
3. Rewrite the home/dashboard/onboarding/paywall copy around memory, taste, and artifact.
4. Rename exported artifacts from `coffeedex-*` to `hyangmi-*`.
5. Keep database table names like `tasting_cards` unchanged unless a real migration is necessary.
6. Introduce a brand constants layer so the next rename does not require hunting dozens of strings.
7. Update docs/tests so product contract remains truthful.

## Naming Shortlist

| Name | Verdict | Why |
| --- | --- | --- |
| Hyangmi | Recommended | Distinctive, Korea-first, meaning-rich, fits taste/archive/artifact. Needs trademark/domain check before launch. |
| Hyangmi Archive | Good fallback | More descriptive and easier for first-time users, slightly less elegant. |
| Taste Archive | Safe descriptor | Clear, but too generic as a standalone brand. Use as category line. |
| Coffee Passport | Product object only | Great paid artifact name, too generic as brand. |
| Beanfolio | Reject | Active coffee app/service found. |
| Brewfolio | Reject | Active coffee brewing journal/app found. |
| Cupfolio | Reject | Active coffee social/waitlist product found. |
| Cupnote | Reject | Active cupping app found. |
| PourLog | Reject | Active Korean coffee tasting app found. |
| RoastNote | Reject | Active roasting app found. |
| CoffeeDex | Retire | Current name points to database/completionism, not premium taste memory. |

## Preliminary Legal/Availability Note

This is not legal advice. Web search suggests `Hyangmi` is a Korean word/name and appears in some cafe/restaurant contexts, but I did not find a direct coffee app with this exact name in the explored results. Before launch, run a proper trademark, App Store, Play Store, domain, and Korean business-name screen.

## Sources

- Internal PRD attachment: `/Users/kim-young-gwang/.codex/attachments/33535358-6747-4305-bf62-5ad789030ed8/pasted-text.txt`
- Existing productization synthesis: `.omo/ultraresearch/20260613-234801/SYNTHESIS.md`
- Existing productization plan: `.omo/plans/coffeedex-productization.md`
- NCA specialty coffee 2025: https://www.ncausa.org/Newsroom/Specialty-coffee-consumption-hits-14-year-high
- SCA 2025 NCDT Specialty Coffee Breakout: https://sca.coffee/sca-news/2025-national-coffee-data-trends-report-available
- Beanconqueror App Store: https://apps.apple.com/us/app/beanconqueror/id1445297158
- Filtru: https://getfiltru.com/
- BeanBook: https://beanbook.app/
- Coffi: https://www.coffi.com/
- Hururup App Store: https://apps.apple.com/us/app/%ED%9B%84%EB%A3%A8%EB%A3%B9-hururup-%EC%BB%A4%ED%95%91-%EA%B8%B0%EB%A1%9D-%EC%BB%A4%ED%94%BC-%EC%B7%A8%ED%96%A5-%EB%B6%84%EC%84%9D/id6667121265
- PourLog App Store: https://apps.apple.com/kr/app/pourlog-%EC%BB%A4%ED%94%BC-%ED%85%8C%EC%9D%B4%EC%8A%A4%ED%8C%85-%EB%85%B8%ED%8A%B8/id6760298828
- Brewfolio: https://brewfolio.app/
- Beanfolio: https://www.beanfolio.app/about
- Cupfolio: https://cupfolio.app/
- Cupnote: https://apps.apple.com/sb/app/cupnote/id6480165506
- Tastify: https://www.tastify.com/
- Letterboxd Pro: https://letterboxd.com/pro/
- Day One Plans: https://dayoneapp.com/plans/
- Momos Coffee: https://momoscoffee.net/
- Anthracite Coffee: https://anthracitecoffee.com/
- Terarosa: https://terarosa.com/

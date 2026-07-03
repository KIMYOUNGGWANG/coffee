# CoffeeDex Design System (DESIGN.md)

## 1. Brand Identity & Vibe: "Warm Private Archive"
**"내 커피 취향과 기억을 조용히 쌓아두는 개인 커피룸"**
- **Concept**: CoffeeDex/Hyangmi is not an AI scanner, coffee-ordering store, or generic dashboard. It is a private room where Korean specialty-coffee drinkers keep memory fragments, bean bags, rebuy clues, and next-brew notes.
- **Core Philosophy**: The product should feel like opening a quiet drawer, not operating a tool. The first screen answers: what did I drink, what do I want to remember, and what might I buy again?
- **Vibe**: warm, personal, tactile, calm, lightly premium. The app should feel native and used, not staged. Use paper, linen, espresso, clay, shelf, room, drawer, and note metaphors, but do not repeat the metaphor in every label.
- **Humanity Rule**: write like a Korean person naming a note, not a brand strategist explaining a feature. Prefer `마신 커피`, `새 노트`, `원두 서랍`, `저장`, `보류`, `다시 살래요`. Avoid over-poetic headings and “quiet/personal/private” claims repeated in multiple places.

## 2. Color System
- **Canvas**: warm paper, not sterile white.
  - App/Web canvas: `#F7EFE2` / mobile `#FFF6E8`.
  - Paper surfaces: `#FFF9EF` / mobile `#FFF8EC`.
  - Linen surfaces: `#EFE0CC` / mobile `#E8D8C1`.
- **Ink and Depth**:
  - Espresso text: `#291912` / mobile `#2A1A12`.
  - Soil panels: `#372319` / mobile `#493024`.
  - Muted cocoa: `#7C6454` / mobile `#8F7867`.
- **Accent**:
  - Clay: `#BD7650`, used for action, focus, and small note accents.
  - Leaf: `#4E7452`, used sparingly for freshness or resolved states.
- **Strict Rule**: no purple/blue AI gradients, no black/gold Leica gallery mode as the default, no ecommerce-orange sale language, no random cool gray panels.

## 3. Typography (Editorial Hierarchy)
- **Primary / Body**: `Pretendard Variable` for Korean legibility. Body copy should be short, natural, and line-height 1.55-1.7.
- **Display / Memory Text**: `Noto Serif KR` or the existing serif token may be used sparingly for long memory fragments only. Primary app headings should use the sans stack so the bridge app feels native, not like a generated moodboard.
- **Tone**: sentence case Korean. Prefer `다시 열어볼 노트`, `내 서랍`, `오늘의 컵`, `다시 살 단서`.
- **CJK Rule**: headings must avoid awkward one-syllable dangling lines. Use shorter copy, balanced widths, and `break-keep`.

## 4. UI Patterns & Layout
- **The Room**: first screen is the product. It shows mood, today’s cup, a direct note action, and the drawer entry point. No marketing hero.
- **Native Scale**: mobile headings should usually sit at 24-26px, not hero scale. Cards should support repeated use, not look like one-off presentation slides.
- **Diary Note**: warm paper, clay left accent, serif memory text, compact metadata below.
- **Bean Drawer**: list or shelf of saved beans with rebuy clues. It should feel browsable, not like an inventory table.
- **Private Panel**: espresso surface used only for privacy/trust or high-signal memory moments.
- **Utility Panels**: web dashboard modules should use product language (`다시 살 단서`, `오늘 시작점`) instead of BI/AI labels.
- **Bottom Nav Safety**: mobile content must reserve enough bottom inset for floating tabs. Do not rely on accidental clipping or manual blank spacer as the main layout strategy.

## 5. Motion & Micro-interactions
- **Physics**: calm and tactile. Prefer pressed states, soft lift, and 240-420ms transitions using `--ease-premium`.
- **Mobile**: buttons should feel touchable without bounce. Active state can scale to `0.98`.
- **Web**: hover can lift cards 1-2px; avoid cinematic effects that make the app feel like a landing page.
- **Reduced Motion**: all decorative motion must respect `prefers-reduced-motion`.

## 6. Anti-Patterns (Strictly Avoid)
- **NO** AI-first vocabulary in primary UI: `AI 분석`, `Confidence`, `스캐너`, `추천 엔진`, `Intelligence`.
- **NO** coffee ordering patterns: cart, delivery, price-forward cards, product menu grids.
- **NO** generic SaaS cockpit: KPI towers, BI labels, dense command dashboards on the first screen.
- **NO** card-in-card nesting unless the outer shell and inner note serve different hierarchy.
- **NO** decorative gradients/orbs, stock-like heroes, or fake app screenshots as UI.
- **NO** one-off raw colors that bypass tokens.
- **NO** repeated brand-theory copy such as “조용한 공간”, “개인 커피룸”, or “나에게 먼저” on every screen. Say it once, then let the interface behave that way.

## 7. Accessibility (WCAG 2.2)
- WCAG AA contrast on warm surfaces.
- Visible clay/espresso focus rings.
- 44px minimum touch targets for chips, rows, and primary actions.
- Korean text must not clip, overlap, or wrap into unreadable fragments.
- Support `prefers-reduced-motion`.

## 8. Mobile App Direction: "The Personal Coffee Room"

The bridge app should not feel like a web landing page or an AI scanner. It should feel like a private coffee room where the user's cups, notes, and beans quietly accumulate.

### Mobile Navigation
- Primary tabs: `룸`, `노트`, `서랍`, `나`.
- Use place-like labels over feature labels. Avoid `스캔`, `패스포트`, `분석` as primary tab names.
- Default posture: private, calm, personal.

### Mobile Palette
- `roomCanvas`: `#FFF6E8`
- `roomCanvasMuted`: `#F0DFC9`
- `paper`: `#FFF8EC`
- `linen`: `#E8D8C1`
- `espresso`: `#2A1A12`
- `soil`: `#493024`
- `cocoa`: `#654D3D`
- `mutedCocoa`: `#8F7867`
- `clay`: `#BD7650`
- `sage`: `#8FA57D`
- `leaf`: `#4E7452`
- `line`: `rgba(42, 26, 18, 0.14)`

### Mobile Components
- **Room card**: warm paper surface, 24-32px radius, one meaningful image or note.
- **Diary note**: paper surface with a clay left accent and serif body text for memory fragments.
- **Bean drawer row**: image thumbnail, coffee name, memory tags, rating or repurchase signal.
- **Private panel**: dark espresso surface used sparingly for privacy/trust moments only.
- **Mood chips**: three to four tactile choices, active chip filled with `soil`.

### Mobile Copy Rules
- Prefer direct Korean: `마신 커피`, `새 노트`, `원두 서랍`, `알림`, `내 정보`.
- Use personal language only where it helps the task: `식으니까 더 편했다`, `비 오는 날 다시 마시기`, `다시 살래요`.
- Avoid front-facing AI language in navigation, headings, and primary buttons.
- Use `사진 기록`, `맞게 읽었는지 확인`, `내 문장`, `비공개 저장` instead of `AI 분석`, `스캐너`, `Confidence`.

## 9. Web App Redesign Direction: "Quiet Roastery Command Room"

CoffeeDex web should feel like a premium mobile web app first, not a marketing site that happens to have an app. Keep the product positioning fixed: private coffee memory, fresh shelf, rebuy decisions, and better next brews.

### Reference Synthesis
- Premium coffee brands: use product restraint, warm materials, and large whitespace rather than dense feature chrome.
- Coffee logging apps: keep utility from brew logs and filters, but avoid dense parameter-first cockpit layouts on the first screen.
- Consumer journal apps: prioritize emotional return loops, recognizable personal artifacts, and low-friction resume points.
- SaaS dashboards: borrow clear status modules, segmented navigation, and compact decision panels.

### Web Palette Tokens
- `canvas`: `#F7EFE2`
- `paper`: `#FFF9EF`
- `linen`: `#EFE0CC`
- `espresso`: `#291912`
- `soil`: `#372319`
- `cocoaMuted`: `#7C6454`
- `clay`: `#BD7650`
- `clayStrong`: `#8F533B`
- `leaf`: `#4E7452`
- `line`: `rgba(41, 25, 18, 0.14)`

### Web Components
- **Premium shell**: low-contrast outer tray with 6px padding, 32px radius, and warm tinted shadow.
- **Premium card**: paper inner core, subtle inset highlight, 26px radius, and no generic gray border/shadow treatment.
- **Espresso panel**: dark espresso surface for high-signal private modules such as `다시 살 단서`, `오늘 시작점`, and privacy/trust panels only.
- **Coffee chip**: tactile filter chip with 44px minimum touch height, active state filled with soft clay.
- **Glance strip**: three compact modules below the header: saved memories, rebuy candidate, and brew starting point.

### Screen Priorities
- **Dashboard first impression**: answer what the user has, what to rebuy, and what to brew next before scrolling.
- **Shelf/cards**: keep package and memory cards scannable; avoid nested card clutter.
- **Records/log**: `오늘 시작점` sits above the calendar as the reason to return before brewing.
- **Taste view**: panels should feel like a personal taste profile, not a generic BI dashboard.
- **Mobile WebView**: bottom nav remains thumb-first, safe-area aware, and visually separate from page content.

## 10. Market-Informed UX Bets

Updated from the 2026-07-03 `/uiux` pass.

### Research Signals
- Coffee logging users repeatedly split into two modes: a simple memory note for "what did I like?" and a detailed brew lab for recipes, grind, roast date, and repeated attempts. Hyangmi should lead with the memory note and reveal brew detail only after the first save.
- Community posts and app-store listings show a strong need for photo-assisted bag capture, multiple open bags, roast/open timing, and fast recall of liked beans. These map directly to Quick Add, Fresh Shelf, Rebuy Intelligence, and Dial-in Coach, but the UI must describe them as private memory loops, not generic AI features.
- Korean-local competitors such as BrewBuds and PourLog lean into feed, recommendation, tasting record, brew timer, and profile/community language. Hyangmi should differentiate as private-first and Korea-first: `내 서랍`, `다시 살 단서`, `오늘의 컵`, and `비공개 기록`.
- Pinterest/Behance/Dribbble coffee-app references are visually rich but mostly ordering, menu, delivery, or cafe-commerce patterns. Borrow warmth, tactile photography, and large thumb targets; reject cart, price, pickup, rewards, and product-grid grammar.
- Mobbin-style onboarding references favor short first-run flows, clear welcome/get-started screens, account setup only when needed, and immediate landing in the core product. Hyangmi should ask for preference only when it improves the first saved note.

### Design Bets
- **First memory before profile**: the first meaningful action is saving or drafting one cup, not completing a long taste quiz.
- **Private drawer over social feed**: feed/share is secondary compatibility; default surfaces should reassure that records are owner-scoped.
- **Rebuy clue as return loop**: every saved note should make the next visit easier by surfacing what to drink, buy again, or adjust.
- **Photo as helper, not scanner identity**: camera copy uses `사진 기록`, `저장 전 확인`, and `제안된 정보`, never primary `AI 분석`.
- **Warm tactile reference filter**: use coffee reference sites for material, rhythm, and touch scale only when they preserve the memory product contract.

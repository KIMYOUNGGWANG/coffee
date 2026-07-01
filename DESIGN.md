# CoffeeDex Design System (DESIGN.md)

## 1. Brand Identity & Vibe: "The Gallery"
**"A premium digital shelf for your coffee collection"**
- **Concept**: A pure, minimalist digital gallery inspired by high-end liquor cabinets, Apple's industrial design, and Leica's dark aesthetics. 
- **Core Philosophy**: Negative space (여백) is the main structural element. The coffee package itself is the artwork; the UI disappears into the background.
- **Vibe**: Ultra-premium, editorial, deep dark mode, silent, trustworthy.

## 2. Color System
- **Backgrounds (The Canvas)**: Perfect Dark Mode.
  - Primary Background: True Black (`#000000`).
  - Glass / Overlays: Extreme transparency (`bg-black/40` or `bg-white/5` with `backdrop-blur-2xl`).
  - Accent (Subtle): Caramel Gold (`#D4AF37`) used EXTREMELY sparingly (only for active states or essential stats).
- **Foregrounds (Text)**:
  - Primary Title: Pure White (`#FFFFFF`).
  - Secondary Text: Slate Gray (`#A3A3A3`).
- **Strict Rule**: NO bright cream backgrounds, NO purple/blue gradients (anti-pattern). NO thick colored borders.

## 3. Typography (Editorial Hierarchy)
- **Primary / Body**: `Pretendard Variable` (Line-height: 1.6+). Weight should be light or regular to feel airy.
- **Display / Headers**: Elegant Serif (`Playfair Display`, `Noto Serif KR`). Used at massive sizes (e.g. `text-5xl` or `text-6xl`) to act as graphic elements.
- **Alignment**: Left-aligned asymmetrical layouts for editorial tension.

## 4. UI Patterns & Layout
- **The Digital Shelf**:
  - Packages should "float" in the darkness. Do NOT wrap packages in bulky white or gray cards.
  - Heavy, soft drop-shadows on the images themselves (`drop-shadow-2xl`) to separate them from the black background.
  - Wide padding (e.g., `gap-8` or `gap-12` between shelf items).
- **Taste Passport**: High-contrast, minimal layout resembling an exclusive membership card.

## 5. Motion & Micro-interactions
- **Physics**: Fluid, slow, and weighty. NO bouncy spring physics.
  - Framer Motion Easing: `ease: [0.16, 1, 0.3, 1]` (custom exponential out).
  - Duration: `0.5s` to `0.8s` for majestic transitions.
- **Interactions**:
  - **Flip Card**: Tapping flips the card smoothly, revealing a glass-morphic back panel.
  - **Hover**: Subtle lift and increased shadow glow. 
  - **Scroll**: Staggered fade-up (`y: 20, opacity: 0` -> `y: 0, opacity: 1`).

## 6. Anti-Patterns (Strictly Avoid)
- **NO** Card-in-card nesting (e.g., a gray box inside a slightly lighter gray box).
- **NO** "App-like" bloated navbars.
- **NO** Fast/jerky animations (<300ms is too fast for premium feel).
- **NO** Squished typography (respect `leading-relaxed` and `tracking-tight`).

## 7. Accessibility (WCAG 2.2)
- Focus rings should be thin, crisp white or gold outlines.
- Support `prefers-reduced-motion` for all 3D transitions.

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
- Prefer personal Korean: `오늘 커피는 어떤 기분이었나요?`, `다시 열어보고 싶은 원두들`, `기록은 나에게 먼저 보여야 해요`.
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
- `canvas`: `#120B07`
- `canvasLift`: `#1B100B`
- `paper`: `#FFF8EC`
- `linen`: `#E8D8C1`
- `espresso`: `#291912`
- `soil`: `#372319`
- `cocoaMuted`: `#B9A28E`
- `clay`: `#D18A5C`
- `clayStrong`: `#F0B978`
- `leaf`: `#8FA57D`
- `line`: `rgba(255, 248, 236, 0.13)`

### Web Components
- **Premium shell**: dark espresso outer tray with 6px padding, 32px radius, warm rim light, and no pale app chrome.
- **Premium card**: dark roasted inner core, subtle inset highlight, 26px radius, and visible cream text at WCAG AA contrast.
- **Espresso panel**: darkest command surface for high-leverage modules such as Rebuy Intelligence and Dial-in Coach.
- **Coffee chip**: tactile filter chip with 44px minimum touch height, active state filled with soft clay.
- **Glance strip**: three compact modules below the header: saved memories, rebuy candidate, and brew starting point.

### Screen Priorities
- **Dashboard first impression**: answer what the user has, what to rebuy, and what to brew next before scrolling.
- **Shelf/cards**: keep package and memory cards scannable; avoid nested card clutter.
- **Records/log**: Dial-in Coach sits above the calendar as the reason to return before brewing.
- **Passport**: analytic panels should feel like a personal profile, not a generic BI dashboard.
- **Mobile WebView**: bottom nav remains thumb-first, safe-area aware, and visually separate from page content.
- **Release polish rule**: primary and secondary CTAs must keep readable labels in both idle and disabled states; avoid `text-white/*` buttons on light surfaces and avoid `text-background-dark` inside dark cards.

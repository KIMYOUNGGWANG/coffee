# CoffeeDex Design System (DESIGN.md)

## 1. Brand Identity & Vibe
**"A premium bar meeting an elegant boutique"**
- **Concept**: A hybrid of a dark, premium espresso bar (backgrounds/shelves) and an elegant, airy specialty coffee boutique (cards/notes).
- **Vibe**: Sophisticated, tactile, trustworthy, and beautiful.

## 2. Color System
- **Backgrounds (The Shelf)**: Dark and moody.
  - Primary Background: Matte Slate / Dark Wood (`#1a1a1a` to `#24201c`)
  - Accent (Glow/Active): Amber/Gold (`#C58948`, `hsl(28, 45%, 35%)`)
- **Foregrounds (The Cards & Notes)**: Light and airy (Cream paper).
  - Card Background: Cream/Off-white (`#F7F7F4`, `#FAF9F6`)
  - Card Text: Deep Espresso (`#19140F`, `#3E3124`)
- **Dynamic Roast Level Colors (Card Accents)**:
  - Light Roast: Soft Peach / Pale Sage (`#FCEADE`, `#E6F0E6`)
  - Medium Roast: Caramel / Tan (`#E5C09B`)
  - Dark Roast: Deep Bronze / Amber (`#8C5E35`)

## 3. Typography
- **Primary / UI**: System fonts (`system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`).
- **Korean (CJK)**: `Pretendard Variable` (Line-height: 1.6 - 1.8).
- **Display / Headers (Cards)**: Elegant Serif (e.g., `Playfair Display`, `Noto Serif KR`) to evoke the boutique diary feel.

## 4. UI Patterns & Layout
- **The Shelf (Dashboard)**: Dark background, 8px grid layout. Cards are displayed as physical objects on a shelf.
- **The Cards**: Soft rounded corners (`rounded-2xl` to `rounded-3xl`), cream-colored background, subtle drop shadows (`shadow-sm` on dark background to simulate depth).
- **Taste Passport (Insight)**: Glassmorphism overlay on a dark background. Frosted glass effect (`backdrop-blur-md`, `bg-white/10`) with gold/amber text for a VIP feel.

## 5. Components & Micro-interactions
- **Animations**: `framer-motion` for 150ms hover effects, card flips, and 3D tilts.
- **Data Visualization**: `FluidRadarChart` (breathing SVG polygons) inside the light cream cards.
- **Buttons**: Pill-shaped or soft-rounded rectangles. Dark text on light background or Gold text on dark background.

## 6. Anti-Patterns (Strictly Avoid)
- **NO** Purple-to-blue gradients (AI Slop).
- **NO** Pure white (`#FFF`) on Pure Black (`#000`).
- **NO** Overuse of glassmorphism (use only for the Taste Passport / VIP screens).
- **NO** Heavy bounce easing.

## 7. Accessibility (WCAG 2.2)
- Ensure high contrast (minimum 4.5:1) between text (Espresso) and cards (Cream).
- Dark mode shelf elements must have distinct borders (`border-white/10`) to separate them from the background.
- Support `prefers-reduced-motion` for all `framer-motion` animations.

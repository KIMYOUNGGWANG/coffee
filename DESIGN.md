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

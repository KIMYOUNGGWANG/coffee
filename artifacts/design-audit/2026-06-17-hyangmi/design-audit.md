# Hyangmi product design audit

Date: 2026-06-17

## Verdict

The visual direction is distinctive and worth keeping. The dark espresso-bar surface, warm amber accent, and editorial Korean serif type give Hyangmi a recognizable coffee identity. Production readiness is much lower than the art direction, however: the onboarding page has a blocking contrast failure, and both the landing page and dashboard clip important content at the captured 768 px viewport.

- Brand direction: strong
- Cross-screen consistency: promising but incomplete
- Responsive readiness: needs work
- Accessibility readiness: blocking issues
- Overall: keep the concept, repair the system before adding more polish

## Audit scope

- Flow: landing -> onboarding -> dashboard
- Target: visual design, UX clarity, and screenshot-observable accessibility risks
- Design intent: a premium espresso bar paired with a light, elegant taste passport

## Step 1 - Landing page

Screenshot: `01-landing.png`

Health: Needs work at tablet width.

### Strengths

- The charcoal, cream, and amber palette communicates coffee immediately without relying on generic purple gradients.
- The serif display type and product photography give the opening screen a distinct editorial identity.
- The two primary entry points are visible without scrolling and use plain action-oriented copy.

### UX and visual issues

- The hero heading overflows the right edge at the captured 768 px viewport, cutting off part of `Taste Passport` and the following Korean text.
- The header's primary action is also clipped on the right, making the navigation feel unfinished and hiding a key conversion path.
- The English badge, mixed Korean/English product terms, and large multi-line headline create more reading work than the simple first action needs.
- The image starts low and partially outside the first viewport, so the screen feels text-heavy despite having a strong visual asset.

### Accessibility risks

- Several secondary text colors are low-contrast gray on charcoal and need measured contrast verification.
- The clipped heading and navigation indicate weak responsive reflow and likely fail at zoomed or intermediate-width layouts.
- Screenshot evidence cannot confirm keyboard focus visibility, semantic heading order, reduced motion support, or screen-reader labels.

## Step 2 - Onboarding and Taste Finder

Screenshot: `02-onboarding.png`

Health: Critical visual accessibility failure.

### Strengths

- The flow has a useful conceptual order: choose a taste profile, scan a package, record familiar flavor words, then build an archive.
- Taste profiles are presented as selectable controls rather than passive cards, which gives the onboarding a clear interaction model.
- The page keeps the same editorial grid and warm coffee palette as the landing experience.

### UX and visual issues

- Most headings, body copy, navigation, and profile-card content render white on a pale cream background and are nearly unreadable.
- Only the small amber labels remain legible, so the visual hierarchy is inverted: supporting labels dominate while the task and choices disappear.
- The three profile choices are present in the accessibility tree but visually indistinguishable, preventing users from comparing or confidently selecting one.
- The screen appears polished structurally but is functionally unusable without selecting text or relying on assistive technology.

### Accessibility risks

- Text contrast is visibly far below a usable threshold across the primary content.
- Interactive profile controls lack a clearly visible default, hover, selected, and focus state in the captured surface.
- Meaningful content exists in the accessibility tree, but visual users cannot perceive it; this is a blocking perceivability issue, not minor polish.
- Screenshot evidence cannot confirm announcements after profile selection or keyboard interaction order.

## Step 3 - Dashboard and first-record entry

Screenshot: `03-dashboard.png`

Health: Strong identity, overloaded first-use hierarchy.

### Strengths

- The dark archive surface, amber highlights, serif headings, and fine borders carry the core brand consistently into the product.
- The empty account state explains that the first record should come before payment, which is the right activation priority.
- Search, filters, usage, archive views, and upgrade paths are exposed as real controls rather than decorative dashboard cards.

### UX and visual issues

- The primary header action is clipped on the right at 768 px, repeating the landing page's responsive overflow problem.
- The first-use panel combines a four-stage funnel, four product/price cards, two calls to action, and upgrade language before the user has created one record.
- `가격 보기` renders as extremely pale text on a white button and is effectively invisible.
- The primary and secondary calls to action compete: `새로운 카드 기록하기`, `첫 Taste Card 만들기`, and the funnel's first step all describe the same next action.
- Product names alternate between Korean and English (`Taste Card`, `Taste Passport`, `Premium`, `테이스팅 10팩`), making the information architecture feel less settled than the visual style.

### Accessibility risks

- The white-on-white secondary button is a blocking contrast failure.
- Dense small text and thin gray borders on near-black surfaces need contrast and zoom testing.
- Horizontal clipping at an intermediate viewport suggests controls may be unreachable or require horizontal scrolling at browser zoom.
- Opening either first-record button produced no visible state change during this audit, so interaction feedback and error recovery need direct verification.

## Cross-screen findings

### What is working

- The product does not look like a generic SaaS template. Coffee, archive, and editorial cues are visible immediately.
- Amber is used as a restrained action and status color rather than a decorative gradient.
- The primary journey is coherent in concept: discover taste -> create first record -> build archive -> unlock recommendations and exports.
- Real empty-state, filtering, usage, and monetization surfaces exist, so the interface already communicates a functioning product rather than a static mock.

### Structural problems

1. Light and dark themes share one global foreground token. `app/globals.css` defines `--foreground` as cream for the dark app but `.hyangmi-paper` changes only the background. The onboarding screen therefore inherits white text on cream.
2. The implementation mixes documented tokens, Tailwind theme tokens, and one-off hex colors. This makes contrast and responsive behavior drift across screens despite a clear `DESIGN.md` concept.
3. Intermediate-width behavior is not treated as a first-class layout. At 768 px, conversion actions and display copy extend beyond the visible right edge.
4. Activation and monetization are visually merged. A new user sees several paid offers before completing the single action that creates product value.
5. The local server returned `404` for `/noise.png`, so the texture layer declared on the landing page is not loading.

## Priority recommendations

### P0 - Restore basic usability

- Give `.hyangmi-paper` its own dark foreground, muted foreground, border, and surface tokens; remove explicit `text-white` from light-paper controls.
- Fix the `가격 보기` button to use dark espresso text on white or an amber outline on the dark surface.
- Add overflow tests at 375, 768, and 1280 px and make header actions wrap or collapse before they clip.

### P1 - Clarify the first-use journey

- Reduce the dashboard's first-use panel to one primary action, one short explanation, and a quiet progress indicator.
- Move prices and upgrade offers below the first-record workflow or behind `가격 보기` until at least one card exists.
- Standardize product language: choose Korean-first labels with English as secondary metadata, or the reverse, rather than alternating by component.

### P2 - Consolidate the design system

- Convert the recurring charcoal, cream, amber, espresso, muted text, and border colors into semantic light/dark tokens shared by all pages.
- Define responsive headline sizes and Korean line-breaking rules in `DESIGN.md`, including `text-wrap`, maximum line length, and intermediate breakpoints.
- Restore or remove the missing `/noise.png` reference so the intended surface texture is deliberate and testable.
- Keep the serif identity, photography, restrained amber, and tactile card treatment; those are the strongest differentiators.

## Evidence limits

- The audit used the current local build and a 768 px-wide Chrome viewport.
- Screenshots establish visible layout and contrast problems, not full WCAG conformance.
- Keyboard order, focus styling, screen-reader output, reduced motion, mobile reflow, and authenticated card creation still require dedicated testing.

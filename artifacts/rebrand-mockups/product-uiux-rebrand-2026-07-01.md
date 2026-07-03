# CoffeeDex/Hyangmi UI/UX Rebrand - 2026-07-01

## Verdict

Selected direction: **Warm Private Archive**.

CoffeeDex/Hyangmi should feel like a private coffee room, not an AI scanner, coffee-ordering app, or SaaS dashboard. The product loop is:

1. Remember today’s cup.
2. Keep the bean in a drawer.
3. Return later to rebuy or brew better.

## Current UI/UX Diagnosis

### Mobile

- `룸`: strongest current screen. It already says “personal app” more than “tool,” but it must keep prioritizing note and drawer actions over camera/scanning.
- `노트`: now closer to diary-first. Camera is acceptable only as a secondary route.
- `서랍`: visually aligned, but copy must avoid recommendation/analysis language and speak like a private archive.
- `나`: privacy tone is strong. Settings should avoid generic dashboard or AI preference wording.
- `노트 작성`: improved from form to card flow. It should stay scene-first: memory, cup label, feeling, drawer category.
- `노트 상세`: aligned with diary/record tone. Keep details secondary to the user’s own sentence.

### Web Dashboard

- Strongest issue: web language still drifted into `Rebuy Intelligence`, `Dial-in Coach`, `Passport`, and KPI-like summaries.
- The web shell should become the expanded version of the same app: `서랍`, `노트`, `취향`, `설정`.
- The first glance should not feel like BI. It should answer: how many notes, what might I rebuy, and what should I brew next.

### Design System

- `DESIGN.md` previously mixed “black Leica gallery” and “warm personal room.” That created contradictory UI instincts.
- The new system unifies around warm paper, espresso text, clay accent, private archive copy, and app-first flow.

## Reference Synthesis

### 1. Coffee App

References: Pinterest coffee mobile app ideas, Dribbble coffee app UI.

What to borrow:
- Warm brown/cream palettes.
- Product photography as tactile material.
- Large thumb-friendly bottom actions.

What not to borrow:
- Cart, delivery, price, menu, cafe ordering flow.
- Coffee-shop commerce language.

### 2. Journal / Diary App

References: Dribbble journal app and diary app screens.

What to borrow:
- Calendar/list memory rhythm.
- Entry-first writing flow.
- A single personal sentence as the emotional anchor.

What not to borrow:
- Generic inspirational prompts.
- Long wellness-app copy.

### 3. Archive / Shelf App

References: Mobbin archive and journal/archive flows.

What to borrow:
- Browsable saved-item rows.
- Clear archive categories.
- Return loops: recent, saved, reopened, hidden/private.

What not to borrow:
- Trash/delete-first mental model.
- Dense productivity navigation.

### 4. Premium Personal Utility

References: Mobbin premium app patterns and calm personal tools.

What to borrow:
- Restrained navigation.
- High-quality empty/loading/error states.
- Compact information panels that feel useful, not decorative.

What not to borrow:
- Generic SaaS KPI cards.
- Feature-heavy command centers.

## Rebrand System

### Keywords

`개인 커피룸`, `내 노트`, `내 서랍`, `다시 살 단서`, `오늘의 컵`, `비공개`, `조용히 쌓이는 취향`

### Avoid

`AI 분석`, `스캐너`, `Confidence`, `Intelligence`, `추천 엔진`, `패스포트` as a primary label, `주문`, `장바구니`, `배송`

### IA

- `룸`: today’s cup, mood, note CTA, drawer CTA.
- `노트`: diary-first list and writing entry; photo as secondary.
- `서랍`: saved beans, rebuy clues, private drawer.
- `나`: privacy, personal settings, account.
- `노트 작성`: scene first, cup label, feeling, drawer category, save.
- `노트 상세`: personal sentence first, coffee metadata second.
- `웹 대시보드`: expanded drawer and note workspace, not marketing.

## Implementation Pass Applied

- Rewrote `DESIGN.md` around Warm Private Archive.
- Reworded web dashboard header and nav:
  - `내 원두 서랍`
  - `오늘의 노트`
  - `취향 지도`
  - `오늘 노트`
- Replaced exposed BI/AI wording in summary cards:
  - `Rebuy Intelligence` -> `최근 기록에서 꺼낸 힌트`
  - `Dial-in Coach` -> `다음 컵을 위한 작은 기준`
- Reworded mobile privacy and drawer copy to avoid analysis/recommendation framing.

## Next Best Iteration

1. Replace remaining component names and user-facing copy around `RebuyIntelligence`/`DialInCoach` panels with product language.
2. Replace manual mobile spacer hacks with a shared safe-area screen wrapper.
3. Build a real saved-note state in mobile so `룸`, `노트`, `서랍`, and detail screens share the same note data.
4. Add composed empty states for first-time users.

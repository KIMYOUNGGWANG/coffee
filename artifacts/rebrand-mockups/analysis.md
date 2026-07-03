# Hyangmi App-First Rebrand

Generated: 2026-06-26

## Correction

The previous direction was too web/landing-page oriented. If Hyangmi is going through a bridge into an app, the design should start from app surfaces, not a marketing hero.

The important surfaces are:

- Home: what the user does today.
- Photo record: capture label, review suggested fields, save.
- Passport/archive: taste history, favorite origins, repurchase clues.
- Bottom tabs: the main navigation model.

## What Feels Wrong In The Current App

The mobile app currently inherits the black gallery design from the web checkout.

Problems:

- The dark premium shelf feels heavy for daily mobile use.
- `Ultra-Premium Collection`, `AI 라벨 분석 완료`, and similar language sounds like a demo instead of a personal tool.
- The scan flow jumps from camera to an alert. It should show a review screen where the user can edit suggested fields.
- The passport is currently badge-like. It should feel more like a useful record of taste, origin, and repurchase signals.

## New Direction

Make Hyangmi feel like a calm personal coffee log.

Principles:

- Keep AI behind the scenes.
- Replace "AI analysis" language with "사진으로 정보 채우기", "저장 전 확인", "제안된 정보".
- Use a warm coffee palette: paper, ceramic, espresso, caramel, leaf green.
- Put the user in control before saving.
- Prioritize 44px+ touch targets and bottom tab navigation.
- Design screens that translate cleanly to Expo, React Native, or WebView bridge.

## Mockup Concepts

### Version A: Daily Cafe Companion

Recommended main direction.

- Warm paper and ceramic surfaces.
- Home starts with "오늘의 커피를 남겨둘까요?"
- The app feels personal and easy to return to.
- Capture flow uses the language "읽은 정보는 저장 전 직접 확인할 수 있어요."
- Passport shows taste profile and origin stamps without over-gamifying.

### Version B: Pocket Coffee Log

Best MVP direction.

- Practical, list-first, simple.
- Minimal visual overhead.
- Fastest to implement in the existing Expo tab structure.
- Good for bridge constraints and repeated daily use.

### Version C: Taste Passport Archive

Best brand direction.

- Editorial and collectible.
- Strongest personality for specialty coffee fans.
- Better for later polish once the core flow is stable.
- More implementation work because typography, image treatment, and archive layout need care.

## Recommendation

Build the app from the v3 personal-space direction, then borrow selected v2 moments for energy.

Use:

- v3 `Personal Space` for the product framing.
- v3 `룸 / 노트 / 서랍 / 나` tabs for a more owned app feeling.
- v3 diary and shelf screens for the emotional core.
- v3 private layer for trust.
- v2 `Sensory Coffee Companion` for the camera and taste-wheel moments.
- v2 camera screen for the bridge app capture experience.
- v2 taste wheel for the signature product moment.
- v2 passport and purchase-hint screens for retention.
- Earlier Version B only for MVP simplification if implementation time is tight.

Concrete changes for production:

- Rename app tabs from `홈 / 스캔 / 패스포트 / 설정` to `홈 / 기록 / 여권 / 설정`.
- Replace dark theme tokens in mobile with warm app tokens.
- Replace scan alert with a confirmation screen.
- Remove "AI" from primary UI labels. Keep it in helper text only when needed.
- Make the first action "사진으로 추가" and the fallback "직접 쓰기".
- Show recent notes as a simple list/card hybrid, not floating premium shelf cards.

## V2 Adds Needed Energy

The first app mockup was intentionally calm, but it became too plain. V2 fixes that by giving each screen a different job and visual rhythm:

- Home: emotional, photo-led, warm, and action-focused.
- Camera: immersive and dark, so capture feels like a real app tool.
- Confirm: trust-building, with editable suggested fields.
- Taste: a colorful flavor wheel instead of another plain card.
- Passport: collection energy without turning the app into a game.
- Purchase hints: a clear reason to return after saving notes.

## V3 Makes It Feel Owned

V3 is the strongest direction if the goal is "my own space" rather than "a useful scanner."

- Tabs change from functional labels to personal places: `룸 / 노트 / 서랍 / 나`.
- Home starts with the user's name, today's mood, and a recent cup.
- Notes are written like memory fragments, not generated analysis.
- The shelf stores beans as objects with context: weather, mood, time, and repurchase clue.
- Privacy is a visible product value: private by default, preview before sharing, recommendations inside my record.

Best blend:

- Use v3 for the home, note, shelf, and privacy model.
- Use v2 for camera capture, field confirmation, and flavor wheel interaction.

# CoffeeDex API Spec

CoffeeDex is a Korea-first coffee memory product centered on recall and repurchase. The primary contract lets a user capture editable package claims, record user-perceived taste and repurchase intent, save a private memory, and retrieve it later. Taste snapshots are evidence-labeled summaries of confirmed records.

- Project: CoffeeDex
- Version: v1.0
- Base URL: `/api/v1`
- Auth method: Supabase session/JWT
- Primary table: `tasting_cards`

## Authentication And Security

Durable memory, export, deletion, analytics, and paid-entitlement routes require an authenticated Supabase user. Database access is owner-scoped: users should only read and mutate rows where `auth.uid() = user_id`. The scan route also permits one anonymous trial under the process-local limitation documented below. Tokenized public-share routes are deliberately separate read surfaces.

The public health endpoint lives outside this contract at `/api/health`.

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/v1/cards` | List the current user's tasting cards, newest first. |
| `POST` | `/api/v1/cards` | Create a new tasting card. |
| `GET` | `/api/v1/cards/:id` | Read one tasting card owned by the current user. |
| `PATCH` | `/api/v1/cards/:id` | Update one tasting card owned by the current user. |
| `DELETE` | `/api/v1/cards/:id` | Delete one tasting card owned by the current user. |
| `POST` | `/api/v1/cards/ai-note` | Generate an SCA-style coffee tasting sentence from tags and a raw note. |
| `POST` | `/api/v1/cards/scan` | Scan a coffee bean package image and return draft card fields. |
| `GET` | `/api/v1/export?format=json\|csv` | Download the current user's owned data in JSON or CSV. |
| `DELETE` | `/api/v1/account` | Permanently delete the authenticated account after explicit confirmation. |
| `GET` | `/api/v1/profile` | Read credits, PDF access, premium status, and scan limits. |
| `GET` | `/api/v1/profile/analytics` | Return taste averages, top flavor tags, and an AI taste profile summary. |
| `GET` | `/api/v1/shelf?include_finished=true\|false` | List owned coffee shelf items for freshness and rebuy timing. |
| `POST` | `/api/v1/shelf` | Add a bean to the current user's private coffee shelf. |
| `PATCH` | `/api/v1/shelf/:id` | Update one owned shelf item, including fill level or finished state. |
| `DELETE` | `/api/v1/shelf/:id` | Delete one owned shelf item. |
| `GET` | `/api/v1/rebuy-intelligence` | Derive the current user's Rebuy Intelligence loop from owned cards, shelf items, and brewing logs. |
| `POST` | `/api/v1/checkout` | Create a Stripe Checkout session for premium, card credits, or PDF export. |
| `GET` | `/api/v1/pdf` | Return the current user's CoffeeDex home-cafe archive as a PDF download. |
| `POST` | `/api/v1/webhooks/stripe` | Receive Stripe entitlement events for premium, scan credits, and PDF access. |
| `POST` | `/api/v1/ai-barista` | Get AI Barista custom brewing advice based on mood situation or extraction feedback (sour, bitter, watery, perfect). |
| `GET` | `/api/v1/dial-in-coach` | Derive a concrete first-cup recipe and next adjustments from owned shelf beans and brew logs. |
| `POST` | `/api/v1/brewing-logs` | Record a new brewing log with extraction parameters and notes for a shelf item. |
| `GET` | `/api/v1/brewing-logs` | Fetch the current user's history of brewing logs. |

`POST /api/v1/brewing-logs` accepts optional `coachFeedback` values of `too_sour`, `too_bitter`, `too_weak`, `too_heavy`, or `balanced`. Dial-in Coach reads the existing `brewing_logs.coach_feedback` field as private Brew Failure Memory and uses it to adjust the next recipe; no new public recipe feed, marketplace, or community comparison is created.

The historical `tasting_cards` table, generic metric columns, route paths, and applied migrations remain unchanged for compatibility. They are implementation identifiers, not the canonical brand.

PDF export, Stripe checkout and entitlements, story export, and public share routes remain supported as secondary compatibility surfaces. They do not define the primary recall and repurchase journey and must not lead landing, onboarding, empty-state, or dashboard actions.

## Current Boundary And Future Roaster Layer

Current capability is intentionally scoped to private coffee memory and retrieval:

- personal tasting cards for cafes, home brews, and roasters such as Fritz, Terarosa, Momos, and Anthracite;
- Quick Add Memory Mode for saving a confirmed private card from bean name, roaster, one-line note, and repurchase intent first; origin, process, flavor tags, and acidity/sweetness/body are optional detail fields rather than the default 20-second surface;
- AI-assisted scan and note drafts that the user reviews before saving;
- a 20-second default quick-record surface that keeps helper tags, package facts, and purchase clues out of the first screen unless the user opens optional details;
- explicit repurchase memory and retrieval based on confirmed saved records;
- private rebuy recall from `repurchase_intent` and `repurchase_reasons`, while last-good-brew recall requires brew-like metadata or provenance in `footer_meta.extraInfo`;
- private Fresh Shelf tracking that derives wait, drink-now, finish-soon, and rebuy timing from roast date, opened date, remaining fill level, and finished state;
- private Shelf Runway estimates that derive cups remaining, likely run-out timing, and a suggested in-app rebuy reminder date from shelf weight, fill level, and opened date;
- private purchase memory through optional `purchase_url` and `purchase_note` fields on cards and shelf items, used only to reopen the user's own saved buying clue or fallback search;
- private in-app rebuy reminder state on shelf items through `rebuy_priority`, `rebuy_reminder_date`, `rebuy_action`, and `rebuy_action_at`; this is a saved UI loop, not push delivery or an order flow;
- private Dial-in Coach guidance that turns shelf beans and recent brew outcomes into a starting recipe and one-variable adjustment plan;
- private Brew Failure Memory inside Dial-in Coach, where one-tap sour, bitter, weak, heavy, or balanced feedback is saved to `brewing_logs.coach_feedback` and changes the next recommended recipe;
- private Rebuy Intelligence that combines Fresh Shelf timing, taste-match criteria, package/scan repurchase search memory, and brew-failure adjustment prompts from owned data only;
- package claims kept distinct from user-perceived taste;
- evidence-labeled taste snapshots based on sample count and coverage.

Story images and PDF artifacts remain secondary compatibility outputs. Stripe remains the payment adapter for those existing entitlements.

Future roaster partnership, referral, and community layers are not current API capabilities. They require separate contracts, consent, moderation, commercial terms, and verification before any user-facing launch.

## Data Contracts

### `TastingCard`

```typescript
interface TastingCard {
  id: string;
  user_id: string;
  category: "coffee";
  title: string;
  subtitle: string;
  image_url: string | null;
  badges: string[];
  metric1: number;
  metric2: number;
  metric3: number;
  tags: string[];
  ai_description: string;
  footer_meta: {
    origin?: string;
    date?: string;
    extraInfo?: string;
  };
  package_origin: string | null;
  package_process: string | null;
  purchase_url: string | null;
  purchase_note: string | null;
  repurchase_intent: "again" | "maybe" | "no" | "undecided";
  repurchase_reasons: string[];
  scan_source: "gemini" | "manual" | null;
  scan_confidence: number | null;
  corrected_fields: Array<"title" | "subtitle" | "package_origin" | "package_process" | "tags">;
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;
}
```

The current CoffeeDex UI creates coffee cards only. The database schema still contains legacy beverage-category compatibility, but the product contract is coffee memory and repurchase.

For coffee cards, the generic metrics are currently interpreted as:

| Field | Coffee meaning | Scale |
| --- | --- | --- |
| `metric1` | Acidity | 1-5 |
| `metric2` | Sweetness | 1-5 |
| `metric3` | Body | 1-5 |

### `CoffeeShelfItem`

Owned shelf rows are private operational memory for beans the user currently has or has finished. The app may derive Fresh Shelf action labels from these fields, but the derived label is not persisted.

```typescript
interface CoffeeShelfItem {
  id: string;
  user_id: string;
  roaster_name: string;
  bean_name: string;
  origin: string | null;
  roast_date: string | null;
  opened_date: string | null;
  total_weight: number;
  fill_level: number;
  is_finished: boolean;
  tasting_card_id: string | null;
  purchase_url: string | null;
  purchase_note: string | null;
  rebuy_priority: "normal" | "pinned" | "paused";
  rebuy_reminder_date: string | null;
  rebuy_action: "none" | "drank" | "will_rebuy" | "rebought";
  rebuy_action_at: string | null;
  created_at: string;
  updated_at: string;
}
```

Fresh Shelf guidance is advisory product copy. Current labels are `waiting`, `drink_now`, `finish_soon`, and `rebuy`, rendered in Korean as shelf-card action signals. The saved rebuy reminder fields only keep app-internal state for pinned candidates, next-buy dates, and completed/drank/will-rebuy actions. They do not create push notifications, roaster orders, partner offers, or marketplace transactions.

### `GET /api/v1/rebuy-intelligence`

Return a private action loop that helps the user decide what to drink, fix, or buy again next. The route reads only owner-scoped `tasting_cards`, `coffee_shelf_items`, and `brewing_logs`; it does not create community recommendations, partner referrals, marketplace listings, roaster orders, or persisted notification jobs.

```typescript
interface RebuyIntelligenceResponse {
  data: {
    generatedAt: string;
    summary: string;
    featureScores: Array<{
      feature: "rebuy_reminder" | "taste_match" | "purchase_memory" | "brew_failure_memory";
      roi: number;
      retention: number;
      painkiller: number;
      monetization: number;
      difficulty: number;
      reason: string;
    }>;
    rebuyReminder: {
      title: string;
      subtitle: string;
      reason: string;
      actionLabel: string;
      priority: "high" | "medium" | "low";
      cardId: string | null;
      shelfItemId: string | null;
    };
    tasteMatch: {
      anchorCardId: string | null;
      anchorTitle: string;
      matchCardId: string | null;
      matchTitle: string;
      sharedTags: string[];
      reason: string;
      searchPrompt: string;
    };
    purchaseMemory: {
      title: string;
      subtitle: string;
      source: "scan" | "shelf" | "manual";
      searchUrl: string;
      reason: string;
      cardId: string | null;
      shelfItemId: string | null;
    };
    brewFailureMemory: {
      title: string;
      subtitle: string;
      problem: "too_sour" | "too_bitter" | "weak" | "dry" | "unknown";
      adjustment: string;
      evidence: string;
      logId: string | null;
      shelfItemId: string | null;
    };
  };
}
```

### `POST /api/v1/cards`

Create a tasting card for the authenticated user.

```typescript
interface CreateCardRequest {
  category: "coffee";
  title: string;
  subtitle: string;
  imageUrl?: string | null;
  badges?: string[];
  metric1: number;
  metric2: number;
  metric3: number;
  tags?: string[];
  aiDescription?: string;
  footerMeta?: {
    origin?: string;
    date?: string;
    extraInfo?: string;
  };
  packageOrigin?: string | null;
  packageProcess?: string | null;
  purchaseUrl?: string | null;
  purchaseNote?: string | null;
  repurchaseIntent?: "again" | "maybe" | "no" | "undecided";
  repurchaseReasons?: string[];
  scanSource?: "gemini" | "manual" | null;
  correctedFields?: Array<"title" | "subtitle" | "package_origin" | "package_process" | "tags">;
  confirmed?: true;
}

interface CreateCardResponse {
  data: TastingCard;
}
```

Quick Add Memory Mode uses this same `POST /api/v1/cards` contract. The default 20-second path writes `confirmed: true`, `scanSource: "manual"`, bean name, roaster, repurchase intent, and a nonblank one-line note into `aiDescription` and `footerMeta.extraInfo`; if the note is blank, it does not generate fallback `repurchaseReasons` or `footerMeta.extraInfo`. Purchase clues, package facts, helper tags, and taste metrics are optional detail fields rather than the default quick-record surface. A one-line note may support private note/rebuy recall when explicitly saved, but last-good-brew recall requires actual brew metadata such as method, ratio, temperature, or grams. It does not create a roaster order, partner offer, marketplace listing, or community recommendation.

### `POST /api/v1/cards/ai-note`

Generate a preview tasting note before card creation. If no AI key is configured, the route returns a local CoffeeDex fallback sentence instead of breaking the workflow.

```typescript
interface GenerateAiNoteRequest {
  tags?: string[];
  rawNote?: string;
}

interface GenerateAiNoteResponse {
  aiDescription: string;
  warning?: string;
}
```

### `POST /api/v1/cards/scan`

Analyze a bean-package image in request memory and return an editable draft. Accepted data URLs are JPEG, PNG, or WebP, limited to 5 MiB after base64 decoding. CoffeeDex checks canonical base64, the declared MIME type, and the decoded file magic/signature before provider work. The route does not persist the raw image.

```typescript
interface ScanCoffeePackageRequest {
  image: string;
}

interface ScanCoffeePackageResponse {
  data: {
    kind: "success";
    source: "gemini";
    title: string | null;
    subtitle: string | null;
    origin: string | null;
    process: string | null;
    tags: string[] | null;
    uncertainty: {
      title: number | null;
      subtitle: number | null;
      origin: number | null;
      process: number | null;
      tags: number | null;
    };
  } | {
    kind: "unavailable";
    reason: "provider_unconfigured" | "provider_error";
    manual_entry: true;
  };
  entitlement?: {
    allowed: boolean;
    source: "monthly_allowance" | "credit" | "premium" | "none";
    credits_spent: number;
    credits_remaining: number;
    scans_used: number;
    monthly_scan_limit: number;
  };
  guest?: { trial_used: true };
}
```

The provider prompt is extraction-only: absent or unreadable claims remain `null`, uncertainty is field-specific, and no flavor or metric is inferred from other package facts. Provider failure returns manual-entry state, never fabricated fallback coffee data.

An anonymous visitor may use one trial keyed from forwarded IP headers. This limiter is an in-memory, process-local MVP control. Guest scan, analytics, and support intake also have process-local request throttles to blunt obvious loops. These controls reset with an instance restart, are not shared between instances, and are not production distributed rate limiting or a security boundary. Guest draft fields and corrections live in browser storage for less than 24 hours; expired or invalid drafts are removed when read. Raw image data is excluded from that local draft.

### `GET /api/v1/profile/analytics`

Return the user's current saved-record taste recap. Progressive passport fields use confirmed records only (`confirmed_at` is non-null). Legacy `totalCards` still counts all owned cards, while the existing averages and `topTags` keys remain for response compatibility and are calculated from confirmed cards.

```typescript
interface TasteAnalyticsResponse {
  data: {
    averageAcidity: number;
    averageSweetness: number;
    averageBody: number;
    topTags: string[];
    totalCards: number;
    aiAnalysis: string;
    topNotes: Array<{ note: string; count: number }>;
    passport: {
      kind: "empty" | "collage" | "first_signals" | "early_snapshot" | "current_snapshot";
      sampleCount: number;
      distinctOriginCount: number;
      distinctProcessCount: number;
      distinctTagCount: number;
      coverage: "narrow" | "mixed" | "broad";
    };
    repurchaseBreakdown: {
      again: number;
      maybe: number;
      no: number;
      undecided: number;
    };
  };
}
```

`sampleCount`, coverage, `topNotes`, and `repurchaseBreakdown` never include unconfirmed drafts. The summary describes current evidence and does not claim a fixed taste identity.

### `GET /api/v1/export?format=json|csv`

Free authenticated download of owner-filtered `tasting_cards`, `brewing_notes`, `coffee_shelf_items`, and `brewing_logs`. JSON returns the four collections in a versioned archive; CSV flattens them into typed rows. Responses are attachments with `private, no-store`, `Pragma: no-cache`, and `nosniff`. If any owned dataset query fails, no partial archive is returned.

### `GET /api/v1/pdf`

Paid compatibility export for authenticated users whose profile has `has_pdf_access: true`. The route queries only the current user's tasting cards, renders a binary `application/pdf` response, and returns it as an attachment with `private, no-store` cache headers. Users without PDF access receive `403`.

PDF generation uses the bundled local Korean font at `public/fonts/NanumGothic-Regular.ttf`. If that asset is unavailable at runtime, the route returns `503` with a structured JSON error instead of fetching a remote font or fabricating a partial artifact.

### `DELETE /api/v1/account`

Requires the exact confirmation phrase `내 CoffeeDex 계정을 영구 삭제합니다` and `acknowledgePermanentDeletion: true`. The admin operation runs sequentially and stops on the first error: public cards are privatized; Stripe event payload and identifiers are redacted; product analytics events are detached from the user; owned brewing logs, shelf items, notes, cards, and entitlement audit rows are deleted; then the profile and Supabase Auth identity are deleted. Auth identity deletion is last so an earlier failure does not orphan a partially deleted account.

The endpoint does not claim transactional rollback across those services. Redacted Stripe audit rows and anonymized product events may remain for payment, dispute, security, and aggregate-operational obligations. The implementation does not currently promise storage-object cleanup, so this contract does not claim it.

## Tables

### `tasting_cards`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key, generated by Postgres. |
| `user_id` | `uuid` | Owner; references `auth.users(id)`. |
| `category` | `text` | Current product writes `coffee`; older compatibility values may exist in legacy rows. |
| `title` | `text` | Bean or product name, such as `Ethiopia Sidama`. |
| `subtitle` | `text` | Roaster name, such as `Fritz Coffee Company` or `Momos Coffee`. |
| `image_url` | `text` | Optional image URL. |
| `badges` | `text[]` | Method, roast, process, and other labels. |
| `metric1` | `integer` | Coffee acidity score, 1-5. |
| `metric2` | `integer` | Coffee sweetness score, 1-5. |
| `metric3` | `integer` | Coffee body score, 1-5. |
| `tags` | `text[]` | Flavor notes. |
| `ai_description` | `text` | Generated or edited tasting sentence. |
| `footer_meta` | `jsonb` | Origin, date, recipe, or other display metadata. |
| `package_origin` | `text` | Nullable package claim, separate from perceived taste. |
| `package_process` | `text` | Nullable package processing claim. |
| `purchase_url` | `text` | Nullable user-saved buying clue URL, not an affiliate or marketplace listing. |
| `purchase_note` | `text` | Nullable user-saved buying note. |
| `repurchase_intent` | `text` | `again`, `maybe`, `no`, or `undecided`. |
| `repurchase_reasons` | `text[]` | User-recorded reasons for the intent. |
| `scan_source` | `text` | Nullable `gemini` or `manual` provenance. |
| `scan_confidence` | `numeric` | Nullable legacy aggregate confidence/provenance value. |
| `corrected_fields` | `text[]` | Scan fields changed by the user before confirmation. |
| `confirmed_at` | `timestamptz` | Null for a draft; timestamp for a user-confirmed memory. |
| `created_at` | `timestamptz` | Creation timestamp. |
| `updated_at` | `timestamptz` | Update timestamp. |

### `profiles`

The profile surface preserves CoffeeDex paid and rate-limited compatibility features.

| Column | Purpose |
| --- | --- |
| `credits` | Remaining paid scan/card credits. |
| `has_pdf_access` | Whether the user may export the home-cafe PDF artifact. |
| `is_premium` | Whether premium scan and theme privileges are active. |
| `scans_used` | Monthly scan usage counter. |
| `monthly_scan_limit` | Free monthly package-scan allowance. |

### `coffee_shelf_items`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key. |
| `user_id` | `uuid` | Owner user reference. |
| `roaster_name` | `text` | Roaster name (e.g. Fritz Coffee Company). |
| `bean_name` | `text` | Coffee bean name. |
| `origin` | `text` | Nullable origin description. |
| `roast_date` | `date` | Nullable roasting date. |
| `opened_date` | `date` | Nullable opened date. |
| `total_weight` | `integer` | Total bag size in grams. |
| `fill_level` | `integer` | Current level check (0-100). |
| `is_finished` | `boolean` | Set true if fill level is 0. |
| `tasting_card_id` | `uuid` | Optional linked tasting card ID. |
| `purchase_url` | `text` | Nullable user-saved buying clue URL, not an affiliate or marketplace listing. |
| `purchase_note` | `text` | Nullable user-saved buying note. |
| `rebuy_priority` | `text` | `normal`, `pinned`, or `paused`; controls in-app rebuy candidate priority. |
| `rebuy_reminder_date` | `date` | Nullable next-buy date shown inside CoffeeDex. |
| `rebuy_action` | `text` | `none`, `drank`, `will_rebuy`, or `rebought`; user action state for the loop. |
| `rebuy_action_at` | `timestamptz` | Nullable timestamp for the latest rebuy action. |

### `brewing_logs`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key. |
| `user_id` | `uuid` | Owner user reference. |
| `shelf_item_id` | `uuid` | Optional linked shelf item ID. |
| `brewed_at` | `timestamptz` | Date when brewed. |
| `method` | `text` | Brewing method used. |
| `parameters` | `jsonb` | Nested variables (waterTemp, waterAmount, coffeeAmount, grindSize, brewTime). |
| `rating` | `integer` | Taste rating (1-5). |
| `simple_note` | `text` | Optional brewing note or recipe tuning details. |
| `coach_source` | `text` | Optional source such as `dial_in_coach`, `ai_barista`, or `manual`. |
| `coach_feedback` | `text` | Optional post-brew feedback: `too_sour`, `too_bitter`, `too_weak`, `too_heavy`, or `balanced`. |
| `coach_iteration` | `integer` | Optional dial-in iteration number from 1 to 12. |
| `coach_snapshot` | `jsonb` | Optional private snapshot of the coach suggestion that led to the log. |

## AI Barista & Brewing Feedback API Specification

### `POST /api/v1/ai-barista`

- **Request Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "situation": "아침 깨어남 (optional)",
    "beanId": "uuid-string (optional)",
    "feedback": "too_sour | too_bitter | too_watery | perfect (optional)"
  }
  ```
- **Response Payload**:
  ```json
  {
    "recommendation": "### 🍋 너무 신맛이 강할 때의 바리스타 처방전...",
    "warning": "Optional API limit fallback warning text (optional)"
  }
  ```

### `GET /api/v1/dial-in-coach`

Return a private first-cup recipe and next-move plan from the user's current shelf beans and recent brewing logs. The route reads only owned `coffee_shelf_items` and `brewing_logs`. It does not call a marketplace, community feed, roaster partner, or background notification system.

- **Response Payload**:
  ```json
  {
    "data": {
      "generatedAt": "2026-06-29T00:00:00.000Z",
      "selectedShelfItemId": "uuid-string-or-null",
      "title": "Fritz Ethiopia Sidama",
      "subtitle": "Ethiopia floral citrus",
      "problem": "새 원두의 첫 컵을 안정적으로 시작하는 것이 목표입니다.",
      "recipe": {
        "method": "V60",
        "coffeeAmount": 15,
        "waterAmount": 240,
        "waterTemp": 93,
        "grindSize": "Medium Fine",
        "brewTime": "2:45",
        "ratioLabel": "1:16"
      },
      "adjustments": [
        {
          "trigger": "too_sour",
          "label": "시거나 날카로우면",
          "nextMove": "분쇄를 한 단계 곱게 하거나 물 온도를 1-2도 올려요."
        }
      ],
      "evidence": ["잔량 45%", "로스팅 후 9일"],
      "suggestedLog": {
        "shelfItemId": "uuid-string-or-null",
        "method": "V60",
        "parameters": { "...": "recipe values" },
        "simpleNote": "Dial-in Coach 시작 레시피...",
        "coachSnapshot": {
          "source": "dial_in_coach",
          "title": "Fritz Ethiopia Sidama",
          "generatedAt": "2026-06-29T00:00:00.000Z",
          "evidence": ["잔량 45%"]
        }
      }
    }
  }
  ```

### `POST /api/v1/brewing-logs`

- **Request Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "shelfItemId": "uuid-string (optional, nullable)",
    "method": "추출 기구 (e.g. Hario V60)",
    "parameters": {
      "waterTemp": 94,
      "waterAmount": 225,
      "coffeeAmount": 15,
      "grindSize": "Medium Fine",
      "brewTime": "165"
    },
    "rating": 3,
    "simpleNote": "AI Barista Tuning: too_sour recommendation applied.",
    "coachSource": "dial_in_coach",
    "coachFeedback": "too_sour",
    "coachIteration": 1,
    "coachSnapshot": {
      "source": "dial_in_coach",
      "title": "Fritz Ethiopia Sidama"
    }
  }
  ```
- **Response Payload**:
  ```json
  {
    "data": {
      "id": "uuid-string",
      "user_id": "uuid-string",
      "shelf_item_id": "uuid-string",
      "brewed_at": "timestamp",
      "method": "Hario V60",
      "parameters": { ... },
      "rating": 3,
      "simple_note": "AI Barista Tuning:...",
      "coach_source": "dial_in_coach",
      "coach_feedback": "too_sour",
      "coach_iteration": 1,
      "coach_snapshot": { "...": "private coach context" }
    }
  }
  ```

## Verification

The product-truth contracts are executable with:

```bash
node --test test/product-copy.test.mjs test/smoke.test.mjs
```

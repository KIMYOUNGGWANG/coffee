# Hyangmi API Spec

Hyangmi is a Korea-first AI specialty coffee memory and artifact product. The current product lets a logged-in user record private coffee cards, generate assisted SCA-style note drafts, scan bean-package labels into editable draft fields, review a saved-record taste recap, and export/share digital artifacts.

- Project: Hyangmi
- Version: v1.0
- Base URL: `/api/v1`
- Auth method: Supabase session/JWT
- Primary table: `tasting_cards`

## Authentication And Security

All `/api/v1` product routes require an authenticated Supabase user. Database access is owner-scoped: users should only read and mutate rows where `auth.uid() = user_id`.

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
| `GET` | `/api/v1/profile` | Read credits, PDF access, premium status, and scan limits. |
| `GET` | `/api/v1/profile/analytics` | Return taste averages, top flavor tags, and an AI taste profile summary. |
| `POST` | `/api/v1/checkout` | Create a Stripe Checkout session for premium, card credits, or PDF export. |
| `GET` | `/api/v1/pdf` | Return the current user's Hyangmi home-cafe archive data for export. |
| `POST` | `/api/v1/webhooks/stripe` | Receive Stripe entitlement events for premium, scan credits, and PDF access. |

Legacy compatibility routes may still exist while productization is in progress, but Hyangmi's primary user contract is the tasting-card workflow above.

## Current Boundary And Future Roaster Layer

Current capability is intentionally scoped to a private Korean specialty coffee archive:

- personal tasting cards for cafes, home brews, and roasters such as Fritz, Terarosa, Momos, and Anthracite;
- AI-assisted scan and note drafts that the user reviews before saving;
- saved-record taste recap based on acidity, sweetness, body, and flavor tags;
- story image and PDF export artifacts.

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
  created_at: string;
  updated_at: string;
}
```

The current Hyangmi UI creates coffee cards only. The database schema still contains legacy beverage-category compatibility, but the product contract for this pass is Korean specialty coffee memory.

For coffee cards, the generic metrics are currently interpreted as:

| Field | Coffee meaning | Scale |
| --- | --- | --- |
| `metric1` | Acidity | 1-5 |
| `metric2` | Sweetness | 1-5 |
| `metric3` | Body | 1-5 |

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
}

interface CreateCardResponse {
  data: TastingCard;
}
```

### `POST /api/v1/cards/ai-note`

Generate a preview tasting note before card creation. If no AI key is configured, the route returns a local Hyangmi fallback sentence instead of breaking the workflow.

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

Analyze a bean package image and return an editable draft card payload. The route expects a base64 image string and can fall back to curated sample coffee data when the AI provider is unavailable. A scan result is assistance, not an authoritative roaster catalog record.

```typescript
interface ScanCoffeePackageRequest {
  image: string;
}

interface ScanCoffeePackageResponse {
  data: {
    title: string;
    subtitle: string;
    origin: string;
    process: string;
    tags: string[];
    metric1_acidity: number;
    metric2_sweetness: number;
    metric3_body: number;
    confidence: number;
    source: "gemini_vision" | "fallback_mock";
  };
  entitlement: {
    allowed: boolean;
    source: "monthly_allowance" | "credit" | "premium" | "none";
    credits_spent: number;
    credits_remaining: number;
    scans_used: number;
    monthly_scan_limit: number;
  };
  warning?: string;
}
```

`confidence` is an assistant-confidence score, not a roaster-verified catalog signal. `source: "fallback_mock"` means the AI provider was unavailable or unconfigured and the user must treat the draft as sample data to review and edit before saving.

### `GET /api/v1/profile/analytics`

Return the user's current saved-record taste recap. This summarizes the user's own cards; it is not a commerce recommendation engine or roaster business intelligence product.

```typescript
interface TasteAnalyticsResponse {
  data: {
    averageAcidity: number;
    averageSweetness: number;
    averageBody: number;
    topTags: string[];
    totalCards: number;
    aiAnalysis: string;
  };
}
```

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
| `created_at` | `timestamptz` | Creation timestamp. |
| `updated_at` | `timestamptz` | Update timestamp. |

### `profiles`

The profile surface powers Hyangmi paid and rate-limited features.

| Column | Purpose |
| --- | --- |
| `credits` | Remaining paid scan/card credits. |
| `has_pdf_access` | Whether the user may export the home-cafe PDF artifact. |
| `is_premium` | Whether premium scan and theme privileges are active. |
| `scans_used` | Monthly scan usage counter. |
| `monthly_scan_limit` | Free monthly package-scan allowance. |

## Verification

The T2 smoke contract is executable with:

```bash
/Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test test/smoke.test.mjs
```

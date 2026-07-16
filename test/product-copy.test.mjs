import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDirectory, "..");

function read(relativePath) {
  return readFileSync(path.join(projectRoot, relativePath), "utf8");
}

function assertDoesNotShow(source, pattern, label) {
  assert.doesNotMatch(source, pattern, `${label} must not contain unsupported product copy`);
}

function assertShows(source, pattern, label) {
  assert.match(source, pattern, `${label} must contain Rebuy PRD product truth`);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function markdownSection(source, heading) {
  const marker = `## ${heading}`;
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `Expected markdown section: ${heading}`);

  const contentStart = start + marker.length;
  const nextHeading = source.indexOf("\n## ", contentStart);
  return source.slice(contentStart, nextHeading === -1 ? source.length : nextHeading);
}

function readEnvSchemaVariables() {
  const envSchema = read("lib/env.ts");
  const entries = [...envSchema.matchAll(/^\s{2}([A-Z0-9_]+): z\.string\(\)([^\n]*),$/gm)].map(
    ([, name, modifiers]) => ({ name, optional: modifiers.includes(".optional()") }),
  );

  return {
    optional: entries.filter((entry) => entry.optional).map((entry) => entry.name).sort(),
    required: entries.filter((entry) => !entry.optional).map((entry) => entry.name).sort(),
  };
}

const unsupportedVisibleCopyTerms = [
  "Starter " + "SaaS",
  "Official " + "SaaS Layer",
  "starter-" + "saas-next-supabase",
  "SaaS " + "monetization",
  "workspace " + "billing",
  "team " + "workspace",
  "seat " + "counts",
  "live market" + "place",
  "public social " + "graph",
  "roaster " + "analytics",
  "print " + "fulfillment",
  "인쇄" + "용",
  "배" + "송",
  "포스" + "터",
  "벽걸" + "이",
  "무제" + "한",
];
const unsupportedVisibleCopyPattern = new RegExp(
  unsupportedVisibleCopyTerms.map(escapeRegExp).join("|"),
  "i",
);
const unsupportedCommunityClaimPattern = new RegExp(
  "Discover brewing recipes and tasting notes from the CoffeeDex " + "comm" + "unity",
);
const stalePrimaryProductPattern = /Taste Passport|Story Export|맛 여권|스토리 카드|공유용 스토리 카드/i;
const sharePdfPrimaryPattern = /Share And PDF Exports|story-card and PDF artifacts|story export image|PDF access -> digital home-cafe archive export/i;

test("CoffeeDex pages lead with recall and repurchase within the scoped product boundary", () => {
  // Given
  const homePage = read("app/page.tsx");
  const dashboardPage = read("app/dashboard/page.tsx");
  const dashboardClient = read("components/dashboard-client.tsx");
  const dashboardAnalyticsPanel = read("components/dashboard-analytics-panel.tsx");
  const dashboardUsagePanel = read("components/dashboard-usage-panel.tsx");
  const quickAddMemoryForm = read("components/quick-add-memory-form.tsx");
  const tastingCard = read("components/TastingCard.tsx");
  const cardDetailModal = read("components/CardDetailModal.tsx");
  const feedPage = read("app/feed/page.tsx");
  const onboardingPage = read("app/onboarding/page.tsx");
  const combinedPages = [
    homePage,
    dashboardPage,
    dashboardClient,
    dashboardAnalyticsPanel,
    dashboardUsagePanel,
    quickAddMemoryForm,
    tastingCard,
    cardDetailModal,
    feedPage,
    onboardingPage,
  ].join("\n");

  // When / Then
  assertDoesNotShow(combinedPages, unsupportedVisibleCopyPattern, "visible pages");

  assert.match(homePage, /CoffeeDex/);
  assert.match(homePage, /다시 살 원두를/);
  assert.match(homePage, /20초 만에 기억/);
  assert.match(dashboardClient, /DashboardShelfView/);
  assert.match(dashboardClient, /다시 살 후보/);
  assert.match(dashboardClient, /최근 저장한 원두/);
  assert.match(dashboardClient, /20초 기록/);
  assert.match(quickAddMemoryForm, /빠른 기록/);
  assert.match(quickAddMemoryForm, /기억이 사라지기 전에 원두, 로스터리, 다시 살 단서/);
  assert.match(quickAddMemoryForm, /다시 살래요/);
  assert.match(tastingCard, /다시 살 이유/);
  assert.match(cardDetailModal, /마지막 좋았던 추출/);
  assert.match(feedPage, /커뮤니티 기능은 아직 현재 제품 기능이 아닙니다/);
  assert.match(feedPage, /공개 공유 카드를 잠시 불러오지 못했어요/);
  assert.doesNotMatch(feedPage, /Failed to load feed|Please try again later|Save Recipe/);
  assert.doesNotMatch(feedPage, unsupportedCommunityClaimPattern);
  assert.match(dashboardAnalyticsPanel, /기록|스냅샷/);
  assert.match(dashboardUsagePanel, /기록|스냅샷/);
  assert.match(onboardingPage, /CoffeeDex/);
  assert.match(onboardingPage, /원두|커피/);
});

test("CoffeeDex landing product outputs lead with private Rebuy memory and ownership export", () => {
  // Given
  const homePage = read("app/page.tsx");
  const englishHomePage = read("app/en/page.tsx");

  // When / Then
  assertShows(homePage, /비공개|개인|private/i, "Korean landing");
  assertShows(homePage, /20초 기록|빠른 기록|quick/i, "Korean landing");
  assertShows(homePage, /Rebuy Memory|재구매 기억|다시 살/i, "Korean landing");
  assertShows(homePage, /Rebuy List|재구매 리스트|다시 살 리스트|다시 살 후보/i, "Korean landing");
  assertShows(homePage, /Rebuy Intelligence|재구매 인텔리전스|다시 살 타이밍|구매 단서/i, "Korean landing");
  assertShows(homePage, /JSON.*CSV|CSV.*JSON|소유권.*내보내기|내 데이터/i, "Korean landing");
  assert.doesNotMatch(homePage, stalePrimaryProductPattern);

  assertShows(englishHomePage, /Quick Private Record|private 20-sec record|private record/i, "English landing");
  assertShows(englishHomePage, /Rebuy Memory/i, "English landing");
  assertShows(englishHomePage, /Rebuy List|buy-again list/i, "English landing");
  assertShows(englishHomePage, /Rebuy Intelligence|buy-again intelligence/i, "English landing");
  assertShows(englishHomePage, /JSON.*CSV|CSV.*JSON|ownership export|owned data export/i, "English landing");
  assertShows(englishHomePage, /Share|PDF|compatibility/i, "English landing secondary compatibility");
  assert.doesNotMatch(englishHomePage, stalePrimaryProductPattern);
});

test("CoffeeDex docs keep memory primary and compatibility surfaces secondary", () => {
  // Given
  const apiSpec = read("docs/api-spec.md");
  const goldenFlows = read("docs/golden-flows.md");
  const deployGuide = read("docs/deploy.md");
  const marketOpportunities = read("docs/market-opportunities-2026-06-26.md");

  // When / Then
  assert.match(apiSpec, /recall and repurchase/i);
  assert.match(apiSpec, /package claims/i);
  assert.match(apiSpec, /user-perceived taste/i);
  assert.match(apiSpec, /secondary compatibility/i);
  assert.match(apiSpec, /PDF/i);
  assert.match(apiSpec, /Stripe/i);
  assert.match(apiSpec, /share/i);
  assert.match(apiSpec, /Future roaster partnership, referral, and community layers are not current API capabilities/);
  assert.match(apiSpec, /tasting_cards/);
  assert.match(apiSpec, /24 hours/i);
  assert.match(apiSpec, /raw image/i);
  assert.match(apiSpec, /5 MiB/);
  assert.match(apiSpec, /process-local/i);
  assert.match(apiSpec, /tasting_cards.*brewing_notes.*coffee_shelf_items.*brewing_logs/is);
  assert.match(apiSpec, /confirmed records/i);
  assert.match(apiSpec, /repurchaseBreakdown/);
  assert.match(apiSpec, /Quick Add Memory Mode/);
  assert.match(apiSpec, /default 20-second path/);
  assert.match(apiSpec, /private rebuy recall from `repurchase_intent` and `repurchase_reasons`/);
  assert.match(apiSpec, /last-good-brew recall requires brew-like metadata/);
  assert.doesNotMatch(apiSpec, /optional brew summary|brew summary|추출 요약/i);

  assert.match(goldenFlows, /recall and repurchase/i);
  assert.match(goldenFlows, /would buy again/i);
  assert.match(goldenFlows, /secondary compatibility/i);
  assert.match(goldenFlows, /future product layers only/);
  assert.match(goldenFlows, /not part of the current golden flows/);
  assert.match(goldenFlows, /JSON and CSV/);
  assert.match(goldenFlows, /`DELETE \/api\/v1\/account`/);
  assert.match(goldenFlows, /Quick Add Memory Mode/);
  assert.match(goldenFlows, /Save a 20-Second Quick Record/);
  assert.match(goldenFlows, /private rebuy recall from the user's own `repurchase_reasons`/);
  assert.match(goldenFlows, /Last-good-brew recall is shown only when `footer_meta.extraInfo` contains actual brew-like metadata/);
  assert.doesNotMatch(goldenFlows, /optional brew summary|brew summary|추출 요약/i);

  assert.match(deployGuide, /Korea-first AI specialty coffee memory and artifact product/);
  assert.match(deployGuide, /future work, not deploy-time capabilities/);
  assert.match(deployGuide, /npm run validate:full/);
  assert.match(deployGuide, /product-copy, brand, smoke, route-contract, typecheck, build, and Playwright E2E coverage/);
  assert.match(deployGuide, /process-local/i);
  assert.match(deployGuide, /not distributed/i);

  assert.match(marketOpportunities, /One-line quick notes remain card memory copy, not brew recall/);
  assert.match(marketOpportunities, /Private rebuy recall surfaces the user's own repurchase reason/);
  assert.match(marketOpportunities, /Last-good-brew recall stays distinct/);
});

test("CoffeeDex deploy guide matches the runtime env schema requiredness", () => {
  // Given
  const deployGuide = read("docs/deploy.md");
  const requiredSection = markdownSection(deployGuide, "Required Environment");
  const optionalSection = markdownSection(deployGuide, "Optional / Recommended Production Environment");
  const schemaVariables = readEnvSchemaVariables();
  const schemaRequired = [
    "NEXT_PUBLIC_APP_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "NEXT_PUBLIC_SUPABASE_URL",
    "STORAGE_BUCKET_UPLOADS",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "SUPABASE_SERVICE_ROLE_KEY",
  ].sort();
  const schemaOptional = [
    "ADMIN_EMAIL_ALLOWLIST",
    "AI_API_KEY",
    "NEXT_PUBLIC_POSTHOG_KEY",
    "NEXT_PUBLIC_SENTRY_DSN",
    "RESEND_API_KEY",
  ].sort();

  // When / Then
  assert.deepEqual(schemaVariables.required, schemaRequired);
  assert.deepEqual(schemaVariables.optional, schemaOptional);

  for (const variable of schemaRequired) {
    assert.match(requiredSection, new RegExp(`\\\`${escapeRegExp(variable)}\\\``));
    assert.doesNotMatch(optionalSection, new RegExp(`\\\`${escapeRegExp(variable)}\\\``));
  }

  for (const variable of schemaOptional) {
    assert.match(optionalSection, new RegExp(`\\\`${escapeRegExp(variable)}\\\``));
    assert.doesNotMatch(requiredSection, new RegExp(`\\\`${escapeRegExp(variable)}\\\``));
  }

  assert.match(optionalSection, /optional/i);
  assert.match(optionalSection, /do not treat them as required/i);
  assert.doesNotMatch(deployGuide, /expected by the current env schema/i);
});

test("CoffeeDex deploy guide guards launch rollback and observability boundaries", () => {
  // Given
  const deployGuide = read("docs/deploy.md");
  const launchChecklist = markdownSection(deployGuide, "Launch Rollback And Observability Checklist");
  const rawSecretExamplePattern =
    /\b(?:sk_live|sk_test|rk_live|whsec|eyJ[A-Za-z0-9_-]{20,}|-----BEGIN PRIVATE KEY-----)/i;
  const unsupportedShippedClaimPattern =
    /\b(?:shipped|launched|available|supports|includes|offers|production capability)\b.{0,80}\b(?:marketplace|referral|roaster partnership|community social graph|print[- ]fulfillment)\b/i;

  // When / Then
  assert.match(launchChecklist, /binary prelaunch gate/);
  assert.match(launchChecklist, /Local Validation Gate/);
  assert.match(launchChecklist, /Production Operator Gate/);
  assert.match(launchChecklist, /Failure Observability Gate/);
  assert.match(launchChecklist, /npm run validate:full/);
  assert.match(launchChecklist, /npm run test:routes/);
  assert.match(launchChecklist, /Vercel.*rollback/is);
  assert.match(launchChecklist, /Supabase migration status/i);
  assert.match(launchChecklist, /forward repair migration|approved database backup point/i);
  assert.match(launchChecklist, /Stripe is in test mode/i);
  assert.match(launchChecklist, /checkout\.session\.completed/);
  assert.match(launchChecklist, /invoice\.payment_failed/);
  assert.match(launchChecklist, /Checkout failures/i);
  assert.match(launchChecklist, /Webhook failures/i);
  assert.match(launchChecklist, /Scan failures/i);
  assert.match(launchChecklist, /Account deletion failures/i);
  assert.match(launchChecklist, /deleteCoffeeDexAccount/);
  assert.match(launchChecklist, /does not require adding a new vendor/i);
  assert.doesNotMatch(deployGuide, rawSecretExamplePattern);
  assert.doesNotMatch(deployGuide, unsupportedShippedClaimPattern);
});

test("CoffeeDex docs and legal copy do not overstate deletion or guest scan guarantees", () => {
  // Given
  const sources = [
    ["deploy guide", read("docs/deploy.md")],
    ["api spec", read("docs/api-spec.md")],
    ["golden flows", read("docs/golden-flows.md")],
    ["privacy", read("app/legal/privacy/page.tsx")],
    ["terms", read("app/legal/terms/page.tsx")],
  ];
  const overstatedDeletionClaim =
    /automatically delete Storage objects|delete Storage objects automatically|storage-object cleanup is implemented|storage-object cleanup is promised|저장소 파일.*자동 삭제를 보장합니다/i;
  const overstatedDistributedLimitClaim =
    /distributed production rate limiting is implemented|production distributed rate limiting is implemented|분산된 사용량 보장입니다|분산된 보안 경계입니다/i;

  // When / Then
  for (const [label, source] of sources) {
    assert.doesNotMatch(source, overstatedDeletionClaim, `${label} must not promise storage cleanup`);
    assert.doesNotMatch(
      source,
      overstatedDistributedLimitClaim,
      `${label} must not promise distributed guest scan limiting`,
    );
  }

  assert.match(read("docs/deploy.md"), /does not delete Storage objects/);
  assert.match(read("docs/api-spec.md"), /does not currently promise storage-object cleanup/);
  assert.match(read("docs/golden-flows.md"), /storage-object cleanup is not promised/);
  assert.match(read("app/legal/privacy/page.tsx"), /자동 삭제까지 보장하지 않습니다/);
  assert.match(read("app/legal/terms/page.tsx"), /자동 삭제를 보장하지 않습니다/);
  assert.match(read("docs/deploy.md"), /not distributed across Vercel instances/);
  assert.match(read("docs/api-spec.md"), /not production distributed rate limiting/);
  assert.match(read("docs/golden-flows.md"), /not distributed production rate limiting/);
  assert.match(read("app/legal/privacy/page.tsx"), /여러 인스턴스 사이에서 일관되지 않을 수 있습니다/);
  assert.match(read("app/legal/terms/page.tsx"), /분산된 사용량 보장을 의미하지 않습니다/);
});

test("CoffeeDex legal copy states guest, analytics, export, and deletion boundaries", () => {
  // Given
  const privacy = read("app/legal/privacy/page.tsx");
  const terms = read("app/legal/terms/page.tsx");

  // When / Then
  assert.match(privacy, /24시간/);
  assert.match(privacy, /원본 이미지.*저장하지 않습니다/);
  assert.match(privacy, /JSON.*CSV/);
  assert.match(privacy, /분석 이벤트.*원두 사진.*향미 메모.*포함하지 않습니다/);
  assert.match(privacy, /Stripe.*비식별화/);
  assert.match(terms, /확인되지 않은 값.*비워/);
  assert.match(terms, /게스트 스캔.*서버 인스턴스/);
  assert.match(terms, /계정 삭제.*되돌릴 수 없/);
});

test("CoffeeDex contract constants no longer expose starter product surfaces", () => {
  // Given
  const contracts = read("lib/contracts.ts");

  // When / Then
  assert.doesNotMatch(
    contracts,
    /starter-saas-next-supabase|Workspace \+ RBAC|Growth Ops|Support Desk|seat counts|invite flows|billing summary|cancel subscription/i,
  );
  assert.match(contracts, /export const starterServiceName = (?:coffeeDexBrand|hyangmiBrand)\.filenameSlug/);
  assert.match(contracts, /Korean specialty coffee cards/);
  assert.match(contracts, /Rebuy Memory|rebuy memory|repurchase memory|buy-again memory/i);
  assert.match(contracts, /Rebuy List|rebuy list|repurchase list|buy-again list/i);
  assert.match(contracts, /Rebuy Intelligence|rebuy intelligence|repurchase intelligence|buy-again intelligence/i);
  assert.match(contracts, /JSON.*CSV|CSV.*JSON/);
  assert.doesNotMatch(contracts, sharePdfPrimaryPattern);
});

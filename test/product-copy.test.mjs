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

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
  assert.match(homePage, /다시 사고 싶은 커피/);
  assert.match(dashboardClient, /DashboardShelfView/);
  assert.match(quickAddMemoryForm, /빠른 기록/);
  assert.match(quickAddMemoryForm, /한국어 향미 단어/);
  assert.match(quickAddMemoryForm, /다시 살래요/);
  assert.match(tastingCard, /다시 살 이유/);
  assert.match(cardDetailModal, /마지막 좋았던 추출/);
  assert.match(feedPage, /커뮤니티 기능은 아직 현재 제품 기능이 아닙니다/);
  assert.doesNotMatch(feedPage, unsupportedCommunityClaimPattern);
  assert.match(dashboardAnalyticsPanel, /기록|스냅샷/);
  assert.match(dashboardUsagePanel, /기록|스냅샷/);
  assert.match(onboardingPage, /CoffeeDex/);
  assert.match(onboardingPage, /원두|커피/);
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
  assert.match(apiSpec, /Korean flavor helper chips/);
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
  assert.match(goldenFlows, /Korean flavor helper chips/);
  assert.match(goldenFlows, /private rebuy recall from the user's own `repurchase_reasons`/);
  assert.match(goldenFlows, /Last-good-brew recall is shown only when `footer_meta.extraInfo` contains actual brew-like metadata/);
  assert.doesNotMatch(goldenFlows, /optional brew summary|brew summary|추출 요약/i);

  assert.match(deployGuide, /Korea-first AI specialty coffee memory and artifact product/);
  assert.match(deployGuide, /future work, not deploy-time capabilities/);
  assert.doesNotMatch(deployGuide, /npm run validate:full/);
  assert.match(deployGuide, /process-local/i);
  assert.match(deployGuide, /not distributed/i);

  assert.match(marketOpportunities, /One-line quick notes remain card memory copy, not brew recall/);
  assert.match(marketOpportunities, /Private rebuy recall surfaces the user's own repurchase reason/);
  assert.match(marketOpportunities, /Last-good-brew recall stays distinct/);
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
  assert.match(contracts, /digital home-cafe archive export/);
});

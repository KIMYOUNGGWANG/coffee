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

test("Hyangmi pages present Korea-first coffee memory within the scoped product boundary", () => {
  // Given
  const homePage = read("app/page.tsx");
  const dashboardPage = read("app/dashboard/page.tsx");
  const dashboardClient = read("components/dashboard-client.tsx");
  const dashboardAnalyticsPanel = read("components/dashboard-analytics-panel.tsx");
  const dashboardUsagePanel = read("components/dashboard-usage-panel.tsx");
  const onboardingPage = read("app/onboarding/page.tsx");
  const combinedPages = [homePage, dashboardPage, dashboardClient, dashboardAnalyticsPanel, dashboardUsagePanel, onboardingPage].join("\n");

  // When / Then
  assertDoesNotShow(combinedPages, unsupportedVisibleCopyPattern, "visible pages");

  assert.match(homePage, /Korea-first Specialty Coffee Memory/);
  assert.match(homePage, /한국 스페셜티 커피/);
  assert.match(homePage, /AI 보조 테이스팅 초안/);
  assert.match(homePage, /디지털 아티팩트/);

  assert.match(dashboardClient, /한국 스페셜티 커피 아카이브/);
  assert.match(dashboardClient, /서울과 부산의 로스터리/);
  assert.match(dashboardAnalyticsPanel, /취향 지도와 리캡/);
  assert.match(dashboardUsagePanel, /기록 기반 AI 취향 리캡/);

  assert.match(onboardingPage, /Hyangmi Korea-first Onboarding/);
  assert.match(onboardingPage, /한국어 향미 단어/);
  assert.match(onboardingPage, /라벨 초안/);
});

test("Hyangmi docs mark roaster commerce and community layers as future-only", () => {
  // Given
  const apiSpec = read("docs/api-spec.md");
  const goldenFlows = read("docs/golden-flows.md");
  const deployGuide = read("docs/deploy.md");

  // When / Then
  assert.match(apiSpec, /Korea-first AI specialty coffee memory and artifact product/);
  assert.match(apiSpec, /AI-assisted scan and note drafts/);
  assert.match(apiSpec, /saved-record taste recap/);
  assert.match(apiSpec, /Future roaster partnership, referral, and community layers are not current API capabilities/);
  assert.match(apiSpec, /private Korean specialty coffee archive/);

  assert.match(goldenFlows, /Korea-first specialty coffee memory and artifact product/);
  assert.match(goldenFlows, /future product layers only/);
  assert.match(goldenFlows, /not part of the current golden flows/);

  assert.match(deployGuide, /Korea-first AI specialty coffee memory and artifact product/);
  assert.match(deployGuide, /future work, not deploy-time capabilities/);
  assert.doesNotMatch(deployGuide, /npm run validate:full/);
});

test("Hyangmi contract constants no longer expose starter product surfaces", () => {
  // Given
  const contracts = read("lib/contracts.ts");

  // When / Then
  assert.doesNotMatch(
    contracts,
    /starter-saas-next-supabase|Workspace \+ RBAC|Growth Ops|Support Desk|seat counts|invite flows|billing summary|cancel subscription/i,
  );
  assert.match(contracts, /export const starterServiceName = hyangmiBrand\.filenameSlug/);
  assert.match(contracts, /title: "Hyangmi Account"/);
  assert.match(contracts, /Korean specialty coffee cards/);
  assert.match(contracts, /digital home-cafe archive export/);
});

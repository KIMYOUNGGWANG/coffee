import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

function read(relativePath) {
  return readFileSync(path.join(projectRoot, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

function assertDependency(packageJson, dependencyName) {
  assert.ok(
    packageJson.dependencies[dependencyName] || packageJson.devDependencies[dependencyName],
    `Expected ${dependencyName} to be declared`,
  );
}

test("CoffeeDex package identity exposes the real app stack", () => {
  const packageJson = readJson("package.json");
  const providersSource = read("components/providers.tsx");
  const tastingHooksSource = read("hooks/useTastingCards.ts");
  const browserClientSource = read("lib/supabase/browser.ts");

  assert.equal(packageJson.name, "coffeedex");
  assert.equal(packageJson.description, "CoffeeDex coffee memory and repurchase companion.");
  assert.equal(packageJson.private, true);
  assert.equal(packageJson.scripts["test:smoke"], "node --test test/smoke.test.mjs");
  assert.equal(packageJson.scripts["validate:full"], "npm run test:smoke && npm run typecheck && npm run build && npm run test:e2e");
  assertDependency(packageJson, "next");
  assertDependency(packageJson, "@supabase/ssr");
  assertDependency(packageJson, "@supabase/supabase-js");
  assertDependency(packageJson, "@tanstack/react-query");
  assertDependency(packageJson, "zustand");
  assertDependency(packageJson, "tailwindcss");
  assertDependency(packageJson, "stripe");
  assertDependency(packageJson, "zod");
  assert.match(providersSource, /QueryClientProvider/);
  assert.match(tastingHooksSource, /useTastingCards/);
  assert.match(tastingHooksSource, /\/api\/v1\/cards/);
  assert.match(tastingHooksSource, /\/api\/v1\/profile\/analytics/);
  assert.match(tastingHooksSource, /\/api\/v1\/cards\/scan/);
  assert.match(browserClientSource, /createBrowserClient/);
});

test("CoffeeDex docs cover memory contracts and golden flows", () => {
  const apiSpec = read("docs/api-spec.md");
  const goldenFlows = read("docs/golden-flows.md");
  const deployGuide = read("docs/deploy.md");

  assert.match(apiSpec, /CoffeeDex API Spec/);
  assert.match(apiSpec, /recall and repurchase/i);
  assert.match(apiSpec, /\/api\/v1\/cards/);
  assert.match(apiSpec, /\/api\/v1\/cards\/ai-note/);
  assert.match(apiSpec, /\/api\/v1\/cards\/scan/);
  assert.match(apiSpec, /confidence/);
  assert.match(apiSpec, /source/);
  assert.match(apiSpec, /\/api\/v1\/profile\/analytics/);
  assert.match(apiSpec, /tasting_cards/);
  assert.match(apiSpec, /profiles/);
  assert.match(apiSpec, /`GET` \| `\/api\/v1\/export\?format=json\\\|csv`/);
  assert.match(apiSpec, /`DELETE` \| `\/api\/v1\/account`/);
  assert.match(apiSpec, /package_origin/);
  assert.match(apiSpec, /scan_source/);
  assert.match(apiSpec, /confirmed_at/);
  assert.match(apiSpec, /coverage/);
  assert.match(apiSpec, /topNotes/);
  assert.match(goldenFlows, /Flow 1\. Capture and Confirm a Coffee Memory/);
  assert.match(goldenFlows, /Flow 2\. Scan a Package into an Editable Draft/);
  assert.match(goldenFlows, /Flow 3\. Retrieve a Coffee Worth Buying Again/);
  assert.match(goldenFlows, /Flow 4\. Review a Progressive Taste Snapshot/);
  assert.match(goldenFlows, /Flow 5\. Export or Delete Owned Data/);
  assert.match(goldenFlows, /Secondary Compatibility Flow\. Share a Story Card/);
  assert.match(goldenFlows, /Secondary Compatibility Flow\. Export PDF or Purchase an Entitlement/);
  assert.match(goldenFlows, /node --test test\/brand-contract\.test\.mjs/);
  assert.match(deployGuide, /Vercel/);
  assert.match(deployGuide, /Supabase/);
  assert.match(deployGuide, /Stripe/);
  assert.match(deployGuide, /AI_API_KEY/);
  assert.match(deployGuide, /NEXT_PUBLIC_SUPABASE_URL/);
  assert.match(deployGuide, /STRIPE_WEBHOOK_SECRET/);
});

test("CoffeeDex pages and routes present the coffee memory product", () => {
  const homePage = read("app/page.tsx");
  const dashboardPage = read("app/dashboard/page.tsx");
  const dashboardClient = read("components/dashboard-client.tsx");
  const dashboardHeader = read("components/dashboard-header.tsx");
  const onboardingPage = read("app/onboarding/page.tsx");
  const layoutSource = read("app/layout.tsx");
  const cardsRoute = read("app/api/v1/cards/route.ts");
  const aiNoteRoute = read("app/api/v1/cards/ai-note/route.ts");
  const scanRoute = read("app/api/v1/cards/scan/route.ts");

  assert.match(layoutSource, /coffeeDexBrand/);
  assert.match(layoutSource, /coffeeDexBrand\.category/);
  assert.match(homePage, /CoffeeDex/);
  assert.match(homePage, /다시 사고 싶은 커피/);
  assert.match(homePage, /Fritz Ethiopia Sidama/);
  assert.match(dashboardPage, /DashboardClient/);
  assert.match(dashboardHeader, /CoffeeDex/);
  assert.match(dashboardHeader, /내 원두 아카이브/);
  assert.match(dashboardHeader, /원두 스캔/);
  assert.match(onboardingPage, /CoffeeDex/);
  assert.match(onboardingPage, /한국 스페셜티 커피/);
  assert.match(cardsRoute, /tasting_cards/);
  assert.match(cardsRoute, /metric1/);
  assert.match(cardsRoute, /metric2/);
  assert.match(cardsRoute, /metric3/);
  assert.match(aiNoteRoute, /SCA-style coffee tasting note/);
  assert.match(scanRoute, /Analyze this coffee bean package label image/);
  assert.match(scanRoute, /confidence/);
  assert.match(scanRoute, /fallback_mock/);
});

test("dashboard uses a mobile-first CoffeeDex app shell", () => {
  const dashboardClient = read("components/dashboard-client.tsx");
  const dashboardHeader = read("components/dashboard-header.tsx");
  const dashboardNavigation = read("components/dashboard-navigation.tsx");
  const dashboardScanAction = read("components/dashboard-scan-action.tsx");
  const tastingCard = read("components/TastingCard.tsx");
  const globalStyles = read("app/globals.css");

  assert.match(dashboardHeader, /CoffeeDex/);
  assert.match(dashboardHeader, /원두 스캔/);
  assert.match(dashboardNavigation, /aria-label="대시보드 주요 메뉴"/);
  assert.match(dashboardNavigation, /fixed inset-x-0 bottom-0/);
  assert.match(dashboardNavigation, /선반/);
  assert.match(dashboardNavigation, /패스포트/);
  assert.match(dashboardNavigation, /설정/);
  assert.match(dashboardScanAction, /새 원두 스캔/);
  assert.match(tastingCard, /coffee-shelf-item/);
  assert.doesNotMatch(dashboardClient, /RevenueFunnelPanel/);
  assert.match(globalStyles, /\.coffee-app-shell/);
  assert.match(globalStyles, /\.coffee-shelf-grid/);
  assert.match(globalStyles, /padding-bottom: calc\(9rem \+ env\(safe-area-inset-bottom\)\)/);
});

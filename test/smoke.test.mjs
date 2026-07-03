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

const unsupportedCommunityClaimPattern = new RegExp(
  "Discover brewing recipes and tasting notes from the CoffeeDex " + "comm" + "unity",
);

test("CoffeeDex package identity exposes the real app stack", () => {
  const packageJson = readJson("package.json");
  const providersSource = read("components/providers.tsx");
  const tastingHooksSource = read("hooks/useTastingCards.ts");
  const browserClientSource = read("lib/supabase/browser.ts");

  assert.equal(packageJson.name, "coffeedex");
  assert.equal(packageJson.description, "CoffeeDex coffee memory and repurchase companion.");
  assert.equal(packageJson.private, true);
  assert.equal(packageJson.scripts["test:smoke"], "node --test test/smoke.test.mjs");
  assert.equal(
    packageJson.scripts["test:product-truth"],
    "node --test test/product-copy.test.mjs test/smoke.test.mjs test/brand-contract.test.mjs test/brand-leak.test.mjs",
  );
  assert.equal(
    packageJson.scripts["test:routes"],
    "node --test test/profile-route.test.mjs test/export-route.test.mjs test/account-route.test.mjs test/checkout-api-contract.test.mjs test/pdf-route.test.mjs test/credit-lifecycle.test.mjs test/scan-trust.test.mjs test/memory-crud-contract.test.mjs test/dial-in-coach-route.test.mjs test/rebuy-intelligence-route.test.mjs test/stripe-webhook-idempotency.test.mjs test/subscription-lifecycle.test.mjs",
  );
  assert.equal(
    packageJson.scripts["validate:full"],
    "npm run test:product-truth && npm run test:routes && npm run typecheck && npm run build && npm run test:e2e",
  );
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
  assert.match(apiSpec, /\/api\/v1\/shelf/);
  assert.match(apiSpec, /\/api\/v1\/ai-barista/);
  assert.match(apiSpec, /\/api\/v1\/brewing-logs/);
  assert.match(apiSpec, /brewing_logs/);
  assert.match(apiSpec, /\/api\/v1\/dial-in-coach/);
  assert.match(apiSpec, /coach_snapshot/);
  assert.match(apiSpec, /too_sour \| too_bitter/);
  assert.match(apiSpec, /CoffeeShelfItem/);
  assert.match(apiSpec, /Fresh Shelf guidance is advisory product copy/);
  assert.match(apiSpec, /Quick Add Memory Mode/);
  assert.match(apiSpec, /default 20-second path/);
  assert.match(apiSpec, /private rebuy recall from `repurchase_intent` and `repurchase_reasons`/);
  assert.match(apiSpec, /last-good-brew recall requires brew-like metadata/);
  assert.doesNotMatch(apiSpec, /optional brew summary|brew summary|추출 요약/i);
  assert.match(apiSpec, /confirmed: true/);
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
  assert.match(goldenFlows, /Quick Add Memory Mode/);
  assert.match(goldenFlows, /Save a 20-Second Quick Record/);
  assert.match(goldenFlows, /private rebuy recall from the user's own `repurchase_reasons`/);
  assert.match(goldenFlows, /Last-good-brew recall is shown only when `footer_meta.extraInfo` contains actual brew-like metadata/);
  assert.doesNotMatch(goldenFlows, /optional brew summary|brew summary|추출 요약/i);
  assert.match(goldenFlows, /Flow 4\. Use Fresh Shelf Rebuy Timing/);
  assert.match(goldenFlows, /Flow 4A\. Start a Dial-in Coach Recipe/);
  assert.match(goldenFlows, /wait, drink now, finish soon, or rebuy/);
  assert.match(goldenFlows, /Flow 5\. Review a Progressive Taste Snapshot/);
  assert.match(goldenFlows, /Flow 6\. Export or Delete Owned Data/);
  assert.match(goldenFlows, /Secondary Compatibility Flow\. Share a Story Card/);
  assert.match(goldenFlows, /Secondary Compatibility Flow\. Export PDF or Purchase an Entitlement/);
  assert.match(goldenFlows, /node --test test\/brand-contract\.test\.mjs/);
  assert.match(deployGuide, /Vercel/);
  assert.match(deployGuide, /Supabase/);
  assert.match(deployGuide, /Stripe/);
  assert.match(deployGuide, /AI_API_KEY/);
  assert.match(deployGuide, /NEXT_PUBLIC_SUPABASE_URL/);
  assert.match(deployGuide, /STRIPE_WEBHOOK_SECRET/);
  assert.match(deployGuide, /Launch Rollback And Observability Checklist/);
  assert.match(deployGuide, /Local Validation Gate/);
  assert.match(deployGuide, /Production Operator Gate/);
  assert.match(deployGuide, /Failure Observability Gate/);
  assert.match(deployGuide, /Vercel.*rollback/is);
  assert.match(deployGuide, /Supabase migration status/i);
  assert.match(deployGuide, /Stripe is in test mode/i);
  assert.match(deployGuide, /stripe_events\.processing_status/);
  assert.match(deployGuide, /deleteCoffeeDexAccount/);
});

test("CoffeeDex pages and routes present the coffee memory product", () => {
  const homePage = read("app/page.tsx");
  const dashboardPage = read("app/dashboard/page.tsx");
  const dashboardClient = read("components/dashboard-client.tsx");
  const dashboardHeader = read("components/dashboard-header.tsx");
  const quickAddMemoryForm = read("components/quick-add-memory-form.tsx");
  const feedPage = read("app/feed/page.tsx");
  const onboardingPage = read("app/onboarding/page.tsx");
  const layoutSource = read("app/layout.tsx");
  const cardsRoute = read("app/api/v1/cards/route.ts");
  const aiNoteRoute = read("app/api/v1/cards/ai-note/route.ts");
  const scanRoute = read("app/api/v1/cards/scan/route.ts");
  const analyticsRoute = read("app/api/v1/analytics/route.ts");
  const supportRoute = read("app/api/v1/support/route.ts");

  assert.match(layoutSource, /coffeeDexBrand/);
  assert.match(layoutSource, /coffeeDexBrand\.category/);
  assert.match(homePage, /CoffeeDex/);
  assert.match(homePage, /다시 살 원두를/);
  assert.match(homePage, /20초 만에 기억/);
  assert.match(homePage, /Fritz Ethiopia Sidama/);
  assert.match(dashboardPage, /DashboardClient/);
  assert.match(dashboardHeader, /Private coffee room/);
  assert.match(dashboardHeader, /개인 커피룸/);
  assert.match(dashboardHeader, /내 원두 서랍/);
  assert.match(quickAddMemoryForm, /빠른 기록/);
  assert.match(quickAddMemoryForm, /기억이 사라지기 전에 원두, 로스터리, 다시 살 단서/);
  assert.match(feedPage, /커뮤니티 기능은 아직 현재 제품 기능이 아닙니다/);
  assert.doesNotMatch(feedPage, unsupportedCommunityClaimPattern);
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
  assert.match(scanRoute, /guestScanRateLimit/);
  assert.match(scanRoute, /checkRateLimit/);
  assert.match(analyticsRoute, /analyticsRateLimit/);
  assert.match(analyticsRoute, /Retry-After/);
  assert.match(supportRoute, /supportRateLimit/);
  assert.match(supportRoute, /Retry-After/);
  const legacyScanRoute = read("app/api/v1/scan/route.ts");
  assert.match(legacyScanRoute, /parseScanRequest/);
  assert.match(legacyScanRoute, /이미지는 5 MiB 이하여야 합니다/);
  assert.ok(
    legacyScanRoute.indexOf("readScanImage(body)") < legacyScanRoute.indexOf("rpc"),
    "legacy scan route should validate images before consuming scan allowance",
  );
});

test("dashboard uses a mobile-first CoffeeDex app shell", () => {
  const dashboardClient = read("components/dashboard-client.tsx");
  const dashboardHeader = read("components/dashboard-header.tsx");
  const dashboardNavigation = read("components/dashboard-navigation.tsx");
  const dashboardScanAction = read("components/dashboard-scan-action.tsx");
  const dashboardShelfView = read("components/dashboard-shelf-view.tsx");
  const coffeeShelfGrid = read("components/coffee-shelf-grid.tsx");
  const tastingCard = read("components/TastingCard.tsx");
  const globalStyles = read("app/globals.css");

  assert.match(dashboardHeader, /Private coffee room/);
  assert.match(dashboardHeader, /내 원두 서랍/);
  assert.match(dashboardNavigation, /aria-label="대시보드 주요 메뉴"/);
  assert.match(dashboardNavigation, /fixed inset-x-0 bottom-0/);
  assert.match(dashboardNavigation, /서랍/);
  assert.match(dashboardNavigation, /취향/);
  assert.match(dashboardNavigation, /설정/);
  assert.match(dashboardShelfView, /CoffeeShelfGrid/);
  assert.match(coffeeShelfGrid, /evaluateFreshShelfStatus/);
  assert.match(coffeeShelfGrid, /freshShelfStatus\.label/);
  assert.match(coffeeShelfGrid, /freshShelfStatus\.reason/);
  assert.match(coffeeShelfGrid, /getFreshShelfToneClasses/);
  assert.match(read("lib/fresh-shelf.ts"), /다시 살 타이밍/);
  assert.match(dashboardScanAction, /새 원두 스캔/);
  assert.match(tastingCard, /coffee-shelf-item/);
  assert.doesNotMatch(dashboardClient, /RevenueFunnelPanel/);
  assert.match(globalStyles, /\.coffee-app-shell/);
  assert.match(globalStyles, /\.coffee-shelf-grid/);
  assert.match(globalStyles, /padding-bottom: calc\(9rem \+ env\(safe-area-inset-bottom\)\)/);
});

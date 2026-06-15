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

test("Hyangmi package identity exposes the real app stack", () => {
  const packageJson = readJson("package.json");
  const providersSource = read("components/providers.tsx");
  const tastingHooksSource = read("hooks/useTastingCards.ts");
  const browserClientSource = read("lib/supabase/browser.ts");

  assert.equal(packageJson.name, "hyangmi");
  assert.equal(packageJson.description, "Hyangmi AI specialty coffee taste archive.");
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

test("Hyangmi docs cover tasting archive contracts and golden flows", () => {
  const apiSpec = read("docs/api-spec.md");
  const goldenFlows = read("docs/golden-flows.md");
  const deployGuide = read("docs/deploy.md");

  assert.match(apiSpec, /Hyangmi API Spec/);
  assert.match(apiSpec, /Korea-first AI specialty coffee memory and artifact product/);
  assert.match(apiSpec, /\/api\/v1\/cards/);
  assert.match(apiSpec, /\/api\/v1\/cards\/ai-note/);
  assert.match(apiSpec, /\/api\/v1\/cards\/scan/);
  assert.match(apiSpec, /confidence/);
  assert.match(apiSpec, /source/);
  assert.match(apiSpec, /\/api\/v1\/profile\/analytics/);
  assert.match(apiSpec, /tasting_cards/);
  assert.match(apiSpec, /profiles/);
  assert.match(goldenFlows, /Flow 1\. Record First Coffee Card/);
  assert.match(goldenFlows, /Flow 2\. Scan Bean Package To Draft Card/);
  assert.match(goldenFlows, /Flow 3\. Generate SCA Tasting Note/);
  assert.match(goldenFlows, /Flow 4\. Review Taste Analytics Dashboard/);
  assert.match(goldenFlows, /Flow 5\. Share Story Card/);
  assert.match(goldenFlows, /Flow 6\. Export Home Cafe PDF/);
  assert.match(goldenFlows, /node --test test\/smoke\.test\.mjs/);
  assert.match(deployGuide, /Vercel/);
  assert.match(deployGuide, /Supabase/);
  assert.match(deployGuide, /Stripe/);
  assert.match(deployGuide, /AI_API_KEY/);
  assert.match(deployGuide, /NEXT_PUBLIC_SUPABASE_URL/);
  assert.match(deployGuide, /STRIPE_WEBHOOK_SECRET/);
});

test("Hyangmi pages and routes present the taste archive product", () => {
  const homePage = read("app/page.tsx");
  const dashboardPage = read("app/dashboard/page.tsx");
  const dashboardClient = read("components/dashboard-client.tsx");
  const onboardingPage = read("app/onboarding/page.tsx");
  const layoutSource = read("app/layout.tsx");
  const cardsRoute = read("app/api/v1/cards/route.ts");
  const aiNoteRoute = read("app/api/v1/cards/ai-note/route.ts");
  const scanRoute = read("app/api/v1/cards/scan/route.ts");

  assert.match(layoutSource, /hyangmiBrand/);
  assert.match(layoutSource, /hyangmiBrand.category/);
  assert.match(homePage, /Hyangmi/);
  assert.match(homePage, /Korea-first Specialty Coffee Memory/);
  assert.match(homePage, /Fritz Ethiopia Sidama/);
  assert.match(dashboardPage, /DashboardClient/);
  assert.match(dashboardClient, /Hyangmi Taste Archive/);
  assert.match(dashboardClient, /한국 스페셜티 커피 아카이브/);
  assert.match(dashboardClient, /새로운 카드 기록하기/);
  assert.match(onboardingPage, /Hyangmi/);
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

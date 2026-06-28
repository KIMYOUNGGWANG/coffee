import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import type { Page, Route } from "@playwright/test";

const evidenceDirectory = ".omo/evidence";
const screenshotPaths = {
  home: `${evidenceDirectory}/task-T8-home.png`,
  dashboard: `${evidenceDirectory}/task-T8-dashboard.png`,
  onboarding: `${evidenceDirectory}/task-T8-onboarding.png`,
} as const;

function escapeRegExp(value: string): string {
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
] as const;
const unsupportedVisibleCopyPattern = new RegExp(
  unsupportedVisibleCopyTerms.map(escapeRegExp).join("|"),
  "i",
);

const emptyCardsResponse = { data: [] } as const;
const profileResponse = {
  data: {
    credits: 1,
    has_pdf_access: false,
    is_premium: false,
    monthly_scan_limit: 5,
    scans_used: 0,
  },
} as const;
const analyticsResponse = {
  data: {
    aiAnalysis: "",
    averageAcidity: 0,
    averageBody: 0,
    averageSweetness: 0,
    topTags: [],
    totalCards: 0,
  },
} as const;
const subscriptionResponse = {
  data: {
    cancelAtPeriodEnd: false,
    currentPeriodEnd: null,
    isPremium: false,
    lastInvoiceStatus: null,
    plan: "free",
    status: "inactive",
    stripeSubscriptionId: null,
    updatedAt: null,
  },
} as const;

async function fulfillJson(route: Route, body: unknown): Promise<void> {
  await route.fulfill({
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

async function mockDashboardApiRoutes(page: Page): Promise<void> {
  await page.route("**/api/v1/**", async (route) => {
    const pathname = new URL(route.request().url()).pathname;

    switch (pathname) {
      case "/api/v1/cards":
        await fulfillJson(route, emptyCardsResponse);
        return;
      case "/api/v1/coffee-dna":
        console.log("MOCK HIT: /api/v1/coffee-dna");
        await fulfillJson(route, {
          data: {
            totalBeans: 0,
            averageRating: null,
            wantAgainRate: 0,
            topOrigins: [],
            topRoasters: [],
            tasteProfile: null,
            typeLabel: "기록이 부족합니다",
          },
        });
        return;
      case "/api/v1/profile":
        await fulfillJson(route, profileResponse);
        return;
      case "/api/v1/profile/analytics":
        await fulfillJson(route, analyticsResponse);
        return;
      case "/api/v1/subscription":
        await fulfillJson(route, subscriptionResponse);
        return;
      case "/api/v1/analytics":
        await fulfillJson(route, { received: true });
        return;
      case "/api/v1/shelf":
        await fulfillJson(route, { data: [] });
        return;
      default:
        await route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({ error: { message: `Unhandled test route: ${pathname}` } }),
        });
    }
  });

  await page.route("**/auth/v1/user*", async (route) => {
    await fulfillJson(route, { id: "test-user-id", aud: "authenticated", role: "authenticated" });
  });

  await page.route("**/rest/v1/tasting_cards*", async (route) => {
    await fulfillJson(route, []);
  });

  await page.addInitScript(() => {
    const originalGetItem = window.localStorage.getItem;
    window.localStorage.getItem = function(key) {
      if (key === 'mock_test_mode') return 'true';
      return originalGetItem.call(window.localStorage, key);
    };
  });

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
}

async function expectNoUnsupportedVisibleCopy(page: Page): Promise<void> {
  await expect(page.locator("body")).not.toContainText(unsupportedVisibleCopyPattern);
}

async function captureEvidenceScreenshot(page: Page, path: string): Promise<void> {
  await mkdir(evidenceDirectory, { recursive: true });
  await page.screenshot({ caret: "initial", path, fullPage: true });
  console.log(`screenshot=${path}`);
}

test.describe("CoffeeDex product copy", () => {
  test("positions the home page as Korean specialty coffee memory", async ({ page }) => {
    // Given / When
    await page.goto("/");

    // Then
    await expect(page.getByText("Korea-first Specialty Coffee Memory")).toBeVisible();
    await expect(page.getByRole("heading", { name: /한국 스페셜티 커피를/ })).toBeVisible();
    await expect(page.getByText("원두 라벨 스캔 초안")).toBeVisible();
    await expect(page.getByText("디지털 진열장에 쌓이는 미각 아카이브")).toBeVisible();
    await expect(page.getByRole("link", { name: "Taste Finder 시작" })).toHaveAttribute("href", "/onboarding");
    await expect(page.getByRole("link", { name: /30초 Taste Finder로 시작/ })).toHaveAttribute("href", "/onboarding");
    await expectNoUnsupportedVisibleCopy(page);
    await captureEvidenceScreenshot(page, screenshotPaths.home);
  });

  test("routes cold-start visitors from home into Taste Finder onboarding", async ({ page }) => {
    // Given / When
    await page.goto("/");
    await page.getByRole("link", { name: /30초 Taste Finder로 시작/ }).click();

    // Then
    await expect(page).toHaveURL("/onboarding");
    await expect(page.getByText("30-second Taste Finder")).toBeVisible();
    await expect(page.getByRole("heading", { name: "오늘의 취향은 어떤 방향인가요?" })).toBeVisible();
    await expect(page.getByText("첫 Taste Card 미리보기")).toBeVisible();
    await expect(page).not.toHaveURL(/\/auth|\/dashboard/);
  });

  test("keeps the dashboard scoped to archive, assisted notes, and recap", async ({ page }) => {
    // Given
    await mockDashboardApiRoutes(page);

    // When
    await page.goto("/dashboard");

    // Then
    await expect(page.getByRole("heading", { name: "향미 선반" })).toBeVisible();
    await expect(page.getByText("내 원두 아카이브")).toBeVisible();
    await expect(page.getByText("기록한 원두들을 찬장에 진열해 보세요")).toBeVisible();
    await expect(page.getByText("Taste Passport", { exact: true })).toBeVisible();
    await expect(page.getByText("오늘의 향미 프로필")).toBeVisible();
    await expect(page.getByText("취향 지도")).toBeVisible();
    await expect(page.getByText("PDF 테이스팅북 내보내기 혜택")).toHaveCount(0);
    await expectNoUnsupportedVisibleCopy(page);
    await captureEvidenceScreenshot(page, screenshotPaths.dashboard);
  });

  test("guides onboarding with Korean roaster and vocabulary cues", async ({ page }) => {
    // Given / When
    await page.goto("/onboarding");

    // Then
    await expect(page.getByText("Private espresso concierge")).toBeVisible();
    await expect(page.getByRole("heading", { name: "오늘의 취향으로 첫 기록을 시작해요" })).toBeVisible();
    await expect(page.getByText("밝은 산미")).toBeVisible();
    await expect(page.getByText("달콤한 균형")).toBeVisible();
    await expect(page.getByText("묵직한 바디")).toBeVisible();
    await expect(page.getByText("첫 Taste Card 미리보기")).toBeVisible();
    await expectNoUnsupportedVisibleCopy(page);
    await captureEvidenceScreenshot(page, screenshotPaths.onboarding);
  });
});

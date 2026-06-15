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
      default:
        await route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({ error: { message: `Unhandled test route: ${pathname}` } }),
        });
    }
  });
}

async function expectNoUnsupportedVisibleCopy(page: Page): Promise<void> {
  await expect(page.locator("body")).not.toContainText(unsupportedVisibleCopyPattern);
}

async function captureEvidenceScreenshot(page: Page, path: string): Promise<void> {
  await mkdir(evidenceDirectory, { recursive: true });
  await page.screenshot({ caret: "initial", path, fullPage: true });
  console.log(`screenshot=${path}`);
}

test.describe("Hyangmi product copy", () => {
  test("positions the home page as Korean specialty coffee memory", async ({ page }) => {
    // Given / When
    await page.goto("/");

    // Then
    await expect(page.getByText("Korea-first Specialty Coffee Memory")).toBeVisible();
    await expect(page.getByRole("heading", { name: /한국 스페셜티 커피를/ })).toBeVisible();
    await expect(page.getByText("AI 보조 테이스팅 초안")).toBeVisible();
    await expect(page.getByText("디지털 아티팩트")).toBeVisible();
    await expectNoUnsupportedVisibleCopy(page);
    await captureEvidenceScreenshot(page, screenshotPaths.home);
  });

  test("keeps the dashboard scoped to archive, assisted notes, and recap", async ({ page }) => {
    // Given
    await mockDashboardApiRoutes(page);

    // When
    await page.goto("/dashboard");

    // Then
    await expect(page.getByText("한국 스페셜티 커피 아카이브")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Hyangmi Taste Archive" })).toBeVisible();
    await expect(page.getByText("취향 지도와 리캡")).toBeVisible();
    await expect(page.getByText("기록 기반 AI 취향 리캡")).toBeVisible();
    await expect(page.getByText("공유 카드 내보내기")).toBeVisible();
    await expect(page.getByText("PDF 테이스팅북 내보내기 혜택")).toHaveCount(0);
    await expectNoUnsupportedVisibleCopy(page);
    await captureEvidenceScreenshot(page, screenshotPaths.dashboard);
  });

  test("guides onboarding with Korean roaster and vocabulary cues", async ({ page }) => {
    // Given / When
    await page.goto("/onboarding");

    // Then
    await expect(page.getByText("Hyangmi Korea-first Onboarding")).toBeVisible();
    await expect(page.getByRole("heading", { name: "첫 한국 스페셜티 커피 기억을 기록할 준비" })).toBeVisible();
    await expect(page.getByText("한국어 향미 단어")).toBeVisible();
    await expect(page.getByText("패키지 스캔 초안")).toBeVisible();
    await expectNoUnsupportedVisibleCopy(page);
    await captureEvidenceScreenshot(page, screenshotPaths.onboarding);
  });
});

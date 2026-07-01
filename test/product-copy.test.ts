import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import type { Page, Route } from "@playwright/test";

const evidenceDirectory = ".omo/evidence";
const screenshotPaths = {
  home: `${evidenceDirectory}/task-T8-home.png`,
  auth: `${evidenceDirectory}/task-T8-auth.png`,
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
      case "/api/v1/rebuy-intelligence":
        await fulfillJson(route, {
          data: {
            generatedAt: "2026-06-29T00:00:00.000Z",
            summary: "아직 기록이 부족해 다음 재구매 행동을 준비하는 중입니다.",
            featureScores: [
              {
                feature: "rebuy_reminder",
                roi: 72,
                retention: 80,
                painkiller: 76,
                monetization: 60,
                difficulty: 24,
                reason: "원두 기록이 생기면 다시 살 타이밍을 알려줍니다.",
              },
            ],
            rebuyReminder: {
              title: "첫 원두를 기다리는 중",
              subtitle: "Fresh Shelf",
              reason: "원두를 등록하면 다시 살 시점을 계산합니다.",
              actionLabel: "첫 원두 등록",
              priority: "low",
              cardId: null,
              shelfItemId: null,
            },
            tasteMatch: {
              anchorCardId: null,
              anchorTitle: "첫 기록",
              matchCardId: null,
              matchTitle: "취향 기준 만들기",
              sharedTags: [],
              reason: "좋았던 카드가 생기면 다음 구매 기준을 만듭니다.",
              searchPrompt: "좋았던 원두와 비슷한 커피",
            },
            purchaseMemory: {
              title: "구매 단서 없음",
              subtitle: "Bag Scan",
              source: "manual",
              searchUrl: "https://www.google.com/search?q=coffee+beans",
              reason: "봉투나 로스터 정보를 저장하면 다시 찾기 쉬워집니다.",
              cardId: null,
              shelfItemId: null,
            },
            brewFailureMemory: {
              title: "다음 컵을 위한 실패 기억",
              subtitle: "Brew Failure Memory",
              problem: "unknown",
              adjustment: "맛이 아쉬웠던 이유를 남기면 다음 조정값을 제안합니다.",
              evidence: "아직 실패 로그가 없습니다.",
              logId: null,
              shelfItemId: null,
            },
          },
        });
        return;
      case "/api/v1/dial-in-coach":
        await fulfillJson(route, {
          data: {
            generatedAt: "2026-06-29T00:00:00.000Z",
            selectedShelfItemId: null,
            title: "첫 원두를 기다리는 중",
            subtitle: "Fresh Shelf",
            problem: "원두를 등록하면 첫 컵 시작 레시피를 제안합니다.",
            recipe: {
              method: "V60",
              coffeeAmount: 15,
              waterAmount: 240,
              waterTemp: 93,
              grindSize: "Medium Fine",
              brewTime: "2:45",
              ratioLabel: "1:16",
            },
            grindMemory: {
              title: "아직 고정된 분쇄도 기억이 없어요",
              subtitle: "좋았던 컵에 별점 4점 이상을 남기면 다음부터 바로 불러옵니다.",
              method: null,
              grindSize: null,
              coffeeAmount: null,
              waterAmount: null,
              waterTemp: null,
              brewTime: null,
              rating: null,
              brewedAt: null,
            },
            adjustments: [],
            evidence: [],
            suggestedLog: {
              shelfItemId: null,
              method: "V60",
              parameters: {
                method: "V60",
                coffeeAmount: 15,
                waterAmount: 240,
                waterTemp: 93,
                grindSize: "Medium Fine",
                brewTime: "2:45",
                ratioLabel: "1:16",
              },
              simpleNote: "Dial-in Coach 시작 레시피",
              coachSnapshot: {
                source: "dial_in_coach",
                title: "첫 원두를 기다리는 중",
                generatedAt: "2026-06-29T00:00:00.000Z",
                evidence: [],
              },
            },
          },
        });
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
    await expect(page.getByText("재구매 기억과 다음 행동")).toBeVisible();
    await expect(page.getByText("CoffeeDex 컵 노트를 지금 직접 테스트해 보세요")).toBeVisible();
    await expect(page.getByText("디지털 진열장에 쌓이는 미각 아카이브")).toBeVisible();
    await expect(page.getByRole("link", { name: "Taste Finder 시작" })).toHaveAttribute("href", "/onboarding");
    await expect(page.getByRole("link", { name: /30초 Taste Finder로 시작/ })).toHaveAttribute("href", "/onboarding");
    await expectNoUnsupportedVisibleCopy(page);
    await captureEvidenceScreenshot(page, screenshotPaths.home);
  });

  test("renders the auth gate as a complete mobile coffee-room screen", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto("/auth?redirect=/dashboard");

    await expect(page.getByTestId("auth-gate-ready")).toBeVisible();
    await expect(page.getByRole("heading", { name: "CoffeeDex 계정으로 계속하기" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Google로 계속하기" })).toBeVisible();
    await expect(page.locator("body")).not.toContainText(/로그인 후 이동|source=onboarding|mode=quick/i);

    const metrics = await page.evaluate(() => ({
      bodyBackground: window.getComputedStyle(document.body).backgroundColor,
      hasHorizontalOverflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) > window.innerWidth,
      mainHeight: document.querySelector("main")?.getBoundingClientRect().height ?? 0,
      viewportHeight: window.innerHeight,
    }));

    expect(metrics.hasHorizontalOverflow).toBe(false);
    expect(metrics.mainHeight).toBeGreaterThanOrEqual(metrics.viewportHeight - 1);
    expect(metrics.bodyBackground).not.toBe("rgb(0, 0, 0)");
    await captureEvidenceScreenshot(page, screenshotPaths.auth);
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
    await expect(page.getByText("내 원두 아카이브")).toBeVisible();
    await expect(page.getByText("개인 커피룸")).toBeVisible();
    await expect(page.getByText("기억한 맛, 지금 가진 원두, 다음 구매 신호를 한 화면에서 이어봅니다.")).toBeVisible();
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

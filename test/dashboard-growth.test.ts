import { expect, test } from "@playwright/test";
import type { Page, Route } from "@playwright/test";

const emptyCardsResponse = { data: [] } as const;
const savedCardsResponse = {
  data: [
    {
      ai_description: "복숭아와 꿀의 단맛이 이어지는 컵.",
      badges: ["Washed", "V60"],
      category: "coffee",
      created_at: "2026-06-14T01:23:45.000Z",
      footer_meta: { date: "2026.06.14", origin: "Ethiopia Guji" },
      id: "growth-card-001",
      image_url: null,
      is_public: false,
      metric1: 4,
      metric2: 5,
      metric3: 3,
      subtitle: "프릳츠 커피",
      tags: ["peach", "honey"],
      title: "Ethiopia Guji",
      updated_at: "2026-06-14T01:23:45.000Z",
      user_id: "user-growth-001",
    },
  ],
} as const;
const profileResponse = {
  data: {
    credits: 2,
    has_pdf_access: false,
    is_premium: false,
    monthly_scan_limit: 5,
    scans_used: 3,
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
const premiumSubscriptionResponse = {
  data: {
    cancelAtPeriodEnd: false,
    currentPeriodEnd: "2026-07-15",
    isPremium: true,
    lastInvoiceStatus: "paid",
    plan: "premium",
    status: "active",
    stripeSubscriptionId: "sub_growth_001",
    updatedAt: "2026-06-15T00:00:00.000Z",
  },
};

async function fulfillJson(route: Route, body: unknown): Promise<void> {
  await route.fulfill({
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

async function mockDashboardApiRoutes(
  page: Page,
  cardsResponse: unknown = emptyCardsResponse,
  subscriptionSummary: unknown = subscriptionResponse,
): Promise<void> {
  await page.route("**/api/v1/**", async (route) => {
    const pathname = new URL(route.request().url()).pathname;

    switch (pathname) {
      case "/api/v1/cards":
        await fulfillJson(route, cardsResponse);
        return;
      case "/api/v1/profile":
        await fulfillJson(route, profileResponse);
        return;
      case "/api/v1/profile/analytics":
        await fulfillJson(route, analyticsResponse);
        return;
      case "/api/v1/subscription":
        await fulfillJson(route, subscriptionSummary);
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

test.describe("CoffeeDex growth dashboard", () => {
  test("turns the empty state into a first-record activation path", async ({ page }) => {
    // Given
    await mockDashboardApiRoutes(page);

    // When
    await page.goto("/dashboard");

    // Then
    await expect(page.getByText("60초 안에 첫 원두 기록")).toBeVisible();
    await expect(page.getByText("오늘의 다음 행동")).toBeVisible();
    await expect(page.getByText("무료 Taste Card", { exact: true })).toBeVisible();
    await expect(page.getByText("CoffeeDex Premium")).toBeVisible();
    await expect(page.getByText("Taste Passport", { exact: true }).last()).toBeVisible();
    await expect(page.getByRole("button", { name: "첫 Taste Card 만들기" })).toBeVisible();
    await expect(page.getByText("샘플 테이스팅 카드")).toBeVisible();
    await expect(page.getByRole("button", { name: "봉투 사진으로 첫 카드 만들기" })).toBeVisible();
  });

  test("promotes sharing after the first card exists", async ({ page }) => {
    // Given
    await mockDashboardApiRoutes(page, savedCardsResponse);

    // When
    await page.goto("/dashboard");

    // Then
    await expect(page.getByText("공유 링크 만들기")).toBeVisible();
    await expect(page.getByRole("button", { name: "최근 카드 공유하기" })).toBeVisible();
    await page.getByRole("button", { name: "최근 카드 공유하기" }).click();
    await expect(page.getByRole("dialog").getByText("인스타그램 스토리 공유")).toBeVisible();
  });

  test("shows scan allowance, credits, and roaster memory status", async ({ page }) => {
    // Given
    await mockDashboardApiRoutes(page);

    // When
    await page.goto("/dashboard");

    // Then
    await expect(page.getByText("무료 AI 스캔 3 / 5")).toBeVisible();
    await expect(page.getByText("보유 크레딧 2개")).toBeVisible();
    await expect(page.getByText("PDF 기록북 미보유")).toBeVisible();
    await expect(page.getByText("아직 로스터 기록 없음")).toBeVisible();
  });

  test("shows compact billing plan and current period metadata", async ({ page }) => {
    // Given
    await mockDashboardApiRoutes(page, emptyCardsResponse, premiumSubscriptionResponse);

    // When
    await page.goto("/dashboard");

    // Then
    await expect(page.getByText("플랜 Premium")).toBeVisible();
    await expect(page.getByText("현재 기간 종료 2026년 7월 15일")).toBeVisible();
    await expect(page.getByText("최근 청구서 결제 완료")).toBeVisible();
    await expect(page.getByText("취소 예약 아니오")).toBeVisible();
    await expect(page.getByText("마지막 동기화 2026년 6월 15일")).toBeVisible();
  });
});

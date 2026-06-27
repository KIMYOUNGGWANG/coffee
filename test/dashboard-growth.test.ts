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
      footer_meta: { date: "2026.06.14", origin: "Ethiopia Guji", extraInfo: "V60 · 15g:250g · 92C" },
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
      package_origin: "Ethiopia Guji",
      package_process: "Washed",
      repurchase_intent: "again",
      repurchase_reasons: ["복숭아 단맛"],
      scan_source: "manual",
      scan_confidence: null,
      corrected_fields: [],
      confirmed_at: "2026-06-14T01:23:45.000Z",
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
      case "/api/v1/coffee-dna":
        const cardCount = typeof cardsResponse === "object" && cardsResponse !== null && "data" in cardsResponse && Array.isArray((cardsResponse as any).data) ? (cardsResponse as any).data.length : 0;
        await fulfillJson(route, {
          data: {
            totalBeans: cardCount,
            averageRating: cardCount > 0 ? 4.5 : null,
            wantAgainRate: cardCount > 0 ? 100 : 0,
            topOrigins: cardCount > 0 ? [{ origin: "Ethiopia", count: 1 }] : [],
            topRoasters: cardCount > 0 ? [{ roaster: "Fritz Coffee", count: 1 }] : [],
            tasteProfile: cardCount > 0 ? { acidity: 4, sweetness: 5, body: 3 } : null,
            typeLabel: cardCount > 0 ? "산뜻한 과일향 타입" : "기록이 부족합니다",
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
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });

    // Then
    await expect(page.getByText("20초 안에 첫 기록")).toBeVisible();
    await expect(page.getByText("첫 원두를 선반에 올려보세요.")).toBeVisible();
    await expect(page.getByRole("button", { name: "원두 패키지 스캔하기" })).toBeVisible();
  });

  test("quick add 빠른 기록 opens a one-screen Korean flavor memory path", async ({ page }) => {
    // Given
    await mockDashboardApiRoutes(page);

    // When
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });

    // Then
    const quickAddButton = page.getByRole("button", { name: /빠른 기록|빠른 커피 기록/ });
    await expect(quickAddButton).toBeVisible();
    await quickAddButton.click();
    await expect(page.getByText(/한국어 향미|향미 단어/)).toBeVisible();
  });

  test("quick add private rebuy recall shows the saved reason and last-good-brew cue", async ({ page }) => {
    // Given
    await mockDashboardApiRoutes(page, savedCardsResponse);

    // When
    await page.goto("/dashboard");

    // Then
    await expect(page.getByRole("heading", { name: "Ethiopia Guji" })).toBeVisible();
    await expect(page.getByText(/다시 살 이유|재구매 이유/)).toBeVisible();
    await expect(page.getByText("복숭아 단맛")).toBeVisible();
    await page.getByRole("button", { name: "Ethiopia Guji 상세 보기" }).click();
    await expect(page.getByText(/마지막 좋았던 추출|좋았던 추출/)).toBeVisible();
    await expect(page.getByText("V60 · 15g:250g · 92C")).toBeVisible();
  });

  test("promotes sharing after the first card exists", async ({ page }) => {
    // Given
    await mockDashboardApiRoutes(page, savedCardsResponse);

    // When
    await page.goto("/dashboard");

    // Then
    await expect(page.getByRole("heading", { name: "Ethiopia Guji" })).toBeVisible();
    await page.getByRole("button", { name: "Ethiopia Guji 공유" }).click();
    await expect(page.getByRole("dialog").getByText("인스타그램 스토리 공유")).toBeVisible();
  });

  test("shows scan allowance, credits, and roaster memory status", async ({ page }) => {
    // Given
    await mockDashboardApiRoutes(page);

    // When
    await page.goto("/settings");

    // Then
    await expect(page.getByRole("heading", { name: "기록과 온보딩 건강도" })).toBeVisible();
    await expect(page.getByText("게스트 저장 흐름 점검")).toBeVisible();
    await expect(page.getByText("무료 AI 스캔 3 / 5")).toBeVisible();
    await expect(page.getByText("보유 크레딧 2개")).toBeVisible();
    await expect(page.getByText("PDF 기록북 미보유")).toBeVisible();
  });

  test("shows compact billing plan and current period metadata", async ({ page }) => {
    // Given
    await mockDashboardApiRoutes(page, emptyCardsResponse, premiumSubscriptionResponse);

    // When
    await page.goto("/settings");

    // Then
    await expect(page.getByText("플랜 Premium")).toBeVisible();
    await expect(page.getByText("현재 기간 종료 2026년 7월 15일")).toBeVisible();
    await expect(page.getByText("최근 청구서 결제 완료")).toBeVisible();
    await expect(page.getByText("취소 예약 아니오")).toBeVisible();
    await expect(page.getByText("마지막 동기화 2026년 6월 15일")).toBeVisible();
  });
});

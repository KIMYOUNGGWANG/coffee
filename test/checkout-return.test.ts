import { expect, test } from "@playwright/test";
import type { Page, Route } from "@playwright/test";

const checkoutReturnScreenshotPath = ".omo/evidence/task-T5-checkout-return.png";

const emptyCardsResponse = { data: [] } as const;
const profileResponse = {
  data: {
    credits: 0,
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

test.describe("checkout return UX", () => {
  test("shows a PDF success notice when checkout returns from PDF purchase", async ({ page }) => {
    // Given
    await mockDashboardApiRoutes(page);

    // When
    await page.goto("/dashboard?checkout_status=success&item_type=pdf_book");

    // Then
    const notice = page.getByTestId("checkout-return-notice");
    await expect(notice).toContainText("PDF 테이스팅북 구매가 완료되었습니다");
    await expect(notice).toContainText("프로필과 카드 정보를 새로 확인했어요");
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.screenshot({ path: checkoutReturnScreenshotPath, fullPage: true });

    await page.getByRole("button", { name: "체크아웃 알림 닫기" }).click();
    await expect(notice).toHaveCount(0);
  });

  test("shows a cancellation notice when checkout is canceled", async ({ page }) => {
    // Given
    await mockDashboardApiRoutes(page);

    // When
    await page.goto("/dashboard?checkout_status=cancel");

    // Then
    const notice = page.getByTestId("checkout-return-notice");
    await expect(notice).toContainText("결제가 취소되었습니다");
    await expect(notice).toContainText("구독이나 PDF 권한은 변경되지 않았습니다");
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("shows a credit top-up success notice when checkout returns from credits purchase", async ({ page }) => {
    // Given
    await mockDashboardApiRoutes(page);

    // When
    await page.goto("/dashboard?checkout_status=success&item_type=credits_10");

    // Then
    const notice = page.getByTestId("checkout-return-notice");
    await expect(notice).toContainText("Hyangmi 테이스팅 10팩 충전이 완료되었습니다");
    await expect(notice).toContainText("추가 AI 스캔 크레딧");
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("does not show checkout notice for unrelated query params", async ({ page }) => {
    // Given
    await mockDashboardApiRoutes(page);

    // When
    await page.goto("/dashboard?utm_source=qa");

    // Then
    await expect(page.getByTestId("checkout-return-notice")).toHaveCount(0);
  });
});

import { expect, test } from "@playwright/test";

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
const loginRequiredResponse = {
  error: {
    code: 401,
    message: "로그인이 필요한 서비스입니다.",
  },
} as const;

test.describe("PaymentDialog checkout honesty", () => {
  test("shows only lifecycle-safe products from the dashboard payment entry", async ({ page }) => {
    await page.route("**/api/v1/cards", async (route) => {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify(emptyCardsResponse),
      });
    });
    await page.route("**/api/v1/profile/analytics", async (route) => {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify(analyticsResponse),
      });
    });
    await page.route("**/api/v1/profile", async (route) => {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify(profileResponse),
      });
    });
    await page.route("**/api/v1/subscription", async (route) => {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify(subscriptionResponse),
      });
    });
    await page.route("**/api/v1/analytics", async (route) => {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ received: true }),
      });
    });

    await page.goto("/dashboard");
    await page.getByRole("button", { name: "월 $3.99로 구독하기" }).click();

    const dialog = page.getByRole("dialog", { name: "프리미엄 커피 도서관 패키지" });
    await expect(dialog.getByText("Hyangmi Premium 구독 (월간)")).toBeVisible();
    await expect(dialog.getByText("$3.99")).toBeVisible();
    await expect(dialog.getByText("Hyangmi 테이스팅 10팩 충전")).toBeVisible();
    await expect(dialog.getByText("$4.99")).toBeVisible();
    await expect(dialog.getByText("홈카페 테이스팅북 PDF")).toBeVisible();
    await expect(dialog.getByText("$9.99")).toBeVisible();

    await expect(dialog.getByText(/테마 10종|스킨 10종|프리미엄 카드 스킨/)).toHaveCount(0);
    await expect(dialog.getByText("인쇄용 결산 대형 포스터")).toHaveCount(0);
    await expect(dialog.getByText("$19.99")).toHaveCount(0);
    await expect(dialog.getByText("MOCK")).toHaveCount(0);
  });

  test("routes checkout auth failures through the auth gate with product intent", async ({ page }) => {
    let checkoutCalls = 0;

    await page.route("**/api/v1/**", async (route) => {
      const pathname = new URL(route.request().url()).pathname;

      switch (pathname) {
        case "/api/v1/cards":
          await route.fulfill({
            contentType: "application/json",
            body: JSON.stringify(emptyCardsResponse),
          });
          return;
        case "/api/v1/profile/analytics":
          await route.fulfill({
            contentType: "application/json",
            body: JSON.stringify(analyticsResponse),
          });
          return;
        case "/api/v1/profile":
          await route.fulfill({
            contentType: "application/json",
            body: JSON.stringify(profileResponse),
          });
          return;
        case "/api/v1/subscription":
          await route.fulfill({
            contentType: "application/json",
            body: JSON.stringify(subscriptionResponse),
          });
          return;
        case "/api/v1/checkout":
          checkoutCalls += 1;
          await route.fulfill({
            status: 401,
            contentType: "application/json",
            body: JSON.stringify(loginRequiredResponse),
          });
          return;
        case "/api/v1/analytics":
          await route.fulfill({
            contentType: "application/json",
            body: JSON.stringify({ received: true }),
          });
          return;
        default:
          await route.fulfill({
            status: 404,
            contentType: "application/json",
            body: JSON.stringify({ error: { message: `Unhandled test route: ${pathname}` } }),
          });
      }
    });

    await page.goto("/dashboard?checkout_intent=premium_subscription");
    await expect(page.getByRole("dialog", { name: "프리미엄 커피 도서관 패키지" })).toBeVisible();
    await expect(page.getByText("로그인 후 이어서 결제할 상품: Hyangmi Premium 구독 (월간)")).toBeVisible();
    expect(checkoutCalls).toBe(0);

    await page.getByRole("button", { name: "구독하기", exact: true }).click();

    await expect(page).toHaveURL(
      `/auth?redirect=${encodeURIComponent("/dashboard?checkout_intent=premium_subscription")}`,
    );
    expect(checkoutCalls).toBe(1);
  });
});

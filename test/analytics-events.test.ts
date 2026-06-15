import { expect, test } from "@playwright/test";
import type { Page, Route } from "@playwright/test";

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

async function mockDashboardRoutes(page: Page, eventNames: string[]): Promise<void> {
  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;

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
      case "/api/v1/analytics": {
        const body = request.postDataJSON() as { readonly eventName?: string };
        if (typeof body.eventName === "string") {
          eventNames.push(body.eventName);
        }
        await fulfillJson(route, { received: true });
        return;
      }
      default:
        await route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({ error: { message: `Unhandled test route: ${pathname}` } }),
        });
    }
  });
}

test.describe("Hyangmi analytics events", () => {
  test("tracks dashboard view and first-card CTA intent", async ({ page }) => {
    // Given
    const eventNames: string[] = [];
    await mockDashboardRoutes(page, eventNames);

    // When
    await page.goto("/dashboard");
    await expect(page.getByTestId("dashboard-ready")).toBeVisible();
    await page.getByRole("button", { name: "봉투 사진으로 첫 카드 만들기" }).click();

    // Then
    await expect.poll(() => eventNames).toContain("dashboard_view");
    await expect.poll(() => eventNames).toContain("first_card_cta_clicked");
  });
});

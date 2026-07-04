import { expect, test } from "@playwright/test";
import type { Page, Route } from "@playwright/test";
import { analyticsEventNames } from "../lib/analytics-events";

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

const legacyEventNames = [
  "landing_view",
  "pricing_viewed",
  "pricing_cta_clicked",
  "dashboard_view",
  "first_card_cta_clicked",
  "paywall_opened",
  "checkout_started",
  "checkout_failed",
  "subscription_status_viewed",
  "billing_support_started",
  "support_request_submitted",
  "story_downloaded",
  "story_share_started",
  "public_share_link_copied",
  "public_card_view",
  "public_card_cta_clicked",
] as const;

const memoryEventNames = [
  "scan_started",
  "scan_result_returned",
  "scan_failed",
  "oauth_failed",
  "card_save_failed",
  "shelf_save_failed",
  "brewing_log_save_failed",
  "checkout_webhook_failed",
  "scan_field_edited",
  "draft_confirmed",
  "card_saved",
  "archive_viewed",
  "archive_searched",
  "second_bag_recorded",
  "third_bag_recorded",
  "share_card_clicked",
  "ai_scan_success",
  "rebuy_action_saved",
] as const;

test("pins legacy commerce/share and validated-memory event names", () => {
  expect(analyticsEventNames).toEqual([...legacyEventNames, ...memoryEventNames]);
});

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

test.describe("CoffeeDex analytics events", () => {
  test("tracks dashboard view and first-card CTA intent", async ({ page }) => {
    // Given
    const eventNames: string[] = [];
    await mockDashboardRoutes(page, eventNames);
    await page.addInitScript(() => {
      window.localStorage.setItem("coffeedex_analytics_test", "true");
    });

    // When
    await page.goto("/dashboard");
    await expect(page.getByTestId("dashboard-ready")).toBeVisible();
    await page.getByRole("button", { name: "20초 기록 시작" }).click();

    // Then
    await expect.poll(() => eventNames).toContain("dashboard_view");
    await expect.poll(() => eventNames).toContain("first_card_cta_clicked");
  });
});

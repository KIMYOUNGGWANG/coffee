import { expect, test } from "@playwright/test";
import type { Page, Route } from "@playwright/test";
import { analyticsEventNames, analyticsEventSchema } from "../lib/analytics-events";

const emptyCardsResponse = { data: [] } as const;
const profileResponse = {
  data: {
    credits: 1,
    has_pdf_access: false,
    is_premium: false,
    monthly_scan_limit: 5,
    scans_used: 0,
    personal_taste_line: null,
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
  "rebuy_calendar_export_clicked",
  "rebuy_calendar_returned",
  "rebuy_purchase_clue_opened",
  "rebuy_shelf_memory_started",
  "next_purchase_memory_opened",
  "taste_preference_saved",
  "taste_preference_copied",
] as const;

test("pins legacy commerce/share and validated-memory event names", () => {
  expect(analyticsEventNames).toEqual([...legacyEventNames, ...memoryEventNames]);
});

test("rejects private taste text at the analytics boundary", () => {
  const result = analyticsEventSchema.safeParse({
    eventName: "taste_preference_saved",
    occurredAt: "2026-07-12T00:00:00.000Z",
    path: "/dashboard",
    properties: {
      source: "rebuy_taste_brief",
      mode: "custom",
      sentence: "private taste text",
    },
  });

  expect(result.success).toBe(false);
});

async function fulfillJson(route: Route, body: unknown): Promise<void> {
  await route.fulfill({
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

type AnalyticsPostBody = {
  readonly eventName?: string;
  readonly path?: string;
  readonly properties?: unknown;
};

function isAnalyticsPostBody(value: unknown): value is AnalyticsPostBody {
  return typeof value === "object" && value !== null;
}

async function mockDashboardRoutes(page: Page, eventNames: string[], eventPayloads: AnalyticsPostBody[] = []): Promise<void> {
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
        const body = request.postDataJSON();
        if (isAnalyticsPostBody(body) && typeof body.eventName === "string") {
          eventNames.push(body.eventName);
          eventPayloads.push(body);
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

  test("tracks privacy-safe rebuy calendar return source", async ({ page }) => {
    // Given
    const eventNames: string[] = [];
    const eventPayloads: AnalyticsPostBody[] = [];
    await mockDashboardRoutes(page, eventNames, eventPayloads);
    await page.addInitScript(() => {
      window.localStorage.setItem("coffeedex_analytics_test", "true");
    });

    // When
    await page.goto("/dashboard?source=rebuy_calendar&utm_source=qa");
    await expect(page.getByTestId("dashboard-ready")).toBeVisible();

    // Then
    await expect(page.getByTestId("rebuy-calendar-return-cue")).toBeVisible();
    await expect(page.getByRole("button", { name: "재구매 결정 열기" })).toBeVisible();
    await expect.poll(() => eventPayloads.find((payload) => payload.eventName === "rebuy_calendar_returned")).toMatchObject({
      eventName: "rebuy_calendar_returned",
      path: "/dashboard",
      properties: { source: "rebuy_calendar" },
    });
    expect(eventPayloads.find((payload) => payload.eventName === "rebuy_calendar_returned")?.properties).toEqual({
      source: "rebuy_calendar",
    });
    await expect(page).toHaveURL(/\/dashboard\?utm_source=qa$/);

    // When
    await page.goto("/dashboard?source=public_card");
    await expect(page.getByTestId("dashboard-ready")).toBeVisible();

    // Then
    await expect.poll(() => eventNames.filter((eventName) => eventName === "rebuy_calendar_returned")).toHaveLength(1);
  });
});

import { expect, test } from "@playwright/test";
import type { Page, Route } from "@playwright/test";

const dashboardUrl = `${process.env.COFFEEDEX_E2E_BASE_URL ?? ""}/dashboard`;

type ElementRect = {
  readonly bottom: number;
  readonly left: number;
  readonly right: number;
  readonly top: number;
};

type MobileFreshShelfMetrics = {
  readonly bodyScrollWidth: number;
  readonly bottomNavRect: ElementRect | null;
  readonly hasHorizontalOverflow: boolean;
  readonly innerWidth: number;
  readonly quickActionRects: readonly ElementRect[];
  readonly quickActionsOverlapFixedControls: boolean;
  readonly scanRect: ElementRect | null;
  readonly scrollWidth: number;
};

const shelfResponse = {
  data: [
    {
      bean_name: "에티오피아 시다마",
      fill_level: 8,
      id: "shelf-sidama",
      is_finished: false,
      opened_date: "2026-06-10",
      origin: "Ethiopia Sidama Washed",
      roast_date: "2026-06-01",
      roaster_name: "프릳츠 커피",
      tasting_card_id: null,
      tasting_cards: null,
      total_weight: 200,
    },
  ],
} as const;

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

async function fulfillJson(route: Route, body: unknown, status = 200): Promise<void> {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

async function mockDashboardRoutes(page: Page): Promise<void> {
  await page.route("**/api/v1/**", async (route) => {
    const requestUrl = new URL(route.request().url());

    switch (requestUrl.pathname) {
      case "/api/v1/shelf":
        await fulfillJson(route, shelfResponse);
        return;
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
          body: JSON.stringify({ error: { message: requestUrl.pathname } }),
        });
    }
  });
}

test.describe("CoffeeDex Fresh Shelf dashboard surface", () => {
  test("shows auth guidance instead of the empty shelf create flow when shelf access requires login", async ({ page }) => {
    let nativeDialogMessage: string | null = null;

    page.on("dialog", async (dialog) => {
      nativeDialogMessage = dialog.message();
      await dialog.dismiss();
    });

    await page.route("**/api/v1/**", async (route) => {
      const requestUrl = new URL(route.request().url());

      switch (requestUrl.pathname) {
        case "/api/v1/shelf":
          await fulfillJson(route, {
            error: { code: 401, message: "인증되지 않은 사용자입니다. 로그인이 필요합니다." },
          }, 401);
          return;
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
            body: JSON.stringify({ error: { message: requestUrl.pathname } }),
          });
      }
    });

    await page.goto(dashboardUrl);

    await expect(page.getByRole("heading", { name: "로그인이 필요합니다" })).toBeVisible();
    await expect(page.getByText("원두 보관함은 CoffeeDex 계정에 저장됩니다.")).toBeVisible();
    await expect(page.getByRole("button", { name: "새 원두 등록하기" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "첫 원두 등록하기" })).toHaveCount(0);
    expect(nativeDialogMessage).toBeNull();
  });

  test("renders the rebuy timing badge on the dashboard shelf tab", async ({ page }) => {
    await mockDashboardRoutes(page);

    await page.goto(dashboardUrl);

    await expect(page.getByTestId("dashboard-ready")).toBeVisible();
    await expect(page.getByRole("heading", { name: /원두 보관함/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: "에티오피아 시다마" })).toBeVisible();
    await expect(page.getByText("다시 살 타이밍")).toBeVisible();
    await expect(page.getByText("거의 비었어요. 다시 살지 판단할 타이밍입니다.")).toBeVisible();
  });

  test("keeps the mobile shelf within the viewport and away from fixed controls", async ({ page }) => {
    await page.setViewportSize({ width: 392, height: 844 });
    await mockDashboardRoutes(page);

    await page.goto(dashboardUrl);

    await expect(page.getByTestId("dashboard-ready")).toBeVisible();
    await expect(page.getByText("다시 살 타이밍")).toBeVisible();

    const metrics = await page.evaluate<MobileFreshShelfMetrics>(() => {
      const readRect = (element: Element | null): ElementRect | null => {
        if (element === null) return null;

        const rect = element.getBoundingClientRect();

        return {
          bottom: rect.bottom,
          left: rect.left,
          right: rect.right,
          top: rect.top,
        };
      };

      const overlaps = (first: ElementRect, second: ElementRect): boolean => (
        first.left < second.right
        && first.right > second.left
        && first.top < second.bottom
        && first.bottom > second.top
      );

      const bottomNavElement = Array.from(
        document.querySelectorAll('nav[aria-label="대시보드 주요 메뉴"]'),
      ).find((element) => window.getComputedStyle(element).position === "fixed") ?? null;
      const bottomNavRect = readRect(bottomNavElement);
      const scanRect = readRect(document.querySelector('button[aria-label="새 원두 스캔"]'));
      const fixedControlRects = [bottomNavRect, scanRect].filter(
        (rect): rect is ElementRect => rect !== null,
      );
      const quickActionLabels = new Set(["100%", "75%", "50%", "25%", "Empty"]);
      const quickActionRects = Array.from(document.querySelectorAll("button"))
        .filter((button) => quickActionLabels.has(button.textContent?.trim() ?? ""))
        .map((button) => button.getBoundingClientRect())
        .map((rect) => ({
          bottom: rect.bottom,
          left: rect.left,
          right: rect.right,
          top: rect.top,
        }));
      const scrollWidth = document.documentElement.scrollWidth;
      const bodyScrollWidth = document.body.scrollWidth;
      const maxScrollWidth = Math.max(scrollWidth, bodyScrollWidth);

      return {
        bodyScrollWidth,
        bottomNavRect,
        hasHorizontalOverflow: maxScrollWidth > window.innerWidth,
        innerWidth: window.innerWidth,
        quickActionRects,
        quickActionsOverlapFixedControls: quickActionRects.some((quickActionRect) => (
          fixedControlRects.some((fixedControlRect) => overlaps(quickActionRect, fixedControlRect))
        )),
        scanRect,
        scrollWidth,
      };
    });

    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.innerWidth);
    expect(metrics.bodyScrollWidth).toBeLessThanOrEqual(metrics.innerWidth);
    expect(metrics.hasHorizontalOverflow).toBe(false);
    expect(metrics.quickActionsOverlapFixedControls).toBe(false);
  });
});

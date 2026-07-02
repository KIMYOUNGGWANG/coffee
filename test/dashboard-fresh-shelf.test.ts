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
      purchase_url: "https://fritz.example/sidama",
      purchase_note: "Fritz 공식몰 200g 옵션",
      rebuy_priority: "normal",
      rebuy_reminder_date: null,
      rebuy_action: "none",
      rebuy_action_at: null,
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

const dialInCoachResponse = {
  data: {
    generatedAt: "2026-06-29T00:00:00.000Z",
    selectedShelfItemId: "shelf-sidama",
    title: "프릳츠 커피 에티오피아 시다마",
    subtitle: "Ethiopia Sidama Washed",
    problem: "새 원두의 첫 컵을 안정적으로 시작하는 것이 목표입니다.",
    recipe: {
      method: "V60",
      coffeeAmount: 15,
      waterAmount: 240,
      waterTemp: 93,
      grindSize: "Medium Fine",
      brewTime: "2:45",
      ratioLabel: "1:16",
    },
    adjustments: [
      {
        trigger: "too_sour",
        label: "시거나 날카로우면",
        nextMove: "분쇄를 한 단계 곱게 하거나 물 온도를 1-2도 올려요.",
      },
      {
        trigger: "too_bitter",
        label: "쓰거나 텁텁하면",
        nextMove: "분쇄를 한 단계 굵게 하거나 총 추출 시간을 15초 줄여요.",
      },
      {
        trigger: "too_weak",
        label: "묽고 비어 있으면",
        nextMove: "물량을 15g 줄이거나 원두를 1g 늘려 농도를 올려요.",
      },
    ],
    evidence: ["프릳츠 커피 에티오피아 시다마 잔량 8%", "로스팅 후 28일"],
    suggestedLog: {
      shelfItemId: "shelf-sidama",
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
      simpleNote: "Dial-in Coach 시작 레시피: 15g/240g, 93C, Medium Fine, 2:45",
      coachSnapshot: {
        source: "dial_in_coach",
        title: "프릳츠 커피 에티오피아 시다마",
        generatedAt: "2026-06-29T00:00:00.000Z",
        evidence: ["프릳츠 커피 에티오피아 시다마 잔량 8%"],
      },
    },
    grindMemory: {
      title: "분쇄도 기억이 아직 없어요",
      subtitle: "이 원두의 첫 성공 컵을 저장하면 다음 추천에 반복 가능한 세팅이 붙습니다.",
      method: null,
      grindSize: null,
      coffeeAmount: null,
      waterAmount: null,
      waterTemp: null,
      brewTime: null,
      rating: null,
      brewedAt: null,
    },
  },
} as const;

const rebuyIntelligenceResponse = {
  data: {
    generatedAt: "2026-06-29T00:00:00.000Z",
    summary: "오늘 마실 원두, 재구매 시점, 취향 기준, 구매 단서, 실패 보정값을 한 번에 이어주는 반복 사용 루프입니다.",
    featureScores: [
      {
        feature: "next_cup_plan",
        roi: 94,
        retention: 96,
        painkiller: 91,
        monetization: 70,
        difficulty: 30,
        reason: "앱을 열 때마다 오늘 마실 원두와 기록 행동을 바로 정해줍니다.",
      },
      {
        feature: "rebuy_reminder",
        roi: 92,
        retention: 95,
        painkiller: 90,
        monetization: 72,
        difficulty: 28,
        reason: "원두가 줄어드는 실제 순간에 다시 방문할 이유를 만듭니다.",
      },
    ],
    rebuyReminder: {
      title: "에티오피아 시다마",
      subtitle: "프릳츠 커피",
      reason: "거의 비었어요. 다시 살지 판단할 타이밍입니다.",
      actionLabel: "재구매 후보 열기",
      priority: "high",
      cardId: null,
      shelfItemId: "shelf-sidama",
    },
    tasteMatch: {
      anchorCardId: null,
      anchorTitle: "프릳츠 커피 에티오피아 시다마",
      matchCardId: null,
      matchTitle: "다음 구매 후보를 고를 기준",
      sharedTags: ["citrus"],
      reason: "좋았던 카드의 맛 기준을 다음 구매 검색어로 바꿨어요.",
      searchPrompt: "프릳츠 커피 citrus 비슷한 원두",
    },
    purchaseMemory: {
      title: "에티오피아 시다마",
      subtitle: "프릳츠 커피",
      source: "shelf",
      searchUrl: "https://www.google.com/search?q=%ED%94%84%EB%A6%B3%EC%B8%A0%20%EC%BB%A4%ED%94%BC%20%EC%97%90%ED%8B%B0%EC%98%A4%ED%94%BC%EC%95%84%20%EC%8B%9C%EB%8B%A4%EB%A7%88%20%EC%9B%90%EB%91%90%20%EA%B5%AC%EB%A7%A4",
      reason: "서랍에 남긴 로스터와 원두명으로 재구매 검색을 열 수 있어요.",
      cardId: null,
      shelfItemId: "shelf-sidama",
    },
    brewFailureMemory: {
      title: "실패 컵도 다음 컵의 레시피가 됩니다",
      subtitle: "Brew Failure Memory",
      problem: "unknown",
      adjustment: "맛이 아쉬웠던 컵에 산미, 쓴맛, 묽음 같은 단서를 남겨두세요.",
      evidence: "실패 로그가 쌓이면 다음 조정값을 바로 제안합니다.",
      logId: null,
      shelfItemId: null,
    },
    nextCupPlan: {
      title: "에티오피아 시다마",
      subtitle: "프릳츠 커피",
      reason: "잔량이 낮아 오늘 한 컵 기록하면 재구매 판단까지 이어집니다.",
      actionLabel: "오늘 마무리 컵",
      priority: "high",
      suggestedMethod: "V60",
      shelfItemId: "shelf-sidama",
      lastBrewLogId: null,
    },
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

async function mockDashboardRoutes(page: Page, shelfPatchBodies: unknown[] = []): Promise<void> {
  await page.route("**/api/v1/**", async (route) => {
    const requestUrl = new URL(route.request().url());

    if (requestUrl.pathname.startsWith("/api/v1/shelf/") && route.request().method() === "PATCH") {
      shelfPatchBodies.push(route.request().postDataJSON());
      await fulfillJson(route, { data: { id: "shelf-sidama" } });
      return;
    }

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
      case "/api/v1/dial-in-coach":
        await fulfillJson(route, dialInCoachResponse);
        return;
      case "/api/v1/brewing-logs":
        await fulfillJson(route, { data: [] });
        return;
      case "/api/v1/rebuy-intelligence":
        await fulfillJson(route, rebuyIntelligenceResponse);
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
        case "/api/v1/dial-in-coach":
          await fulfillJson(route, dialInCoachResponse);
          return;
        case "/api/v1/rebuy-intelligence":
          await fulfillJson(route, rebuyIntelligenceResponse);
          return;
        case "/api/v1/brewing-logs":
          await fulfillJson(route, { data: [] });
          return;
        case "/api/v1/rebuy-intelligence":
          await fulfillJson(route, rebuyIntelligenceResponse);
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

    await page.goto(dashboardUrl, { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: "로그인이 필요합니다" })).toBeVisible();
    await expect(page.getByText("원두 보관함은 CoffeeDex 계정에 저장됩니다.")).toBeVisible();
    await expect(page.getByRole("button", { name: "새 원두 등록하기" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "첫 원두 등록하기" })).toHaveCount(0);
    expect(nativeDialogMessage).toBeNull();
  });

  test("renders the rebuy timing badge on the dashboard shelf tab", async ({ page }) => {
    await mockDashboardRoutes(page);

    await page.goto(dashboardUrl, { waitUntil: "domcontentloaded" });

    await expect(page.getByTestId("dashboard-ready")).toBeVisible();
    await expect(page.getByRole("heading", { name: /원두 보관함/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: "에티오피아 시다마" })).toBeVisible();
    await expect(page.getByText("다시 살 타이밍")).toBeVisible();
    await expect(page.getByText("거의 비었어요. 다시 살지 판단할 타이밍입니다.").first()).toBeVisible();
  });

  test("renders Rebuy Intelligence as the next retention loop on the shelf tab", async ({ page }) => {
    await mockDashboardRoutes(page);

    await page.goto(dashboardUrl, { waitUntil: "domcontentloaded" });

    await expect(page.getByTestId("dashboard-ready")).toBeVisible();
    await expect(page.getByRole("region", { name: "Rebuy Intelligence" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "다음에 다시 살 커피를 놓치지 않게" })).toBeVisible();
    await expect(page.getByText("Next Cup")).toBeVisible();
    await expect(page.getByRole("button", { name: /오늘 마무리 컵/ })).toBeVisible();
    await expect(page.getByText("Rebuy Reminder")).toBeVisible();
    await expect(page.getByText("Taste Match")).toBeVisible();
    await expect(page.getByText("Bag To Rebuy")).toBeVisible();
    await expect(page.getByRole("button", { name: /Brew Failure/ })).toBeVisible();
  });

  test("lets users pin and mark a shelf item for in-app rebuy follow-up", async ({ page }) => {
    const patchBodies: unknown[] = [];
    await mockDashboardRoutes(page, patchBodies);

    await page.goto(dashboardUrl, { waitUntil: "domcontentloaded" });

    await expect(page.getByTestId("dashboard-ready")).toBeVisible();
    await page.getByRole("heading", { name: "에티오피아 시다마" }).click();
    await expect(page.getByText("앱 내부 리마인더")).toBeVisible();
    await page.waitForTimeout(900);

    await page.getByRole("button", { name: /고정/ }).click();
    await expect.poll(() => patchBodies.length).toBe(1);
    if (!await page.getByText("앱 내부 리마인더").first().isVisible()) {
      await page.getByRole("heading", { name: "에티오피아 시다마" }).click();
      await expect(page.getByText("앱 내부 리마인더")).toBeVisible();
      await page.waitForTimeout(900);
    }
    await page.getByText("다시 살래요").click({ force: true });

    expect(patchBodies).toEqual([
      { rebuyPriority: "pinned" },
      { rebuyAction: "will_rebuy", rebuyPriority: "pinned" },
    ]);
  });

  test("keeps the mobile shelf within the viewport and away from fixed controls", async ({ page }) => {
    await page.setViewportSize({ width: 392, height: 844 });
    await mockDashboardRoutes(page);

    await page.goto(dashboardUrl, { waitUntil: "domcontentloaded" });

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

  test("renders Dial-in Coach on the log tab and saves the suggested recipe", async ({ page }) => {
    let savedCoachSource: unknown = null;

    await page.route("**/api/v1/**", async (route) => {
      const requestUrl = new URL(route.request().url());

      if (requestUrl.pathname === "/api/v1/brewing-logs" && route.request().method() === "POST") {
        const payload = route.request().postDataJSON() as { coachSource?: unknown };
        savedCoachSource = payload.coachSource;
        await fulfillJson(route, { data: { id: "log-from-coach" } }, 201);
        return;
      }

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
        case "/api/v1/dial-in-coach":
          await fulfillJson(route, dialInCoachResponse);
          return;
        case "/api/v1/rebuy-intelligence":
          await fulfillJson(route, rebuyIntelligenceResponse);
          return;
        case "/api/v1/brewing-logs":
          await fulfillJson(route, { data: [] });
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

    await page.goto(dashboardUrl, { waitUntil: "domcontentloaded" });
    await page
      .getByRole("navigation", { name: "대시보드 주요 메뉴" })
      .getByRole("button", { name: "기록", exact: true })
      .first()
      .click();

    await expect(page.getByRole("region", { name: "Dial-in Coach" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "오늘 첫 컵을 어디서 시작할지 정해드릴게요" })).toBeVisible();
    await expect(page.getByText("원두 15g")).toBeVisible();

    await page.getByRole("button", { name: "이 레시피로 로그 시작" }).click();

    await expect(page.getByText("오늘의 시작 레시피와 선반 잔량을 함께 저장했어요.")).toBeVisible();
    expect(savedCoachSource).toBe("dial_in_coach");
  });
});

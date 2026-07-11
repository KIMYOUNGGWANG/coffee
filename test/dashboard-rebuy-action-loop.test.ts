import { expect, test } from "@playwright/test";
import type { Page, Route } from "@playwright/test";

const dashboardUrl = `${process.env.COFFEEDEX_E2E_BASE_URL ?? ""}/dashboard`;

const shelfResponse = {
  data: [{
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
  }],
} as const;

const rebuyIntelligenceResponse = {
  data: {
    generatedAt: "2026-06-29T00:00:00.000Z",
    summary: "오늘 마실 원두, 재구매 시점, 취향 기준, 구매 단서, 실패 보정값을 한 번에 이어주는 반복 사용 루프입니다.",
    featureScores: [{
      feature: "rebuy_reminder",
      roi: 92,
      retention: 95,
      painkiller: 90,
      monetization: 72,
      difficulty: 28,
      reason: "원두가 줄어드는 실제 순간에 다시 방문할 이유를 만듭니다.",
    }],
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
      searchUrl: "https://www.google.com/search?q=sidama",
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

async function fulfillJson(route: Route, body: unknown, status = 200): Promise<void> {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

type DashboardRouteOptions = {
  readonly rebuyReturnDelayMs?: number;
  readonly shelfPostBodies?: unknown[];
};

async function mockDashboardRoutes(page: Page, shelfPatchBodies: unknown[], options: DashboardRouteOptions = {}): Promise<void> {
  const { rebuyReturnDelayMs = 0, shelfPostBodies = [] } = options;

  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;

    if (pathname.startsWith("/api/v1/shelf/") && request.method() === "PATCH") {
      shelfPatchBodies.push(JSON.parse(request.postData() ?? "{}"));
      await fulfillJson(route, { data: { id: "shelf-sidama" } });
      return;
    }

    switch (pathname) {
      case "/api/v1/shelf":
        if (request.method() === "POST") {
          shelfPostBodies.push(JSON.parse(request.postData() ?? "{}"));
          await fulfillJson(route, { data: { id: "shelf-new-sidama" } }, 201);
          return;
        }
        await fulfillJson(route, shelfResponse);
        return;
      case "/api/v1/rebuy-intelligence":
        await fulfillJson(route, rebuyIntelligenceResponse);
        return;
      case "/api/v1/shelf/rebuy-return":
        if (rebuyReturnDelayMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, rebuyReturnDelayMs));
        }
        await fulfillJson(route, {
          data: {
            id: "93493987-4800-4b7c-836f-c0a35f39244e",
            roasterName: "프릳츠 커피",
            beanName: "에티오피아 시다마",
            origin: "Ethiopia Sidama Washed",
            totalWeight: 200,
            tastingCardId: null,
            purchaseUrl: "https://fritz.example/sidama",
            purchaseNote: "프릳츠 공식몰 200g 18,000원",
            rebuyAction: "none",
          },
        });
        return;
      case "/api/v1/cards":
      case "/api/v1/brewing-logs":
        await fulfillJson(route, { data: [] });
        return;
      case "/api/v1/profile":
        await fulfillJson(route, { data: { credits: 1, has_pdf_access: false, is_premium: false, monthly_scan_limit: 5, scans_used: 0 } });
        return;
      case "/api/v1/profile/analytics":
        await fulfillJson(route, { data: { aiAnalysis: "", averageAcidity: 0, averageBody: 0, averageSweetness: 0, topTags: [], totalCards: 0 } });
        return;
      case "/api/v1/dial-in-coach":
        await fulfillJson(route, { data: { title: "오늘 시작점", subtitle: "", recipe: {}, grindMemory: {}, adjustments: [], evidence: [], suggestedLog: {} } });
        return;
      case "/api/v1/subscription":
        await fulfillJson(route, { data: { cancelAtPeriodEnd: false, currentPeriodEnd: null, isPremium: false, lastInvoiceStatus: null, plan: "free", status: "inactive", stripeSubscriptionId: null, updatedAt: null } });
        return;
      case "/api/v1/analytics":
        await fulfillJson(route, { received: true });
        return;
      default:
        await fulfillJson(route, { error: { message: pathname } }, 404);
    }
  });
}

test("saves a Rebuy Intelligence action without opening the shelf item", async ({ page }) => {
  const patchBodies: unknown[] = [];
  await mockDashboardRoutes(page, patchBodies);

  await page.goto(dashboardUrl, { waitUntil: "domcontentloaded" });

  await expect(page.getByTestId("dashboard-ready")).toBeVisible();
  await expect(page.getByTestId("rebuy-action-loop")).toBeVisible();

  await page.getByTestId("rebuy-action-loop").getByRole("button", { name: "다시 살래요" }).click();
  await expect.poll(() => patchBodies.length).toBe(1);

  await page.getByTestId("rebuy-action-loop").getByRole("button", { name: "다시 샀음" }).click();
  await expect.poll(() => patchBodies.length).toBe(2);

  expect(patchBodies).toEqual([
    { rebuyAction: "will_rebuy", rebuyPriority: "pinned" },
    { rebuyAction: "rebought", rebuyPriority: "normal", rebuyReminderDate: null },
  ]);
});

test("saves an exact private bean decision after a calendar return", async ({ page }) => {
  const patchBodies: unknown[] = [];
  await mockDashboardRoutes(page, patchBodies);

  await page.goto(`${dashboardUrl}?source=rebuy_calendar&rebuy_token=f70cfec8-51f9-4667-a80f-ca38bfbc2b6d`, { waitUntil: "domcontentloaded" });

  await expect(page.getByTestId("dashboard-ready")).toBeVisible();
  await expect(page.getByTestId("rebuy-calendar-return-cue")).toContainText("프릳츠 커피 · 에티오피아 시다마");
  await expect(page.getByTestId("rebuy-calendar-return-cue").getByRole("link", { name: "구매 단서 열기" })).toHaveAttribute("href", "https://fritz.example/sidama");
  await page.getByTestId("rebuy-calendar-return-cue").getByRole("button", { name: "다시 살래요" }).click();

  await expect.poll(() => patchBodies).toEqual([
    { rebuyAction: "will_rebuy", rebuyPriority: "pinned" },
  ]);
  await expect(page.getByTestId("rebuy-calendar-return-cue")).toBeHidden();
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("starts a separate active shelf memory only after an explicit calendar-return rebuy confirmation", async ({ page }) => {
  const patchBodies: unknown[] = [];
  const shelfPostBodies: unknown[] = [];
  await mockDashboardRoutes(page, patchBodies, { shelfPostBodies });

  await page.goto(`${dashboardUrl}?source=rebuy_calendar&rebuy_token=f70cfec8-51f9-4667-a80f-ca38bfbc2b6d`, { waitUntil: "domcontentloaded" });

  const cue = page.getByTestId("rebuy-calendar-return-cue");
  await expect(cue).toContainText("프릳츠 커피 · 에티오피아 시다마");
  await cue.getByRole("button", { name: "다시 샀음" }).click();
  await expect.poll(() => patchBodies).toEqual([
    { rebuyAction: "rebought", rebuyPriority: "normal", rebuyReminderDate: null },
  ]);

  await expect(cue).toContainText("새 봉투도 선반에 담아 다음 재구매 시점을 이어가세요.");
  await cue.getByRole("button", { name: "새 봉투도 선반에 담기" }).click();
  await expect.poll(() => shelfPostBodies).toEqual([{
    roasterName: "프릳츠 커피",
    beanName: "에티오피아 시다마",
    origin: "Ethiopia Sidama Washed",
    roastDate: null,
    openedDate: null,
    totalWeight: 200,
    fillLevel: 100,
    tastingCardId: null,
    purchaseUrl: "https://fritz.example/sidama",
    purchaseNote: "프릳츠 공식몰 200g 18,000원",
    rebuyPriority: "normal",
    rebuyAction: "none",
    rating: 5,
    wantAgain: true,
  }]);
  await expect(cue).toBeHidden();
});

test("keeps the exact calendar return decision usable on a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const patchBodies: unknown[] = [];
  await mockDashboardRoutes(page, patchBodies);

  await page.goto(`${dashboardUrl}?source=rebuy_calendar&rebuy_token=f70cfec8-51f9-4667-a80f-ca38bfbc2b6d`, { waitUntil: "domcontentloaded" });

  const cue = page.getByTestId("rebuy-calendar-return-cue");
  await expect(cue).toContainText("프릳츠 커피 · 에티오피아 시다마");
  const reboughtButton = cue.getByRole("button", { name: "다시 샀음" });
  await expect(reboughtButton).toBeVisible();
  await expect(reboughtButton).toHaveCSS("min-height", "44px");
  expect(await reboughtButton.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return rect.left >= 0 && rect.right <= window.innerWidth;
  })).toBe(true);

  await reboughtButton.click();
  await expect.poll(() => patchBodies).toEqual([
    { rebuyAction: "rebought", rebuyPriority: "normal", rebuyReminderDate: null },
  ]);
  const continuationButton = cue.getByRole("button", { name: "새 봉투도 선반에 담기" });
  await expect(continuationButton).toBeVisible();
  expect(await continuationButton.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return rect.left >= 0 && rect.right <= window.innerWidth;
  })).toBe(true);
});

test("removes the opaque token after a dismissed calendar return cue finishes loading", async ({ page }) => {
  const patchBodies: unknown[] = [];
  await mockDashboardRoutes(page, patchBodies, { rebuyReturnDelayMs: 250 });

  await page.goto(`${dashboardUrl}?source=rebuy_calendar&rebuy_token=f70cfec8-51f9-4667-a80f-ca38bfbc2b6d`, { waitUntil: "domcontentloaded" });

  const cue = page.getByTestId("rebuy-calendar-return-cue");
  await expect(cue).toContainText("캘린더의 원두 기억을 꺼내는 중이에요.");
  await cue.getByRole("button", { name: "캘린더 복귀 안내 닫기" }).click();
  await expect(cue).toBeHidden();
  await expect(page).toHaveURL(/\/dashboard$/);
});

import { expect, test } from "@playwright/test";
import type { Page, Route } from "@playwright/test";

const dashboardUrl = `${process.env.COFFEEDEX_E2E_BASE_URL ?? ""}/dashboard`;

const mockCardsResponse = {
  data: [
    {
      id: "card-sidama",
      user_id: "user-001",
      category: "coffee",
      title: "에티오피아 시다마",
      subtitle: "프릳츠 커피",
      image_url: null,
      badges: ["Single Origin", "Washed"],
      metric1: 4, // acidity
      metric2: 3, // sweetness
      metric3: 3, // body
      tags: ["lemon", "floral"],
      ai_description: "상큼한 레몬 향미와 화사한 꽃 향기가 돋보이는 에티오피아 싱글 오리진 커피입니다.",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_public: false,
      footer_meta: { date: "2026.06.15", origin: "Ethiopia Sidama" },
      package_origin: "Ethiopia Sidama",
      package_process: "Washed",
      repurchase_intent: "again" as const,
      repurchase_reasons: ["상큼한 산미", "꽃향기"],
      scan_source: "manual" as const,
      scan_confidence: null,
      corrected_fields: [],
      confirmed_at: new Date().toISOString(),
    },
  ],
} as const;


const mockShelfResponse = {
  data: [
    {
      id: "shelf-sidama",
      user_id: "user-001",
      roaster_name: "프릳츠 커피",
      bean_name: "에티오피아 시다마",
      origin: "Ethiopia Sidama Washed",
      roast_date: "2026-06-15",
      opened_date: "2026-06-16",
      total_weight: 200,
      fill_level: 80,
      is_finished: false,
      tasting_card_id: "card-sidama",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
} as const;

const profileResponse = {
  data: {
    credits: 5,
    has_pdf_access: false,
    is_premium: true,
    monthly_scan_limit: 5,
    scans_used: 0,
  },
} as const;

const subscriptionResponse = {
  data: {
    cancelAtPeriodEnd: false,
    currentPeriodEnd: null,
    isPremium: true,
    lastInvoiceStatus: null,
    plan: "premium",
    status: "active",
    stripeSubscriptionId: null,
    updatedAt: null,
  },
} as const;

const analyticsResponse = {
  data: {
    aiAnalysis: "",
    averageAcidity: 4,
    averageBody: 3,
    averageSweetness: 3,
    topTags: ["lemon"],
    totalCards: 1,
  },
} as const;

const coffeeDnaResponse = {
  data: {
    totalBeans: 3,
    averageRating: 4.2,
    wantAgainRate: 66,
    topOrigins: [{ origin: "Ethiopia", count: 2 }],
    topRoasters: [{ roaster: "Fritz", count: 1 }],
    tasteProfile: { acidity: 4, sweetness: 3, body: 3 },
    typeLabel: "화사한 산미의 탐험가",
  },
} as const;

async function fulfillJson(route: Route, body: unknown, status = 200): Promise<void> {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

test.describe("AI Barista Quick Tuning Feedback Loop E2E", () => {
  test("performs the quick tuning flow and logs the adjusted recipe successfully", async ({ page }) => {
    let aiBaristaPayload: any = null;
    let brewingLogsPayload: any = null;

    // Set viewport to desktop to easily view layout
    await page.setViewportSize({ width: 1280, height: 800 });

    // Print browser errors to stdout
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        console.error(`PAGE CONSOLE ERROR: "${msg.text()}"`);
      }
    });

    page.on("pageerror", (err) => {
      console.error(`PAGE UNCAUGHT EXCEPTION: "${err.message}"\nStack:\n${err.stack}`);
    });

    // Mock API requests
    await page.route("**/api/v1/**", async (route) => {
      const requestUrl = new URL(route.request().url());
      const method = route.request().method();

      switch (requestUrl.pathname) {
        case "/api/v1/cards":
          await fulfillJson(route, mockCardsResponse);
          return;
        case "/api/v1/shelf":
          await fulfillJson(route, mockShelfResponse);
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
        case "/api/v1/coffee-dna":
          await fulfillJson(route, coffeeDnaResponse);
          return;
        case "/api/v1/ai-barista":
          if (method === "POST") {
            aiBaristaPayload = route.request().postDataJSON();
            await fulfillJson(route, {
              recommendation: "### 신맛 보정 튜닝 가이드\n**[프릳츠 커피] 에티오피아 시다마** 원두 추출 결과, 신맛이 너무 강하게 느껴지셨군요.\n\n*   **추출수 온도 조절:** 온도를 **2°C 올려서** 추출해 보세요.\n*   **분쇄도 조정:** 지금보다 **더 곱게(Finer)** 조절해 보세요."
            });
          } else {
            await fulfillJson(route, { data: {} });
          }
          return;
        case "/api/v1/brewing-logs":
          if (method === "POST") {
            brewingLogsPayload = route.request().postDataJSON();
            await fulfillJson(route, {
              data: {
                id: "log-001",
                method: brewingLogsPayload.method,
                parameters: brewingLogsPayload.parameters,
                rating: brewingLogsPayload.rating,
                simple_note: brewingLogsPayload.simpleNote,
              }
            });
          } else {
            await fulfillJson(route, { data: [] });
          }
          return;
        default:
          if (requestUrl.pathname.includes("/brewing-notes")) {
            await fulfillJson(route, { data: [] });
            return;
          }
          await fulfillJson(route, { data: {} });
          return;
      }
    });

    // 1. Visit dashboard
    await page.goto(dashboardUrl);

    // 2. Open Tasting Card Modal (click the card in the archive section)
    await page.getByRole("button", { name: "에티오피아 시다마 상세 보기" }).click();

    // 3. Verify modal is visible
    await expect(page.getByText("Brew Tuning")).toBeVisible();
    await expect(page.getByText("이 원두의 추출 맛은 어떤가요?")).toBeVisible();

    // 4. Click 'too_sour' feedback button
    await page.getByRole("button", { name: "너무 신맛이 강함" }).click();

    // 5. Verify API was called with correct parameters
    await expect.poll(() => aiBaristaPayload).toMatchObject({
      beanId: "card-sidama",
      feedback: "too_sour",
    });

    // 6. Verify advice text rendered in modal
    await expect(page.getByText("신맛 보정 튜닝 가이드")).toBeVisible();
    await expect(page.getByText("추출수 온도 조절")).toBeVisible();

    // 7. Click log save button
    await page.getByRole("button", { name: "보정된 레시피 일지에 저장" }).click();

    // 8. Verify brewing-logs API called with adjusted parameters
    await expect.poll(() => brewingLogsPayload).toMatchObject({
      shelfItemId: "shelf-sidama",
      method: "Hario V60",
      parameters: {
        waterTemp: 94,
        waterAmount: 225,
        coffeeAmount: 15,
        grindSize: "Medium Fine",
        brewTime: "165",
      },
      rating: 3,
      simpleNote: "브루잉 조정값 적용: too_sour.",
    });

    // 9. Verify success checkmark is shown
    await expect(page.getByText("일지 저장 완료")).toBeVisible();
  });
});

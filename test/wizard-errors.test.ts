import { Buffer } from "node:buffer";
import { expect, test } from "@playwright/test";
import type { Page, Route } from "@playwright/test";

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
const paidCreditProfileResponse = {
  data: {
    credits: 2,
    has_pdf_access: false,
    is_premium: false,
    monthly_scan_limit: 5,
    scans_used: 5,
  },
} as const;
const createdCardResponse = {
  data: {
    id: "card-inline-error-retry",
    user_id: "user-inline-error",
    category: "coffee",
    title: "테스트 원두",
    subtitle: "테스트 로스터리",
    image_url: null,
    badges: ["Single Origin", "Hario V60"],
    metric1: 3,
    metric2: 3,
    metric3: 3,
    tags: ["Citrus"],
    ai_description: "복숭아와 꿀의 향이 균형 있게 이어지는 테스트 컵.",
    footer_meta: {
      origin: "Unknown",
      date: "2026-06-14",
      extraInfo: "Hario V60, 92°C",
    },
    created_at: "2026-06-14T17:00:00.000Z",
    updated_at: "2026-06-14T17:00:00.000Z",
  },
} as const;

async function fulfillJson(route: Route, status: number, body: unknown): Promise<void> {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

async function mockDashboardShell(page: Page, profileBody: typeof profileResponse | typeof paidCreditProfileResponse = profileResponse): Promise<void> {
  await page.route("**/api/v1/shelf", async (route) => {
    await fulfillJson(route, 200, { data: [] });
  });
  await page.route("**/api/v1/coffee-dna", async (route) => {
    await fulfillJson(route, 200, { data: null });
  });
  await page.route("**/api/v1/rebuy-intelligence", async (route) => {
    await fulfillJson(route, 200, { data: null });
  });
  await page.route("**/api/v1/dial-in-coach", async (route) => {
    await fulfillJson(route, 200, { data: null });
  });
  await page.route("**/api/v1/brewing-logs", async (route) => {
    await fulfillJson(route, 200, { data: [] });
  });
  await page.route("**/api/v1/profile/analytics", async (route) => {
    await fulfillJson(route, 200, analyticsResponse);
  });
  await page.route("**/api/v1/profile", async (route) => {
    await fulfillJson(route, 200, profileBody);
  });
  await page.route("**/api/v1/subscription", async (route) => {
    await fulfillJson(route, 200, subscriptionResponse);
  });
  await page.route("**/api/v1/analytics", async (route) => {
    await fulfillJson(route, 200, { received: true });
  });
}

async function openWizard(page: Page): Promise<void> {
  await page.goto("/dashboard");
  const createButton = page.getByRole("button", { name: "라벨 스캔으로 채우기" });
  const wizardHeading = page.getByRole("heading", { name: "새로운 테이스팅 카드" });

  await expect(createButton).toBeVisible();
  await createButton.click();
  try {
    await expect(wizardHeading).toBeVisible({ timeout: 1_000 });
  } catch {
    await createButton.click();
    await expect(wizardHeading).toBeVisible();
  }
}

async function enterBasicCoffee(page: Page): Promise<void> {
  await page.getByPlaceholder("예: 에티오피아 예가체프").fill("테스트 원두");
  await page.getByPlaceholder("예: 블루보틀 커피").fill("테스트 로스터리");
}

async function advanceToAiNoteStep(page: Page): Promise<void> {
  await enterBasicCoffee(page);
  await page.getByRole("button", { name: "다음" }).click();
  await page.getByRole("button", { name: "다음" }).click();
  await page.getByRole("button", { name: "Citrus" }).click();
}

test.describe("CardCreatorWizard inline errors", () => {
  test("shows AI-note failure inline and clears it when retry succeeds", async ({ page }) => {
    // Given: dashboard data is mocked and the first AI-note request fails.
    await mockDashboardShell(page);
    await page.route("**/api/v1/cards", async (route) => {
      await fulfillJson(route, 200, emptyCardsResponse);
    });
    let aiNoteRequests = 0;
    await page.route("**/api/v1/cards/ai-note", async (route) => {
      aiNoteRequests += 1;
      if (aiNoteRequests === 1) {
        await fulfillJson(route, 503, { error: { message: "AI 테스트 실패" } });
        return;
      }
      await fulfillJson(route, 200, {
        aiDescription: "복숭아와 꿀의 향이 균형 있게 이어지는 테스트 컵.",
      });
    });

    await openWizard(page);
    await advanceToAiNoteStep(page);

    // When: AI-note generation fails.
    await page.getByRole("button", { name: "향미 한줄평 초안 생성" }).click();

    // Then: the message is visible inline and disappears after a successful retry.
    await expect(page.getByRole("alert").filter({ hasText: "AI 테스트 실패" })).toBeVisible();
    await page.getByRole("button", { name: "향미 한줄평 다시 시도" }).click();
    await expect(page.getByRole("heading", { name: "4단계: 향미 초안 확인 & 발행" })).toBeVisible();
    await expect(page.getByText("AI 테스트 실패")).toHaveCount(0);
    await expect(page.getByText("“복숭아와 꿀의 향이 균형 있게 이어지는 테스트 컵.”")).toBeVisible();
  });

  test("shows submit failure inline and clears it when retry succeeds", async ({ page }) => {
    // Given: AI generation succeeds and the first card submission fails.
    await mockDashboardShell(page);
    let submitRequests = 0;
    await page.route("**/api/v1/cards", async (route) => {
      if (route.request().method() === "GET") {
        await fulfillJson(route, 200, emptyCardsResponse);
        return;
      }
      submitRequests += 1;
      if (submitRequests === 1) {
        await fulfillJson(route, 500, { error: { message: "저장 테스트 실패" } });
        return;
      }
      await fulfillJson(route, 201, createdCardResponse);
    });
    await page.route("**/api/v1/cards/ai-note", async (route) => {
      await fulfillJson(route, 200, {
        aiDescription: "복숭아와 꿀의 향이 균형 있게 이어지는 테스트 컵.",
      });
    });

    await openWizard(page);
    await advanceToAiNoteStep(page);
    await page.getByRole("button", { name: "향미 한줄평 초안 생성" }).click({ force: true });
    await expect(page.getByRole("heading", { name: "4단계: 향미 초안 확인 & 발행" })).toBeVisible();

    // When: card submission fails.
    await page.getByRole("button", { name: "카드 발행 완료" }).click();

    // Then: the message is visible inline and the retry closes the successful wizard.
    await expect(page.getByRole("alert").filter({ hasText: "저장 테스트 실패" })).toBeVisible();
    await page.getByRole("button", { name: "카드 저장 다시 시도" }).click();
    await expect(page.getByRole("heading", { name: "새로운 테이스팅 카드" })).toHaveCount(0);
    expect(submitRequests).toBe(2);
  });

  test("keeps scan failure visible until a package upload retry succeeds", async ({ page }) => {
    // Given: the first package scan fails and the retry returns parsed coffee data.
    await mockDashboardShell(page);
    await page.route("**/api/v1/cards", async (route) => {
      await fulfillJson(route, 200, emptyCardsResponse);
    });
    let scanRequests = 0;
    await page.route("**/api/v1/cards/scan", async (route) => {
      scanRequests += 1;
      if (scanRequests === 1) {
        await fulfillJson(route, 502, { error: { message: "스캔 테스트 실패" } });
        return;
      }
      await fulfillJson(route, 200, {
        data: {
          title: "Retry Kenya",
          subtitle: "테스트 로스터리",
          origin: "Kenya",
          process: "Washed",
          tags: ["Citrus"],
          metric1_acidity: 5,
          metric2_sweetness: 3,
          metric3_body: 3,
        },
      });
    });

    await openWizard(page);

    // When: package upload scanning fails.
    await page.locator('input[type="file"]').setInputFiles({
      name: "failed-label.png",
      mimeType: "image/png",
      buffer: Buffer.from("failed scan fixture"),
    });

    // Then: the error remains visible and the same inline upload control can recover.
    await expect(page.getByRole("alert").filter({ hasText: "스캔 테스트 실패" })).toBeVisible();
    await expect(page.getByText("패키지 사진 촬영 / 업로드")).toBeVisible();
    await expect(page.locator('input[type="file"]')).toBeEnabled();

    await page.locator('input[type="file"]').setInputFiles({
      name: "retry-label.png",
      mimeType: "image/png",
      buffer: Buffer.from("retry scan fixture"),
    });

    await expect(page.getByPlaceholder("예: 에티오피아 예가체프")).toHaveValue("Retry Kenya");
    await expect(page.getByText("스캔 테스트 실패")).toHaveCount(0);
    expect(scanRequests).toBe(2);
  });

  test("uses paid scan credits after the free monthly limit is exhausted", async ({ page }) => {
    // Given: free scans are exhausted but paid credits are available.
    await mockDashboardShell(page, paidCreditProfileResponse);
    await page.route("**/api/v1/cards", async (route) => {
      await fulfillJson(route, 200, emptyCardsResponse);
    });
    let scanRequests = 0;
    await page.route("**/api/v1/cards/scan", async (route) => {
      scanRequests += 1;
      await fulfillJson(route, 200, {
        data: {
          title: "Credit Kenya",
          subtitle: "크레딧 로스터리",
          origin: "Kenya",
          process: "Washed",
          tags: ["Citrus"],
          metric1_acidity: 4,
          metric2_sweetness: 3,
          metric3_body: 3,
        },
        entitlement: {
          allowed: true,
          source: "credit",
          credits_spent: 1,
          credits_remaining: 1,
        },
      });
    });

    await openWizard(page);
    await expect(page.getByText("보유 크레딧 2개 사용 가능")).toBeVisible();

    // When: a package image is uploaded after the free allowance is exhausted.
    await page.locator('input[type="file"]').setInputFiles({
      name: "credit-label.png",
      mimeType: "image/png",
      buffer: Buffer.from("paid credit scan fixture"),
    });

    // Then: the API path is called and the wizard applies the scan result.
    await expect(page.getByPlaceholder("예: 에티오피아 예가체프")).toHaveValue("Credit Kenya");
    await expect(page.getByText("월간 무료 사진 판독 한도와 보유 크레딧을 모두 사용했습니다")).toHaveCount(0);
    expect(scanRequests).toBe(1);
  });
});

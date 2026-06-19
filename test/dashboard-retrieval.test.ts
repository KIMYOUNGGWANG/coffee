import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import type { Page, Route } from "@playwright/test";

const evidencePath = ".omo/evidence/task-9-coffeedex-memory-pivot.png";
const privateQuery = "비밀 산미 메모";
const dashboardUrl = `${process.env.COFFEEDEX_E2E_BASE_URL ?? ""}/dashboard`;

const cardsResponse = {
  data: [
    {
      id: "card-guji",
      user_id: "user-1",
      category: "coffee",
      title: "구지 우라가",
      subtitle: "프릳츠 커피 컴퍼니",
      image_url: null,
      badges: ["Hario V60", "Light"],
      metric1: 4,
      metric2: 4,
      metric3: 2,
      tags: ["복숭아", "자스민"],
      ai_description: privateQuery,
      footer_meta: { date: "2026.06.18", origin: "에티오피아" },
      package_origin: "Ethiopia Guji",
      package_process: "Washed",
      repurchase_intent: "again",
      repurchase_reasons: ["깨끗한 단맛"],
      scan_source: "manual",
      scan_confidence: null,
      corrected_fields: [],
      confirmed_at: "2026-06-18T00:00:00.000Z",
      created_at: "2026-06-18T00:00:00.000Z",
      updated_at: "2026-06-18T00:00:00.000Z",
    },
    {
      id: "card-busan",
      user_id: "user-1",
      category: "coffee",
      title: "부산 데일리 블렌드",
      subtitle: "모모스 커피",
      image_url: null,
      badges: ["Espresso", "Dark"],
      metric1: 2,
      metric2: 3,
      metric3: 5,
      tags: ["초콜릿"],
      ai_description: "묵직하고 긴 여운",
      footer_meta: { date: "2026.06.17", origin: "브라질" },
      package_origin: "Brazil Cerrado",
      package_process: "Natural",
      repurchase_intent: "no",
      repurchase_reasons: ["너무 묵직함"],
      scan_source: "manual",
      scan_confidence: null,
      corrected_fields: [],
      confirmed_at: "2026-06-17T00:00:00.000Z",
      created_at: "2026-06-17T00:00:00.000Z",
      updated_at: "2026-06-17T00:00:00.000Z",
    },
  ],
} as const;

const profileResponse = { data: { credits: 1, has_pdf_access: false, is_premium: false, monthly_scan_limit: 5, scans_used: 2 } } as const;
const analyticsResponse = { data: { aiAnalysis: "", averageAcidity: 3, averageBody: 3.5, averageSweetness: 3.5, topTags: [], totalCards: 2 } } as const;
const subscriptionResponse = { data: { cancelAtPeriodEnd: false, currentPeriodEnd: null, isPremium: false, lastInvoiceStatus: null, plan: "free", status: "inactive", stripeSubscriptionId: null, updatedAt: null } } as const;

async function fulfillJson(route: Route, body: unknown): Promise<void> {
  await route.fulfill({ contentType: "application/json", body: JSON.stringify(body) });
}

async function mockDashboard(page: Page, analyticsPayloads: unknown[]): Promise<void> {
  await page.route("**/api/v1/**", async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    switch (pathname) {
      case "/api/v1/cards": await fulfillJson(route, cardsResponse); return;
      case "/api/v1/profile": await fulfillJson(route, profileResponse); return;
      case "/api/v1/profile/analytics": await fulfillJson(route, analyticsResponse); return;
      case "/api/v1/subscription": await fulfillJson(route, subscriptionResponse); return;
      case "/api/v1/analytics": analyticsPayloads.push(route.request().postDataJSON()); await fulfillJson(route, { received: true }); return;
      default: await route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: { message: pathname } }) });
    }
  });
}

for (const width of [375, 768, 1280]) {
  test(`retrieves a coffee memory and resets zero results at ${width}px`, async ({ page }) => {
    // Given
    const analyticsPayloads: unknown[] = [];
    await page.setViewportSize({ width, height: 900 });
    await mockDashboard(page, analyticsPayloads);
    await page.goto(dashboardUrl);

    // When
    await page.getByText("검색과 상세 필터").click();
    const search = page.getByRole("searchbox", { name: "커피 기억 검색" }).first();
    await search.fill("  ETHIOPIA   guji ");
    await search.press("Enter");

    // Then
    await expect(page.getByRole("heading", { name: "구지 우라가" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "부산 데일리 블렌드" })).toHaveCount(0);

    // When
    await search.fill("찾을 수 없는 원두");
    await search.press("Enter");

    // Then
    await expect(page.getByRole("heading", { name: "검색 결과가 없어요" })).toBeVisible();
    await expect(search).toHaveValue("찾을 수 없는 원두");
    await page.getByRole("button", { name: "검색과 필터 초기화" }).first().click();
    await expect(page.getByRole("heading", { name: "구지 우라가" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "부산 데일리 블렌드" })).toBeVisible();

    // When
    await page.getByRole("button", { name: "다시 살래요" }).click();

    // Then
    await expect(page.getByRole("heading", { name: "구지 우라가" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "부산 데일리 블렌드" })).toHaveCount(0);

    const serializedAnalytics = JSON.stringify(analyticsPayloads);
    expect(serializedAnalytics).toContain('"interaction":"search"');
    expect(serializedAnalytics).toContain('"interaction":"filter"');
    expect(serializedAnalytics).not.toContain("ETHIOPIA");
    expect(serializedAnalytics).not.toContain("찾을 수 없는 원두");

    if (width === 375) {
      await page.getByRole("button", { name: "검색과 필터 초기화" }).first().click();
      await search.fill(privateQuery);
      await search.press("Enter");
      await mkdir(".omo/evidence", { recursive: true });
      await page.screenshot({ path: evidencePath, fullPage: true });
    }
  });
}

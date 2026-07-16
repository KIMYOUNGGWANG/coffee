import { expect, test } from "@playwright/test";
import type { Page, Route } from "@playwright/test";

const evidencePath = "artifacts/passport-collage-state.png";
const dashboardUrl = `${process.env.PASSPORT_BASE_URL ?? "http://localhost:3000"}/dashboard`;

async function fulfillJson(route: Route, body: unknown): Promise<void> {
  await route.fulfill({ contentType: "application/json", body: JSON.stringify(body) });
}

async function mockDashboard(page: Page): Promise<void> {
  await page.route("**/api/v1/**", async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname === "/api/v1/cards") {
      await fulfillJson(route, { data: [{ id: "card-1", title: "Ethiopia Guji", tags: ["복숭아"], metric1: 4, metric2: 4, metric3: 2, footer_meta: {}, badges: [], subtitle: "", image_url: null, ai_description: "", category: "coffee", user_id: "user-1", created_at: "2026-06-18", updated_at: "2026-06-18", package_origin: "Ethiopia", package_process: "Washed", repurchase_intent: "again", repurchase_reasons: [], scan_source: null, scan_confidence: null, corrected_fields: [], confirmed_at: "2026-06-18" }] });
      return;
    }
    if (pathname === "/api/v1/profile/analytics") {
      await fulfillJson(route, { data: { averageAcidity: 4, averageSweetness: 4, averageBody: 2, topTags: ["복숭아"], topNotes: [{ note: "복숭아", count: 1 }], totalCards: 1, aiAnalysis: "확정 기록 1개의 콜라주입니다. 아직 취향으로 확정하지 않아요.", passport: { kind: "collage", sampleCount: 1, distinctOriginCount: 1, distinctProcessCount: 1, distinctTagCount: 1, coverage: "narrow" }, repurchaseBreakdown: { again: 1, maybe: 0, no: 0, undecided: 0 }, brewingStats: { totalNotes: 0, favoriteMethod: "-", averageRating: 0, bestTemp: null } } });
      return;
    }
    if (pathname === "/api/v1/profile") {
      await fulfillJson(route, { data: { credits: 0, has_pdf_access: false, is_premium: false, monthly_scan_limit: 5, scans_used: 0 } });
      return;
    }
    if (pathname === "/api/v1/subscription") {
      await fulfillJson(route, { data: { plan: "free", status: "inactive", isPremium: false, cancelAtPeriodEnd: false, currentPeriodEnd: null, lastInvoiceStatus: null, stripeSubscriptionId: null, updatedAt: null } });
      return;
    }
    await fulfillJson(route, { received: true });
  });
}

test("shows a memory collage without claiming a complete taste profile for one confirmed coffee", async ({ page }) => {
  // Given
  await mockDashboard(page);

  // When
  await page.goto(dashboardUrl);
  await expect(page.getByTestId("dashboard-ready")).toBeVisible();
  await page.getByRole("button", { name: "취향", exact: true }).click();

  // Then
  await expect(page.getByRole("heading", { name: "커피 기억 콜라주" })).toBeVisible();
  await expect(page.getByText("확정 기록 1개", { exact: true })).toBeVisible();
  await expect(page.getByText("좁은 범위", { exact: false })).toBeVisible();
  await expect(page.getByText("취향 분석을 위한 데이터가 부족합니다")).toBeVisible();
  await expect(page.getByText("향미 노트")).toBeVisible();
  await expect(page.getByText("취향 DNA", { exact: false })).toHaveCount(0);
  await page.screenshot({ path: evidencePath, fullPage: true });
});

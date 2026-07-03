import { expect, test } from "@playwright/test";
import { stat } from "node:fs/promises";

const cardsResponse = {
  data: [
    {
      ai_description: "복숭아와 꿀의 단맛, 은은한 재스민 향이 이어지는 컵.",
      badges: ["Washed", "Hario V60"],
      category: "coffee",
      created_at: "2026-06-14T01:23:45.000Z",
      footer_meta: { date: "2026.06.14", origin: "Ethiopia Guji" },
      id: "story-card-001",
      image_url: null,
      metric1: 4,
      metric2: 5,
      metric3: 3,
      package_origin: "Ethiopia Guji",
      package_process: "Washed",
      repurchase_intent: "again",
      repurchase_reasons: ["향이 오래감"],
      scan_source: "manual",
      scan_confidence: null,
      corrected_fields: [],
      confirmed_at: "2026-06-14T01:23:45.000Z",
      subtitle: "Light Roast",
      tags: ["peach", "honey", "jasmine"],
      title: "Ethiopia Guji",
      updated_at: "2026-06-14T01:23:45.000Z",
      user_id: "user-001",
    },
  ],
} as const;

const profileResponse = {
  data: {
    credits: 0,
    has_pdf_access: false,
    is_premium: false,
    monthly_scan_limit: 5,
    scans_used: 1,
  },
} as const;

const analyticsResponse = {
  data: {
    aiAnalysis: "과일향 중심의 밝고 깨끗한 취향입니다.",
    averageAcidity: 4,
    averageBody: 3,
    averageSweetness: 5,
    topTags: ["peach", "honey"],
    totalCards: 1,
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

test.describe("Story image export", () => {
  test("downloads a non-empty story image from the dashboard share modal", async ({ page }, testInfo) => {
    const dialogMessages: string[] = [];
    page.on("dialog", async (dialog) => {
      dialogMessages.push(dialog.message());
      await dialog.dismiss();
    });
    await page.route("**/api/v1/cards", async (route) => {
      await route.fulfill({ contentType: "application/json", body: JSON.stringify(cardsResponse) });
    });
    await page.route("**/api/v1/profile/analytics", async (route) => {
      await route.fulfill({ contentType: "application/json", body: JSON.stringify(analyticsResponse) });
    });
    await page.route("**/api/v1/profile", async (route) => {
      await route.fulfill({ contentType: "application/json", body: JSON.stringify(profileResponse) });
    });
    await page.route("**/api/v1/subscription", async (route) => {
      await route.fulfill({ contentType: "application/json", body: JSON.stringify(subscriptionResponse) });
    });
    await page.route("**/api/v1/shelf", async (route) => {
      await route.fulfill({ contentType: "application/json", body: JSON.stringify({ data: [] }) });
    });
    await page.route("**/api/v1/coffee-dna", async (route) => {
      await route.fulfill({ contentType: "application/json", body: JSON.stringify({ data: null }) });
    });
    await page.route("**/api/v1/rebuy-intelligence", async (route) => {
      await route.fulfill({ contentType: "application/json", body: JSON.stringify({ data: null }) });
    });
    await page.route("**/api/v1/dial-in-coach", async (route) => {
      await route.fulfill({ contentType: "application/json", body: JSON.stringify({ data: null }) });
    });
    await page.route("**/api/v1/analytics", async (route) => {
      await route.fulfill({ contentType: "application/json", body: JSON.stringify({ received: true }) });
    });

    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "Ethiopia Guji" })).toBeVisible();
    await page.getByRole("button", { name: "Ethiopia Guji 공유" }).click();

    const downloadPromise = page.waitForEvent("download", { timeout: 5_000 });
    await page.getByRole("button", { name: "Story 이미지 다운로드" }).click();
    const download = await downloadPromise;
    const downloadPath = testInfo.outputPath(download.suggestedFilename());
    await download.saveAs(downloadPath);

    await testInfo.attach(download.suggestedFilename(), {
      path: downloadPath,
      contentType: "image/svg+xml",
    });

    expect(dialogMessages).toEqual([]);
    expect(download.suggestedFilename()).toBe("coffeedex-story-ethiopia-guji.svg");

    const savedFile = await stat(downloadPath);
    expect(savedFile.size).toBeGreaterThan(0);
    console.log(`story-download=${download.suggestedFilename()} size=${savedFile.size} path=${downloadPath}`);
  });
});

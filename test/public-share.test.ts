import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import type { Page, Route } from "@playwright/test";

const evidenceDirectory = ".omo/evidence";
const publicShareScreenshotPath = `${evidenceDirectory}/task-T8-public-share.png`;

const publicCardResponse = {
  data: {
    ai_description: "복숭아와 꿀의 단맛, 은은한 재스민 향이 이어지는 컵.",
    badges: ["Washed", "Hario V60"],
    category: "coffee",
    created_at: "2026-06-14T01:23:45.000Z",
    footer_meta: { date: "2026.06.14", origin: "Ethiopia Guji" },
    id: "public-card-001",
    image_url: null,
    metric1: 4,
    metric2: 5,
    metric3: 3,
    public_share_token: "public-token-001",
    subtitle: "프릳츠 커피",
    tags: ["peach", "honey", "jasmine"],
    title: "Ethiopia Guji",
    updated_at: "2026-06-14T01:23:45.000Z",
  },
} as const;

const cardsResponse = {
  data: [
    {
      ...publicCardResponse.data,
      is_public: false,
      package_origin: "Ethiopia Guji",
      package_process: "Washed",
      repurchase_intent: "again",
      repurchase_reasons: ["공유하고 싶은 컵"],
      scan_source: "manual",
      scan_confidence: null,
      corrected_fields: [],
      confirmed_at: "2026-06-14T01:23:45.000Z",
      user_id: "private-user-id",
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

async function fulfillJson(route: Route, body: unknown): Promise<void> {
  await route.fulfill({
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

async function mockDashboardApiRoutes(page: Page): Promise<void> {
  await page.route("**/api/v1/**", async (route) => {
    const pathname = new URL(route.request().url()).pathname;

    switch (pathname) {
      case "/api/v1/cards":
        await fulfillJson(route, cardsResponse);
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
      case "/api/v1/cards/public-card-001/share":
        if (route.request().method() === "DELETE") {
          await fulfillJson(route, { data: { revoked: true } });
          return;
        }
        await fulfillJson(route, {
          data: {
            publicShareToken: "public-token-001",
            publicUrl: "http://127.0.0.1:3000/cards/public-token-001",
          },
        });
        return;
      case "/api/v1/analytics":
        await fulfillJson(route, { received: true });
        return;
      default:
        await route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({ error: { message: `Unhandled test route: ${pathname}` } }),
        });
    }
  });
}

async function captureEvidenceScreenshot(page: Page, path: string): Promise<void> {
  await mkdir(evidenceDirectory, { recursive: true });
  await page.screenshot({ caret: "initial", path, fullPage: true });
  console.log(`screenshot=${path}`);
}

test.describe("public card sharing", () => {
  test("renders a privacy-safe public card page", async ({ page }) => {
    // Given
    await page.route("**/api/v1/public/cards/public-token-001", async (route) => {
      await fulfillJson(route, publicCardResponse);
    });
    await page.route("**/api/v1/analytics", async (route) => {
      await fulfillJson(route, { received: true });
    });

    // When
    await page.goto("/cards/public-token-001");

    // Then
    await expect(page.getByText("CoffeeDex 공개 테이스팅 카드")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Ethiopia Guji" })).toBeVisible();
    await expect(page.getByText("프릳츠 커피")).toBeVisible();
    await expect(page.getByText("복숭아와 꿀의 단맛")).toBeVisible();
    await expect(page.getByRole("link", { name: "내 CoffeeDex Taste Card 만들기" })).toBeVisible();
    await expect(page.locator("body")).not.toContainText("private-user-id");
    await captureEvidenceScreenshot(page, publicShareScreenshotPath);
  });

  test("publishes and copies a public card link from the story modal", async ({ page }) => {
    // Given
    await mockDashboardApiRoutes(page);

    // When
    const cardsResponse = page.waitForResponse((response) => {
      return response.url().includes("/api/v1/cards") && response.request().method() === "GET";
    });
    await page.goto("/dashboard");
    await cardsResponse;
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"], {
      origin: new URL(page.url()).origin,
    });
    await expect(page.getByRole("heading", { name: "Ethiopia Guji" })).toBeVisible();
    await page.getByRole("button", { name: "Ethiopia Guji 공유" }).click();
    await page.getByRole("button", { name: "공개 카드 링크 복사" }).click();

    // Then
    await expect(page.getByText("공개 링크 복사 완료")).toBeVisible();
  });

  test("revokes a public card link from the story modal", async ({ page }) => {
    // Given
    await mockDashboardApiRoutes(page);
    await page.goto("/dashboard");
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"], {
      origin: new URL(page.url()).origin,
    });
    await expect(page.getByRole("heading", { name: "Ethiopia Guji" })).toBeVisible();
    await page.getByRole("button", { name: "Ethiopia Guji 공유" }).click();
    await page.getByRole("button", { name: "공개 카드 링크 복사" }).click();
    await expect(page.getByRole("button", { name: "공개 링크 해제" })).toBeVisible();

    // When
    const revokeResponse = page.waitForResponse((response) => {
      return response.url().includes("/api/v1/cards/public-card-001/share")
        && response.request().method() === "DELETE";
    });
    await page.getByRole("button", { name: "공개 링크 해제" }).click();
    await revokeResponse;

    // Then
    await expect(page.getByRole("status")).toHaveText("공개 링크가 해제되었습니다.");
    await expect(page.getByRole("button", { name: "공개 링크 해제" })).toBeHidden();
  });
});

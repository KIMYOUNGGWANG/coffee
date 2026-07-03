import { expect, test } from "@playwright/test";
import type { Page, Route } from "@playwright/test";

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

const loginRequiredResponse = {
  error: {
    message: "로그인이 필요합니다. CoffeeDex 계정으로 다시 로그인해주세요.",
  },
} as const;

const dashboardActivationPath =
  "/dashboard?intent=first_card&source=public_card&mode=quick&token=public-token-001";
const captureActivationPath =
  "/capture?intent=first_card&source=public_card&mode=quick&token=public-token-001";

async function fulfillJson(route: Route, body: unknown, status = 200): Promise<void> {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

async function mockAuthGateRoutes(page: Page): Promise<void> {
  await page.route("**/api/v1/**", async (route) => {
    const pathname = new URL(route.request().url()).pathname;

    switch (pathname) {
      case "/api/v1/public/cards/public-token-001":
        await fulfillJson(route, publicCardResponse);
        return;
      case "/api/v1/analytics":
        await fulfillJson(route, { received: true });
        return;
      case "/api/v1/cards":
      case "/api/v1/profile":
      case "/api/v1/profile/analytics":
      case "/api/v1/subscription":
        await fulfillJson(route, loginRequiredResponse, 401);
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

async function expectKoreanAuthGate(page: Page): Promise<void> {
  await expect(page.getByRole("heading", { name: "CoffeeDex 계정으로 계속하기" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Google로 계속하기" })).toBeVisible();
  await expect(page.getByText("CoffeeDex Auth Gate")).toHaveCount(0);
  await expect(page.getByText(/로그인 후 이동:/)).toHaveCount(0);
  await expect(page.getByText(/401/)).not.toBeVisible();
  await expect(page.getByText("데이터 로드 실패")).not.toBeVisible();
  await expect(page.getByText(/Supabase 연결/)).not.toBeVisible();
}

test.describe("CoffeeDex authenticated activation gate", () => {
  test("routes public-card activation into capture and gates auth only when saving", async ({ page }) => {
    // Given
    await mockAuthGateRoutes(page);

    // When
    await page.goto("/cards/public-token-001");
    await page.getByRole("link", { name: "내 CoffeeDex Taste Card 만들기" }).click();
    await expect(page).toHaveURL("/onboarding?source=public_card&token=public-token-001");
    await page.getByTestId("onboarding-first-card-cta").click();

    // Then
    await expect(page).toHaveURL(captureActivationPath);
    await expect(page.getByText("방금 본 커피처럼 빠른 기록을 시작해요")).toBeVisible();
    await page.getByLabel("원두 이름").fill("Ethiopia Guji");
    await page.getByLabel("로스터리").fill("프릳츠 커피");
    await page.getByRole("radio", { name: "또 사고 싶어요" }).check();
    await page.getByLabel("한 줄 메모").fill("복숭아 단맛을 다시 찾고 싶다.");
    await page.getByRole("checkbox", { name: "이 내용으로 기록할게요" }).check();
    await page.getByRole("button", { name: "내 CoffeeDex에 저장" }).click();
    await expect(page).toHaveURL(
      `/auth?redirect=${encodeURIComponent("/capture?resume=1")}`,
    );
    await expectKoreanAuthGate(page);
  });

  test("renders Korean auth gate for direct unauthenticated dashboard activation", async ({ page }) => {
    // Given
    await mockAuthGateRoutes(page);

    // When
    await page.goto(dashboardActivationPath);

    // Then
    await expect(page).toHaveURL(
      `/auth?redirect=${encodeURIComponent(dashboardActivationPath)}`,
    );
    await expectKoreanAuthGate(page);
  });

  test("sanitizes malformed external redirects to dashboard on auth page", async ({ page }) => {
    // Given
    await mockAuthGateRoutes(page);

    // When
    await page.goto("/auth?redirect=https://evil.example");

    // Then
    await expectKoreanAuthGate(page);
    await expect(page.getByText(/로그인 후 이동:/)).toHaveCount(0);
  });
});

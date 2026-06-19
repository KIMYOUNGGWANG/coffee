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

async function fulfillJson(route: Route, body: unknown): Promise<void> {
  await route.fulfill({
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

async function mockActivationRoutes(page: Page, eventNames: string[]): Promise<void> {
  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;

    switch (pathname) {
      case "/api/v1/public/cards/public-token-001":
        await fulfillJson(route, publicCardResponse);
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
      case "/api/v1/analytics": {
        const body = request.postDataJSON() as { readonly eventName?: string };
        if (typeof body.eventName === "string") {
          eventNames.push(body.eventName);
        }
        await fulfillJson(route, { received: true });
        return;
      }
      default:
        await route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({ error: { message: `Unhandled test route: ${pathname}` } }),
        });
    }
  });
}

test.describe("Viral activation loop", () => {
  test("prefills first-card wizard from selected onboarding taste profile", async ({ page }) => {
    // Given
    const eventNames: string[] = [];
    await mockActivationRoutes(page, eventNames);

    // When
    await page.goto("/onboarding");
    await page.getByTestId("taste-profile-sweet").click();

    // Then
    await expect(page.getByTestId("taste-profile-selection-copy")).toContainText("달고 고소한 컵");
    const onboardingCta = page.getByTestId("onboarding-first-card-cta");
    await expect(onboardingCta).toHaveAttribute(
      "href",
      "/dashboard?intent=first_card&source=onboarding&taste_profile=sweet",
    );

    // When
    await onboardingCta.click();

    // Then
    await expect(page.getByRole("heading", { name: "새로운 테이스팅 카드" })).toBeVisible();
    await expect(page.getByTestId("taste-profile-prefill")).toContainText("달고 고소한 컵");
    await expect(page.getByTestId("taste-profile-prefill-sweetness")).toHaveText("단맛 5");
    await expect.poll(() => eventNames).toContain("first_card_cta_clicked");
  });

  test("routes public-card visitors through onboarding into first-card creation", async ({ page }) => {
    // Given
    const eventNames: string[] = [];
    await mockActivationRoutes(page, eventNames);

    // When
    await page.goto("/cards/public-token-001");
    const publicCardCta = page.getByRole("link", { name: "내 CoffeeDex Taste Card 만들기" });
    await expect(publicCardCta).toHaveAttribute("href", "/onboarding?source=public_card&token=public-token-001");
    await publicCardCta.click();

    // Then
    await expect(page).toHaveURL("/onboarding?source=public_card&token=public-token-001");
    await expect(page.getByText("방금 본 공개 카드처럼")).toBeVisible();

    // When
    const onboardingCta = page.getByRole("link", { name: "첫 Taste Card 시작하기" });
    await expect(onboardingCta).toHaveAttribute(
      "href",
      "/dashboard?intent=first_card&source=public_card&token=public-token-001",
    );
    await onboardingCta.click();

    // Then
    await expect(page.getByRole("heading", { name: "새로운 테이스팅 카드" })).toBeVisible();
    await expect.poll(() => eventNames).toContain("first_card_cta_clicked");
  });
});

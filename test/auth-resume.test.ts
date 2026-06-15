import { expect, test } from "@playwright/test";
import type { Page, Route } from "@playwright/test";

const checkoutIntentPath = "/dashboard?checkout_intent=premium_subscription";

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
const loginRequiredResponse = {
  error: {
    code: 401,
    message: "로그인이 필요합니다. Hyangmi 계정으로 다시 로그인해주세요.",
  },
} as const;
const authUser = {
  id: "user-hyangmi-resume",
  aud: "authenticated",
  role: "authenticated",
  email: "hyangmi@example.com",
  app_metadata: { provider: "email", providers: ["email"] },
  user_metadata: {},
  created_at: "2026-06-14T01:23:45.000Z",
} as const;

async function fulfillJson(route: Route, body: unknown, status = 200): Promise<void> {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

async function mockSupabaseAuthRoutes(
  page: Page,
  options: { readonly onPasswordSignIn?: () => void } = {},
): Promise<void> {
  await page.route("**/auth/v1/**", async (route) => {
    const url = new URL(route.request().url());

    if (url.pathname.endsWith("/auth/v1/token") && url.searchParams.get("grant_type") === "password") {
      options.onPasswordSignIn?.();
      await fulfillJson(route, {
        access_token: "mock-access-token",
        token_type: "bearer",
        expires_in: 3600,
        refresh_token: "mock-refresh-token",
        user: authUser,
      });
      return;
    }

    if (url.pathname.endsWith("/auth/v1/signup")) {
      await fulfillJson(route, {
        user: {
          ...authUser,
          confirmation_sent_at: "2026-06-14T01:24:00.000Z",
          confirmed_at: null,
          email_confirmed_at: null,
          identities: [],
        },
        session: null,
      });
      return;
    }

    if (url.pathname.endsWith("/auth/v1/user")) {
      await fulfillJson(route, { user: authUser });
      return;
    }

    await fulfillJson(route, { error: { message: `Unhandled auth route: ${url.pathname}` } }, 404);
  });
}

async function mockDashboardRoutes(page: Page, isSignedIn: () => boolean): Promise<void> {
  await page.route("**/api/v1/**", async (route) => {
    const pathname = new URL(route.request().url()).pathname;

    if (pathname === "/api/v1/analytics") {
      await fulfillJson(route, { received: true });
      return;
    }

    if (!isSignedIn()) {
      await fulfillJson(route, loginRequiredResponse, 401);
      return;
    }

    switch (pathname) {
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
      default:
        await fulfillJson(route, { error: { message: `Unhandled test route: ${pathname}` } }, 404);
    }
  });
}

async function signInWithKoreanForm(page: Page): Promise<void> {
  await expect(page.getByTestId("auth-gate-ready")).toBeVisible();
  await page.getByLabel("이메일").fill("hyangmi@example.com");
  await page.getByLabel("비밀번호").fill("correct-horse-battery-staple");
  const loginButton = page.getByRole("button", { name: "로그인" });
  await expect(loginButton).toBeEnabled();
  await loginButton.click();
}

async function signUpWithKoreanForm(page: Page): Promise<void> {
  await expect(page.getByTestId("auth-gate-ready")).toBeVisible();
  await page.getByLabel("이메일").fill("new-hyangmi@example.com");
  await page.getByLabel("비밀번호").fill("correct-horse-battery-staple");
  const signUpButton = page.getByRole("button", { name: "회원가입" });
  const signUpResponse = page.waitForResponse((response) => {
    return response.url().includes("/auth/v1/signup") && response.request().method() === "POST";
  });
  await expect(signUpButton).toBeEnabled();
  await Promise.all([signUpResponse, signUpButton.click()]);
}

test.describe("Hyangmi auth resume conversion", () => {
  test.beforeEach(async ({ context, page }) => {
    await context.clearCookies();
    await page.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
  });

  test("shows Korean email-confirmation guidance for no-session sign-up and sanitizes external redirects", async ({ browser }) => {
    // Given
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
    await mockSupabaseAuthRoutes(page);

    try {
      // When
      await page.goto(`http://127.0.0.1:3000/auth?redirect=${encodeURIComponent(checkoutIntentPath)}`);
      await signUpWithKoreanForm(page);

      // Then
      await expect(page.getByRole("status")).toContainText("가입 확인 메일을 보냈습니다");
      await expect(page.getByRole("status")).toContainText("메일 인증 후 Hyangmi에 로그인해주세요");
      await expect(page.getByRole("status")).toContainText(`로그인 후 이동: ${checkoutIntentPath}`);

      // When
      await page.goto("http://127.0.0.1:3000/auth?redirect=https://evil.example/dashboard?checkout_intent=premium_subscription");

      // Then
      await expect(page.getByText("로그인 후 이동: /dashboard", { exact: true })).toBeVisible();
    } finally {
      await context.close();
    }
  });

  test("C001 resumes Korean password sign-in into the public-card first-card wizard", async ({ page }) => {
    // Given
    await mockSupabaseAuthRoutes(page);
    await mockDashboardRoutes(page, () => true);

    // When
    await page.goto("/auth?redirect=/dashboard?intent=first_card%26source=public_card%26token=public-token-001");
    await signInWithKoreanForm(page);

    // Then
    await expect(page).toHaveURL(/\/dashboard(?:\?|$)/);
    await expect(page.getByRole("heading", { name: "새로운 테이스팅 카드" })).toBeVisible();
    await expect(page.getByText(/401|AuthApiError|로그인이 필요|인증되지 않은/)).toHaveCount(0);
    await page.screenshot({ path: ".omo/evidence/auth-resume-c001.png", fullPage: true });
  });

  test("C002 preserves checkout_intent through auth and opens the premium payment dialog", async ({ page }) => {
    // Given
    let signedIn = false;
    await mockSupabaseAuthRoutes(page, {
      onPasswordSignIn: () => {
        signedIn = true;
      },
    });
    await mockDashboardRoutes(page, () => signedIn);

    // When
    await page.goto(checkoutIntentPath);

    // Then
    await expect(page).toHaveURL(`/auth?redirect=${encodeURIComponent(checkoutIntentPath)}`);
    await page.goto(`/auth?redirect=${encodeURIComponent(checkoutIntentPath)}`);
    await expect(page.getByText(`로그인 후 이동: ${checkoutIntentPath}`)).toBeVisible();

    // When
    await signInWithKoreanForm(page);

    // Then
    await expect(page).toHaveURL(/\/dashboard(?:\?|$)/);
    await expect(page.getByRole("dialog", { name: "프리미엄 커피 도서관 패키지" })).toBeVisible();
    await expect(page.getByText("로그인 후 이어서 결제할 상품: Hyangmi Premium 구독 (월간)")).toBeVisible();
    await expect(page.getByText(/401|AuthApiError|로그인이 필요|인증되지 않은/)).toHaveCount(0);
    await page.screenshot({ path: ".omo/evidence/auth-resume-c002.png", fullPage: true });
  });

});

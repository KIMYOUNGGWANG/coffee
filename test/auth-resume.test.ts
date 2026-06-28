import { expect, test } from "@playwright/test";
import type { Page, Route } from "@playwright/test";

const checkoutIntentPath = "/dashboard?checkout_intent=premium_subscription";
const publicCardActivationPath =
  "/dashboard?intent=first_card&source=public_card&mode=quick&token=public-token-001";

async function fulfillOAuthAuthorize(route: Route): Promise<void> {
  await route.fulfill({
    status: 200,
    contentType: "text/html",
    body: "<!doctype html><title>OAuth redirect captured</title><main>OAuth redirect captured</main>",
  });
}

async function captureGoogleOAuthUrl(page: Page): Promise<URL> {
  await page.route("**/auth/v1/authorize**", fulfillOAuthAuthorize);
  const googleButton = page.getByRole("button", { name: "Google로 계속하기" });

  await expect(googleButton).toBeEnabled();
  await Promise.all([
    page.waitForURL(/\/auth\/v1\/authorize/),
    googleButton.click(),
  ]);

  return new URL(page.url());
}

function expectOAuthNextPath(oAuthUrl: URL, expectedNextPath: string): void {
  expect(oAuthUrl.searchParams.get("provider")).toBe("google");

  const redirectTo = oAuthUrl.searchParams.get("redirect_to");
  expect(redirectTo).not.toBeNull();

  const callbackUrl = new URL(redirectTo ?? "");
  expect(callbackUrl.origin).toBe("http://127.0.0.1:3000");
  expect(callbackUrl.pathname).toBe("/auth/callback");
  expect(callbackUrl.searchParams.get("next")).toBe(expectedNextPath);
}

test.describe("CoffeeDex auth resume conversion", () => {
  test.beforeEach(async ({ context, page }) => {
    await context.clearCookies();
    await page.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
  });

  test("sanitizes external redirects before starting Google OAuth", async ({ page }) => {
    // When
    await page.goto("/auth?redirect=https://evil.example/dashboard?checkout_intent=premium_subscription");

    // Then
    await expect(page.getByRole("heading", { name: "CoffeeDex 계정으로 계속하기" })).toBeVisible();
    await expect(page.getByText(/로그인 후 이동:/)).toHaveCount(0);

    const oAuthUrl = await captureGoogleOAuthUrl(page);
    expectOAuthNextPath(oAuthUrl, "/dashboard");
  });

  test("C001 resumes Google OAuth into the public-card first-card wizard", async ({ page }) => {
    // When
    await page.goto(`/auth?redirect=${encodeURIComponent(publicCardActivationPath)}`);

    // Then
    await expect(page.getByText(/로그인 후 이동:/)).toHaveCount(0);

    const oAuthUrl = await captureGoogleOAuthUrl(page);
    expectOAuthNextPath(oAuthUrl, publicCardActivationPath);
  });

  test("C002 preserves checkout_intent through Google OAuth", async ({ page }) => {
    // When
    await page.goto(`/auth?redirect=${encodeURIComponent(checkoutIntentPath)}`);

    // Then
    await expect(page.getByText(/로그인 후 이동:/)).toHaveCount(0);

    const oAuthUrl = await captureGoogleOAuthUrl(page);
    expectOAuthNextPath(oAuthUrl, checkoutIntentPath);
  });
});

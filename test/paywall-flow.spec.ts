import { test, expect } from "@playwright/test";

test.describe("Monetization Paywall Flow", () => {
  test("Should enforce 3 scans per month limit and show PaywallModal", async ({ page, request }) => {
    // Note: Since this is an E2E test without a live Stripe key, we'll mock the 402 response 
    // to simulate the user hitting the monthly limit.
    
    // 0. Mock dashboard APIs to simulate authenticated state
    await page.route("**/api/v1/**", async (route) => {
      const requestUrl = new URL(route.request().url());

      switch (requestUrl.pathname) {
        case "/api/v1/shelf":
          await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: [] }) });
          return;
        case "/api/v1/cards":
          await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: [] }) });
          return;
        case "/api/v1/profile":
          await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: { is_premium: false, scans_used: 3, monthly_scan_limit: 3, credits: 0, has_pdf_access: false } }) });
          return;
        case "/api/v1/profile/analytics":
          await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: { aiAnalysis: "", averageAcidity: 0, averageBody: 0, averageSweetness: 0, topTags: [], totalCards: 0 } }) });
          return;
        case "/api/v1/subscription":
          await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: { status: "inactive" } }) });
          return;
        case "/api/v1/analytics":
          await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ received: true }) });
          return;
        case "/api/v1/coffee-dna":
          await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: null }) });
          return;
        case "/api/v1/rebuy-intelligence":
        case "/api/v1/dial-in-coach":
          await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: null }) });
          return;
        case "/api/v1/brewing-logs":
          await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: [] }) });
          return;
        case "/api/v1/cards/scan":
          await route.fulfill({
            status: 402,
            contentType: "application/json",
            body: JSON.stringify({
              error: {
                code: 402,
                message: "무료 스캔 횟수(월 3회)를 모두 사용했습니다. 무제한 스캔을 위해 Premium으로 업그레이드하세요.",
                details: { allowed: false }
              }
            })
          });
          return;
        case "/api/v1/checkout":
          const payload = route.request().postDataJSON();
          expect(payload.itemType).toBe("premium_subscription");
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ url: "https://checkout.stripe.com/mock-url" })
          });
          return;
        default:
          await route.continue();
      }
    });
    // 3. Go to the dashboard and trigger a scan
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    
    await page.waitForTimeout(1000);

    await page.getByRole("button", { name: "라벨 스캔으로 채우기" }).first().click();

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-coffee.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('mock-image-data-base64-string')
    });

    await expect(page.getByText("월간 무료 사진 판독 한도와 보유 크레딧을 모두 사용했습니다")).toBeVisible({ timeout: 10000 });
    const paymentDialog = page.getByRole("dialog", { name: "추가 기능 및 결제" });
    await expect(paymentDialog).toBeVisible();
    await expect(paymentDialog.getByText("CoffeeDex Premium 구독 (월간)")).toBeVisible();

    // 5. Click the Premium upgrade button and wait for the checkout request
    const [checkoutRequest] = await Promise.all([
      page.waitForRequest("/api/v1/checkout"),
      paymentDialog.getByRole("button", { name: "구독하기", exact: true }).click()
    ]);

    expect(checkoutRequest.url()).toContain("/api/v1/checkout");
    
    // Since we mocked window.location.href assignment with the mock URL,
    // We can check if the page navigated.
    // Wait for the navigation to happen (since we intercepted and returned a mock URL,
    // the app will try to assign window.location.href = "https://checkout.stripe.com/mock-url")
    // Because Playwright might throw a navigation error to a mock external site, 
    // we just ensure the mock route was hit successfully.
  });
});

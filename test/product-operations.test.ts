import { expect, test } from "@playwright/test";

test.describe("Hyangmi product operations UX", () => {
  test("tracks landing pricing intent and routes premium CTA into checkout intent", async ({ page }) => {
    const eventNames: string[] = [];

    await page.route("**/api/v1/analytics", async (route) => {
      const body = route.request().postDataJSON() as { readonly eventName?: string };
      if (typeof body.eventName === "string") eventNames.push(body.eventName);
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ received: true }),
      });
    });

    await page.goto("/");
    await expect(page.getByTestId("landing-pricing-section")).toBeVisible();

    await page.getByRole("link", { name: "Premium으로 시작" }).click();

    await expect(page).toHaveURL(/\/dashboard\?checkout_intent=premium_subscription/);
    await expect.poll(() => eventNames).toContain("pricing_cta_clicked");
  });

  test("submits a billing support request without a live downstream service", async ({ page }) => {
    const eventNames: string[] = [];
    let supportPayload: unknown = null;

    await page.route("**/api/v1/analytics", async (route) => {
      const body = route.request().postDataJSON() as { readonly eventName?: string };
      if (typeof body.eventName === "string") eventNames.push(body.eventName);
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ received: true }),
      });
    });
    await page.route("**/api/v1/support", async (route) => {
      supportPayload = route.request().postDataJSON();
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ data: { ticketId: "hyangmi-support-20260615-001" } }),
      });
    });

    await page.goto("/support/billing");
    await page.getByLabel("이메일").fill("minji@example.com");
    await page.getByLabel("문의 유형").selectOption("refund_request");
    await page.getByLabel("문의 내용").fill("PDF를 실수로 구매해서 환불 가능 여부를 확인하고 싶습니다.");
    await page.getByRole("button", { name: "문의 접수" }).click();

    await expect(page.getByText("접수번호 hyangmi-support-20260615-001")).toBeVisible();
    await expect.poll(() => eventNames).toContain("billing_support_started");
    await expect.poll(() => eventNames).toContain("support_request_submitted");
    expect(supportPayload).toMatchObject({
      email: "minji@example.com",
      category: "refund_request",
    });
  });
});

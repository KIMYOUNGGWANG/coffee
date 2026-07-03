import { expect, test } from "@playwright/test";

test.describe("CoffeeDex product surface", () => {
  test("renders the current CoffeeDex home experience", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: /다시 살 원두를 20초 만에 기억/ })).toBeVisible();
    await expect(page.getByText("CoffeeDex").first()).toBeVisible();
    await expect(page.getByText("Korea-first Specialty Coffee Memory")).toBeVisible();
    await expect(page.getByRole("link", { name: "20초 기록 시작" }).first()).toBeVisible();
  });

  test("exposes the health route", async ({ request }) => {
    const health = await request.get("/api/health");

    expect(health.ok()).toBeTruthy();
  });
});

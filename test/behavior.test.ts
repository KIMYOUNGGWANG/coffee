import { expect, test } from "@playwright/test";

test.describe("Hyangmi product surface", () => {
  test("renders the current Hyangmi home experience", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: /한국 스페셜티 커피/ })).toBeVisible();
    await expect(page.getByText("Hyangmi").first()).toBeVisible();
    await expect(page.getByText("Korea-first Specialty Coffee Memory")).toBeVisible();
    await expect(page.getByRole("link", { name: "첫 테이스팅 기록 시작" })).toBeVisible();
  });

  test("exposes the health route", async ({ request }) => {
    const health = await request.get("/api/health");

    expect(health.ok()).toBeTruthy();
  });
});

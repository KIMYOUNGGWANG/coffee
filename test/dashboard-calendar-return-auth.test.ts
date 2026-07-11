import { expect, test } from "@playwright/test";

test("preserves an opaque calendar return through an expired dashboard session", async ({ page }) => {
  await page.route("**/api/v1/**", async (route) => {
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ error: { message: "인증되지 않은 사용자입니다. 로그인이 필요합니다." } }),
    });
  });

  await page.goto("/dashboard?source=rebuy_calendar&rebuy_token=f70cfec8-51f9-4667-a80f-ca38bfbc2b6d", { waitUntil: "domcontentloaded" });

  await expect(page).toHaveURL(
    `/auth?redirect=${encodeURIComponent("/dashboard?source=rebuy_calendar&rebuy_token=f70cfec8-51f9-4667-a80f-ca38bfbc2b6d")}`,
  );
});

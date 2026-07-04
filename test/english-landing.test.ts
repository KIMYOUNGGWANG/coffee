import { expect, test } from "@playwright/test";

test.describe("CoffeeDex English landing", () => {
  test("renders the English product promise and language switch", async ({ page }) => {
    await page.goto("/en", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: /Remember coffees worth buying again/ })).toBeVisible();
    await expect(page.getByRole("link", { name: "한국어" })).toHaveAttribute("href", "/");
    await expect(page.getByRole("link", { name: "Start a 20-sec record" }).first()).toHaveAttribute("href", "/capture");
    await expect(page.getByText("Marketplace, referral, roaster partnerships, and community feeds are future layers")).toBeVisible();
  });
});

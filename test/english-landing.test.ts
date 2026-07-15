import { expect, test } from "@playwright/test";

test.describe("CoffeeDex English landing", () => {
  test("renders the English product promise and language switch", async ({ page }) => {
    await page.goto("/en", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: /Remember coffees worth buying again/ })).toBeVisible();
    await expect(page.getByRole("link", { name: "한국어" })).toHaveAttribute("href", "/");
    await expect(page.getByRole("link", { name: "Start a 20-sec record" }).first()).toHaveAttribute("href", "/capture");
    await expect(page.getByRole("heading", { name: "Private 20-sec record" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Memory worth buying again" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Buy-again list" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Buy-again intelligence" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "JSON/CSV ownership export" })).toBeVisible();
    await expect(page.getByText("Share and PDF outputs stay secondary compatibility layers.")).toBeVisible();
    await expect(page.getByText("Taste Passport")).toHaveCount(0);
    await expect(page.getByText("Story Export")).toHaveCount(0);
    await expect(page.getByText("Marketplace, referral, roaster partnerships, and community feeds are future layers")).toBeVisible();
  });
});

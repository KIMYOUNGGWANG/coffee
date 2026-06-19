import { expect, test } from "@playwright/test";
import { readFile, stat } from "node:fs/promises";

test("downloads a non-empty CoffeeDex CSV attachment", async ({ page }, testInfo) => {
  await page.route("**/api/v1/export?format=csv", async (route) => {
    await route.fulfill({
      body: "export_version,exported_at,record_type,id,title\r\n1,2026-06-18T11:00:00.000Z,tasting_card,card-1,Ethiopia Sidama\r\n",
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": 'attachment; filename="coffeedex-memories-2026-06-18.csv"',
        "Content-Type": "text/csv; charset=utf-8",
      },
    });
  });
  await page.setContent(
    '<base href="http://127.0.0.1:3000"><a href="/api/v1/export?format=csv">CoffeeDex CSV export</a>',
  );

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "CoffeeDex CSV export" }).click();
  const download = await downloadPromise;
  const artifactPath = testInfo.outputPath(download.suggestedFilename());
  await download.saveAs(artifactPath);

  expect(download.suggestedFilename()).toBe("coffeedex-memories-2026-06-18.csv");
  expect((await stat(artifactPath)).size).toBeGreaterThan(0);
  expect(await readFile(artifactPath, "utf8")).toContain("Ethiopia Sidama");
  await testInfo.attach(download.suggestedFilename(), { path: artifactPath, contentType: "text/csv" });
  console.log(`export-download=${artifactPath}`);
});

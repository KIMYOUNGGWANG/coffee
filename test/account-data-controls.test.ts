import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import type { Page, Route } from "@playwright/test";

const confirmation = "내 CoffeeDex 계정을 영구 삭제합니다";
const evidenceDirectory = ".agent/evidence/account-data-controls";
const settingsUrl = `${process.env.ACCOUNT_CONTROLS_BASE_URL ?? ""}/settings`;

async function fulfillExport(route: Route): Promise<void> {
  const format = new URL(route.request().url()).searchParams.get("format");
  const filename = `coffeedex-memories-2026-06-18.${format}`;
  await route.fulfill({
    contentType: format === "csv" ? "text/csv" : "application/json",
    headers: { "Content-Disposition": `attachment; filename="${filename}"` },
    body: format === "csv" ? "title\nGuji" : JSON.stringify({ memories: [{ title: "Guji" }] }),
  });
}

async function prepareDeletion(page: Page): Promise<void> {
  const deleteButton = page.getByRole("button", { name: "계정 영구 삭제" });
  await expect(deleteButton).toBeDisabled();
  await page.getByLabel("아래 확인 문구를 정확히 입력하세요.").fill(confirmation);
  await page.getByLabel("모든 데이터가 영구 삭제되며 복구할 수 없음을 이해했습니다.").check();
  await expect(deleteButton).toBeEnabled();
}

test.beforeEach(async ({ page }) => {
  await mkdir(evidenceDirectory, { recursive: true });
  await page.setViewportSize({ width: 375, height: 900 });
});

test("downloads free JSON and CSV exports and completes confirmed account deletion", async ({ page }) => {
  const deletionPayloads: unknown[] = [];
  await page.route("**/api/v1/export?format=*", fulfillExport);
  await page.route("**/api/v1/account", async (route) => {
    deletionPayloads.push(route.request().postDataJSON());
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ data: { status: "deleted" } }),
    });
  });
  await page.goto(settingsUrl);

  for (const format of ["json", "csv"] as const) {
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("link", { name: `${format.toUpperCase()} 내려받기` }).click(),
    ]);
    expect(download.suggestedFilename()).toBe(`coffeedex-memories-2026-06-18.${format}`);
  }

  await prepareDeletion(page);
  await page.getByRole("button", { name: "계정 영구 삭제" }).click();

  await expect(page.getByRole("status")).toHaveText("계정 삭제가 완료되었습니다.");
  await expect(page.getByRole("button", { name: "삭제 완료" })).toBeDisabled();
  expect(deletionPayloads).toEqual([{
    confirmation,
    acknowledgePermanentDeletion: true,
  }]);
  await page.screenshot({ path: `${evidenceDirectory}/happy-mobile.png`, fullPage: true });
  await page.setViewportSize({ width: 768, height: 900 });
  await page.screenshot({ path: `${evidenceDirectory}/happy-tablet.png`, fullPage: true });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.screenshot({ path: `${evidenceDirectory}/happy-desktop.png`, fullPage: true });
});

test("keeps account deletion recoverable after an API failure", async ({ page }) => {
  let attempt = 0;
  await page.route("**/api/v1/account", async (route) => {
    attempt += 1;
    if (attempt === 1) {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: { code: 500, message: "계정 삭제를 완료하지 못했습니다. 다시 시도해주세요." } }),
      });
      return;
    }
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ data: { status: "deleted" } }),
    });
  });
  await page.goto(settingsUrl);
  await prepareDeletion(page);

  await page.getByRole("button", { name: "계정 영구 삭제" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "계정 삭제를 완료하지 못했습니다. 다시 시도해주세요." }),
  ).toHaveText("계정 삭제를 완료하지 못했습니다. 다시 시도해주세요.");
  await expect(page.getByRole("button", { name: "계정 영구 삭제" })).toBeEnabled();
  await expect(page.getByLabel("아래 확인 문구를 정확히 입력하세요.")).toHaveValue(confirmation);
  await page.screenshot({ path: `${evidenceDirectory}/failure-recoverable-mobile.png`, fullPage: true });

  await page.getByRole("button", { name: "계정 영구 삭제" }).click();
  await expect(page.getByRole("status")).toHaveText("계정 삭제가 완료되었습니다.");
  expect(attempt).toBe(2);
});

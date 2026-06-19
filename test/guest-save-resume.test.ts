import { expect, test } from "@playwright/test";
import type { Page, Route } from "@playwright/test";

const guestDraft = {
  version: 1,
  created_at: "2026-06-18T12:00:00.000Z",
  extracted: {
    title: "Colombia Huila",
    subtitle: "Local Roaster",
    package_origin: "Huila, Colombia",
    package_process: null,
    tags: ["caramel"],
    scan_source: "manual",
    scan_confidence: null,
  },
  corrections: {
    title: "Colombia Huila",
    subtitle: "Local Roaster",
    package_origin: "Huila, Colombia",
    package_process: "Washed",
    tags: ["caramel", "apple"],
    raw_note: "단맛이 편안하고 매일 마시기 좋다.",
    acidity: 3,
    sweetness: 4,
    body: 3,
    repurchase_intent: "maybe",
    repurchase_reasons: ["데일리 커피"],
    corrected_fields: ["package_process", "tags"],
  },
} as const;

async function fulfillJson(route: Route, body: unknown, status = 200): Promise<void> {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

async function hasGuestDraft(page: Page): Promise<boolean> {
  return page.evaluate(() => window.localStorage.getItem("coffeedex.guest-draft") !== null);
}

test("resumed save retains the draft on failure and clears it only after a 201 retry", async ({ page }) => {
  let attempts = 0;
  await page.setViewportSize({ width: 375, height: 812 });
  await page.addInitScript((draft) => {
    if (window.sessionStorage.getItem("guest-resume-test-ready") === null) {
      window.localStorage.setItem("coffeedex.guest-draft", JSON.stringify(draft));
      window.sessionStorage.setItem("guest-resume-test-ready", "1");
    }
  }, guestDraft);
  await page.route("**/api/v1/cards", async (route) => {
    attempts += 1;
    if (attempts === 1) {
      await fulfillJson(route, { error: { code: 500, message: "잠시 저장할 수 없습니다." } }, 500);
      return;
    }
    await fulfillJson(route, {
      data: {
        id: "memory-001",
        title: guestDraft.corrections.title,
      },
    }, 201);
  });

  await page.goto("/capture?resume=1");

  await expect(page.getByText("잠시 저장할 수 없습니다.", { exact: true })).toBeVisible();
  expect(await hasGuestDraft(page)).toBe(true);
  await expect(page.getByLabel("원두 이름")).toHaveValue("Colombia Huila");
  await expect(page.getByLabel("가공 방식")).toHaveValue("Washed");
  await page.screenshot({ path: "artifacts/guest-capture/mobile-save-retry.png", fullPage: true });

  await page.getByRole("button", { name: "저장 다시 시도" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  expect(await hasGuestDraft(page)).toBe(false);
  expect(attempts).toBe(2);
});

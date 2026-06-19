import { expect, test } from "@playwright/test";
import type { Page, Route } from "@playwright/test";

async function fulfillJson(route: Route, body: unknown, status = 200): Promise<void> {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

async function readGuestDraft(page: Page): Promise<string | null> {
  return page.evaluate(() => window.localStorage.getItem("coffeedex.guest-draft"));
}

test.describe("CoffeeDex guest capture", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.addInitScript(() => {
      if (window.sessionStorage.getItem("guest-capture-test-ready") === null) {
        window.localStorage.clear();
        window.sessionStorage.setItem("guest-capture-test-ready", "1");
      }
    });
  });

  test("scans package facts, keeps taste user-owned, and asks for auth only when saving", async ({ page }) => {
    let createBody: unknown;
    await page.route("**/api/v1/cards/scan", async (route) => {
      await fulfillJson(route, {
        data: {
          kind: "success",
          source: "gemini",
          title: "Ethiopia Guji",
          subtitle: "April Coffee",
          origin: "Guji, Ethiopia",
          process: null,
          tags: ["jasmine", "peach"],
          uncertainty: {
            title: 0.04,
            subtitle: 0.08,
            origin: 0.42,
            process: null,
            tags: 0.35,
          },
        },
        guest: { trial_used: true },
      });
    });
    await page.route("**/api/v1/cards", async (route) => {
      createBody = route.request().postDataJSON();
      await fulfillJson(route, { error: { code: 401, message: "로그인이 필요합니다." } }, 401);
    });

    await page.goto("/capture");
    await expect(page.getByRole("heading", { name: "오늘 마신 커피를 남겨보세요" })).toBeVisible();
    await expect(page).toHaveURL(/\/capture$/);

    await page.getByLabel("원두 패키지 사진 선택").setInputFiles({
      name: "coffee-label.png",
      mimeType: "image/png",
      buffer: Buffer.from("guest-photo"),
    });
    await page.getByRole("button", { name: "라벨 읽기" }).click();

    await expect(page.getByLabel("원두 이름")).toHaveValue("Ethiopia Guji");
    await expect(page.getByLabel("가공 방식")).toHaveValue("");
    await expect(page.getByText("확실하지 않음", { exact: true })).toBeVisible();
    await expect(page.getByRole("slider", { name: "산미" })).toHaveValue("3");
    await expect(page.getByRole("slider", { name: "단맛" })).toHaveValue("3");
    await expect(page.getByRole("slider", { name: "바디감" })).toHaveValue("3");
    expect(await readGuestDraft(page)).toBeNull();
    await page.screenshot({ path: "artifacts/guest-capture/mobile-editor.png", fullPage: true });

    await page.getByLabel("가공 방식").fill("Washed");
    await page.getByRole("slider", { name: "산미" }).fill("4");
    await page.getByRole("slider", { name: "단맛" }).fill("5");
    await page.getByRole("radio", { name: "또 사고 싶어요" }).check();
    await page.getByLabel("재구매 이유").fill("깨끗한 단맛, 향이 오래감");
    await page.getByLabel("나만의 메모").fill("식으면서 복숭아 향이 더 선명했다.");

    const saveButton = page.getByRole("button", { name: "내 CoffeeDex에 저장" });
    await expect(saveButton).toBeDisabled();
    await page.getByRole("checkbox", { name: "이 내용으로 기록할게요" }).check();
    await saveButton.click();

    await expect(page).toHaveURL(/\/auth\?redirect=%2Fcapture%3Fresume%3D1$/);
    const storedDraft = await readGuestDraft(page);
    expect(storedDraft).not.toBeNull();
    expect(storedDraft).not.toContain("data:image");
    expect(storedDraft).not.toContain("guest-photo");
    expect(createBody).toMatchObject({
      title: "Ethiopia Guji",
      packageProcess: "Washed",
      metric1: 4,
      metric2: 5,
      scanSource: "gemini",
      imageUrl: null,
      confirmed: true,
    });
    await page.screenshot({ path: "artifacts/guest-capture/mobile-auth-gate.png", fullPage: true });
  });

  test("opens a blank manual draft without scanning or fabricating a sample bean", async ({ page }) => {
    let scanRequests = 0;
    await page.route("**/api/v1/cards/scan", async (route) => {
      scanRequests += 1;
      await fulfillJson(route, { error: { message: "Unexpected scan" } }, 500);
    });

    await page.goto("/capture");
    await page.getByRole("button", { name: "사진 없이 직접 입력" }).click();

    await expect(page.getByLabel("원두 이름")).toHaveValue("");
    await expect(page.getByLabel("로스터리 / 브랜드")).toHaveValue("");
    await expect(page.getByText(/Ethiopia|Guji|Fritz|Sidama/)).toHaveCount(0);
    expect(scanRequests).toBe(0);
  });
});

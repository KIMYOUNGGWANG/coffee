import { mkdir } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const evidenceDirectory = "artifacts/mobile-note-detail";

async function createNote(page: Page, values: {
  readonly coffeeName: string;
  readonly roaster?: string;
  readonly memory?: string;
}): Promise<void> {
  await page.goto("/note/create");
  await page.getByPlaceholder("원두 이름").fill(values.coffeeName);
  if (values.roaster) {
    await page.getByPlaceholder("로스터리").fill(values.roaster);
  }
  if (values.memory) {
    await page.getByPlaceholder("예: 식으니까 더 편했다.").fill(values.memory);
  }
  await page.getByText("다시 살래요", { exact: true }).click();
  await page.getByText("저장", { exact: true }).click();
  await expect(page).toHaveURL(/\/note\/[^/]+$/);
}

test.beforeAll(async () => {
  await mkdir(evidenceDirectory, { recursive: true });
});

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
});

test("shows a focused Coffee Note detail for a complete memory", async ({ page }) => {
  await createNote(page, {
    coffeeName: "에티오피아 구지",
    roaster: "커피 리브레",
    memory: "식으니까 복숭아 향이 더 편했다.",
  });

  await expect(page.getByText("Coffee Note", { exact: true })).toBeVisible();
  await expect(page.getByTestId("note-detail-hero")).toContainText("느낌");
  await expect(page.getByTestId("note-detail-hero")).toContainText("4 / 5");
  await expect(page.getByTestId("note-detail-memory")).toContainText("식으니까 복숭아 향이 더 편했다.");
  await expect(page.getByTestId("note-detail-facts")).toContainText("커피 리브레");
  await expect(page.getByText("다시 살래요", { exact: true })).toBeVisible();
  await page.screenshot({ path: `${evidenceDirectory}/happy-mobile.png`, fullPage: true });

  for (const viewport of [
    { width: 375, height: 812, name: "375" },
    { width: 430, height: 932, name: "430" },
    { width: 768, height: 1024, name: "768" },
    { width: 1280, height: 900, name: "1280" },
  ] as const) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: `${evidenceDirectory}/happy-${viewport.name}.png`, fullPage: true });
  }

  for (const control of [page.getByLabel("뒤로가기"), ...await page.getByLabel("노트 수정").all(), page.getByLabel("노트 삭제")]) {
    const box = await control.boundingBox();
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  }
});

test("keeps sparse and missing notes recoverable", async ({ page }) => {
  await createNote(page, { coffeeName: "이름만 남긴 컵" });

  await expect(page.getByText("로스터리 미정", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("메모 없이 저장한 컵입니다.", { exact: true })).toBeVisible();
  await page.screenshot({ path: `${evidenceDirectory}/sparse-mobile.png`, fullPage: true });

  await page.goto("/note/not-found");
  await expect(page.getByText("노트를 찾지 못했습니다.", { exact: true })).toBeVisible();
  const missingBackButton = page.getByRole("button", { name: "뒤로가기" });
  await expect(missingBackButton).toBeVisible();
  const missingBackBox = await missingBackButton.boundingBox();
  expect(missingBackBox?.width ?? 0).toBeGreaterThanOrEqual(44);
  expect(missingBackBox?.height ?? 0).toBeGreaterThanOrEqual(44);
  await page.screenshot({ path: `${evidenceDirectory}/missing-mobile.png`, fullPage: true });
});

test("preserves edit and two-step delete navigation", async ({ page }) => {
  await createNote(page, { coffeeName: "삭제 흐름 확인" });
  const detailUrl = page.url();

  await page.getByLabel("노트 수정").last().click();
  await expect(page).toHaveURL(/\/note\/create\?editId=/);
  await page.getByPlaceholder("원두 이름").fill("수정된 삭제 흐름");
  await page.getByText("저장", { exact: true }).click();
  await expect(page.getByText("수정된 삭제 흐름", { exact: true }).last()).toBeVisible();
  await page.getByLabel("노트 삭제").last().click();

  await expect(page.getByText("한 번 더", { exact: true })).toBeVisible();
  await expect(page.getByLabel("노트 삭제 확인").last()).toBeVisible();
  await page.getByLabel("노트 수정").last().click();
  await expect(page).toHaveURL(/\/note\/create\?editId=/);
  await page.goBack();
  await expect(page.getByLabel("노트 삭제").last()).toBeVisible();
  await page.getByLabel("노트 삭제").last().click();
  await page.getByLabel("노트 삭제 확인").last().click();
  await expect(page).toHaveURL(/\/passport$/);
  await page.goto(detailUrl);
  await expect(page.getByText("노트를 찾지 못했습니다.", { exact: true })).toBeVisible();
});

test("recovers when local deletion fails", async ({ page }) => {
  await createNote(page, { coffeeName: "삭제 실패 복구" });
  await page.evaluate(() => {
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function setItem(key, value) {
      if (key.includes("coffeedex/coffee-notes")) {
        throw new Error("synthetic storage failure");
      }
      return originalSetItem.call(this, key, value);
    };
  });

  await page.getByLabel("노트 삭제").last().click();
  await page.getByLabel("노트 삭제 확인").last().click();
  await expect(page.getByText("삭제하지 못했습니다. 다시 시도해 주세요.", { exact: true })).toBeVisible();
  await expect(page.getByLabel("노트 삭제").last()).toBeVisible();
});

test("renders a safe date fallback for malformed legacy storage", async ({ page }) => {
  await createNote(page, { coffeeName: "날짜 복구 확인" });
  const updated = await page.evaluate(() => {
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (!key?.includes("coffeedex/coffee-notes")) {
        continue;
      }
      const raw = window.localStorage.getItem(key);
      if (!raw) {
        return false;
      }
      window.localStorage.setItem(key, raw.replace(/"createdAt":"[^"]+"/, '"createdAt":"invalid"'));
      return true;
    }
    return false;
  });

  expect(updated).toBe(true);
  await page.reload();
  await expect(page.getByText("날짜 미정", { exact: true }).first()).toBeVisible();
});

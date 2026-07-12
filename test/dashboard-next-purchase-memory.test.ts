import { expect, test } from "@playwright/test";
import type { Page, Route, TestInfo } from "@playwright/test";

const cards = [
  {
    id: "card-colombia",
    user_id: "user-1",
    category: "coffee",
    title: "콜롬비아 엘 디비소",
    subtitle: "모모스 커피",
    image_url: "/images/onboarding/private-espresso-coffee-bag.png",
    badges: [],
    metric1: 4,
    metric2: 5,
    metric3: 3,
    metric4: 0,
    metric5: 0,
    metric6: 0,
    tags: ["복숭아", "꽃향"],
    ai_description: "복숭아와 꽃향이 선명했어요.",
    footer_meta: { date: "2026-06-01", origin: "Colombia" },
    package_origin: "Colombia",
    package_process: "Washed",
    purchase_url: "https://shop.example/colombia",
    purchase_note: "모모스 공식몰",
    repurchase_intent: "again",
    repurchase_reasons: ["식으면서 복숭아 단맛이 좋아졌어요"],
    scan_source: "manual",
    scan_confidence: null,
    corrected_fields: [],
    confirmed_at: "2026-06-01T00:00:00.000Z",
    created_at: "2026-06-01T00:00:00.000Z",
    updated_at: "2026-06-01T00:00:00.000Z",
  },
  {
    id: "card-sidama",
    user_id: "user-1",
    category: "coffee",
    title: "에티오피아 시다마",
    subtitle: "프릳츠 커피",
    image_url: "/images/premium_coffee_brewing.png",
    badges: [],
    metric1: 4,
    metric2: 4,
    metric3: 2,
    metric4: 0,
    metric5: 0,
    metric6: 0,
    tags: ["꽃향", "꿀"],
    ai_description: "꽃향과 꿀 같은 단맛이 편안했어요.",
    footer_meta: { date: "2026-05-10", origin: "Ethiopia" },
    package_origin: "Ethiopia",
    package_process: "Washed",
    purchase_url: null,
    purchase_note: null,
    repurchase_intent: "again",
    repurchase_reasons: ["꽃향이 오래 남았어요"],
    scan_source: "manual",
    scan_confidence: null,
    corrected_fields: [],
    confirmed_at: "2026-05-10T00:00:00.000Z",
    created_at: "2026-05-10T00:00:00.000Z",
    updated_at: "2026-05-10T00:00:00.000Z",
  },
] as const;

type EventPayload = {
  readonly eventName?: string;
  readonly properties?: unknown;
};

async function json(route: Route, body: unknown): Promise<void> {
  await route.fulfill({ contentType: "application/json", body: JSON.stringify(body) });
}

async function mockRoutes(page: Page, events: EventPayload[], profileUpdates: unknown[] = []): Promise<void> {
  let personalTasteLine: string | null = null;

  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;
    if (pathname === "/api/v1/analytics" && request.method() === "POST") {
      events.push(request.postDataJSON());
      await json(route, { received: true });
      return;
    }

    if (pathname === "/api/v1/profile") {
      if (request.method() === "PATCH") {
        const update = request.postDataJSON();
        profileUpdates.push(update);
        personalTasteLine = typeof update.personalTasteLine === "string" ? update.personalTasteLine : null;
      }
      await json(route, {
        data: {
          credits: 1,
          has_pdf_access: false,
          is_premium: false,
          monthly_scan_limit: 5,
          scans_used: 0,
          personal_taste_line: personalTasteLine,
        },
      });
      return;
    }

    const responses: Readonly<Record<string, unknown>> = {
      "/api/v1/cards": { data: cards },
      "/api/v1/profile/analytics": { data: { aiAnalysis: "", averageAcidity: 4, averageBody: 2.5, averageSweetness: 4.5, topTags: ["꽃향"], totalCards: 2 } },
      "/api/v1/subscription": { data: { cancelAtPeriodEnd: false, currentPeriodEnd: null, isPremium: false, lastInvoiceStatus: null, plan: "free", status: "inactive", stripeSubscriptionId: null, updatedAt: null } },
      "/api/v1/rebuy-intelligence": { data: null },
      "/api/v1/dial-in-coach": { data: null },
      "/api/v1/shelf": { data: [] },
      "/api/v1/brewing-logs": { data: [] },
    };
    const response = responses[pathname];
    if (response !== undefined) {
      await json(route, response);
      return;
    }
    await route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: { message: pathname } }) });
  });
}

test("Given an automatic taste brief, When the user rewrites it in their own words, Then the private line is saved and copied without its text entering analytics", async ({ page }) => {
  const events: EventPayload[] = [];
  const profileUpdates: unknown[] = [];
  await mockRoutes(page, events, profileUpdates);
  await page.addInitScript(() => {
    window.localStorage.setItem("coffeedex_analytics_test", "true");
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async () => undefined },
    });
  });

  await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
  const panel = page.getByRole("region", { name: "재구매 취향 문장" });
  await expect(panel).toBeVisible();
  await panel.getByRole("button", { name: "내 말로 고치기" }).click();
  await panel.getByRole("textbox", { name: "내 취향 문장" }).fill("밝은 산미는 좋지만 발효향은 적고, 식었을 때 단맛이 남는 원두를 좋아해요.");
  await panel.getByRole("button", { name: "내 취향으로 저장" }).click();

  await expect.poll(() => profileUpdates.at(-1)).toEqual({
    personalTasteLine: "밝은 산미는 좋지만 발효향은 적고, 식었을 때 단맛이 남는 원두를 좋아해요.",
  });
  await expect(panel.getByText("밝은 산미는 좋지만 발효향은 적고, 식었을 때 단맛이 남는 원두를 좋아해요.", { exact: true })).toBeVisible();
  await panel.getByRole("button", { name: "내 취향 문장 복사" }).click();
  await expect(panel.getByRole("button", { name: "내 취향 문장 복사" })).toContainText("복사됨");

  await expect.poll(() => events.find((event) => event.eventName === "taste_preference_saved")).toMatchObject({
    properties: { mode: "custom", source: "rebuy_taste_brief" },
  });
  const serializedEvents = JSON.stringify(events);
  expect(serializedEvents).not.toContain("밝은 산미는 좋지만");
  expect(serializedEvents).not.toContain("발효향");
});

test("Given liked photo memories, When the dashboard opens a purchase clue, Then it shows personal conditions and tracks no coffee identity", async ({ page }, testInfo: TestInfo) => {
  const events: EventPayload[] = [];
  await mockRoutes(page, events);
  await page.addInitScript(() => {
    window.localStorage.setItem("coffeedex_analytics_test", "true");
    window.open = () => null;
  });

  await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
  const panel = page.getByRole("region", { name: "다음 원두 기억" });
  await expect(panel).toBeVisible();
  await expect(panel.getByText("복숭아", { exact: true })).toBeVisible();
  await expect(panel.getByText("꽃향", { exact: true })).toBeVisible();
  const leadImage = panel.getByRole("img", { name: /콜롬비아 엘 디비소/ });
  await expect(leadImage).toBeVisible();
  await expect.poll(() => leadImage.evaluate((image) => image instanceof HTMLImageElement && image.naturalWidth > 0)).toBe(true);
  await panel.screenshot({ path: testInfo.outputPath("next-purchase-memory-desktop.png") });

  await panel.getByRole("button", { name: "구매 단서 열기" }).first().click();
  await expect.poll(() => events.find((event) => event.eventName === "next_purchase_memory_opened")).toMatchObject({
    eventName: "next_purchase_memory_opened",
    properties: { action: "purchase_clue", clue: "saved_link" },
  });
  expect(events.find((event) => event.eventName === "next_purchase_memory_opened")?.properties).toEqual({
    action: "purchase_clue",
    clue: "saved_link",
  });
});

for (const viewport of [
  { label: "mobile", width: 375, height: 812 },
  { label: "tablet", width: 768, height: 1024 },
] as const) {
  test(`Given liked photo memories, When the ${viewport.label} dashboard opens, Then the next-purchase memory stays readable`, async ({ page }, testInfo: TestInfo) => {
    const events: EventPayload[] = [];
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await mockRoutes(page, events);
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });

    const panel = page.getByRole("region", { name: "다음 원두 기억" });
    await expect(panel).toBeVisible();
    await expect(panel.getByRole("button", { name: "기억 열기" }).first()).toHaveCSS("min-height", "44px");
    expect(await panel.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
    await panel.screenshot({ path: testInfo.outputPath(`next-purchase-memory-${viewport.label}.png`) });
  });
}

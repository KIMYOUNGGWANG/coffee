import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

function eventNameFromPayload(payload: unknown): string | null {
  if (typeof payload !== "object" || payload === null || !("eventName" in payload)) return null;
  const eventName = payload.eventName;
  return typeof eventName === "string" ? eventName : null;
}

async function installAnalyticsCapture(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const analyticsEventsKey = "__hyangmiAnalyticsEvents";
    if (!window.sessionStorage.getItem(analyticsEventsKey)) {
      window.sessionStorage.setItem(analyticsEventsKey, JSON.stringify([]));
    }
    const readStoredEvents = (): string[] => {
      try {
        const storedEvents: unknown = JSON.parse(window.sessionStorage.getItem(analyticsEventsKey) ?? "[]");
        return Array.isArray(storedEvents) ? storedEvents.filter((item) => typeof item === "string") : [];
      } catch (error) {
        void error;
        return [];
      }
    };
    const originalFetch = window.fetch.bind(window);
    window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      const requestUrl = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      const body = init?.body;
      if (requestUrl.includes("/api/v1/analytics") && typeof body === "string") {
        try {
          const payload: unknown = JSON.parse(body);
          if (typeof payload === "object" && payload !== null && "eventName" in payload && typeof payload.eventName === "string") {
            const analyticsEvents = readStoredEvents();
            analyticsEvents.push(payload.eventName);
            window.sessionStorage.setItem(analyticsEventsKey, JSON.stringify(analyticsEvents));
          }
        } catch (error) {
          void error;
          return originalFetch(input, init);
        }
      }
      return originalFetch(input, init);
    };
  });
}

async function readCapturedAnalyticsEvents(page: Page): Promise<readonly string[]> {
  return page.evaluate(() => {
    try {
      const capturedEvents: unknown = JSON.parse(window.sessionStorage.getItem("__hyangmiAnalyticsEvents") ?? "[]");
      return Array.isArray(capturedEvents) ? capturedEvents.filter((item) => typeof item === "string") : [];
    } catch (error) {
      void error;
      return [];
    }
  });
}

test.describe("CoffeeDex product operations UX", () => {
  test("tracks landing pricing intent and routes premium CTA into checkout intent", async ({ page }) => {
    await installAnalyticsCapture(page);

    await page.route("**/api/v1/analytics", async (route) => {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ received: true }),
      });
    });

    await page.goto("/");
    await expect(page.getByTestId("landing-pricing-section")).toBeVisible();
    const primaryHeroCta = page.getByRole("link", { name: "첫 테이스팅 기록 시작" });
    const heroCtaColors = await primaryHeroCta.evaluate((element) => {
      const styles = window.getComputedStyle(element);
      return {
        backgroundColor: styles.backgroundColor,
        color: styles.color,
      };
    });
    expect(heroCtaColors.color).toBe("rgb(255, 255, 255)");
    expect(heroCtaColors.color).not.toBe(heroCtaColors.backgroundColor);
    await expect(page.getByText("가격 안내")).toBeVisible();
    await expect(page.getByText("월간 Premium")).toBeVisible();
    await expect(page.getByText("Pricing", { exact: true })).toHaveCount(0);

    await page.getByRole("link", { name: "Premium으로 시작" }).click();

    await expect(page).toHaveURL(/\/auth\?redirect=%2Fdashboard%3Fcheckout_intent%3Dpremium_subscription/);
    await expect.poll(() => readCapturedAnalyticsEvents(page)).toContain("pricing_cta_clicked");
  });

  test("submits a billing support request without a live downstream service", async ({ page }) => {
    const eventNames: string[] = [];
    let supportPayload: unknown = null;

    await page.route("**/api/v1/analytics", async (route) => {
      const eventName = eventNameFromPayload(route.request().postDataJSON());
      if (eventName) eventNames.push(eventName);
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ received: true }),
      });
    });
    await page.route("**/api/v1/support", async (route) => {
      supportPayload = route.request().postDataJSON();
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ data: { ticketId: "hyangmi-support-20260615-001" } }),
      });
    });

    await page.goto("/support/billing");
    await page.getByLabel("이메일").fill("minji@example.com");
    await page.getByLabel("문의 유형").selectOption("refund_request");
    await page.getByLabel("문의 내용").fill("PDF를 실수로 구매해서 환불 가능 여부를 확인하고 싶습니다.");
    await page.getByRole("button", { name: "문의 접수" }).click();

    await expect(page.getByText("접수번호 hyangmi-support-20260615-001")).toBeVisible();
    await expect.poll(() => eventNames).toContain("billing_support_started");
    await expect.poll(() => eventNames).toContain("support_request_submitted");
    expect(supportPayload).toMatchObject({
      email: "minji@example.com",
      category: "refund_request",
    });
  });

  test("does not emit support-started analytics when optional Stripe IDs fail local validation", async ({ page }) => {
    await installAnalyticsCapture(page);
    let supportRequestCount = 0;

    await page.route("**/api/v1/analytics", async (route) => {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ received: true }),
      });
    });
    await page.route("**/api/v1/support", async (route) => {
      supportRequestCount += 1;
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ data: { ticketId: "should-not-submit" } }),
      });
    });

    await page.goto("/support/billing");
    await page.getByLabel("이메일").fill("minji@example.com");
    await page.getByLabel("문의 유형").selectOption("refund_request");
    await page.getByLabel("문의 내용").fill("PDF를 실수로 구매해서 환불 가능 여부를 확인하고 싶습니다.");
    await page.getByLabel("체크아웃 세션 ID 선택").fill("cs_" + "x".repeat(121));
    await page.getByRole("button", { name: "문의 접수" }).click();

    await expect(page.getByText("이메일과 문의 내용을 확인해주세요.")).toBeVisible();
    await expect(page.getByText("접수번호 should-not-submit")).toHaveCount(0);
    await expect(await readCapturedAnalyticsEvents(page)).not.toContain("billing_support_started");
    expect(supportRequestCount).toBe(0);
  });

  test("shows Korean optional Stripe ID guidance and billing support SLA", async ({ page }) => {
    await page.goto("/support/billing");

    await expect(page.getByText("고객지원 접수")).toBeVisible();
    await expect(page.getByLabel("체크아웃 세션 ID 선택")).toBeVisible();
    await expect(page.getByLabel("구독 ID 선택")).toBeVisible();
    await expect(page.getByText("Stripe ID는 선택 입력입니다.")).toBeVisible();
    await expect(page.getByText("영수증의 cs_ 또는 sub_ 값을 남기면 영업일 1일 내 확인이 빨라집니다.")).toBeVisible();
  });
});

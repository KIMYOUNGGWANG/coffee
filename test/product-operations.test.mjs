import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

function read(relativePath) {
  return readFileSync(path.join(projectRoot, relativePath), "utf8");
}

function assertFile(relativePath) {
  assert.equal(existsSync(path.join(projectRoot, relativePath)), true, `${relativePath} should exist`);
}

test("Given productized pricing, When reading source contracts, Then prices and conversion events are centralized", () => {
  assertFile("lib/commerce.ts");
  assertFile("components/landing-pricing-section.tsx");

  const commerce = read("lib/commerce.ts");
  const checkoutRoute = read("app/api/v1/checkout/route.ts");
  const analyticsEvents = read("lib/analytics-events.ts");
  const pricingSection = read("components/landing-pricing-section.tsx");

  assert.match(commerce, /premium_subscription[\s\S]*amountCents:\s*399/);
  assert.match(commerce, /credits_10[\s\S]*amountCents:\s*499/);
  assert.match(commerce, /pdf_book[\s\S]*amountCents:\s*999/);
  assert.match(checkoutRoute, /readCheckoutProduct/);
  assert.doesNotMatch(checkoutRoute, /const STRIPE_PRICING/);

  assert.match(analyticsEvents, /pricing_viewed/);
  assert.match(analyticsEvents, /pricing_cta_clicked/);
  assert.match(analyticsEvents, /billing_support_started/);
  assert.match(analyticsEvents, /support_request_submitted/);
  assert.match(pricingSection, /checkout_intent=premium_subscription/);
});

test("Given operational readiness pages, When reading routes, Then support, legal, and payment notices exist", () => {
  const routeFiles = [
    "app/support/billing/page.tsx",
    "app/api/v1/support/route.ts",
    "app/legal/terms/page.tsx",
    "app/legal/privacy/page.tsx",
    "app/legal/payment/page.tsx",
    "components/billing-support-form.tsx",
    "components/dashboard-billing-status-panel.tsx",
  ];

  for (const routeFile of routeFiles) assertFile(routeFile);

  assert.match(read("app/legal/terms/page.tsx"), /서비스 이용약관/);
  assert.match(read("app/legal/privacy/page.tsx"), /개인정보 처리방침/);
  assert.match(read("app/legal/payment/page.tsx"), /결제 및 환불 고지/);

  const billingPanel = read("components/dashboard-billing-status-panel.tsx");
  assert.match(billingPanel, /결제 실패/);
  assert.match(billingPanel, /구독 취소/);
  assert.match(billingPanel, /환불 요청/);
  assert.match(read("components/PaymentDialog.tsx"), /결제 및 환불 고지/);
});

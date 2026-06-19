import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

function read(relativePath) {
  return readFileSync(path.join(projectRoot, relativePath), "utf8");
}

const deferredArtifactPattern = new RegExp("pos" + "ter", "i");
const deferredCheckoutPattern = new RegExp('handleCheckout\\("' + "pos" + "ter" + '"\\)');

test("PaymentDialog exposes lifecycle-safe checkout products", () => {
  const paymentDialog = read("components/PaymentDialog.tsx");
  const commerce = read("lib/commerce.ts");

  assert.match(commerce, /CoffeeDex Premium 구독 \(월간\)/);
  assert.match(commerce, /\$3\.99/);
  assert.match(paymentDialog, /handleCheckout\("premium_subscription"\)/);

  assert.match(commerce, /홈카페 테이스팅북 PDF/);
  assert.match(commerce, /\$9\.99/);
  assert.match(paymentDialog, /handleCheckout\("pdf_book"\)/);

  assert.match(commerce, /CoffeeDex 테이스팅 10팩 충전/);
  assert.match(commerce, /\$4\.99/);
  assert.match(paymentDialog, /handleCheckout\("credits_10"\)/);

  assert.doesNotMatch(paymentDialog, new RegExp("인쇄용 결산 대형 " + "포스" + "터"));
  assert.doesNotMatch(paymentDialog, /테마 10종|스킨 10종|프리미엄 카드 스킨/);
  assert.doesNotMatch(paymentDialog, /\$19\.99/);
  assert.doesNotMatch(paymentDialog, /MOCK/);
  assert.doesNotMatch(paymentDialog, deferredCheckoutPattern);
});

test("checkout route keeps future artifact deferred while preserving approved prices", () => {
  const checkoutRoute = read("app/api/v1/checkout/route.ts");
  const commerce = read("lib/commerce.ts");

  assert.match(checkoutRoute, /readCheckoutProduct/);
  assert.match(commerce, /premium_subscription:\s*{[\s\S]*?amountCents:\s*399/);
  assert.match(commerce, /credits_10:\s*{[\s\S]*?amountCents:\s*499/);
  assert.match(commerce, /pdf_book:\s*{[\s\S]*?amountCents:\s*999/);
  assert.doesNotMatch(checkoutRoute, /테마 10종|스킨 10종|프리미엄 카드 스킨/);
  assert.doesNotMatch(checkoutRoute, deferredArtifactPattern);
});

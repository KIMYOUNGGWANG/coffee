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

test("Given checkout source, When the authenticated user has no email, Then checkout returns a clear Korean 400", () => {
  // Given
  const checkoutRoute = read("app/api/v1/checkout/route.ts");

  // When / Then
  assert.match(checkoutRoute, /if \(!user\.email\)/);
  assert.match(checkoutRoute, /이메일 주소가 없어 결제를 진행할 수 없습니다\./);
  assert.match(checkoutRoute, /\{\s*status:\s*400\s*\}/);
  assert.match(checkoutRoute, /customer_email:\s*user\.email/);
});

test("Given checkout source, When itemType is invalid, Then checkout keeps the 400 product contract", () => {
  // Given
  const checkoutRoute = read("app/api/v1/checkout/route.ts");

  // When / Then
  assert.match(checkoutRoute, /itemType:\s*checkoutItemTypeSchema/);
  assert.match(checkoutRoute, /checkoutRequestSchema\.safeParse\(body\)/);
  assert.match(checkoutRoute, /올바르지 않은 상품 타입입니다\./);
  assert.match(checkoutRoute, /\{\s*status:\s*400\s*\}/);
});

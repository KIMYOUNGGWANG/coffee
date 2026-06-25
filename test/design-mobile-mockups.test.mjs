import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

function read(relativePath) {
  return readFileSync(path.join(projectRoot, relativePath), "utf8");
}

test("Hyangmi mobile mockup keeps the polished CoffeeDex direction", () => {
  const source = read("app/design/mobile-mockups/page.tsx");

  assert.match(source, /Hyangmi 모바일 기준안/);
  assert.match(source, /디자인 원칙/);
  assert.match(source, /향미 선반/);
  assert.match(source, /취향 지도/);
  assert.match(source, /새 원두 라벨 스캔/);
  assert.match(source, /aria-label="5각형 취향 레이더 차트"/);
  assert.match(source, /radarShapePoints/);
  assert.match(source, /radarPoints/);
  assert.match(source, /CoffeeBag/);
  assert.doesNotMatch(source, /Nordic Paper|Seoul Boutique|Editorial Passport/);
});

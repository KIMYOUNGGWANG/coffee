import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(testDirectory, "..");

function read(relativePath) {
  return readFileSync(path.join(projectRoot, relativePath), "utf8");
}

test("Coffee Note detail uses the focused memory hierarchy", () => {
  // Given: the native note detail source.
  const source = read("mobile/app/note/[id].tsx");

  // When: the screen is inspected as the shipped detail contract.
  // Then: the dominant rating, memory, and fact regions are stable and truthful.
  assert.match(source, /Coffee Note/);
  assert.match(source, /testID="note-detail-hero"/);
  assert.match(source, /testID="note-detail-memory"/);
  assert.match(source, /testID="note-detail-facts"/);
  assert.match(source, /느낌/);
  assert.match(source, /\/ 5/);
  assert.match(source, /내 문장/);
  assert.match(source, /로스터리/);
  assert.match(source, /기록일/);
  assert.match(source, /재구매/);
  assert.doesNotMatch(source, /Beer Note|CARBONATION|ABV|473 mL|favorite/i);
});

test("Coffee Note detail preserves sparse fallbacks and two-step deletion", () => {
  // Given: the persisted note model and native detail route.
  const model = read("mobile/lib/coffee-notes.ts");
  const source = read("mobile/app/note/[id].tsx");

  // When: the storage and fallback contract is inspected.
  // Then: no schema expansion or destructive-flow regression is introduced.
  assert.match(model, /@coffeedex\/coffee-notes\/v1/);
  assert.match(model, /coffeeName: string/);
  assert.match(model, /roaster: string/);
  assert.match(model, /rating: number/);
  assert.match(model, /repurchase: RepurchaseStatus/);
  assert.match(model, /이름 없는 컵/);
  assert.match(source, /메모 없이 저장한 컵입니다\./);
  assert.match(model, /로스터리 미정/);
  assert.match(source, /if \(!isConfirmingDelete\)/);
  assert.match(source, /setIsConfirmingDelete\(true\)/);
  assert.match(source, /deleteNote\.mutateAsync\(noteId\)/);
  assert.match(source, /router\.replace\('\/\(tabs\)\/passport'\)/);
  assert.match(source, /accessibilityLabel="노트 수정"/);
  assert.match(source, /'노트 삭제'/);
  assert.match(source, /useFocusEffect/);
  assert.match(source, /accessibilityRole="button"/);
  assert.match(source, /노트 삭제 확인/);
  assert.match(source, /accessibilityState=/);
  assert.match(source, /삭제하지 못했습니다\. 다시 시도해 주세요\./);
  assert.match(source, /Number\.isNaN\(createdAt\.getTime\(\)\)/);
  assert.match(source, /날짜 미정/);
  assert.match(source, /ROOM_COLORS/);
  assert.doesNotMatch(source, /#[0-9A-Fa-f]{6}/);
});

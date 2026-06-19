import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath) {
  return readFileSync(path.join(projectRoot, relativePath), "utf8");
}

test("paid artifacts include visible recap and public-card quality cues", () => {
  const pdfGenerator = read("lib/pdf-generator.ts");
  const storyAssets = read("components/story-export-assets.ts");

  assert.match(pdfGenerator, /Taste Map/);
  assert.match(pdfGenerator, /Roaster Memory/);
  assert.match(pdfGenerator, /CoffeeDex Taste Recap/);
  assert.match(storyAssets, /PUBLIC COFFEEDEX CARD/);
  assert.match(storyAssets, /createPublicCardUrl/);
});

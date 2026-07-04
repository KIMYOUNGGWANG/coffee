import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function transpile(source, fileName) {
  return ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      target: ts.ScriptTarget.ES2022,
    },
    fileName,
  }).outputText;
}

async function loadRebuyClueRescueModule() {
  const tempDirectory = mkdtempSync(path.join(tmpdir(), "coffeedex-rebuy-clue-rescue-"));
  const sourcePath = path.join(projectRoot, "lib/rebuy-clue-rescue.ts");

  assert.equal(existsSync(sourcePath), true);
  writeFileSync(
    path.join(tempDirectory, "rebuy-clue-rescue.mjs"),
    transpile(readFileSync(sourcePath, "utf8"), sourcePath),
  );

  try {
    return {
      module: await import(pathToFileURL(path.join(tempDirectory, "rebuy-clue-rescue.mjs"))),
      tempDirectory,
    };
  } catch (error) {
    rmSync(tempDirectory, { recursive: true, force: true });
    throw error;
  }
}

function card(overrides = {}) {
  return {
    id: "card-fritz",
    title: "Ethiopia Sidama",
    subtitle: "Fritz",
    tags: ["floral", "honey"],
    purchase_url: null,
    purchase_note: null,
    repurchase_intent: "again",
    repurchase_reasons: ["식으니까 복숭아 향이 좋았음"],
    created_at: "2026-06-01T00:00:00.000Z",
    ...overrides,
  };
}

test("Given buy-again cards with missing purchase clues, When rescue is built, Then the weakest memory is prioritized", async () => {
  const loaded = await loadRebuyClueRescueModule();
  try {
    const { buildRebuyClueRescue } = loaded.module;
    const result = buildRebuyClueRescue(
      [
        card({
          id: "complete",
          purchase_url: "https://example.com/coffee",
          purchase_note: "프릳츠 공식몰 200g 18,000원",
        }),
        card({
          id: "missing-all",
          title: "Colombia Pink Bourbon",
          subtitle: "Anthracite",
          purchase_note: null,
          repurchase_reasons: [],
          created_at: "2026-05-01T00:00:00.000Z",
        }),
        card({
          id: "maybe-missing-link",
          repurchase_intent: "maybe",
          purchase_note: "Momos 공식몰 250g 22,000원",
        }),
        card({
          id: "not-a-rebuy",
          repurchase_intent: "no",
          purchase_note: null,
          repurchase_reasons: [],
        }),
      ],
      new Date("2026-07-01T00:00:00.000Z"),
    );

    assert.equal(result.totalCandidates, 2);
    assert.equal(result.candidates[0].cardId, "missing-all");
    assert.deepEqual(result.candidates[0].missingClues, [
      "purchase_place",
      "purchase_price",
      "purchase_link",
      "rebuy_reason",
    ]);
    assert.equal(result.candidates[0].priority, "high");
    assert.match(result.candidates[0].rescuePrompt, /구매처.*가격.*구매 링크/);
    assert.equal(result.candidates[1].cardId, "maybe-missing-link");
    assert.deepEqual(result.candidates[1].missingClues, ["purchase_link"]);
    assert.match(result.summary, /2개 재구매 후보/);
  } finally {
    rmSync(loaded.tempDirectory, { recursive: true, force: true });
  }
});

test("Given complete rebuy cards, When rescue is built, Then it does not create collection chores", async () => {
  const loaded = await loadRebuyClueRescueModule();
  try {
    const { buildRebuyClueRescue } = loaded.module;
    const result = buildRebuyClueRescue(
      [
        card({
          purchase_url: "https://example.com/coffee",
          purchase_note: "Fritz 공식몰 200g 18,000원",
        }),
      ],
      new Date("2026-07-01T00:00:00.000Z"),
    );

    assert.equal(result.totalCandidates, 0);
    assert.equal(result.candidates.length, 0);
    assert.match(result.summary, /구매처, 가격, 링크, 이유/);
  } finally {
    rmSync(loaded.tempDirectory, { recursive: true, force: true });
  }
});

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

async function loadRebuyTimingMemoryModule() {
  const tempDirectory = mkdtempSync(path.join(tmpdir(), "coffeedex-rebuy-timing-memory-"));
  const sourcePath = path.join(projectRoot, "lib/rebuy-timing-memory.ts");

  assert.equal(existsSync(sourcePath), true);
  writeFileSync(
    path.join(tempDirectory, "rebuy-timing-memory.mjs"),
    transpile(readFileSync(sourcePath, "utf8"), sourcePath),
  );

  try {
    return {
      module: await import(pathToFileURL(path.join(tempDirectory, "rebuy-timing-memory.mjs"))),
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
    repurchase_intent: "again",
    repurchase_reasons: ["꽃향과 단맛이 좋아 다시 사고 싶었음"],
    purchase_url: null,
    purchase_note: null,
    footer_meta: { date: "2026-05-01" },
    confirmed_at: "2026-05-01T00:00:00.000Z",
    created_at: "2026-05-01T00:00:00.000Z",
    updated_at: "2026-05-01T00:00:00.000Z",
    ...overrides,
  };
}

test("Given saved rebuy memories, When timing memory is built, Then overdue direct purchase clues rank first", async () => {
  const loaded = await loadRebuyTimingMemoryModule();
  try {
    const { buildRebuyTimingMemory } = loaded.module;
    const result = buildRebuyTimingMemory(
      [
        card({
          id: "card-fresh",
          title: "Fresh Kenya",
          subtitle: "Momos",
          footer_meta: { date: "2026-06-25" },
        }),
        card({
          id: "card-direct",
          title: "Colombia El Paraiso",
          subtitle: "Anthracite",
          purchase_url: "https://example.com/colombia",
          purchase_note: "공식몰 200g 옵션",
          footer_meta: { date: "2026-04-20" },
        }),
        card({
          id: "card-no",
          title: "One Time Blend",
          subtitle: "Cafe",
          repurchase_intent: "no",
          repurchase_reasons: [],
          footer_meta: { date: "2026-03-01" },
        }),
      ],
      new Date("2026-06-30T00:00:00.000Z"),
    );

    assert.equal(result.totalCandidates, 2);
    assert.equal(result.candidates[0].cardId, "card-direct");
    assert.equal(result.candidates[0].stage, "overdue");
    assert.equal(result.candidates[0].hasDirectPurchaseClue, true);
    assert.match(result.candidates[0].searchPhrase, /Anthracite/);
    assert.match(result.candidates[0].searchPhrase, /Colombia El Paraiso/);
    assert.match(result.candidates[0].searchPhrase, /공식몰 200g 옵션/);
    assert.equal(result.candidates[0].searchUrl, "https://example.com/colombia");
    assert.match(result.summary, /2개 후보/);
  } finally {
    rmSync(loaded.tempDirectory, { recursive: true, force: true });
  }
});

test("Given only undecided memories, When timing memory is built, Then it asks for one explicit rebuy mark", async () => {
  const loaded = await loadRebuyTimingMemoryModule();
  try {
    const { buildRebuyTimingMemory } = loaded.module;
    const result = buildRebuyTimingMemory(
      [
        card({
          repurchase_intent: "undecided",
          repurchase_reasons: [],
          purchase_url: null,
          purchase_note: null,
        }),
      ],
      new Date("2026-06-30T00:00:00.000Z"),
    );

    assert.equal(result.totalCandidates, 0);
    assert.equal(result.candidates.length, 0);
    assert.match(result.summary, /다시 살 원두/);
  } finally {
    rmSync(loaded.tempDirectory, { recursive: true, force: true });
  }
});

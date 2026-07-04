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

async function loadRebuyPaceMemoryModule() {
  const tempDirectory = mkdtempSync(path.join(tmpdir(), "coffeedex-rebuy-pace-memory-"));
  const purchaseMemorySourcePath = path.join(projectRoot, "lib/rebuy-purchase-memory.ts");
  const paceMemorySourcePath = path.join(projectRoot, "lib/rebuy-pace-memory.ts");

  assert.equal(existsSync(purchaseMemorySourcePath), true);
  assert.equal(existsSync(paceMemorySourcePath), true);
  writeFileSync(
    path.join(tempDirectory, "rebuy-purchase-memory.mjs"),
    transpile(readFileSync(purchaseMemorySourcePath, "utf8"), purchaseMemorySourcePath),
  );
  writeFileSync(
    path.join(tempDirectory, "rebuy-pace-memory.mjs"),
    transpile(readFileSync(paceMemorySourcePath, "utf8"), paceMemorySourcePath)
      .replace('from "./rebuy-purchase-memory";', 'from "./rebuy-purchase-memory.mjs";'),
  );

  try {
    return {
      module: await import(pathToFileURL(path.join(tempDirectory, "rebuy-pace-memory.mjs"))),
      tempDirectory,
    };
  } catch (error) {
    rmSync(tempDirectory, { recursive: true, force: true });
    throw error;
  }
}

test("Given a 250g purchase note and old memory, When pace is built, Then it surfaces a rebuy timing cue", async () => {
  const loaded = await loadRebuyPaceMemoryModule();
  try {
    const { buildRebuyPaceMemory } = loaded.module;
    const memory = buildRebuyPaceMemory("프릳츠 공식몰 250g 23,000원", 75);

    assert.equal(memory.stage, "late");
    assert.equal(memory.cups, 17);
    assert.equal(memory.cupsLabel, "약 17잔분");
    assert.equal(memory.timingLabel, "75일 전 기록, 놓치기 전 재확인");
    assert.equal(memory.detailLabel, "15g 한 잔 기준");
    assert.equal(memory.hasCue, true);
  } finally {
    rmSync(loaded.tempDirectory, { recursive: true, force: true });
  }
});

test("Given a kg bag near its cup count, When pace is built, Then it marks the candidate as ready", async () => {
  const loaded = await loadRebuyPaceMemoryModule();
  try {
    const { buildRebuyPaceMemory } = loaded.module;
    const memory = buildRebuyPaceMemory("공동구매 1kg 6.5만원", 68);

    assert.equal(memory.stage, "ready");
    assert.equal(memory.cups, 67);
    assert.equal(memory.cupsLabel, "약 67잔분");
    assert.equal(memory.timingLabel, "68일 전 기록, 다시 살 타이밍");
  } finally {
    rmSync(loaded.tempDirectory, { recursive: true, force: true });
  }
});

test("Given no bag size, When pace is built, Then it stays quiet", async () => {
  const loaded = await loadRebuyPaceMemoryModule();
  try {
    const { buildRebuyPaceMemory } = loaded.module;
    const memory = buildRebuyPaceMemory("구매처만 기억남", 40);

    assert.equal(memory.stage, "unknown");
    assert.equal(memory.cups, null);
    assert.equal(memory.hasCue, false);
  } finally {
    rmSync(loaded.tempDirectory, { recursive: true, force: true });
  }
});

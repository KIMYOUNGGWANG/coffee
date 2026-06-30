import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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

async function loadShelfRunwayModule() {
  const tempDirectory = mkdtempSync(path.join(tmpdir(), "coffeedex-shelf-runway-"));
  const modulePath = path.join(projectRoot, "lib/shelf-runway.ts");
  writeFileSync(path.join(tempDirectory, "shelf-runway.mjs"), transpile(readFileSync(modulePath, "utf8"), modulePath));

  try {
    return {
      module: await import(pathToFileURL(path.join(tempDirectory, "shelf-runway.mjs"))),
      tempDirectory,
    };
  } catch (error) {
    rmSync(tempDirectory, { recursive: true, force: true });
    throw error;
  }
}

test("Given opened beans with known consumption, When Shelf Runway is evaluated, Then it estimates cups and rebuy date", async () => {
  const loaded = await loadShelfRunwayModule();
  try {
    const { evaluateShelfRunway } = loaded.module;
    const result = evaluateShelfRunway({
      totalWeight: 200,
      fillLevel: 25,
      openedDate: "2026-06-20",
      now: new Date("2026-06-30T00:00:00.000Z"),
    });

    assert.equal(result.remainingGrams, 50);
    assert.equal(result.cupsRemaining, 4);
    assert.equal(result.estimatedDaysLeft, 4);
    assert.equal(result.suggestedRebuyDate, "2026-07-01");
    assert.match(result.reason, /약 4일 뒤/);
  } finally {
    rmSync(loaded.tempDirectory, { recursive: true, force: true });
  }
});

test("Given nearly empty beans, When Shelf Runway is evaluated, Then it recommends buying today", async () => {
  const loaded = await loadShelfRunwayModule();
  try {
    const { evaluateShelfRunway } = loaded.module;
    const result = evaluateShelfRunway({
      totalWeight: 200,
      fillLevel: 5,
      openedDate: "2026-06-25",
      now: new Date("2026-06-30T00:00:00.000Z"),
    });

    assert.equal(result.cupsRemaining, 1);
    assert.equal(result.suggestedRebuyDate, "2026-06-30");
    assert.equal(result.label, "마지막 컵");
  } finally {
    rmSync(loaded.tempDirectory, { recursive: true, force: true });
  }
});

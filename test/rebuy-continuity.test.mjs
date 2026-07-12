import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function loadModule() {
  const directory = mkdtempSync(path.join(tmpdir(), "coffeedex-rebuy-continuity-"));
  const sourcePath = path.join(projectRoot, "lib/rebuy-continuity.ts");
  const output = ts.transpileModule(readFileSync(sourcePath, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
    fileName: sourcePath,
  }).outputText;
  const modulePath = path.join(directory, "rebuy-continuity.mjs");
  writeFileSync(modulePath, output);
  return { module: await import(pathToFileURL(modulePath)), directory };
}

test("source-linked rebuy increments the purchase sequence and stamps the Korean purchase date", async () => {
  const loaded = await loadModule();
  try {
    assert.deepEqual(
      loaded.module.buildRebuyContinuity({ rebuy_sequence: 2 }, new Date("2026-07-10T16:30:00.000Z")),
      { purchaseDate: "2026-07-11", rebuySequence: 3 },
    );
  } finally {
    rmSync(loaded.directory, { recursive: true, force: true });
  }
});

test("ordinary shelf additions do not invent a purchase date or repeat history", async () => {
  const loaded = await loadModule();
  try {
    assert.deepEqual(
      loaded.module.buildRebuyContinuity(null, new Date("2026-07-10T16:30:00.000Z")),
      { purchaseDate: null, rebuySequence: 1 },
    );
  } finally {
    rmSync(loaded.directory, { recursive: true, force: true });
  }
});

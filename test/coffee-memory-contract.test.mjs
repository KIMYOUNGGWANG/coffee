import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const modulePath = path.join(projectRoot, "lib", "coffee-memory.ts");

async function loadCoffeeMemoryModule() {
  assert.equal(existsSync(modulePath), true, "the shared coffee-memory contract exists");
  const tempDirectory = mkdtempSync(path.join(tmpdir(), "coffee-memory-contract-"));
  const zodUrl = pathToFileURL(path.join(projectRoot, "node_modules/zod/index.js")).href;
  const source = readFileSync(modulePath, "utf8").replaceAll('"zod"', `"${zodUrl}"`);
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: modulePath,
  }).outputText;
  const outputPath = path.join(tempDirectory, "coffee-memory.mjs");
  writeFileSync(outputPath, output);

  try {
    return await import(pathToFileURL(outputPath));
  } finally {
    rmSync(tempDirectory, { recursive: true, force: true });
  }
}

test("Given a legacy card, When memory fields are parsed, Then compatibility defaults are applied", async () => {
  const { coffeeMemorySchema } = await loadCoffeeMemoryModule();

  assert.deepEqual(coffeeMemorySchema.parse({}), {
    package_origin: null,
    package_process: null,
    repurchase_intent: "undecided",
    repurchase_reasons: [],
    scan_source: null,
    scan_confidence: null,
    corrected_fields: [],
    confirmed_at: null,
  });
});

test("Given a confirmed scanned memory, When parsed, Then strict package and provenance fields survive", async () => {
  const { coffeeMemorySchema } = await loadCoffeeMemoryModule();
  const memory = {
    package_origin: "Ethiopia Sidama",
    package_process: "Washed",
    repurchase_intent: "again",
    repurchase_reasons: ["clean finish", "floral aroma"],
    scan_source: "gemini",
    scan_confidence: 0.86,
    corrected_fields: ["package_origin", "tags"],
    confirmed_at: "2026-06-18T12:30:00.000Z",
  };

  assert.deepEqual(coffeeMemorySchema.parse(memory), memory);
});

test("Given invalid memory values, When parsed, Then the domain boundary rejects them", async () => {
  const { coffeeMemorySchema } = await loadCoffeeMemoryModule();
  const invalidInputs = [
    { repurchase_intent: "yes" },
    { scan_source: "fallback_mock" },
    { scan_confidence: 1.01 },
    { corrected_fields: ["metric1"] },
    { repurchase_reasons: [""] },
    { confirmed_at: "not-a-timestamp" },
    { unexpected: true },
  ];

  for (const input of invalidInputs) {
    assert.equal(coffeeMemorySchema.safeParse(input).success, false);
  }
});

import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const currentFilePath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(currentFilePath), "..");

async function loadPassportStateModule() {
  const tempDirectory = mkdtempSync(path.join(tmpdir(), "coffeedex-passport-state-"));
  const sourcePath = path.join(projectRoot, "lib/passport-state.ts");
  const source = readFileSync(sourcePath, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: sourcePath,
  }).outputText;

  writeFileSync(path.join(tempDirectory, "passport-state.mjs"), transpiled);

  try {
    return await import(pathToFileURL(path.join(tempDirectory, "passport-state.mjs")));
  } finally {
    rmSync(tempDirectory, { recursive: true, force: true });
  }
}

function memories(count, options = {}) {
  const origins = options.origins ?? ["Ethiopia"];
  const processes = options.processes ?? ["Washed"];
  const tags = options.tags ?? [["Floral"]];

  return Array.from({ length: count }, (_, index) => ({
    origin: origins[index % origins.length],
    process: processes[index % processes.length],
    tags: tags[index % tags.length],
  }));
}

test("Given confirmed memory totals, When building passport state, Then every progressive threshold is exact", async () => {
  // Given
  const { buildPassportState } = await loadPassportStateModule();
  const cases = [
    [0, "empty"],
    [1, "collage"],
    [2, "collage"],
    [3, "first_signals"],
    [4, "first_signals"],
    [5, "early_snapshot"],
    [9, "early_snapshot"],
    [10, "current_snapshot"],
    [20, "current_snapshot"],
  ];

  // When
  const states = cases.map(([count]) => buildPassportState(memories(count)));

  // Then
  assert.deepEqual(
    states.map(({ kind, sampleCount }) => ({ kind, sampleCount })),
    cases.map(([sampleCount, kind]) => ({ kind, sampleCount })),
  );
});

test("Given diverse confirmed memories, When building passport state, Then literal distinct evidence is counted", async () => {
  // Given
  const { buildPassportState } = await loadPassportStateModule();
  const confirmedMemories = memories(10, {
    origins: ["Ethiopia", "Kenya", "Colombia"],
    processes: ["Washed", "Natural", "Honey"],
    tags: [["Floral", "Citrus"], ["Berry", "Citrus"], ["Chocolate"]],
  });

  // When
  const state = buildPassportState(confirmedMemories);

  // Then
  assert.deepEqual(state, {
    kind: "current_snapshot",
    sampleCount: 10,
    distinctOriginCount: 3,
    distinctProcessCount: 3,
    distinctTagCount: 4,
    coverage: "broad",
  });
});

test("Given incomplete or repeated evidence, When building passport state, Then coverage stays narrow", async () => {
  // Given
  const { buildPassportState } = await loadPassportStateModule();
  const cases = [
    memories(3),
    memories(5, { origins: [null], processes: ["Washed"], tags: [["Floral", "Citrus"]] }),
    memories(5, { origins: ["Ethiopia", "Kenya"], processes: [null], tags: [["Floral"]] }),
    memories(5, { origins: ["Ethiopia", "Kenya"], processes: ["Washed", "Natural"], tags: [[]] }),
  ];

  // When
  const coverage = cases.map((confirmedMemories) => buildPassportState(confirmedMemories).coverage);

  // Then
  assert.deepEqual(coverage, ["narrow", "narrow", "narrow", "narrow"]);
});

test("Given some diversity without broad coverage, When building passport state, Then coverage is mixed", async () => {
  // Given
  const { buildPassportState } = await loadPassportStateModule();
  const confirmedMemories = memories(5, {
    origins: ["Ethiopia", "Kenya"],
    processes: ["Washed"],
    tags: [["Floral"], ["Citrus"]],
  });

  // When
  const state = buildPassportState(confirmedMemories);

  // Then
  assert.equal(state.coverage, "mixed");
});

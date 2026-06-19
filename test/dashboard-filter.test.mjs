import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function loadFilterModule() {
  const sourcePath = path.join(projectRoot, "lib/dashboard-card-filter.ts");
  const source = await readFile(sourcePath, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
      verbatimModuleSyntax: true,
    },
    fileName: sourcePath,
  }).outputText;
  const tempDirectory = await mkdtemp(path.join(os.tmpdir(), "coffeedex-dashboard-filter-"));
  const outputPath = path.join(tempDirectory, "dashboard-card-filter.mjs");
  await writeFile(outputPath, compiled);

  try {
    return { module: await import(pathToFileURL(outputPath)), tempDirectory };
  } catch (error) {
    await rm(tempDirectory, { recursive: true, force: true });
    throw error;
  }
}

const baseCard = {
  id: "card-1",
  user_id: "user-1",
  category: "coffee",
  title: "제주 여름 블렌드",
  subtitle: "Fritz Coffee Company",
  image_url: null,
  badges: ["Hario V60", "Light"],
  metric1: 4,
  metric2: 3,
  metric3: 2,
  tags: ["복숭아", "Brown Sugar"],
  ai_description: "살구 향과 깨끗한 후미를 다시 기억하고 싶어요",
  footer_meta: { origin: "제주", extraInfo: "92°C" },
  package_origin: "Ethiopia Guji",
  package_process: "Washed Process",
  repurchase_intent: "again",
  repurchase_reasons: ["깨끗한 단맛"],
  scan_source: "manual",
  scan_confidence: null,
  corrected_fields: [],
  confirmed_at: "2026-06-18T00:00:00.000Z",
  created_at: "2026-06-18T00:00:00.000Z",
  updated_at: "2026-06-18T00:00:00.000Z",
};

const defaultFilters = {
  searchQuery: "",
  selectedMethod: "",
  selectedRoast: "",
  selectedRepurchaseIntent: "",
  minAcidity: 1,
  minSweetness: 1,
  minBody: 1,
  sortBy: "newest",
};

test("Given Korean and Latin coffee memory fields, When normalized queries are applied, Then every retrieval field finds the card", async () => {
  // Given
  const { module, tempDirectory } = await loadFilterModule();
  const queries = [
    "  제주   여름 ",
    "FRITZ coffee",
    "ethiopia guji",
    "WASHED   process",
    "복숭아",
    "brown sugar",
    "깨끗한 후미",
    "깨끗한 단맛",
  ];

  try {
    // When / Then
    for (const searchQuery of queries) {
      const result = module.filterDashboardCards([baseCard], { ...defaultFilters, searchQuery });
      assert.deepEqual(result.map((card) => card.id), [baseCard.id], searchQuery);
    }
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test("Given all repurchase decisions, When each decision is filtered, Then only matching memories remain", async () => {
  // Given
  const { module, tempDirectory } = await loadFilterModule();
  const cards = ["again", "maybe", "no", "undecided"].map((repurchaseIntent, index) => ({
    ...baseCard,
    id: `card-${index}`,
    repurchase_intent: repurchaseIntent,
  }));

  try {
    // When / Then
    for (const selectedRepurchaseIntent of ["again", "maybe", "no", "undecided"]) {
      const result = module.filterDashboardCards(cards, {
        ...defaultFilters,
        selectedRepurchaseIntent,
      });
      assert.deepEqual(result.map((card) => card.repurchase_intent), [selectedRepurchaseIntent]);
    }
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test("Given mixed repurchase decisions, When repurchase priority sorting is selected, Then likely rebuys lead", async () => {
  // Given
  const { module, tempDirectory } = await loadFilterModule();
  const cards = ["no", "undecided", "again", "maybe"].map((repurchaseIntent, index) => ({
    ...baseCard,
    id: `card-${index}`,
    repurchase_intent: repurchaseIntent,
  }));

  try {
    // When
    const result = module.filterDashboardCards(cards, { ...defaultFilters, sortBy: "repurchase" });

    // Then
    assert.deepEqual(result.map((card) => card.repurchase_intent), ["again", "maybe", "undecided", "no"]);
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

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

async function loadRebuyIntelligenceModule() {
  const tempDirectory = mkdtempSync(path.join(tmpdir(), "coffeedex-rebuy-intelligence-"));
  const freshShelfPath = path.join(projectRoot, "lib/fresh-shelf.ts");
  const rebuyPath = path.join(projectRoot, "lib/rebuy-intelligence.ts");

  assert.equal(existsSync(rebuyPath), true);

  writeFileSync(
    path.join(tempDirectory, "fresh-shelf.mjs"),
    transpile(readFileSync(freshShelfPath, "utf8"), freshShelfPath),
  );
  writeFileSync(
    path.join(tempDirectory, "rebuy-intelligence.mjs"),
    transpile(
      readFileSync(rebuyPath, "utf8").replaceAll('"@/lib/fresh-shelf"', '"./fresh-shelf.mjs"'),
      rebuyPath,
    ),
  );

  try {
    return {
      module: await import(pathToFileURL(path.join(tempDirectory, "rebuy-intelligence.mjs"))),
      tempDirectory,
    };
  } catch (error) {
    rmSync(tempDirectory, { recursive: true, force: true });
    throw error;
  }
}

function card(overrides = {}) {
  return {
    id: "card-sidama",
    title: "Ethiopia Sidama",
    subtitle: "Fritz",
    metric1: 4,
    metric2: 5,
    metric3: 3,
    tags: ["floral", "citrus", "honey"],
    repurchase_intent: "again",
    repurchase_reasons: ["clean floral finish"],
    scan_source: "gemini",
    package_origin: "Ethiopia Sidama",
    package_process: "Washed",
    purchase_url: null,
    purchase_note: null,
    footer_meta: { origin: "Ethiopia", extraInfo: "V60 15g 250g 92C" },
    created_at: "2026-06-20T00:00:00.000Z",
    ...overrides,
  };
}

test("Given shelf, card, and failed brew memory, When Rebuy Intelligence is built, Then all four retention loops are present", async () => {
  const loaded = await loadRebuyIntelligenceModule();
  try {
    const { buildRebuyIntelligence } = loaded.module;
    const result = buildRebuyIntelligence({
      now: new Date("2026-06-29T00:00:00.000Z"),
      cards: [
        card(),
        card({
          id: "card-kenya",
          title: "Kenya Kirinyaga",
          subtitle: "Anthracite",
          metric1: 5,
          metric2: 4,
          metric3: 3,
          tags: ["citrus", "blackcurrant"],
          repurchase_intent: "maybe",
          repurchase_reasons: ["bright but intense"],
          scan_source: "manual",
          created_at: "2026-06-18T00:00:00.000Z",
        }),
      ],
      shelfItems: [
        {
          id: "shelf-sidama",
          roaster_name: "Fritz",
          bean_name: "Ethiopia Sidama",
          origin: "Ethiopia Sidama Washed",
          roast_date: "2026-06-01",
          opened_date: "2026-06-10",
          fill_level: 8,
          is_finished: false,
          tasting_card_id: "card-sidama",
          purchase_url: "https://fritz.example/sidama",
          purchase_note: "Fritz 공식몰 200g 옵션",
          rebuy_priority: "normal",
          rebuy_reminder_date: null,
          rebuy_action: "none",
          rebuy_action_at: null,
          created_at: "2026-06-19T00:00:00.000Z",
        },
      ],
      brewingLogs: [
        {
          id: "brew-1",
          shelf_item_id: "shelf-sidama",
          brewed_at: "2026-06-28T09:00:00.000Z",
          method: "V60",
          parameters: { waterTemp: 90 },
          rating: 2,
          simple_note: "too sour and thin",
          coffee_shelf_items: {
            id: "shelf-sidama",
            roaster_name: "Fritz",
            bean_name: "Ethiopia Sidama",
            origin: "Ethiopia Sidama Washed",
            roast_date: "2026-06-01",
            opened_date: "2026-06-10",
            fill_level: 8,
            is_finished: false,
            tasting_card_id: "card-sidama",
            purchase_url: "https://fritz.example/sidama",
            purchase_note: "Fritz 공식몰 200g 옵션",
            rebuy_priority: "normal",
            rebuy_reminder_date: null,
            rebuy_action: "none",
            rebuy_action_at: null,
            created_at: "2026-06-19T00:00:00.000Z",
          },
        },
      ],
    });

    assert.equal(result.rebuyReminder.priority, "high");
    assert.equal(result.rebuyReminder.cardId, "card-sidama");
    assert.equal(result.tasteMatch.matchCardId, "card-kenya");
    assert.deepEqual(result.tasteMatch.sharedTags, ["citrus"]);
    assert.equal(result.purchaseMemory.source, "shelf");
    assert.equal(result.purchaseMemory.searchUrl, "https://fritz.example/sidama");
    assert.equal(result.purchaseMemory.reason, "Fritz 공식몰 200g 옵션");
    assert.equal(result.brewFailureMemory.problem, "too_sour");
    assert.match(result.brewFailureMemory.adjustment, /곱게|온도/);
    assert.deepEqual(result.featureScores.map((score) => score.feature), [
      "rebuy_reminder",
      "purchase_memory",
      "brew_failure_memory",
      "taste_match",
    ]);
  } finally {
    rmSync(loaded.tempDirectory, { recursive: true, force: true });
  }
});

test("Given a pinned or due shelf reminder, When Rebuy Intelligence is built, Then it outranks passive freshness timing", async () => {
  const loaded = await loadRebuyIntelligenceModule();
  try {
    const { buildRebuyIntelligence } = loaded.module;
    const result = buildRebuyIntelligence({
      now: new Date("2026-06-29T12:00:00.000Z"),
      cards: [card()],
      shelfItems: [
        {
          id: "shelf-low",
          roaster_name: "Low Stock",
          bean_name: "Almost Empty",
          origin: null,
          roast_date: "2026-06-01",
          opened_date: "2026-06-10",
          fill_level: 5,
          is_finished: false,
          tasting_card_id: null,
          purchase_url: null,
          purchase_note: null,
          rebuy_priority: "normal",
          rebuy_reminder_date: null,
          rebuy_action: "none",
          rebuy_action_at: null,
          created_at: "2026-06-10T00:00:00.000Z",
        },
        {
          id: "shelf-pinned",
          roaster_name: "Fritz",
          bean_name: "Ethiopia Sidama",
          origin: "Ethiopia Sidama Washed",
          roast_date: "2026-06-20",
          opened_date: null,
          fill_level: 80,
          is_finished: false,
          tasting_card_id: "card-sidama",
          purchase_url: null,
          purchase_note: null,
          rebuy_priority: "pinned",
          rebuy_reminder_date: "2026-06-29",
          rebuy_action: "will_rebuy",
          rebuy_action_at: "2026-06-28T00:00:00.000Z",
          created_at: "2026-06-28T00:00:00.000Z",
        },
      ],
      brewingLogs: [],
    });

    assert.equal(result.rebuyReminder.shelfItemId, "shelf-pinned");
    assert.equal(result.rebuyReminder.priority, "high");
    assert.equal(result.rebuyReminder.actionLabel, "다시 찾기");
    assert.match(result.rebuyReminder.reason, /재구매 예정일|다시 살/);
  } finally {
    rmSync(loaded.tempDirectory, { recursive: true, force: true });
  }
});

test("Given no saved memories, When Rebuy Intelligence is built, Then it returns safe onboarding prompts", async () => {
  const loaded = await loadRebuyIntelligenceModule();
  try {
    const { buildRebuyIntelligence } = loaded.module;
    const result = buildRebuyIntelligence({
      now: new Date("2026-06-29T00:00:00.000Z"),
      cards: [],
      shelfItems: [],
      brewingLogs: [],
    });

    assert.equal(result.rebuyReminder.cardId, null);
    assert.equal(result.tasteMatch.anchorCardId, null);
    assert.equal(result.purchaseMemory.source, "manual");
    assert.equal(result.brewFailureMemory.logId, null);
  } finally {
    rmSync(loaded.tempDirectory, { recursive: true, force: true });
  }
});

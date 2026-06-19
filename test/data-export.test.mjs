import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const modulePath = path.join(projectRoot, "lib", "data-export.ts");

async function loadDataExportModule() {
  const tempDirectory = mkdtempSync(path.join(tmpdir(), "coffeedex-data-export-"));
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
  const outputPath = path.join(tempDirectory, "data-export.mjs");
  writeFileSync(outputPath, output);

  try {
    return await import(pathToFileURL(outputPath));
  } finally {
    rmSync(tempDirectory, { recursive: true, force: true });
  }
}

const ownerId = "550e8400-e29b-41d4-a716-446655440001";
const cardId = "550e8400-e29b-41d4-a716-446655440000";
const shelfId = "550e8400-e29b-41d4-a716-446655440002";

const archive = {
  version: "1",
  exportedAt: "2026-06-18T20:00:00+09:00",
  tastingCards: [{
    id: cardId,
    user_id: ownerId,
    category: "coffee",
    title: "=에티오피아, \"봄\"",
    subtitle: "향미\n로스터리",
    image_url: null,
    badges: ["싱글 오리진", "+추천"],
    metric1: 5,
    metric2: 4,
    metric3: 3,
    tags: ["복숭아", "재스민"],
    ai_description: "첫 줄\n둘째 \"줄\"",
    footer_meta: { origin: "@Ethiopia", date: "2026.06.18", extraInfo: "-iced" },
    package_origin: "에티오피아 시다마",
    package_process: "Washed",
    repurchase_intent: "again",
    repurchase_reasons: ["깨끗한 끝맛"],
    scan_source: "gemini",
    scan_confidence: 0.86,
    corrected_fields: ["package_origin", "tags"],
    confirmed_at: "2026-06-18T05:30:00+09:00",
    is_public: false,
    public_share_token: null,
    created_at: "2026-06-18T12:30:00+09:00",
    updated_at: "2026-06-18T13:30:00+09:00",
  }],
  brewingNotes: [{
    id: "550e8400-e29b-41d4-a716-446655440003",
    tasting_card_id: cardId,
    user_id: ownerId,
    method: "+V60",
    bean_amount: 15,
    water_amount: 240,
    grind_size: "medium",
    water_temp: 93,
    brew_time: 165,
    rating: 5,
    memo: "꽃 향",
    created_at: "2026-06-18T14:00:00+09:00",
  }],
  shelfItems: [{
    id: shelfId,
    user_id: ownerId,
    roaster_name: "Coffee Lab",
    bean_name: "Sidama",
    origin: "Ethiopia",
    roast_date: "2026-06-10",
    opened_date: null,
    total_weight: 200,
    fill_level: 75,
    is_finished: false,
    tasting_card_id: cardId,
    created_at: "2026-06-18T15:00:00+09:00",
    updated_at: "2026-06-18T15:30:00+09:00",
  }],
  brewingLogs: [{
    id: "550e8400-e29b-41d4-a716-446655440004",
    user_id: ownerId,
    shelf_item_id: shelfId,
    brewed_at: "2026-06-18T16:00:00+09:00",
    method: "V60",
    parameters: { water_temp: 93, note: "@hot" },
    rating: 5,
    simple_note: "clean",
    created_at: "2026-06-18T16:00:00+09:00",
    updated_at: "2026-06-18T16:30:00+09:00",
  }],
};

test("Given all owned datasets, When serializing JSON, Then a deterministic versioned archive is returned", async () => {
  const { serializeCoffeeDexJson } = await loadDataExportModule();

  const first = serializeCoffeeDexJson(archive);
  const second = serializeCoffeeDexJson(archive);
  const parsed = JSON.parse(first);

  assert.equal(first, second);
  assert.deepEqual(Object.keys(parsed), ["version", "exportedAt", "tastingCards", "brewingNotes", "shelfItems", "brewingLogs"]);
  assert.equal(parsed.version, "1");
  assert.equal(parsed.exportedAt, "2026-06-18T11:00:00.000Z");
  assert.equal(parsed.tastingCards[0].footer_origin, "@Ethiopia");
  assert.equal(parsed.brewingNotes[0].created_at, "2026-06-18T05:00:00.000Z");
  assert.equal(parsed.shelfItems[0].roast_date, "2026-06-10");
  assert.deepEqual(parsed.brewingLogs[0].parameters, { water_temp: 93, note: "@hot" });
});

test("Given all record types, When serializing CSV, Then stable union rows preserve every dataset", async () => {
  const { coffeeDexExportHeaders, serializeCoffeeDexCsv } = await loadDataExportModule();

  const csv = serializeCoffeeDexCsv(archive);

  assert.equal(csv.endsWith("\r\n"), true);
  assert.deepEqual(coffeeDexExportHeaders.slice(0, 3), ["export_version", "exported_at", "record_type"]);
  assert.equal(csv.split("\r\n", 1)[0], coffeeDexExportHeaders.join(","));
  assert.match(csv, /tasting_card/);
  assert.match(csv, /brewing_note/);
  assert.match(csv, /shelf_item/);
  assert.match(csv, /brewing_log/);
  assert.match(csv, /"'\=에티오피아, ""봄"""/);
  assert.match(csv, /'\+V60/);
  assert.match(csv, /"\{""water_temp"":93,""note"":""@hot""\}"/);
});

test("Given formula prefixes in any dataset, When serializing CSV, Then executable cells are neutralized", async () => {
  const { serializeCoffeeDexCsv } = await loadDataExportModule();
  const prefixes = ["=1+1", "+cmd", "-2+3", "@SUM(A1:A2)"];

  for (const prefix of prefixes) {
    const csv = serializeCoffeeDexCsv({
      ...archive,
      brewingNotes: [{ ...archive.brewingNotes[0], memo: prefix }],
    });
    assert.match(csv, new RegExp(`'${prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
  }
});

test("Given malformed or incomplete persisted data, When serializing, Then the archive fails closed", async () => {
  const { serializeCoffeeDexJson } = await loadDataExportModule();

  assert.throws(() => serializeCoffeeDexJson({ ...archive, brewingNotes: undefined }));
  assert.throws(() => serializeCoffeeDexJson({
    ...archive,
    shelfItems: [{ ...archive.shelfItems[0], fill_level: 101 }],
  }));
  assert.throws(() => serializeCoffeeDexJson({
    ...archive,
    brewingLogs: [{ ...archive.brewingLogs[0], billing_state: "paid" }],
  }));
});

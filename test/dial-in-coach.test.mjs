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

async function loadDialInCoachModule() {
  const tempDirectory = mkdtempSync(path.join(tmpdir(), "coffeedex-dial-in-coach-"));
  const modulePath = path.join(projectRoot, "lib/dial-in-coach.ts");
  writeFileSync(path.join(tempDirectory, "dial-in-coach.mjs"), transpile(readFileSync(modulePath, "utf8"), modulePath));

  try {
    return {
      module: await import(pathToFileURL(path.join(tempDirectory, "dial-in-coach.mjs"))),
      tempDirectory,
    };
  } catch (error) {
    rmSync(tempDirectory, { recursive: true, force: true });
    throw error;
  }
}

test("Given a bright active bean, When Dial-in Coach is built, Then it returns a concrete starting recipe and save payload", async () => {
  const loaded = await loadDialInCoachModule();
  try {
    const { buildDialInCoach } = loaded.module;
    const result = buildDialInCoach({
      now: new Date("2026-06-29T00:00:00.000Z"),
      shelfItems: [
        {
          id: "shelf-1",
          roaster_name: "Fritz",
          bean_name: "Ethiopia Sidama Washed",
          origin: "Ethiopia floral citrus",
          roast_date: "2026-06-20",
          opened_date: "2026-06-26",
          fill_level: 45,
          is_finished: false,
        },
      ],
      brewingLogs: [],
    });

    assert.equal(result.selectedShelfItemId, "shelf-1");
    assert.equal(result.recipe.method, "V60");
    assert.equal(result.recipe.coffeeAmount, 15);
    assert.equal(result.recipe.waterAmount, 240);
    assert.equal(result.recipe.waterTemp, 93);
    assert.equal(result.suggestedLog.shelfItemId, "shelf-1");
    assert.equal(result.suggestedLog.coachSnapshot.source, "dial_in_coach");
    assert.match(result.suggestedLog.simpleNote, /Dial-in Coach/);
    assert.equal(result.adjustments.length, 4);
  } finally {
    rmSync(loaded.tempDirectory, { recursive: true, force: true });
  }
});

test("Given a recent successful brew log, When Dial-in Coach is built, Then it reuses the proven recipe", async () => {
  const loaded = await loadDialInCoachModule();
  try {
    const { buildDialInCoach } = loaded.module;
    const result = buildDialInCoach({
      now: new Date("2026-06-29T00:00:00.000Z"),
      shelfItems: [
        {
          id: "shelf-1",
          roaster_name: "Momos",
          bean_name: "Colombia Natural",
          origin: "Colombia natural chocolate",
          roast_date: "2026-06-12",
          opened_date: "2026-06-18",
          fill_level: 60,
          is_finished: false,
        },
      ],
      brewingLogs: [
        {
          id: "log-1",
          shelf_item_id: "shelf-1",
          brewed_at: "2026-06-28T10:00:00.000Z",
          method: "Origami",
          parameters: {
            coffeeAmount: 18,
            waterAmount: 270,
            waterTemp: 90,
            grindSize: "Medium",
            brewTime: "2:25",
          },
          rating: 5,
          simple_note: "balanced",
        },
      ],
    });

    assert.equal(result.recipe.method, "Origami");
    assert.equal(result.recipe.coffeeAmount, 18);
    assert.equal(result.recipe.waterAmount, 270);
    assert.equal(result.recipe.ratioLabel, "이전 성공 로그 기반");
    assert.ok(result.evidence.some((value) => value.includes("성공 로그")));
  } finally {
    rmSync(loaded.tempDirectory, { recursive: true, force: true });
  }
});

import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function loadFunnel() {
  const tempDirectory = mkdtempSync(path.join(tmpdir(), "coffeedex-rebuy-calendar-funnel-"));
  const sourcePath = path.join(projectRoot, "lib/rebuy-calendar-funnel.ts");
  const output = ts.transpileModule(readFileSync(sourcePath, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: sourcePath,
  }).outputText;
  const modulePath = path.join(tempDirectory, "rebuy-calendar-funnel.mjs");
  writeFileSync(modulePath, output);

  return {
    module: await import(pathToFileURL(modulePath)),
    cleanup: () => rmSync(tempDirectory, { recursive: true, force: true }),
  };
}

test("Given owner-linked calendar events, When an owner returns and later saves a rebuy decision, Then the funnel counts only the completed sequence", async () => {
  const funnel = await loadFunnel();

  try {
    const result = funnel.module.buildRebuyCalendarFunnel({
      now: new Date("2026-07-10T12:00:00.000Z"),
      events: [
        { event_name: "rebuy_calendar_export_clicked", occurred_at: "2026-07-10T09:00:00.000Z", user_id: "user-1" },
        { event_name: "rebuy_calendar_returned", occurred_at: "2026-07-10T10:00:00.000Z", user_id: "user-1" },
        { event_name: "rebuy_purchase_clue_opened", occurred_at: "2026-07-10T10:05:00.000Z", user_id: "user-1" },
        { event_name: "rebuy_shelf_memory_started", occurred_at: "2026-07-10T11:05:00.000Z", user_id: "user-1" },
        { event_name: "rebuy_calendar_export_clicked", occurred_at: "2026-07-10T09:10:00.000Z", user_id: "user-2" },
        { event_name: "rebuy_calendar_returned", occurred_at: "2026-07-10T08:00:00.000Z", user_id: "user-3" },
        { event_name: "rebuy_calendar_export_clicked", occurred_at: "2026-07-10T09:20:00.000Z", user_id: null },
        { event_name: "rebuy_calendar_export_clicked", occurred_at: "2026-06-01T09:00:00.000Z", user_id: "user-expired" },
      ],
      shelfItems: [
        { user_id: "user-1", rebuy_action: "rebought", rebuy_action_at: "2026-07-10T11:00:00.000Z" },
        { user_id: "user-2", rebuy_action: "will_rebuy", rebuy_action_at: "2026-07-10T08:00:00.000Z" },
        { user_id: "user-3", rebuy_action: "rebought", rebuy_action_at: "2026-07-10T12:00:00.000Z" },
        { user_id: "user-expired", rebuy_action: "rebought", rebuy_action_at: "2026-07-10T12:00:00.000Z" },
      ],
    });

    assert.deepEqual(result, {
      exportedUsers: 2,
      returnedUsers: 1,
      purchaseClueUsers: 1,
      decidedUsers: 1,
      reboughtUsers: 1,
      shelfMemoryUsers: 1,
      rates: {
        returnAfterExportPercent: 50,
        decisionAfterReturnPercent: 100,
        newBagAfterReboughtPercent: 100,
      },
      bottleneck: "return",
      unattributedEvents: 1,
      windowDays: 14,
      windowStart: "2026-06-26T12:00:00.000Z",
    });
  } finally {
    funnel.cleanup();
  }
});

test("Given no completed rebuy in the window, When calendar funnel rates are derived, Then a new-bag rate is withheld instead of implying a drop", async () => {
  const funnel = await loadFunnel();

  try {
    const result = funnel.module.buildRebuyCalendarFunnel({
      now: new Date("2026-07-10T12:00:00.000Z"),
      events: [
        { event_name: "rebuy_calendar_export_clicked", occurred_at: "2026-07-10T09:00:00.000Z", user_id: "user-1" },
        { event_name: "rebuy_calendar_returned", occurred_at: "2026-07-10T10:00:00.000Z", user_id: "user-1" },
      ],
      shelfItems: [
        { user_id: "user-1", rebuy_action: "will_rebuy", rebuy_action_at: "2026-07-10T10:10:00.000Z" },
      ],
    });

    assert.equal(result.reboughtUsers, 0);
    assert.equal(result.rates.newBagAfterReboughtPercent, null);
    assert.equal(result.bottleneck, "insufficient_data");
  } finally {
    funnel.cleanup();
  }
});

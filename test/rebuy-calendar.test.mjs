import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const helperPath = path.join(projectRoot, "lib/rebuy-calendar.ts");

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

async function loadRebuyCalendarModule() {
  assert.equal(existsSync(helperPath), true);
  const tempDirectory = mkdtempSync(path.join(tmpdir(), "coffeedex-rebuy-calendar-"));
  writeFileSync(
    path.join(tempDirectory, "rebuy-calendar.mjs"),
    transpile(readFileSync(helperPath, "utf8"), helperPath),
  );

  try {
    return {
      module: await import(pathToFileURL(path.join(tempDirectory, "rebuy-calendar.mjs"))),
      tempDirectory,
    };
  } catch (error) {
    rmSync(tempDirectory, { recursive: true, force: true });
    throw error;
  }
}

function shelfItem(overrides = {}) {
  return {
    id: "shelf-private-id-123",
    roaster_name: "Fritz; Seoul",
    bean_name: "에티오피아, 시다마\n워시드",
    rebuy_reminder_date: "2026-07-15",
    ...overrides,
  };
}

function unfoldCalendarLines(calendarText) {
  return calendarText.split("\r\n").reduce((lines, line) => {
    if (line.startsWith(" ")) {
      lines[lines.length - 1] = `${lines[lines.length - 1]}${line.slice(1)}`;
      return lines;
    }
    lines.push(line);
    return lines;
  }, []);
}

test("Given an owned shelf reminder, When building a private rebuy reminder calendar, Then the ICS is RFC-safe and private", async () => {
  const loaded = await loadRebuyCalendarModule();
  try {
    const { buildRebuyReminderCalendar } = loaded.module;

    const calendarText = buildRebuyReminderCalendar({
      shelfItem: shelfItem({
        bean_name: `${"긴원두이름".repeat(18)}, 시다마\n워시드`,
        roaster_name: "Fritz; Seoul",
      }),
      origin: "https://coffeedex.example/current/path?ignored=true",
      now: new Date("2026-07-01T12:34:56.789Z"),
    });
    const lines = unfoldCalendarLines(calendarText);

    assert.equal(calendarText.includes("\n"), true);
    assert.equal(calendarText.includes("\r\n"), true);
    assert.equal(calendarText.replaceAll("\r\n", "").includes("\n"), false);
    assert.equal(lines.at(0), "BEGIN:VCALENDAR");
    assert.equal(lines.includes("VERSION:2.0"), true);
    assert.equal(lines.includes("BEGIN:VEVENT"), true);
    assert.equal(lines.includes("END:VEVENT"), true);
    assert.equal(lines.at(-2), "END:VCALENDAR");
    assert.match(calendarText, /^UID:coffeedex-rebuy-[a-z0-9]+@coffeedex\.local/m);
    assert.equal(lines.includes("DTSTAMP:20260701T123456Z"), true);
    assert.equal(lines.includes("DTSTART;VALUE=DATE:20260715"), true);
    assert.equal(lines.includes("DTEND;VALUE=DATE:20260716"), true);
    assert.equal(
      lines.some((line) => line.includes("SUMMARY:원두 재구매 리마인더")),
      true,
    );
    assert.equal(calendarText.includes("Fritz\\; Seoul"), true);
    assert.equal(calendarText.includes("\\, 시다마\\n워시드"), true);
    assert.equal(calendarText.includes("https://coffeedex.example/dashboard?source=rebuy_calendar"), true);
    assert.equal(calendarText.includes("shelf-private-id-123"), false);
    assert.equal(calendarText.includes("user_id"), false);
    assert.equal(calendarText.includes("analytics"), false);
    assert.equal(
      calendarText.split("\r\n").every((line) => new TextEncoder().encode(line).length <= 75),
      true,
    );
  } finally {
    rmSync(loaded.tempDirectory, { recursive: true, force: true });
  }
});

test("Given an owned shelf item without a reminder, When building a calendar, Then it rejects shelf items without a reminder date", async () => {
  const loaded = await loadRebuyCalendarModule();
  try {
    const { buildRebuyReminderCalendar } = loaded.module;

    assert.throws(
      () => buildRebuyReminderCalendar({
        shelfItem: shelfItem({ rebuy_reminder_date: null }),
        origin: "https://coffeedex.example",
        now: new Date("2026-07-01T12:34:56.789Z"),
      }),
      /재구매 예정일이 있는 원두만 캘린더로 내보낼 수 있습니다\./,
    );
  } finally {
    rmSync(loaded.tempDirectory, { recursive: true, force: true });
  }
});

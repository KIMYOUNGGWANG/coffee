import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const migrationPath = path.join(projectRoot, "supabase/migrations/20260710003000_add_rebuy_shelf_memory_started_event.sql");

test("Given an explicit calendar-return new-bag save, When its event persists, Then the database event constraint accepts it", () => {
  const migration = readFileSync(migrationPath, "utf8");

  assert.match(migration, /drop constraint if exists product_events_event_name_check/);
  assert.match(migration, /'rebuy_shelf_memory_started'/);
});

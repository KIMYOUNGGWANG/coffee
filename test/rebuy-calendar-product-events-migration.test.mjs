import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const migrationPath = path.join(projectRoot, "supabase/migrations/20260710001000_expand_rebuy_calendar_product_events.sql");

test("Given the private rebuy calendar funnel, When its events persist, Then the database event constraint accepts each event", () => {
  const migration = readFileSync(migrationPath, "utf8");

  assert.match(migration, /drop constraint if exists product_events_event_name_check/);
  assert.match(migration, /'rebuy_action_saved'/);
  assert.match(migration, /'rebuy_calendar_export_clicked'/);
  assert.match(migration, /'rebuy_calendar_returned'/);
});

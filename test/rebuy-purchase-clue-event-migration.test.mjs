import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const migrationPath = path.join(projectRoot, "supabase/migrations/20260710002000_add_rebuy_purchase_clue_event.sql");

test("Given a private calendar purchase handoff, When its open event persists, Then the database event constraint accepts it", () => {
  const migration = readFileSync(migrationPath, "utf8");

  assert.match(migration, /drop constraint if exists product_events_event_name_check/);
  assert.match(migration, /'rebuy_purchase_clue_opened'/);
});

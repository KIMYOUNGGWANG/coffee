import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const migration = readFileSync(
  path.join(projectRoot, "supabase/migrations/20260711002000_add_next_purchase_memory_event.sql"),
  "utf8",
);

test("Given a private next-purchase memory action, When analytics persists, Then the event constraint accepts it", () => {
  assert.match(migration, /drop constraint if exists product_events_event_name_check/);
  assert.match(migration, /'next_purchase_memory_opened'/);
});

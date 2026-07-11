import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const migrationPath = path.join(projectRoot, "supabase/migrations/20260710004000_add_rebuy_shelf_source_idempotency.sql");

test("Given a retried calendar rebuy continuation, When a new bag is persisted, Then one owner-scoped source row can create only one successor", () => {
  const migration = readFileSync(migrationPath, "utf8");

  assert.match(migration, /rebuy_source_shelf_item_id uuid/);
  assert.match(migration, /unique \(user_id, rebuy_source_shelf_item_id\)/);
});

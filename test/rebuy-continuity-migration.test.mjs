import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const migration = readFileSync(
  path.join(projectRoot, "supabase/migrations/20260711001000_add_rebuy_continuity_memory.sql"),
  "utf8",
);

test("rebuy continuity migration stores an optional purchase date and positive one-based sequence", () => {
  assert.match(migration, /purchase_date date/);
  assert.match(migration, /rebuy_sequence integer not null default 1/);
  assert.match(migration, /check \(rebuy_sequence >= 1\)/);
});

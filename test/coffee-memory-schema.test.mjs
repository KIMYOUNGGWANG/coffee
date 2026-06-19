import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const foundationPath = path.join(
  projectRoot,
  "supabase/migrations/20260614000000_create_tasting_cards.sql",
);
const migrationPath = path.join(
  projectRoot,
  "supabase/migrations/20260618000000_add_coffee_memory_contract.sql",
);

function normalizeSql(sql) {
  return sql.toLowerCase().replace(/\s+/g, " ");
}

test("Given the legacy card schema, When memory fields are added, Then owner RLS remains the authority", () => {
  const foundationSql = normalizeSql(readFileSync(foundationPath, "utf8"));

  assert.match(foundationSql, /user_id uuid not null references auth\.users\(id\)/);
  assert.match(foundationSql, /alter table tasting_cards enable row level security/);
  assert.match(foundationSql, /for insert with check \(auth\.uid\(\) = user_id\)/);
  assert.match(foundationSql, /for select using \(auth\.uid\(\) = user_id\)/);
  assert.match(foundationSql, /for update using \(auth\.uid\(\) = user_id\)/);
  assert.match(foundationSql, /for delete using \(auth\.uid\(\) = user_id\)/);

  assert.equal(existsSync(migrationPath), true, "the additive memory migration exists");
  const migrationSql = normalizeSql(readFileSync(migrationPath, "utf8"));
  assert.doesNotMatch(migrationSql, /disable row level security|drop policy|create table/);
});

test("Given existing tasting cards, When the migration runs, Then memory columns are additive and replay-safe", () => {
  assert.equal(existsSync(migrationPath), true, "the additive memory migration exists");
  const sql = normalizeSql(readFileSync(migrationPath, "utf8"));

  assert.match(sql, /alter table public\.tasting_cards add column if not exists package_origin text/);
  assert.match(sql, /add column if not exists package_process text/);
  assert.match(sql, /add column if not exists repurchase_intent text not null default 'undecided'/);
  assert.match(sql, /add column if not exists repurchase_reasons text\[\] not null default '\{\}'::text\[\]/);
  assert.match(sql, /add column if not exists scan_source text/);
  assert.match(sql, /add column if not exists scan_confidence double precision/);
  assert.match(sql, /add column if not exists corrected_fields text\[\] not null default '\{\}'::text\[\]/);
  assert.match(sql, /add column if not exists confirmed_at timestamptz/);
});

test("Given persisted memory values, When constraints apply, Then invalid intent, source, confidence, and corrections fail", () => {
  assert.equal(existsSync(migrationPath), true, "the additive memory migration exists");
  const sql = normalizeSql(readFileSync(migrationPath, "utf8"));

  assert.match(sql, /repurchase_intent in \('again', 'maybe', 'no', 'undecided'\)/);
  assert.match(sql, /scan_source is null or scan_source in \('gemini', 'manual'\)/);
  assert.match(sql, /scan_confidence is null or scan_confidence between 0 and 1/);
  assert.match(
    sql,
    /corrected_fields <@ array\[\s*'title', 'subtitle', 'package_origin', 'package_process', 'tags'\s*\]::text\[\]/,
  );
  assert.match(sql, /create index if not exists idx_tasting_cards_user_repurchase_intent/);
  assert.match(sql, /on public\.tasting_cards \(user_id, repurchase_intent\)/);
  assert.match(sql, /create index if not exists idx_tasting_cards_user_confirmed_at/);
  assert.match(sql, /on public\.tasting_cards \(user_id, confirmed_at desc\)/);
});

import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const currentFilePath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(currentFilePath), "..");
const migrationsDirectory = path.join(projectRoot, "supabase", "migrations");

async function readMigrationSql() {
  const migrationNames = (await readdir(migrationsDirectory))
    .filter((name) => name.endsWith(".sql"))
    .sort();

  const migrationBodies = await Promise.all(
    migrationNames.map((name) =>
      readFile(path.join(migrationsDirectory, name), "utf8"),
    ),
  );

  return migrationBodies.join("\n");
}

function normalizeSql(sql) {
  return sql.toLowerCase().replace(/\s+/g, " ");
}

function assertColumnContract(sql, pattern, message) {
  assert.match(sql, pattern, message);
}

test("Given a fresh schema, When migrations run, Then profiles is bootstrapped before profile alters", async () => {
  const sql = normalizeSql(await readMigrationSql());
  const createProfilesIndex = sql.search(
    /create table if not exists (public\.)?profiles/,
  );
  const firstAlterProfilesIndex = sql.search(
    /alter table (public\.)?profiles add column/,
  );

  assert.notEqual(createProfilesIndex, -1, "profiles table is created safely");
  assert.ok(
    firstAlterProfilesIndex === -1 || createProfilesIndex < firstAlterProfilesIndex,
    "profiles creation appears before migrations alter profiles",
  );
  assert.match(sql, /after insert on auth\.users/, "auth profile trigger exists");
  assert.match(sql, /alter table (public\.)?profiles enable row level security/);
  assert.match(sql, /create policy "users can view their own profile"/);
});

test("Given profile paid state, When migrations run, Then defaults are safe", async () => {
  const sql = normalizeSql(await readMigrationSql());

  assertColumnContract(sql, /credits integer not null default 1 check \(credits >= 0\)/, "credits default is safe");
  assertColumnContract(sql, /has_pdf_access boolean not null default false/, "PDF access defaults false");
  assertColumnContract(sql, /is_premium boolean not null default false/, "premium defaults false");
  assertColumnContract(sql, /scans_used integer not null default 0 check \(scans_used >= 0\)/, "scan use starts at zero");
  assertColumnContract(sql, /monthly_scan_limit integer not null default 5 check \(monthly_scan_limit >= 0\)/, "monthly limit has a safe default");
  assertColumnContract(sql, /last_scan_reset timestamptz not null default now\(\)/, "scan reset timestamp defaults to now");
});

test("Given Stripe webhooks, When migrations run, Then event ledger supports idempotency metadata", async () => {
  const sql = normalizeSql(await readMigrationSql());

  assert.match(sql, /create table if not exists (public\.)?stripe_events/);
  assert.match(sql, /event_id text not null/);
  assert.match(sql, /unique \(event_id\)/, "event ID has a unique ledger key");
  assert.match(sql, /stripe_session_id text/);
  assert.match(sql, /stripe_payment_intent_id text/);
  assert.match(sql, /stripe_customer_id text/);
  assert.match(sql, /stripe_subscription_id text/);
  assert.match(sql, /stripe_subscription_item_id text/);
  assert.match(sql, /item_type text/);
  assert.match(sql, /payload jsonb not null default '\{\}'::jsonb/);
  assert.match(sql, /alter table (public\.)?stripe_events enable row level security/);
});

test("Given entitlement changes, When migrations run, Then audit rows are recorded and protected", async () => {
  const sql = normalizeSql(await readMigrationSql());

  assert.match(sql, /create table if not exists (public\.)?entitlement_audit/);
  assert.match(sql, /user_id uuid not null references auth\.users\(id\)/);
  assert.match(sql, /entitlement_kind text not null/);
  assert.match(sql, /entitlement_change text not null/);
  assert.match(sql, /source text not null/);
  assert.match(sql, /stripe_event_id text/);
  assert.match(sql, /event_metadata jsonb not null default '\{\}'::jsonb/);
  assert.match(sql, /occurred_at timestamptz not null default now\(\)/);
  assert.match(sql, /created_at timestamptz not null default now\(\)/);
  assert.match(sql, /alter table (public\.)?entitlement_audit enable row level security/);
  assert.match(sql, /create policy "users can view their own entitlement audit"/);
});

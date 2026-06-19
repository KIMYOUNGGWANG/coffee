import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

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

function writeRuntimeMocks(tempDirectory) {
  writeFileSync(path.join(tempDirectory, "next-server.mjs"), `
export class NextResponse extends Response {
  static json(body, init = {}) {
    const headers = new Headers(init.headers);
    headers.set("content-type", "application/json");
    return new NextResponse(JSON.stringify(body), { ...init, headers });
  }
}`);
  writeFileSync(path.join(tempDirectory, "supabase.mjs"), `
const state = { authenticated: true, tableResults: {}, calls: [] };

export function configure(next) {
  Object.assign(state, next);
  state.calls = [];
}

export function getCalls() {
  return structuredClone(state.calls);
}

class Query {
  constructor(table) { this.table = table; }
  select(columns = "*") { state.calls.push({ method: "select", columns }); return this; }
  eq(column, value) { state.calls.push({ method: "eq", column, value }); return this; }
  order(column, options) {
    state.calls.push({ method: "order", column, options });
    return Promise.resolve(state.tableResults[this.table] ?? { data: [], error: null });
  }
}

export async function createServerSupabase() {
  return {
    auth: {
      getUser: () => Promise.resolve(state.authenticated
        ? { data: { user: { id: "550e8400-e29b-41d4-a716-446655440001" } }, error: null }
        : { data: { user: null }, error: { message: "anonymous" } }),
    },
    from(table) { state.calls.push({ method: "from", table }); return new Query(table); },
  };
}`);
}

async function loadExportRoute() {
  const tempDirectory = mkdtempSync(path.join(tmpdir(), "coffeedex-export-route-"));
  const zodUrl = pathToFileURL(path.join(projectRoot, "node_modules/zod/index.js")).href;
  writeRuntimeMocks(tempDirectory);

  const dataExportPath = path.join(projectRoot, "lib/data-export.ts");
  const dataExportSource = readFileSync(dataExportPath, "utf8").replaceAll('"zod"', `"${zodUrl}"`);
  writeFileSync(path.join(tempDirectory, "data-export.mjs"), transpile(dataExportSource, dataExportPath));

  const routePath = path.join(projectRoot, "app/api/v1/export/route.ts");
  const routeSource = readFileSync(routePath, "utf8")
    .replaceAll('"next/server"', '"./next-server.mjs"')
    .replaceAll('"zod"', `"${zodUrl}"`)
    .replaceAll('"@/lib/supabase/server"', '"./supabase.mjs"')
    .replaceAll('"@/lib/data-export"', '"./data-export.mjs"');
  writeFileSync(path.join(tempDirectory, "route.mjs"), transpile(routeSource, routePath));

  return {
    route: await import(pathToFileURL(path.join(tempDirectory, "route.mjs"))),
    supabase: await import(pathToFileURL(path.join(tempDirectory, "supabase.mjs"))),
  };
}

const memory = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  user_id: "550e8400-e29b-41d4-a716-446655440001",
  category: "coffee",
  title: "Ethiopia Sidama",
  subtitle: "Coffee Lab",
  image_url: null,
  badges: ["Washed"],
  metric1: 4,
  metric2: 5,
  metric3: 3,
  tags: ["peach"],
  ai_description: "Clean finish",
  footer_meta: { origin: "Ethiopia" },
  package_origin: "Sidama",
  package_process: "Washed",
  repurchase_intent: "again",
  repurchase_reasons: ["clean finish"],
  scan_source: "manual",
  scan_confidence: null,
  corrected_fields: [],
  confirmed_at: "2026-06-18T12:00:00.000Z",
  is_public: false,
  public_share_token: null,
  created_at: "2026-06-18T12:00:00.000Z",
  updated_at: "2026-06-18T12:00:00.000Z",
};

const brewingNote = {
  id: "550e8400-e29b-41d4-a716-446655440002",
  tasting_card_id: memory.id,
  user_id: memory.user_id,
  method: "V60",
  bean_amount: 15,
  water_amount: 240,
  grind_size: null,
  water_temp: 93,
  brew_time: 165,
  rating: 5,
  memo: "clean",
  created_at: "2026-06-18T13:00:00.000Z",
};
const shelfItem = {
  id: "550e8400-e29b-41d4-a716-446655440003",
  user_id: memory.user_id,
  roaster_name: "Coffee Lab",
  bean_name: "Sidama",
  origin: "Ethiopia",
  roast_date: "2026-06-10",
  opened_date: null,
  total_weight: 200,
  fill_level: 75,
  is_finished: false,
  tasting_card_id: memory.id,
  created_at: "2026-06-18T14:00:00.000Z",
  updated_at: "2026-06-18T14:00:00.000Z",
};
const brewingLog = {
  id: "550e8400-e29b-41d4-a716-446655440004",
  user_id: memory.user_id,
  shelf_item_id: shelfItem.id,
  brewed_at: "2026-06-18T15:00:00.000Z",
  method: "V60",
  parameters: { water_temp: 93 },
  rating: 5,
  simple_note: "clean",
  created_at: "2026-06-18T15:00:00.000Z",
  updated_at: "2026-06-18T15:00:00.000Z",
};

const tableResults = {
  tasting_cards: { data: [memory], error: null },
  brewing_notes: { data: [brewingNote], error: null },
  coffee_shelf_items: { data: [shelfItem], error: null },
  brewing_logs: { data: [brewingLog], error: null },
};

test("Given an unsupported format, When exporting, Then the route returns 400 before auth or data access", async () => {
  const { route, supabase } = await loadExportRoute();
  supabase.configure({ authenticated: false });

  const response = await route.GET(new Request("http://localhost/api/v1/export?format=xml"));

  assert.equal(response.status, 400);
  assert.equal((await response.json()).error.code, 400);
  assert.deepEqual(supabase.getCalls(), []);
});

test("Given no authenticated user, When exporting, Then the route returns 401 before querying", async () => {
  const { route, supabase } = await loadExportRoute();
  supabase.configure({ authenticated: false });

  const response = await route.GET(new Request("http://localhost/api/v1/export?format=json"));

  assert.equal(response.status, 401);
  assert.deepEqual(supabase.getCalls(), []);
});

test("Given a free authenticated owner, When exporting JSON, Then only owner-scoped memories download privately", async () => {
  const { route, supabase } = await loadExportRoute();
  supabase.configure({ authenticated: true, tableResults });

  const response = await route.GET(new Request("http://localhost/api/v1/export?format=json"));

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /^application\/json/);
  assert.match(response.headers.get("content-disposition"), /^attachment; filename="coffeedex-memories-\d{4}-\d{2}-\d{2}\.json"$/);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.equal(response.headers.get("pragma"), "no-cache");
  const archive = JSON.parse(await response.text());
  assert.equal(archive.version, "1");
  assert.deepEqual(archive.tastingCards.map((row) => row.id), [memory.id]);
  assert.deepEqual(archive.brewingNotes.map((row) => row.id), [brewingNote.id]);
  assert.deepEqual(archive.shelfItems.map((row) => row.id), [shelfItem.id]);
  assert.deepEqual(archive.brewingLogs.map((row) => row.id), [brewingLog.id]);
  assert.deepEqual(supabase.getCalls(), [
    { method: "from", table: "tasting_cards" },
    { method: "select", columns: "*" },
    { method: "eq", column: "user_id", value: memory.user_id },
    { method: "order", column: "created_at", options: { ascending: false } },
    { method: "from", table: "brewing_notes" },
    { method: "select", columns: "*" },
    { method: "eq", column: "user_id", value: memory.user_id },
    { method: "order", column: "created_at", options: { ascending: false } },
    { method: "from", table: "coffee_shelf_items" },
    { method: "select", columns: "*" },
    { method: "eq", column: "user_id", value: memory.user_id },
    { method: "order", column: "created_at", options: { ascending: false } },
    { method: "from", table: "brewing_logs" },
    { method: "select", columns: "*" },
    { method: "eq", column: "user_id", value: memory.user_id },
    { method: "order", column: "brewed_at", options: { ascending: false } },
  ]);
});

test("Given owned memories, When exporting CSV, Then the response is an attachment with serialized rows", async () => {
  const { route, supabase } = await loadExportRoute();
  supabase.configure({ authenticated: true, tableResults });

  const response = await route.GET(new Request("http://localhost/api/v1/export?format=csv"));
  const body = await response.text();

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /^text\/csv/);
  assert.match(response.headers.get("content-disposition"), /\.csv"$/);
  assert.match(body, /^export_version,exported_at,record_type,/);
  assert.match(body, /tasting_card/);
  assert.match(body, /Ethiopia Sidama/);
});

test("Given any owned dataset query fails, When exporting, Then the archive fails closed", async () => {
  const { route, supabase } = await loadExportRoute();
  supabase.configure({
    authenticated: true,
    tableResults: {
      ...tableResults,
      brewing_notes: { data: null, error: { message: "notes unavailable" } },
    },
  });

  const response = await route.GET(new Request("http://localhost/api/v1/export?format=json"));

  assert.equal(response.status, 500);
  assert.equal(response.headers.get("content-disposition"), null);
  assert.equal((await response.json()).error.code, 500);
});

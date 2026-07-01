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
  writeFileSync(path.join(tempDirectory, "api-errors.mjs"), `
export function getErrorMessage(error) {
  return error instanceof Error ? error.message : "unknown";
}`);
  writeFileSync(path.join(tempDirectory, "supabase.mjs"), `
const state = {
  authenticated: true,
  listRows: [],
  singleResult: { data: null, error: null },
  calls: [],
};

export function configure(next) {
  Object.assign(state, next);
  state.calls = [];
}

export function getCalls() {
  return structuredClone(state.calls);
}

class Query {
  constructor() { this.operation = "select"; }
  select(columns = "*") { state.calls.push({ method: "select", columns }); return this; }
  insert(payload) { this.operation = "insert"; state.calls.push({ method: "insert", payload }); return this; }
  update(payload) { this.operation = "update"; state.calls.push({ method: "update", payload }); return this; }
  delete() { this.operation = "delete"; state.calls.push({ method: "delete" }); return this; }
  eq(column, value) { state.calls.push({ method: "eq", column, value }); return this; }
  order(column, options) {
    state.calls.push({ method: "order", column, options });
    return Promise.resolve({ data: state.listRows, error: null });
  }
  single() { return Promise.resolve(state.singleResult); }
}

export async function createServerSupabase() {
  return {
    auth: {
      getUser: () => Promise.resolve(state.authenticated
        ? { data: { user: { id: "owner-1" } }, error: null }
        : { data: { user: null }, error: { message: "anonymous" } }),
    },
    from(table) { state.calls.push({ method: "from", table }); return new Query(); },
  };
}`);
}

async function loadRoutes() {
  const tempDirectory = mkdtempSync(path.join(tmpdir(), "coffeedex-memory-crud-"));
  const zodUrl = pathToFileURL(path.join(projectRoot, "node_modules/zod/index.js")).href;
  writeRuntimeMocks(tempDirectory);

  const memoryPath = path.join(projectRoot, "lib/coffee-memory.ts");
  const memorySource = readFileSync(memoryPath, "utf8").replaceAll('"zod"', `"${zodUrl}"`);
  writeFileSync(path.join(tempDirectory, "coffee-memory.mjs"), transpile(memorySource, memoryPath));

  const replacements = (source) => source
    .replaceAll('"next/server"', '"./next-server.mjs"')
    .replaceAll('"zod"', `"${zodUrl}"`)
    .replaceAll('"@/lib/supabase/server"', '"./supabase.mjs"')
    .replaceAll('"@/lib/api-errors"', '"./api-errors.mjs"')
    .replaceAll('"@/lib/coffee-memory"', '"./coffee-memory.mjs"');

  const collectionPath = path.join(projectRoot, "app/api/v1/cards/route.ts");
  const itemPath = path.join(projectRoot, "app/api/v1/cards/[id]/route.ts");
  writeFileSync(
    path.join(tempDirectory, "collection.mjs"),
    transpile(replacements(readFileSync(collectionPath, "utf8")), collectionPath),
  );
  writeFileSync(
    path.join(tempDirectory, "item.mjs"),
    transpile(replacements(readFileSync(itemPath, "utf8")), itemPath),
  );

  return {
    collection: await import(pathToFileURL(path.join(tempDirectory, "collection.mjs"))),
    item: await import(pathToFileURL(path.join(tempDirectory, "item.mjs"))),
    supabase: await import(pathToFileURL(path.join(tempDirectory, "supabase.mjs"))),
  };
}

function jsonRequest(method, body) {
  return new Request("http://localhost/api/v1/cards", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function legacyCard(overrides = {}) {
  return {
    id: "card-1",
    user_id: "owner-1",
    category: "coffee",
    title: "Sidama",
    subtitle: "Coffee Lab",
    image_url: null,
    badges: [],
    metric1: 3,
    metric2: 4,
    metric3: 2,
    tags: ["floral"],
    ai_description: "",
    footer_meta: {},
    created_at: "2026-06-18T10:00:00.000Z",
    updated_at: "2026-06-18T10:00:00.000Z",
    ...overrides,
  };
}

async function responseJson(response) {
  return JSON.parse(await response.text());
}

test("Given legacy rows, When cards are listed, Then memory compatibility defaults are returned", async () => {
  // Given
  const { collection, supabase } = await loadRoutes();
  supabase.configure({ authenticated: true, listRows: [legacyCard()] });

  // When
  const response = await collection.GET(new Request("http://localhost/api/v1/cards"));

  // Then
  assert.equal(response.status, 200);
  const body = await responseJson(response);
  assert.deepEqual(body.data[0], legacyCard({
    package_origin: null,
    package_process: null,
    purchase_url: null,
    purchase_note: null,
    repurchase_intent: "undecided",
    repurchase_reasons: [],
    scan_source: null,
    scan_confidence: null,
    corrected_fields: [],
    confirmed_at: null,
  }));
  assert.deepEqual(supabase.getCalls().filter((call) => call.method === "eq"), [
    { method: "eq", column: "user_id", value: "owner-1" },
  ]);
});

test("Given an explicitly confirmed memory, When created, Then camelCase input maps to trusted columns", async () => {
  // Given
  const { collection, supabase } = await loadRoutes();
  const returnedCard = legacyCard({ repurchase_intent: "again" });
  supabase.configure({ authenticated: true, singleResult: { data: returnedCard, error: null } });

  // When
  const response = await collection.POST(jsonRequest("POST", {
    category: "coffee",
    title: "Sidama",
    subtitle: "Coffee Lab",
    metric1: 3,
    metric2: 4,
    metric3: 2,
    packageOrigin: "Ethiopia Sidama",
    packageProcess: "Washed",
    repurchaseIntent: "again",
    repurchaseReasons: ["clean finish"],
    scanSource: "gemini",
    scanConfidence: 0.86,
    correctedFields: ["package_origin", "tags"],
    confirmed: true,
  }));

  // Then
  assert.equal(response.status, 201);
  const insert = supabase.getCalls().find((call) => call.method === "insert");
  assert.equal(insert.payload.user_id, "owner-1");
  assert.equal(insert.payload.package_origin, "Ethiopia Sidama");
  assert.equal(insert.payload.package_process, "Washed");
  assert.equal(insert.payload.repurchase_intent, "again");
  assert.deepEqual(insert.payload.repurchase_reasons, ["clean finish"]);
  assert.equal(insert.payload.scan_source, "gemini");
  assert.equal(insert.payload.scan_confidence, 0.86);
  assert.deepEqual(insert.payload.corrected_fields, ["package_origin", "tags"]);
  assert.equal(Number.isNaN(Date.parse(insert.payload.confirmed_at)), false);
});

test("Given a legacy card without memory fields, When created, Then it remains unconfirmed", async () => {
  // Given
  const { collection, supabase } = await loadRoutes();
  supabase.configure({
    authenticated: true,
    singleResult: { data: legacyCard(), error: null },
  });

  // When
  const response = await collection.POST(jsonRequest("POST", {
    category: "coffee",
    title: "Sidama",
    subtitle: "Coffee Lab",
    metric1: 3,
    metric2: 4,
    metric3: 2,
  }));

  // Then
  assert.equal(response.status, 201);
  const insert = supabase.getCalls().find((call) => call.method === "insert");
  assert.equal(insert.payload.confirmed_at, null);
  const body = await responseJson(response);
  assert.equal(body.data.confirmed_at, null);
  assert.equal(body.data.repurchase_intent, "undecided");
});

test("Given malformed or unconfirmed provenance, When created, Then validation rejects it before data access", async () => {
  // Given
  const { collection, supabase } = await loadRoutes();
  supabase.configure({ authenticated: true });

  // When
  const response = await collection.POST(jsonRequest("POST", {
    category: "coffee",
    title: "Sidama",
    subtitle: "Coffee Lab",
    metric1: 3,
    metric2: 4,
    metric3: 2,
    scanSource: "fallback_mock",
    scanConfidence: 1.2,
    confirmed_at: "2026-06-18T12:30:00.000Z",
    user_id: "attacker",
  }));

  // Then
  assert.equal(response.status, 400);
  assert.equal(supabase.getCalls().some((call) => call.method === "from"), false);
});

test("Given a memory update, When patched, Then all intents map and the owner filter remains explicit", async () => {
  // Given
  const { item, supabase } = await loadRoutes();
  supabase.configure({
    authenticated: true,
    singleResult: { data: legacyCard({ repurchase_intent: "no" }), error: null },
  });

  // When
  const response = await item.PATCH(
    jsonRequest("PATCH", { repurchaseIntent: "no", repurchaseReasons: [], confirmed: true }),
    { params: Promise.resolve({ id: "card-1" }) },
  );

  // Then
  assert.equal(response.status, 200);
  const calls = supabase.getCalls();
  const update = calls.find((call) => call.method === "update");
  assert.equal(update.payload.repurchase_intent, "no");
  assert.equal(Number.isNaN(Date.parse(update.payload.confirmed_at)), false);
  assert.deepEqual(calls.filter((call) => call.method === "eq"), [
    { method: "eq", column: "id", value: "card-1" },
    { method: "eq", column: "user_id", value: "owner-1" },
  ]);
});

test("Given a cross-owner update, When no owned row is returned, Then existence stays hidden behind 404", async () => {
  // Given
  const { item, supabase } = await loadRoutes();
  supabase.configure({
    authenticated: true,
    singleResult: { data: null, error: { message: "no rows" } },
  });

  // When
  const response = await item.PATCH(
    jsonRequest("PATCH", { repurchaseIntent: "maybe", confirmed: true }),
    { params: Promise.resolve({ id: "other-card" }) },
  );

  // Then
  assert.equal(response.status, 404);
  const body = await responseJson(response);
  assert.equal(body.error.code, 404);
});

test("Given no authenticated user, When listing cards, Then the route returns 401 before querying", async () => {
  // Given
  const { collection, supabase } = await loadRoutes();
  supabase.configure({ authenticated: false });

  // When
  const response = await collection.GET(new Request("http://localhost/api/v1/cards"));

  // Then
  assert.equal(response.status, 401);
  assert.deepEqual(supabase.getCalls(), []);
});

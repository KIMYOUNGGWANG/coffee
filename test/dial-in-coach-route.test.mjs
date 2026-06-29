import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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

async function loadRoute() {
  const tempDirectory = mkdtempSync(path.join(tmpdir(), "coffeedex-dial-in-route-"));

  writeFileSync(path.join(tempDirectory, "next-server.mjs"), `
export class NextResponse extends Response {
  static json(body, init = {}) {
    const headers = new Headers(init.headers);
    headers.set("content-type", "application/json");
    return new NextResponse(JSON.stringify(body), { ...init, headers });
  }
}
`);
  writeFileSync(path.join(tempDirectory, "api-errors.mjs"), `
export function getErrorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}
`);
  writeFileSync(path.join(tempDirectory, "dial-in-coach.mjs"), `
export function buildDialInCoach(input) {
  return {
    generatedAt: "2026-06-29T00:00:00.000Z",
    selectedShelfItemId: input.shelfItems[0]?.id ?? null,
    title: "mock",
    subtitle: "mock",
    problem: "mock",
    recipe: { method: "V60", coffeeAmount: 15, waterAmount: 240, waterTemp: 92, grindSize: "Medium Fine", brewTime: "2:40", ratioLabel: "1:16" },
    adjustments: [],
    evidence: [],
    suggestedLog: { shelfItemId: null, method: "V60", parameters: {}, simpleNote: "mock", coachSnapshot: { source: "dial_in_coach", title: "mock", generatedAt: "2026-06-29T00:00:00.000Z", evidence: [] } },
    inputSizes: { shelfItems: input.shelfItems.length, brewingLogs: input.brewingLogs.length }
  };
}
`);
  writeFileSync(path.join(tempDirectory, "supabase-server.mjs"), `
const state = {
  authenticated: true,
  rows: {
    coffee_shelf_items: [{ id: "shelf-1" }],
    brewing_logs: [{ id: "log-1" }]
  },
  calls: []
};

export function configure(next) {
  Object.assign(state, next);
  state.calls = [];
}

export function readCalls() {
  return [...state.calls];
}

class Query {
  constructor(table) {
    this.table = table;
  }

  select(columns) {
    state.calls.push({ method: "select", table: this.table, columns });
    return this;
  }

  eq(column, value) {
    state.calls.push({ method: "eq", table: this.table, column, value });
    return this;
  }

  order(column, options) {
    state.calls.push({ method: "order", table: this.table, column, options });
    return this;
  }

  limit(count) {
    state.calls.push({ method: "limit", table: this.table, count });
    return Promise.resolve({ data: state.rows[this.table] ?? [], error: null });
  }
}

export async function createServerSupabase() {
  return {
    auth: {
      getUser: () => Promise.resolve(state.authenticated
        ? { data: { user: { id: "owner-1" } }, error: null }
        : { data: { user: null }, error: { message: "anonymous" } })
    },
    from: (table) => {
      state.calls.push({ method: "from", table });
      return new Query(table);
    }
  };
}
`);

  const routePath = path.join(projectRoot, "app/api/v1/dial-in-coach/route.ts");
  const routeSource = readFileSync(routePath, "utf8")
    .replaceAll('"next/server"', '"./next-server.mjs"')
    .replaceAll('"@/lib/api-errors"', '"./api-errors.mjs"')
    .replaceAll('"@/lib/dial-in-coach"', '"./dial-in-coach.mjs"')
    .replaceAll('"@/lib/supabase/server"', '"./supabase-server.mjs"');
  writeFileSync(path.join(tempDirectory, "route.mjs"), transpile(routeSource, routePath));

  return {
    route: await import(pathToFileURL(path.join(tempDirectory, "route.mjs"))),
    supabase: await import(pathToFileURL(path.join(tempDirectory, "supabase-server.mjs"))),
    tempDirectory,
  };
}

test("Given no authenticated user, When Dial-in Coach is requested, Then it fails before data access", async () => {
  const loaded = await loadRoute();
  try {
    loaded.supabase.configure({ authenticated: false });

    const response = await loaded.route.GET();

    assert.equal(response.status, 401);
    assert.deepEqual(loaded.supabase.readCalls(), []);
  } finally {
    rmSync(loaded.tempDirectory, { recursive: true, force: true });
  }
});

test("Given an authenticated user, When Dial-in Coach is requested, Then shelf and log queries are owner scoped", async () => {
  const loaded = await loadRoute();
  try {
    loaded.supabase.configure({ authenticated: true });

    const response = await loaded.route.GET();
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(body.data.inputSizes, { shelfItems: 1, brewingLogs: 1 });
    assert.deepEqual(
      loaded.supabase.readCalls().filter((call) => call.method === "eq"),
      [
        { method: "eq", table: "coffee_shelf_items", column: "user_id", value: "owner-1" },
        { method: "eq", table: "coffee_shelf_items", column: "is_finished", value: false },
        { method: "eq", table: "brewing_logs", column: "user_id", value: "owner-1" },
      ],
    );
  } finally {
    rmSync(loaded.tempDirectory, { recursive: true, force: true });
  }
});

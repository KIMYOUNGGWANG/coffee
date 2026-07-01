import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
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
  const tempDirectory = mkdtempSync(path.join(tmpdir(), "coffeedex-brewing-log-route-"));
  symlinkSync(path.join(projectRoot, "node_modules"), path.join(tempDirectory, "node_modules"), "dir");

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
  writeFileSync(path.join(tempDirectory, "shelf-consumption.mjs"), `
export function calculateShelfConsumption(input) {
  const previousFillLevel = Math.round(input.fillLevel);
  const remainingGrams = Math.max(0, input.totalWeight * (previousFillLevel / 100) - input.coffeeAmount);
  const nextFillLevel = Math.round((remainingGrams / input.totalWeight) * 100);
  return {
    consumedGrams: input.coffeeAmount,
    consumedPercent: Math.max(1, Math.round((input.coffeeAmount / input.totalWeight) * 100)),
    previousFillLevel,
    nextFillLevel,
    remainingGrams,
    isFinished: nextFillLevel === 0,
  };
}
`);
  writeFileSync(path.join(tempDirectory, "supabase-server.mjs"), `
const state = {
  authenticated: true,
  shelfItem: { id: "11111111-1111-4111-8111-111111111111", total_weight: 200, fill_level: 50 },
  insertedLog: { id: "log-1" },
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
    this.operation = "select";
  }

  select(columns) {
    state.calls.push({ method: "select", table: this.table, columns });
    return this;
  }

  insert(payload) {
    this.operation = "insert";
    state.calls.push({ method: "insert", table: this.table, payload });
    return this;
  }

  update(payload) {
    this.operation = "update";
    state.calls.push({ method: "update", table: this.table, payload });
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
    return Promise.resolve({ data: [], error: null });
  }

  single() {
    state.calls.push({ method: "single", table: this.table, operation: this.operation });
    if (this.table === "coffee_shelf_items" && this.operation === "select") {
      return Promise.resolve({ data: state.shelfItem, error: null });
    }
    if (this.table === "brewing_logs" && this.operation === "insert") {
      return Promise.resolve({ data: state.insertedLog, error: null });
    }
    if (this.table === "coffee_shelf_items" && this.operation === "update") {
      return Promise.resolve({ data: { id: state.shelfItem.id }, error: null });
    }
    return Promise.resolve({ data: null, error: { message: "unexpected query" } });
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

  const routePath = path.join(projectRoot, "app/api/v1/brewing-logs/route.ts");
  const routeSource = readFileSync(routePath, "utf8")
    .replaceAll('"next/server"', '"./next-server.mjs"')
    .replaceAll('"@/lib/api-errors"', '"./api-errors.mjs"')
    .replaceAll('"@/lib/shelf-consumption"', '"./shelf-consumption.mjs"')
    .replaceAll('"@/lib/supabase/server"', '"./supabase-server.mjs"');
  writeFileSync(path.join(tempDirectory, "route.mjs"), transpile(routeSource, routePath));

  return {
    route: await import(pathToFileURL(path.join(tempDirectory, "route.mjs"))),
    supabase: await import(pathToFileURL(path.join(tempDirectory, "supabase-server.mjs"))),
    tempDirectory,
  };
}

function createRequest(body) {
  return new Request("https://coffeedex.test/api/v1/brewing-logs", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

test("Given no authenticated user, When a brewing log is created, Then it fails before data access", async () => {
  const loaded = await loadRoute();
  try {
    loaded.supabase.configure({ authenticated: false });

    const response = await loaded.route.POST(createRequest({ method: "V60" }));

    assert.equal(response.status, 401);
    assert.deepEqual(loaded.supabase.readCalls(), []);
  } finally {
    rmSync(loaded.tempDirectory, { recursive: true, force: true });
  }
});

test("Given a shelf bean and brew dose, When a brewing log is created, Then shelf fill level is owner-scoped and decremented", async () => {
  const loaded = await loadRoute();
  try {
    const shelfItemId = "11111111-1111-4111-8111-111111111111";
    loaded.supabase.configure({ authenticated: true });

    const response = await loaded.route.POST(createRequest({
      shelfItemId,
      method: "V60",
      parameters: {
        coffeeAmount: 15,
        waterAmount: 240,
      },
    }));
    const body = await response.json();

    assert.equal(response.status, 201);
    assert.deepEqual(body.shelfConsumption, {
      shelfItemId,
      consumedGrams: 15,
      consumedPercent: 8,
      previousFillLevel: 50,
      nextFillLevel: 43,
      remainingGrams: 85,
      isFinished: false,
    });
    assert.deepEqual(
      loaded.supabase.readCalls().filter((call) => call.method === "eq"),
      [
        { method: "eq", table: "coffee_shelf_items", column: "id", value: shelfItemId },
        { method: "eq", table: "coffee_shelf_items", column: "user_id", value: "owner-1" },
        { method: "eq", table: "coffee_shelf_items", column: "id", value: shelfItemId },
        { method: "eq", table: "coffee_shelf_items", column: "user_id", value: "owner-1" },
      ],
    );
    assert.deepEqual(
      loaded.supabase.readCalls().find((call) => call.method === "update")?.payload,
      { fill_level: 43, is_finished: false },
    );
  } finally {
    rmSync(loaded.tempDirectory, { recursive: true, force: true });
  }
});

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
  const tempDirectory = mkdtempSync(path.join(tmpdir(), "coffeedex-rebuy-route-"));

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
  writeFileSync(path.join(tempDirectory, "rebuy-intelligence.mjs"), `
export function buildRebuyIntelligence(input) {
  return {
    generatedAt: "2026-06-29T00:00:00.000Z",
    summary: "mock",
    featureScores: [],
    rebuyReminder: { title: "mock", subtitle: "mock", reason: "mock", actionLabel: "mock", priority: "low", cardId: null, shelfItemId: null },
    tasteMatch: { anchorCardId: null, anchorTitle: "mock", matchCardId: null, matchTitle: "mock", sharedTags: [], reason: "mock", searchPrompt: "mock" },
    purchaseMemory: { title: "mock", subtitle: "mock", source: "manual", searchUrl: "https://example.com", reason: "mock", cardId: null, shelfItemId: null },
    brewFailureMemory: { title: "mock", subtitle: "mock", problem: "unknown", adjustment: "mock", evidence: "mock", logId: null, shelfItemId: null },
    nextCupPlan: { title: "mock", subtitle: "mock", reason: "mock", actionLabel: "mock", priority: "low", suggestedMethod: "V60", shelfItemId: null, lastBrewLogId: null },
    inputSizes: {
      cards: input.cards.length,
      shelfItems: input.shelfItems.length,
      brewingLogs: input.brewingLogs.length
    }
  };
}
`);
  writeFileSync(path.join(tempDirectory, "supabase-server.mjs"), `
const state = {
  authenticated: true,
  rows: {
    tasting_cards: [{ id: "card-1" }],
    coffee_shelf_items: [{ id: "shelf-1" }],
    brewing_logs: [{ id: "brew-1" }]
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

  const routePath = path.join(projectRoot, "app/api/v1/rebuy-intelligence/route.ts");
  const routeSource = readFileSync(routePath, "utf8")
    .replaceAll('"next/server"', '"./next-server.mjs"')
    .replaceAll('"@/lib/api-errors"', '"./api-errors.mjs"')
    .replaceAll('"@/lib/rebuy-intelligence"', '"./rebuy-intelligence.mjs"')
    .replaceAll('"@/lib/supabase/server"', '"./supabase-server.mjs"');
  writeFileSync(path.join(tempDirectory, "route.mjs"), transpile(routeSource, routePath));

  return {
    route: await import(pathToFileURL(path.join(tempDirectory, "route.mjs"))),
    supabase: await import(pathToFileURL(path.join(tempDirectory, "supabase-server.mjs"))),
    tempDirectory,
  };
}

test("Given no authenticated user, When Rebuy Intelligence is requested, Then it fails before data access", async () => {
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

test("Given an authenticated user, When Rebuy Intelligence is requested, Then every query is owner scoped", async () => {
  const loaded = await loadRoute();
  try {
    loaded.supabase.configure({ authenticated: true });

    const response = await loaded.route.GET();
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(body.data.inputSizes, {
      cards: 1,
      shelfItems: 1,
      brewingLogs: 1,
    });
    assert.deepEqual(
      loaded.supabase.readCalls().filter((call) => call.method === "eq"),
      [
        { method: "eq", table: "tasting_cards", column: "user_id", value: "owner-1" },
        { method: "eq", table: "coffee_shelf_items", column: "user_id", value: "owner-1" },
        { method: "eq", table: "brewing_logs", column: "user_id", value: "owner-1" },
      ],
    );
  } finally {
    rmSync(loaded.tempDirectory, { recursive: true, force: true });
  }
});

import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const routePath = path.join(projectRoot, "app/api/v1/shelf/[id]/rebuy-calendar/route.ts");
const helperPath = path.join(projectRoot, "lib/rebuy-calendar.ts");

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
}
`);
  writeFileSync(path.join(tempDirectory, "api-errors.mjs"), `
export function getErrorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}
`);
  writeFileSync(path.join(tempDirectory, "supabase.mjs"), `
const state = {
  authenticated: true,
  row: {
    id: "shelf-private-id-123",
    user_id: "owner-1",
    roaster_name: "Fritz",
    bean_name: "에티오피아 시다마",
    rebuy_reminder_date: "2026-07-15",
    rebuy_return_token: "f70cfec8-51f9-4667-a80f-ca38bfbc2b6d"
  },
  error: null,
  calls: []
};

export function configure(next) {
  Object.assign(state, next);
  state.calls = [];
}

export function readCalls() {
  return structuredClone(state.calls);
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

  single() {
    state.calls.push({ method: "single", table: this.table });
    return Promise.resolve({ data: state.row, error: state.error });
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
}

async function loadRoute() {
  assert.equal(existsSync(routePath), true);
  assert.equal(existsSync(helperPath), true);
  const tempDirectory = mkdtempSync(path.join(tmpdir(), "coffeedex-rebuy-calendar-route-"));
  writeRuntimeMocks(tempDirectory);
  writeFileSync(
    path.join(tempDirectory, "rebuy-calendar.mjs"),
    transpile(readFileSync(helperPath, "utf8"), helperPath),
  );

  const routeSource = readFileSync(routePath, "utf8")
    .replaceAll('"next/server"', '"./next-server.mjs"')
    .replaceAll('"@/lib/api-errors"', '"./api-errors.mjs"')
    .replaceAll('"@/lib/rebuy-calendar"', '"./rebuy-calendar.mjs"')
    .replaceAll('"@/lib/supabase/server"', '"./supabase.mjs"');
  writeFileSync(path.join(tempDirectory, "route.mjs"), transpile(routeSource, routePath));

  try {
    return {
      route: await import(pathToFileURL(path.join(tempDirectory, "route.mjs"))),
      supabase: await import(pathToFileURL(path.join(tempDirectory, "supabase.mjs"))),
      tempDirectory,
    };
  } catch (error) {
    rmSync(tempDirectory, { recursive: true, force: true });
    throw error;
  }
}

function routeContext(id = "shelf-private-id-123") {
  return { params: Promise.resolve({ id }) };
}

test("Given an authenticated owner, When exporting a rebuy reminder, Then authenticated owner gets a private calendar export", async () => {
  const loaded = await loadRoute();
  try {
    loaded.supabase.configure({ authenticated: true });

    const response = await loaded.route.GET(
      new Request("https://coffeedex.example/api/v1/shelf/shelf-private-id-123/rebuy-calendar"),
      routeContext(),
    );
    const body = await response.text();

    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type"), /^text\/calendar; charset=utf-8/);
    assert.equal(response.headers.get("cache-control"), "private, no-store");
    assert.match(
      response.headers.get("content-disposition"),
      /^attachment; filename="coffeedex-rebuy-reminder-2026-07-15\.ics"$/,
    );
    assert.match(body, /BEGIN:VEVENT/);
    assert.match(body.replaceAll("\r\n ", ""), /\/dashboard\?source=rebuy_calendar&rebuy_token=f70cfec8-51f9-4667-a80f-ca38bfbc2b6d/);
    assert.equal(body.includes("owner-1"), false);
    assert.equal(body.includes("shelf-private-id-123"), false);
    assert.equal(body.includes("analytics"), false);
    assert.deepEqual(loaded.supabase.readCalls(), [
      { method: "from", table: "coffee_shelf_items" },
      {
        method: "select",
        table: "coffee_shelf_items",
        columns: "id,roaster_name,bean_name,rebuy_reminder_date,rebuy_return_token",
      },
      { method: "eq", table: "coffee_shelf_items", column: "id", value: "shelf-private-id-123" },
      { method: "eq", table: "coffee_shelf_items", column: "user_id", value: "owner-1" },
      { method: "single", table: "coffee_shelf_items" },
    ]);
  } finally {
    rmSync(loaded.tempDirectory, { recursive: true, force: true });
  }
});

test("Given invalid access or reminderless rows, When exporting, Then it rejects anonymous or reminderless calendar export", async () => {
  const anonymous = await loadRoute();
  try {
    anonymous.supabase.configure({ authenticated: false });

    const response = await anonymous.route.GET(
      new Request("https://coffeedex.example/api/v1/shelf/shelf-private-id-123/rebuy-calendar"),
      routeContext(),
    );

    assert.equal(response.status, 401);
    assert.deepEqual(anonymous.supabase.readCalls(), []);
  } finally {
    rmSync(anonymous.tempDirectory, { recursive: true, force: true });
  }

  const reminderless = await loadRoute();
  try {
    reminderless.supabase.configure({
      authenticated: true,
      row: {
        id: "shelf-private-id-123",
        user_id: "owner-1",
        roaster_name: "Fritz",
        bean_name: "에티오피아 시다마",
        rebuy_reminder_date: null,
        rebuy_return_token: "f70cfec8-51f9-4667-a80f-ca38bfbc2b6d",
      },
    });

    const response = await reminderless.route.GET(
      new Request("https://coffeedex.example/api/v1/shelf/shelf-private-id-123/rebuy-calendar"),
      routeContext(),
    );
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.error.message, "재구매 예정일이 있는 원두만 캘린더로 내보낼 수 있습니다.");
  } finally {
    rmSync(reminderless.tempDirectory, { recursive: true, force: true });
  }
});

test("Given a missing or non-owned shelf item, When exporting, Then the route returns 404", async () => {
  const loaded = await loadRoute();
  try {
    loaded.supabase.configure({ authenticated: true, row: null, error: { code: "PGRST116", message: "not found" } });

    const response = await loaded.route.GET(
      new Request("https://coffeedex.example/api/v1/shelf/shelf-private-id-123/rebuy-calendar"),
      routeContext(),
    );
    const body = await response.json();

    assert.equal(response.status, 404);
    assert.equal(body.error.code, 404);
  } finally {
    rmSync(loaded.tempDirectory, { recursive: true, force: true });
  }
});

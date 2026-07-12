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

async function loadProfileRoute() {
  const tempDirectory = mkdtempSync(path.join(tmpdir(), "coffeedex-profile-route-"));

  writeFileSync(path.join(tempDirectory, "next-server.mjs"), `
export class NextResponse extends Response {
  static json(body, init = {}) {
    const headers = new Headers(init.headers);
    headers.set("content-type", "application/json");
    return new NextResponse(JSON.stringify(body), { ...init, headers });
  }
}
`);
  writeFileSync(path.join(tempDirectory, "api-errors.mjs"), "export function getErrorMessage(error) { return error instanceof Error ? error.message : String(error); }\n");
  writeFileSync(path.join(tempDirectory, "zod.mjs"), `export { z } from ${JSON.stringify(pathToFileURL(path.join(projectRoot, "node_modules/zod/index.js")).href)};\n`);
  writeFileSync(path.join(tempDirectory, "supabase-server.mjs"), `
const state = {
  authResult: { data: { user: null }, error: { message: "anonymous" } },
  profiles: new Map(),
  operations: [],
};

export function configure(next) {
  if ("authResult" in next) {
    state.authResult = next.authResult;
  }
  if ("profiles" in next) {
    state.profiles = new Map(next.profiles.map((profile) => [profile.id, profile]));
  }
  state.operations = [];
}

export function readOperations() {
  return [...state.operations];
}

class Query {
  constructor(tableName) {
    this.tableName = tableName;
    this.filters = [];
    this.selectedColumns = [];
  }

  select(columns) {
    this.selectedColumns = columns.split(",").map((column) => column.trim());
    state.operations.push(\`select:\${this.tableName}:\${columns}\`);
    return this;
  }

  eq(column, value) {
    this.filters.push({ column, value });
    state.operations.push(\`eq:\${this.tableName}:\${column}:\${value}\`);
    return this;
  }

  single() {
    const idFilter = this.filters.find((filter) => filter.column === "id");
    const profile = idFilter ? state.profiles.get(idFilter.value) : null;
    if (!profile) {
      return Promise.resolve({ data: null, error: { code: "PGRST116", message: "No profile" } });
    }
    const selectedProfile = Object.fromEntries(
      this.selectedColumns.map((column) => [column, profile[column]]),
    );
    return Promise.resolve({ data: selectedProfile, error: null });
  }
}

export async function createServerSupabase() {
  return {
    auth: { getUser: () => Promise.resolve(state.authResult) },
    from: (tableName) => new Query(tableName),
    rpc: async (functionName, args) => {
      state.operations.push(\`rpc:\${functionName}\`);
      const userId = state.authResult.data.user?.id;
      const profile = userId ? state.profiles.get(userId) : null;
      if (!profile) return { data: [], error: { message: "No profile" } };
      const updated = { ...profile, personal_taste_line: args.new_personal_taste_line };
      state.profiles.set(userId, updated);
      return { data: [updated], error: null };
    },
  };
}
`);

  const routePath = path.join(projectRoot, "app/api/v1/profile/route.ts");
  const routeSource = readFileSync(routePath, "utf8")
    .replaceAll('"next/server"', '"./next-server.mjs"')
    .replaceAll('"zod"', '"./zod.mjs"')
    .replaceAll('"@/lib/supabase/server"', '"./supabase-server.mjs"')
    .replaceAll('"@/lib/api-errors"', '"./api-errors.mjs"');
  writeFileSync(path.join(tempDirectory, "route.mjs"), transpile(routeSource, routePath));

  return {
    route: await import(pathToFileURL(path.join(tempDirectory, "route.mjs"))),
    supabase: await import(pathToFileURL(path.join(tempDirectory, "supabase-server.mjs"))),
    tempDirectory,
  };
}

test("Given no authenticated user, When profile is requested, Then the route fails closed before profile lookup", async () => {
  const loaded = await loadProfileRoute();
  try {
    loaded.supabase.configure({
      authResult: { data: { user: null }, error: { message: "anonymous" } },
      profiles: [{
        id: "legacy-fixture-user",
        credits: 99,
        has_pdf_access: true,
        is_premium: true,
        scans_used: 4,
        monthly_scan_limit: 50,
        personal_taste_line: null,
      }],
    });

    const response = await loaded.route.GET(new Request("http://localhost/api/v1/profile"));

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), {
      error: { code: 401, message: "로그인이 필요합니다." },
    });
    assert.deepEqual(loaded.supabase.readOperations(), []);
  } finally {
    rmSync(loaded.tempDirectory, { recursive: true, force: true });
  }
});

test("Given an authenticated user, When profile is requested, Then the profile lookup is scoped to the real user id", async () => {
  const loaded = await loadProfileRoute();
  try {
    loaded.supabase.configure({
      authResult: { data: { user: { id: "real-user-456" } }, error: null },
      profiles: [
        {
          id: "legacy-fixture-user",
          credits: 99,
          has_pdf_access: true,
          is_premium: true,
          scans_used: 4,
          monthly_scan_limit: 50,
          personal_taste_line: null,
        },
        {
          id: "real-user-456",
          credits: 7,
          has_pdf_access: false,
          is_premium: false,
          scans_used: 1,
          monthly_scan_limit: 5,
          personal_taste_line: null,
        },
      ],
    });

    const response = await loaded.route.GET(new Request("http://localhost/api/v1/profile"));

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      data: {
        credits: 7,
        has_pdf_access: false,
        is_premium: false,
        scans_used: 1,
        monthly_scan_limit: 5,
        personal_taste_line: null,
      },
    });
    assert.deepEqual(loaded.supabase.readOperations(), [
      "select:profiles:credits, has_pdf_access, is_premium, scans_used, monthly_scan_limit, personal_taste_line",
      "eq:profiles:id:real-user-456",
    ]);
  } finally {
    rmSync(loaded.tempDirectory, { recursive: true, force: true });
  }
});

test("Given an authenticated user, When a personal taste line is patched, Then only the scoped RPC performs the update", async () => {
  const loaded = await loadProfileRoute();
  try {
    loaded.supabase.configure({
      authResult: { data: { user: { id: "real-user-456" } }, error: null },
      profiles: [{
        id: "real-user-456",
        credits: 7,
        has_pdf_access: false,
        is_premium: false,
        scans_used: 1,
        monthly_scan_limit: 5,
        personal_taste_line: null,
      }],
    });
    const request = new Request("http://localhost/api/v1/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ personalTasteLine: "식었을 때 단맛이 남는 원두" }),
    });

    const response = await loaded.route.PATCH(request);

    assert.equal(response.status, 200);
    assert.equal((await response.json()).data.personal_taste_line, "식었을 때 단맛이 남는 원두");
    assert.deepEqual(loaded.supabase.readOperations(), ["rpc:update_personal_taste_line"]);
  } finally {
    rmSync(loaded.tempDirectory, { recursive: true, force: true });
  }
});

import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

function read(relativePath) {
  return readFileSync(path.join(projectRoot, relativePath), "utf8");
}

function transpileTypescript(source, fileName) {
  return ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.ES2022,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      target: ts.ScriptTarget.ES2022,
    },
    fileName,
  }).outputText;
}

function writeNextResponseMock(tempDirectory) {
  writeFileSync(
    path.join(tempDirectory, "next-server.mjs"),
    `export class NextRequest extends Request {}

export class NextResponse extends Response {
  static json(body, init = {}) {
    const headers = new Headers(init.headers);
    if (!headers.has("content-type")) headers.set("content-type", "application/json");
    return new NextResponse(JSON.stringify(body), { ...init, headers });
  }
}`,
  );
}

function writeEnvMock(tempDirectory) {
  writeFileSync(
    path.join(tempDirectory, "mock-env.mjs"),
    `export function readStarterEnv() {
  return { AI_API_KEY: "" };
}`,
  );
}

function writeSupabaseMock(tempDirectory) {
  writeFileSync(
    path.join(tempDirectory, "mock-supabase.mjs"),
    `let scenario = {
  auth: { data: { user: { id: "user-1" } }, error: null },
  rpc: {
    data: {
      allowed: true,
      source: "monthly_allowance",
      credits_spent: 0,
      credits_remaining: 3,
      scans_used: 2,
      monthly_scan_limit: 5,
    },
    error: null,
  },
};
let rpcCalls = [];

export function setScanRouteScenario(nextScenario) {
  scenario = nextScenario;
  rpcCalls = [];
}

export function getRpcCalls() {
  return rpcCalls.map((call) => ({ ...call }));
}

export async function createServerSupabase() {
  return {
    auth: {
      getUser() {
        return Promise.resolve(scenario.auth);
      },
    },
    rpc(functionName, args) {
      rpcCalls.push({ functionName, args });
      return Promise.resolve(scenario.rpc);
    },
  };
}`,
  );
}

async function loadScanRoute() {
  const tempDirectory = mkdtempSync(path.join(tmpdir(), "hyangmi-scan-route-"));
  const zodModuleUrl = pathToFileURL(path.join(projectRoot, "node_modules/zod/index.js")).href;
  writeNextResponseMock(tempDirectory);
  writeEnvMock(tempDirectory);
  writeSupabaseMock(tempDirectory);

  const routePath = path.join(projectRoot, "app/api/v1/cards/scan/route.ts");
  const routeSource = read("app/api/v1/cards/scan/route.ts")
    .replaceAll('"next/server"', '"./next-server.mjs"')
    .replaceAll('"zod"', `"${zodModuleUrl}"`)
    .replaceAll('"@/lib/supabase/server"', '"./mock-supabase.mjs"')
    .replaceAll('"@/lib/env"', '"./mock-env.mjs"');

  writeFileSync(
    path.join(tempDirectory, "route.mjs"),
    transpileTypescript(routeSource, routePath),
  );

  const routeModule = await import(pathToFileURL(path.join(tempDirectory, "route.mjs")));
  const supabaseMock = await import(pathToFileURL(path.join(tempDirectory, "mock-supabase.mjs")));

  return { routeModule, supabaseMock };
}

function scanRequest() {
  return new Request("http://localhost/api/v1/cards/scan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: "data:image/jpeg;base64,ZmFrZS1pbWFnZQ==" }),
  });
}

async function withBlockedFetch(action) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => {
    throw new Error("fetch should not be called when AI_API_KEY is empty");
  };

  try {
    return await action();
  } finally {
    globalThis.fetch = originalFetch;
  }
}

async function parseJson(response) {
  return JSON.parse(await response.text());
}

function normalizedSql(relativePath) {
  return read(relativePath).toLowerCase().replace(/\s+/g, " ");
}

test("Given a free user below the monthly limit, When scanning, Then no credit is spent", async () => {
  // Given
  const { routeModule, supabaseMock } = await loadScanRoute();
  supabaseMock.setScanRouteScenario({
    auth: { data: { user: { id: "user-1" } }, error: null },
    rpc: {
      data: {
        allowed: true,
        source: "monthly_allowance",
        credits_spent: 0,
        credits_remaining: 2,
        scans_used: 3,
        monthly_scan_limit: 5,
      },
      error: null,
    },
  });

  // When
  const response = await withBlockedFetch(() => routeModule.POST(scanRequest()));

  // Then
  assert.equal(response.status, 200);
  const body = await parseJson(response);
  assert.equal(body.entitlement.source, "monthly_allowance");
  assert.equal(body.entitlement.credits_spent, 0);
  assert.deepEqual(supabaseMock.getRpcCalls(), [
    { functionName: "increment_user_scan", args: { target_user_id: "user-1" } },
  ]);
});

test("Given a free user at the monthly limit with credits, When scanning, Then exactly one credit is spent", async () => {
  // Given
  const { routeModule, supabaseMock } = await loadScanRoute();
  supabaseMock.setScanRouteScenario({
    auth: { data: { user: { id: "user-1" } }, error: null },
    rpc: {
      data: {
        allowed: true,
        source: "credit",
        credits_spent: 1,
        credits_remaining: 9,
        scans_used: 6,
        monthly_scan_limit: 5,
      },
      error: null,
    },
  });

  // When
  const response = await withBlockedFetch(() => routeModule.POST(scanRequest()));

  // Then
  assert.equal(response.status, 200);
  const body = await parseJson(response);
  assert.equal(body.entitlement.source, "credit");
  assert.equal(body.entitlement.credits_spent, 1);
  assert.equal(body.entitlement.credits_remaining, 9);
});

test("Given a free user at the monthly limit with zero credits, When scanning, Then the route returns 403", async () => {
  // Given
  const { routeModule, supabaseMock } = await loadScanRoute();
  supabaseMock.setScanRouteScenario({
    auth: { data: { user: { id: "user-1" } }, error: null },
    rpc: {
      data: {
        allowed: false,
        reason: "no_credits",
        source: "none",
        credits_spent: 0,
        credits_remaining: 0,
        scans_used: 5,
        monthly_scan_limit: 5,
      },
      error: null,
    },
  });

  // When
  const response = await withBlockedFetch(() => routeModule.POST(scanRequest()));

  // Then
  assert.equal(response.status, 403);
  const body = await parseJson(response);
  assert.equal(body.error.code, 403);
  assert.match(body.error.message, /무료 월간 스캔 한도/);
  assert.equal(body.entitlement.reason, "no_credits");
  assert.equal(body.entitlement.credits_spent, 0);
});

test("Given a premium user, When scanning, Then limits and credit spend are bypassed", async () => {
  // Given
  const { routeModule, supabaseMock } = await loadScanRoute();
  supabaseMock.setScanRouteScenario({
    auth: { data: { user: { id: "premium-user" } }, error: null },
    rpc: {
      data: {
        allowed: true,
        source: "premium",
        credits_spent: 0,
        credits_remaining: 0,
        scans_used: 25,
        monthly_scan_limit: 5,
      },
      error: null,
    },
  });

  // When
  const response = await withBlockedFetch(() => routeModule.POST(scanRequest()));

  // Then
  assert.equal(response.status, 200);
  const body = await parseJson(response);
  assert.equal(body.entitlement.source, "premium");
  assert.equal(body.entitlement.credits_spent, 0);
});

test("Given the scan RPC migration, When credits are used, Then exactly one credit is decremented", () => {
  // Given
  const sql = normalizedSql("supabase/migrations/20260614000002_add_brewing_notes_and_scan_limits.sql");

  // When / Then
  assert.match(sql, /create or replace function increment_user_scan\(target_user_id uuid\) returns jsonb/);
  assert.match(sql, /set credits = credits - 1, scans_used = scans_used \+ 1/);
  assert.match(sql, /'source', 'credit'/);
  assert.match(sql, /'credits_spent', 1/);
  assert.match(sql, /'reason', 'no_credits'/);
});

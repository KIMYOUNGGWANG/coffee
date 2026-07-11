import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function read(relativePath) {
  return readFileSync(path.join(projectRoot, relativePath), "utf8");
}

function transpile(source, fileName) {
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

export async function loadAnalyticsRoute() {
  const tempDirectory = mkdtempSync(path.join(projectRoot, ".coffeedex-analytics-route-"));
  const schemaPath = path.join(projectRoot, "lib/analytics-events.ts");
  const routePath = path.join(projectRoot, "app/api/v1/analytics/route.ts");

  writeFileSync(
    path.join(tempDirectory, "next-server.mjs"),
    `export class NextResponse extends Response {
  static json(body, init = {}) {
    const headers = new Headers(init.headers);
    headers.set("content-type", "application/json");
    return new NextResponse(JSON.stringify(body), { ...init, headers });
  }
}`,
  );
  writeFileSync(
    path.join(tempDirectory, "mock-env.mjs"),
    `export function readStarterEnv() {
  return {
    NEXT_PUBLIC_SUPABASE_URL: "https://fixture.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "service-role",
  };
}`,
  );
  writeFileSync(
    path.join(tempDirectory, "mock-supabase.mjs"),
    `const rows = [];
let failure = null;
export function resetAnalyticsState() { rows.length = 0; failure = null; }
export function failNextInsert(error) { failure = error; }
export function getAnalyticsRows() { return rows.map((row) => ({ ...row })); }
export function createClient() {
  return {
    from(table) {
      if (table !== "product_events") throw new Error("unexpected table: " + table);
      return {
        insert(row) {
          if (failure) return Promise.resolve({ error: failure });
          if (rows.some((existing) => existing.event_id === row.event_id)) {
            return Promise.resolve({ error: { code: "23505", message: "duplicate event id" } });
          }
          rows.push({ ...row });
          return Promise.resolve({ error: null });
        },
      };
    },
  };
}`,
  );
  writeFileSync(
    path.join(tempDirectory, "mock-server-supabase.mjs"),
    `let user = null;
export function setAnalyticsUser(nextUser) { user = nextUser; }
export async function createServerSupabase() {
  return {
    auth: {
      getUser() {
        return Promise.resolve({ data: { user }, error: user ? null : { message: "anonymous" } });
      },
    },
  };
}`,
  );
  writeFileSync(
    path.join(tempDirectory, "analytics-events.mjs"),
    transpile(read("lib/analytics-events.ts"), schemaPath),
  );
  writeFileSync(
    path.join(tempDirectory, "mock-rate-limit.mjs"),
    `export function readClientIdentity() {
  return "analytics-route-test";
}

export function checkRateLimit() {
  return { allowed: true, remaining: 99, resetAt: Date.now() + 60000 };
}`,
  );

  const routeSource = read("app/api/v1/analytics/route.ts")
    .replaceAll('"next/server"', '"./next-server.mjs"')
    .replaceAll('"@/lib/analytics-events"', '"./analytics-events.mjs"')
    .replaceAll('"@/lib/env"', '"./mock-env.mjs"')
    .replaceAll('"@/lib/rate-limit"', '"./mock-rate-limit.mjs"')
    .replaceAll('"@/lib/supabase/server"', '"./mock-server-supabase.mjs"')
    .replaceAll('"@supabase/supabase-js"', '"./mock-supabase.mjs"');
  writeFileSync(path.join(tempDirectory, "route.mjs"), transpile(routeSource, routePath));

  return {
    route: await import(pathToFileURL(path.join(tempDirectory, "route.mjs"))),
    store: await import(pathToFileURL(path.join(tempDirectory, "mock-supabase.mjs"))),
    session: await import(pathToFileURL(path.join(tempDirectory, "mock-server-supabase.mjs"))),
    cleanup: () => rmSync(tempDirectory, { force: true, recursive: true }),
  };
}

export function analyticsRequest(overrides = {}) {
  return new Request("http://localhost/api/v1/analytics", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      eventId: "b7254c0c-2262-4ea4-95e6-91d6f9b84d29",
      eventName: "card_saved",
      occurredAt: "2026-06-18T12:00:00.000Z",
      path: "/dashboard",
      anonymousId: "guest-session-7",
      properties: { capture_method: "scan", corrected_field_count: 2, confirmed: true },
      ...overrides,
    }),
  });
}

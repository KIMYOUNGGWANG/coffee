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
  writeFileSync(path.join(tempDirectory, "supabase-server.mjs"), `
const state = { authenticated: true };

export function configure(next) {
  Object.assign(state, next);
}

export async function createServerSupabase() {
  return {
    auth: {
      getUser: () => Promise.resolve(state.authenticated
        ? { data: { user: { id: "550e8400-e29b-41d4-a716-446655440001" } }, error: null }
        : { data: { user: null }, error: { message: "anonymous" } }),
    },
  };
}`);
  writeFileSync(path.join(tempDirectory, "supabase-admin.mjs"), `
export class AdminSupabaseConfigurationError extends Error {
  constructor(issues = []) {
    super("Supabase admin credentials are unavailable");
    this.name = "AdminSupabaseConfigurationError";
    this.issues = issues;
  }
}

export function createAdminSupabase() {
  throw new AdminSupabaseConfigurationError([{ path: ["SUPABASE_SERVICE_ROLE_KEY"] }]);
}`);
}

async function loadAccountRoute() {
  const tempDirectory = mkdtempSync(path.join(tmpdir(), "coffeedex-account-route-"));
  const zodUrl = pathToFileURL(path.join(projectRoot, "node_modules/zod/index.js")).href;
  writeRuntimeMocks(tempDirectory);

  const accountDeletionPath = path.join(projectRoot, "lib/account-deletion.ts");
  const accountDeletionSource = readFileSync(accountDeletionPath, "utf8")
    .replaceAll('"zod"', `"${zodUrl}"`);
  writeFileSync(path.join(tempDirectory, "account-deletion.mjs"), transpile(accountDeletionSource, accountDeletionPath));

  const routePath = path.join(projectRoot, "app/api/v1/account/route.ts");
  const routeSource = readFileSync(routePath, "utf8")
    .replaceAll('"next/server"', '"./next-server.mjs"')
    .replaceAll('"zod"', `"${zodUrl}"`)
    .replaceAll('"@/lib/account-deletion"', '"./account-deletion.mjs"')
    .replaceAll('"@/lib/supabase/admin"', '"./supabase-admin.mjs"')
    .replaceAll('"@/lib/supabase/server"', '"./supabase-server.mjs"');
  writeFileSync(path.join(tempDirectory, "route.mjs"), transpile(routeSource, routePath));

  return {
    route: await import(pathToFileURL(path.join(tempDirectory, "route.mjs"))),
    supabase: await import(pathToFileURL(path.join(tempDirectory, "supabase-server.mjs"))),
  };
}

const confirmation = "내 CoffeeDex 계정을 영구 삭제합니다";

test("Given admin service-role configuration is missing, When deleting an authenticated account, Then a typed 503 error is returned", async () => {
  const { route, supabase } = await loadAccountRoute();
  supabase.configure({ authenticated: true });

  const response = await route.DELETE(new Request("http://localhost/api/v1/account", {
    method: "DELETE",
    body: JSON.stringify({
      confirmation,
      acknowledgePermanentDeletion: true,
    }),
  }));

  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), {
    error: {
      code: 503,
      message: "계정 삭제 서비스를 사용할 수 없습니다.",
    },
  });
});

test("Given deletion confirmation is incomplete, When deleting, Then the account route rejects before admin setup", async () => {
  const { route, supabase } = await loadAccountRoute();
  supabase.configure({ authenticated: true });

  const response = await route.DELETE(new Request("http://localhost/api/v1/account", {
    method: "DELETE",
    body: JSON.stringify({
      confirmation,
      acknowledgePermanentDeletion: false,
    }),
  }));

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: {
      code: 400,
      message: "계정 삭제 확인 문구와 영구 삭제 동의가 필요합니다.",
    },
  });
});

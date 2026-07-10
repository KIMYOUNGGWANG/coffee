import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const routePath = path.join(projectRoot, "app/api/v1/shelf/rebuy-return/route.ts");

function transpile(source, fileName) {
  return ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022, moduleResolution: ts.ModuleResolutionKind.Bundler, target: ts.ScriptTarget.ES2022 }, fileName }).outputText;
}

function writeRuntimeMocks(tempDirectory) {
  writeFileSync(path.join(tempDirectory, "next-server.mjs"), `
export class NextResponse extends Response { static json(body, init = {}) { const headers = new Headers(init.headers); headers.set("content-type", "application/json"); return new NextResponse(JSON.stringify(body), { ...init, headers }); } }
`);
  writeFileSync(path.join(tempDirectory, "supabase.mjs"), `
const state = { authenticated: true, row: { id: "93493987-4800-4b7c-836f-c0a35f39244e", roaster_name: "프릳츠", bean_name: "에티오피아 시다마", rebuy_action: "none" }, error: null, calls: [] };
export function configure(next) { Object.assign(state, next); state.calls = []; }
export function readCalls() { return structuredClone(state.calls); }
class Query { select(columns) { state.calls.push({ method: "select", columns }); return this; } eq(column, value) { state.calls.push({ method: "eq", column, value }); return this; } single() { state.calls.push({ method: "single" }); return Promise.resolve({ data: state.row, error: state.error }); } }
export async function createServerSupabase() { return { auth: { getUser: () => Promise.resolve(state.authenticated ? { data: { user: { id: "owner-1" } }, error: null } : { data: { user: null }, error: { message: "anonymous" } }) }, from: (table) => { state.calls.push({ method: "from", table }); return new Query(); } }; }
`);
}

async function loadRoute() {
  assert.equal(existsSync(routePath), true);
  const tempDirectory = mkdtempSync(path.join(projectRoot, ".coffeedex-rebuy-return-route-"));
  writeRuntimeMocks(tempDirectory);
  const routeSource = readFileSync(routePath, "utf8").replaceAll('"next/server"', '"./next-server.mjs"').replaceAll('"@/lib/supabase/server"', '"./supabase.mjs"');
  writeFileSync(path.join(tempDirectory, "route.mjs"), transpile(routeSource, routePath));
  try {
    return { route: await import(pathToFileURL(path.join(tempDirectory, "route.mjs"))), supabase: await import(pathToFileURL(path.join(tempDirectory, "supabase.mjs"))), tempDirectory };
  } catch (error) {
    rmSync(tempDirectory, { recursive: true, force: true });
    throw error;
  }
}

const token = "f70cfec8-51f9-4667-a80f-ca38bfbc2b6d";

test("Given a signed-in owner and opaque calendar token, When returning to CoffeeDex, Then it resolves only the owned rebuy memory", async () => {
  const loaded = await loadRoute();
  try {
    const response = await loaded.route.GET(new Request(`https://coffeedex.example/api/v1/shelf/rebuy-return?token=${token}`));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "private, no-store");
    assert.deepEqual(await response.json(), { data: { id: "93493987-4800-4b7c-836f-c0a35f39244e", roasterName: "프릳츠", beanName: "에티오피아 시다마", rebuyAction: "none" } });
    assert.deepEqual(loaded.supabase.readCalls(), [
      { method: "from", table: "coffee_shelf_items" },
      { method: "select", columns: "id,roaster_name,bean_name,rebuy_action" },
      { method: "eq", column: "rebuy_return_token", value: token },
      { method: "eq", column: "user_id", value: "owner-1" },
      { method: "single" },
    ]);
  } finally { rmSync(loaded.tempDirectory, { recursive: true, force: true }); }
});

test("Given anonymous, invalid, or non-owned calendar return state, When resolving a memory, Then it exposes no shelf details", async () => {
  const invalid = await loadRoute();
  try {
    const response = await invalid.route.GET(new Request("https://coffeedex.example/api/v1/shelf/rebuy-return?token=shelf-private-id-123"));
    assert.equal(response.status, 400);
    assert.deepEqual(invalid.supabase.readCalls(), []);
  } finally { rmSync(invalid.tempDirectory, { recursive: true, force: true }); }
  const anonymous = await loadRoute();
  try {
    anonymous.supabase.configure({ authenticated: false });
    const response = await anonymous.route.GET(new Request(`https://coffeedex.example/api/v1/shelf/rebuy-return?token=${token}`));
    assert.equal(response.status, 401);
    assert.deepEqual(anonymous.supabase.readCalls(), []);
  } finally { rmSync(anonymous.tempDirectory, { recursive: true, force: true }); }
  const missing = await loadRoute();
  try {
    missing.supabase.configure({ row: null, error: { code: "PGRST116", message: "not found" } });
    const response = await missing.route.GET(new Request(`https://coffeedex.example/api/v1/shelf/rebuy-return?token=${token}`));
    assert.equal(response.status, 404);
  } finally { rmSync(missing.tempDirectory, { recursive: true, force: true }); }
});

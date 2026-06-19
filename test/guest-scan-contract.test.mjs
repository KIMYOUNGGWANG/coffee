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
      module: ts.ModuleKind.ES2022,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      target: ts.ScriptTarget.ES2022,
    },
    fileName,
  }).outputText;
}

async function loadGuestRoute() {
  const tempDirectory = mkdtempSync(path.join(tmpdir(), "coffeedex-guest-scan-"));
  const zodUrl = pathToFileURL(path.join(projectRoot, "node_modules/zod/index.js")).href;
  writeFileSync(path.join(tempDirectory, "next-server.mjs"), `
export class NextResponse extends Response {
  static json(body, init = {}) {
    const headers = new Headers(init.headers);
    headers.set("content-type", "application/json");
    return new NextResponse(JSON.stringify(body), { ...init, headers });
  }
}`);
  writeFileSync(path.join(tempDirectory, "mock-env.mjs"), `
export function readStarterEnv() { return { AI_API_KEY: "" }; }
`);
  writeFileSync(path.join(tempDirectory, "mock-supabase.mjs"), `
let rpcCalls = 0;
export function getRpcCalls() { return rpcCalls; }
export async function createServerSupabase() {
  return {
    auth: { getUser: () => Promise.resolve({ data: { user: null }, error: { message: "anonymous" } }) },
    rpc: () => { rpcCalls += 1; return Promise.resolve({ data: null, error: null }); },
  };
}
`);

  const helperPath = path.join(projectRoot, "lib/guest-scan.ts");
  const helperSource = read("lib/guest-scan.ts").replaceAll('"zod"', `"${zodUrl}"`);
  writeFileSync(path.join(tempDirectory, "guest-scan.mjs"), transpileTypescript(helperSource, helperPath));

  const routePath = path.join(projectRoot, "app/api/v1/cards/scan/route.ts");
  const routeSource = read("app/api/v1/cards/scan/route.ts")
    .replaceAll('"next/server"', '"./next-server.mjs"')
    .replaceAll('"zod"', `"${zodUrl}"`)
    .replaceAll('"@/lib/supabase/server"', '"./mock-supabase.mjs"')
    .replaceAll('"@/lib/env"', '"./mock-env.mjs"')
    .replaceAll('"@/lib/guest-scan"', '"./guest-scan.mjs"');
  writeFileSync(path.join(tempDirectory, "route.mjs"), transpileTypescript(routeSource, routePath));

  return {
    routeModule: await import(pathToFileURL(path.join(tempDirectory, "route.mjs"))),
    supabaseMock: await import(pathToFileURL(path.join(tempDirectory, "mock-supabase.mjs"))),
  };
}

function guestRequest(image, ip = "203.0.113.10") {
  return new Request("http://localhost/api/v1/cards/scan", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify({ image }),
  });
}

async function parseJson(response) {
  return JSON.parse(await response.text());
}

const validImage = "data:image/png;base64,iVBORw0KGgo=";

test("Given an anonymous visitor, When using one scan trial, Then the image is ephemeral and no database entitlement is touched", async () => {
  // Given
  const { routeModule, supabaseMock } = await loadGuestRoute();

  // When
  const response = await routeModule.POST(guestRequest(validImage));

  // Then
  assert.equal(response.status, 200);
  const body = await parseJson(response);
  assert.equal(body.data.kind, "unavailable");
  assert.equal(body.guest.trial_used, true);
  assert.equal(JSON.stringify(body).includes(validImage), false);
  assert.equal(supabaseMock.getRpcCalls(), 0);
});

test("Given a malformed image data URL, When a guest scans, Then the request fails safely", async () => {
  // Given
  const { routeModule } = await loadGuestRoute();

  // When
  const response = await routeModule.POST(guestRequest("data:image/gif;base64,not-base64!", "203.0.113.11"));

  // Then
  assert.equal(response.status, 400);
  const body = await parseJson(response);
  assert.equal(body.error.code, 400);
});

test("Given decoded bytes that contradict the declared MIME, When a guest scans, Then the request fails safely", async () => {
  // Given
  const { routeModule } = await loadGuestRoute();
  const jpegBytesDeclaredAsPng = "data:image/png;base64,/9j/";

  // When
  const response = await routeModule.POST(guestRequest(jpegBytesDeclaredAsPng, "203.0.113.14"));

  // Then
  assert.equal(response.status, 400);
  const body = await parseJson(response);
  assert.equal(body.error.code, 400);
});

test("Given an image above five MiB decoded, When a guest scans, Then the route rejects it before provider work", async () => {
  // Given
  const { routeModule } = await loadGuestRoute();
  const oversized = `data:image/webp;base64,${Buffer.alloc((5 * 1024 * 1024) + 1).toString("base64")}`;

  // When
  const response = await routeModule.POST(guestRequest(oversized, "203.0.113.12"));

  // Then
  assert.equal(response.status, 413);
  const body = await parseJson(response);
  assert.equal(body.error.code, 413);
});

test("Given a guest already used the process-local trial, When scanning again, Then CoffeeDex rate limits the repeat", async () => {
  // Given
  const { routeModule } = await loadGuestRoute();
  const ip = "203.0.113.13";
  const firstResponse = await routeModule.POST(guestRequest(validImage, ip));
  assert.equal(firstResponse.status, 200);

  // When
  const response = await routeModule.POST(guestRequest(validImage, ip));

  // Then
  assert.equal(response.status, 429);
  const body = await parseJson(response);
  assert.equal(body.error.code, 429);
});

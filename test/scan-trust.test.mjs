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

function markdownSection(source, heading) {
  const marker = `### ${heading}`;
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `Expected markdown section: ${heading}`);
  const contentStart = start + marker.length;
  const nextHeading = source.indexOf("\n### ", contentStart);
  return source.slice(contentStart, nextHeading === -1 ? source.length : nextHeading);
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
    `let aiApiKey = "";

export function setAiApiKey(nextKey) {
  aiApiKey = nextKey;
}

export function readStarterEnv() {
  return { AI_API_KEY: aiApiKey };
}`,
  );
}

function writeSupabaseMock(tempDirectory) {
  writeFileSync(
    path.join(tempDirectory, "mock-supabase.mjs"),
    `const rpcCalls = [];

export function getRpcCalls() {
  return rpcCalls.map((call) => ({ ...call }));
}

export async function createServerSupabase() {
  return {
    auth: {
      getUser() {
        return Promise.resolve({ data: { user: { id: "user-1" } }, error: null });
      },
    },
    rpc(functionName, args) {
      rpcCalls.push({ functionName, args });
      return Promise.resolve({
        data: {
          allowed: true,
          source: "monthly_allowance",
          credits_spent: 0,
          credits_remaining: 3,
          scans_used: 2,
          monthly_scan_limit: 5,
        },
        error: null,
      });
    },
  };
}`,
  );
}

async function loadScanRoute() {
  const tempDirectory = mkdtempSync(path.join(tmpdir(), "coffeedex-scan-trust-"));
  const zodModuleUrl = pathToFileURL(path.join(projectRoot, "node_modules/zod/index.js")).href;
  writeNextResponseMock(tempDirectory);
  writeEnvMock(tempDirectory);
  writeSupabaseMock(tempDirectory);

  const helperPath = path.join(projectRoot, "lib/guest-scan.ts");
  const helperSource = read("lib/guest-scan.ts").replaceAll('"zod"', `"${zodModuleUrl}"`);
  writeFileSync(path.join(tempDirectory, "guest-scan.mjs"), transpileTypescript(helperSource, helperPath));

  const routePath = path.join(projectRoot, "app/api/v1/cards/scan/route.ts");
  const routeSource = read("app/api/v1/cards/scan/route.ts")
    .replaceAll('"next/server"', '"./next-server.mjs"')
    .replaceAll('"zod"', `"${zodModuleUrl}"`)
    .replaceAll('"@/lib/supabase/server"', '"./mock-supabase.mjs"')
    .replaceAll('"@/lib/env"', '"./mock-env.mjs"')
    .replaceAll('"@/lib/guest-scan"', '"./guest-scan.mjs"');

  writeFileSync(path.join(tempDirectory, "route.mjs"), transpileTypescript(routeSource, routePath));

  return {
    envMock: await import(pathToFileURL(path.join(tempDirectory, "mock-env.mjs"))),
    routeModule: await import(pathToFileURL(path.join(tempDirectory, "route.mjs"))),
    supabaseMock: await import(pathToFileURL(path.join(tempDirectory, "mock-supabase.mjs"))),
  };
}

function scanRequest() {
  return new Request("http://localhost/api/v1/cards/scan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: "data:image/jpeg;base64,/9j/" }),
  });
}

async function withFetchMock(fetchMock, action) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = fetchMock;
  try {
    return await action();
  } finally {
    globalThis.fetch = originalFetch;
  }
}

async function parseJson(response) {
  return JSON.parse(await response.text());
}

test("Given an authenticated allowance, When scanning, Then the existing entitlement RPC remains pinned", async () => {
  // Given
  const { routeModule, supabaseMock } = await loadScanRoute();

  // When
  const response = await withFetchMock(
    () => { throw new Error("provider must not run without a key"); },
    () => routeModule.POST(scanRequest()),
  );

  // Then
  assert.equal(response.status, 200);
  const body = await parseJson(response);
  assert.equal(body.entitlement.source, "monthly_allowance");
  assert.deepEqual(supabaseMock.getRpcCalls(), [
    { functionName: "increment_user_scan", args: { target_user_id: "user-1" } },
  ]);
});

test("Given no provider key, When scanning, Then CoffeeDex returns an explicit manual unavailable state", async () => {
  // Given
  const { routeModule } = await loadScanRoute();

  // When
  const response = await withFetchMock(
    () => { throw new Error("provider must not run without a key"); },
    () => routeModule.POST(scanRequest()),
  );

  // Then
  assert.equal(response.status, 200);
  const body = await parseJson(response);
  assert.deepEqual(body.data, {
    kind: "unavailable",
    reason: "provider_unconfigured",
    manual_entry: true,
  });
});

test("Given only a visible coffee title, When Gemini responds, Then unknown package claims stay null", async () => {
  // Given
  const { envMock, routeModule } = await loadScanRoute();
  envMock.setAiApiKey("test-ai-key");
  let providerRequestBody;

  // When
  const response = await withFetchMock(
    (_url, init) => {
      providerRequestBody = JSON.parse(init.body);
      return Promise.resolve(Response.json({
        candidates: [{ content: { parts: [{ text: JSON.stringify({
          title: "Colombia La Esperanza",
          subtitle: null,
          origin: null,
          process: null,
          tags: null,
          uncertainty: {
            title: 0.08,
            subtitle: null,
            origin: null,
            process: null,
            tags: null,
          },
        }) }] } }],
      }));
    },
    () => routeModule.POST(scanRequest()),
  );

  // Then
  assert.equal(response.status, 200);
  const body = await parseJson(response);
  assert.equal(body.data.kind, "success");
  assert.deepEqual(Object.keys(body.data).sort(), [
    "kind",
    "origin",
    "process",
    "source",
    "subtitle",
    "tags",
    "title",
    "uncertainty",
  ].sort());
  assert.equal(body.data.title, "Colombia La Esperanza");
  assert.equal(body.data.subtitle, null);
  assert.equal(body.data.origin, null);
  assert.equal(body.data.process, null);
  assert.equal(body.data.tags, null);
  assert.deepEqual(body.data.uncertainty, {
    title: 0.08,
    subtitle: null,
    origin: null,
    process: null,
    tags: null,
  });
  assert.equal("metric1_acidity" in body.data, false);
  assert.equal("metric2_sweetness" in body.data, false);
  assert.equal("metric3_body" in body.data, false);
  assert.equal("matchScore" in body.data, false);
  assert.doesNotMatch(JSON.stringify(providerRequestBody), /educated estimates|metric[123]/i);
});

test("Given the provider fails, When scanning, Then no sample coffee is fabricated", async () => {
  // Given
  const { envMock, routeModule } = await loadScanRoute();
  envMock.setAiApiKey("test-ai-key");

  // When
  const response = await withFetchMock(
    () => Promise.resolve(new Response("outage", { status: 503 })),
    () => routeModule.POST(scanRequest()),
  );

  // Then
  assert.equal(response.status, 200);
  const body = await parseJson(response);
  assert.deepEqual(body.data, {
    kind: "unavailable",
    reason: "provider_error",
    manual_entry: true,
  });
});

test("Given the scan API contract, Then route and docs exclude legacy match scoring", () => {
  // Given
  const scanRoute = read("app/api/v1/cards/scan/route.ts");
  const scanDocs = markdownSection(read("docs/api-spec.md"), "`POST /api/v1/cards/scan`");

  // When / Then
  assert.doesNotMatch(scanRoute, /matchScore/);
  assert.doesNotMatch(scanDocs, /matchScore/);
  assert.match(scanDocs, /title: string \| null/);
  assert.match(scanDocs, /uncertainty/);
  assert.match(scanDocs, /manual_entry: true/);
});

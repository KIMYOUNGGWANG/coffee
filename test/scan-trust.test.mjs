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
    `export async function createServerSupabase() {
  return {
    auth: {
      getUser() {
        return Promise.resolve({ data: { user: { id: "user-1" } }, error: null });
      },
    },
    rpc() {
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
  const tempDirectory = mkdtempSync(path.join(tmpdir(), "hyangmi-scan-trust-"));
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

  return {
    envMock: await import(pathToFileURL(path.join(tempDirectory, "mock-env.mjs"))),
    routeModule: await import(pathToFileURL(path.join(tempDirectory, "route.mjs"))),
  };
}

function scanRequest() {
  return new Request("http://localhost/api/v1/cards/scan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: "data:image/jpeg;base64,ZmFrZS1pbWFnZQ==" }),
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

function assertConfidence(value) {
  assert.equal(typeof value, "number");
  assert.ok(value > 0);
  assert.ok(value <= 1);
}

test("Given no AI key, When scanning, Then the mock fallback includes confidence and source", async () => {
  // Given
  const { routeModule } = await loadScanRoute();

  // When
  const response = await withFetchMock(
    () => {
      throw new Error("fetch should not be called for no-key fallback scans");
    },
    () => routeModule.POST(scanRequest()),
  );

  // Then
  assert.equal(response.status, 200);
  const body = await parseJson(response);
  assert.equal(body.data.source, "fallback_mock");
  assertConfidence(body.data.confidence);
  assert.match(body.warning, /내장|fallback|mock/i);
});

test("Given Gemini omits trust fields, When scanning, Then confidence and source are normalized", async () => {
  // Given
  const { envMock, routeModule } = await loadScanRoute();
  envMock.setAiApiKey("test-ai-key");
  const geminiPayload = {
    title: "Colombia Huila Monteblanco Purple Caturra",
    subtitle: "프릳츠 커피",
    origin: "Colombia",
    process: "Anaerobic",
    tags: ["Berry", "Chocolate"],
    metric1_acidity: 3,
    metric2_sweetness: 5,
    metric3_body: 4,
  };

  // When
  const response = await withFetchMock(
    () => Promise.resolve(Response.json({
      candidates: [{ content: { parts: [{ text: JSON.stringify(geminiPayload) }] } }],
    })),
    () => routeModule.POST(scanRequest()),
  );

  // Then
  assert.equal(response.status, 200);
  const body = await parseJson(response);
  assert.equal(body.data.title, geminiPayload.title);
  assert.equal(body.data.source, "gemini_vision");
  assertConfidence(body.data.confidence);
});

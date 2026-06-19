import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const currentFilePath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(currentFilePath), "..");

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

async function loadAnalyticsRoute() {
  const tempDirectory = mkdtempSync(path.join(tmpdir(), "coffeedex-passport-api-"));
  const passportSourcePath = path.join(projectRoot, "lib/passport-state.ts");
  const routeSourcePath = path.join(projectRoot, "app/api/v1/profile/analytics/route.ts");

  writeFileSync(path.join(tempDirectory, "passport-state.mjs"), transpile(readFileSync(passportSourcePath, "utf8"), passportSourcePath));
  writeFileSync(path.join(tempDirectory, "next-server.mjs"), `
export class NextResponse extends Response {
  static json(body, init = {}) {
    return new NextResponse(JSON.stringify(body), {
      ...init,
      headers: { "content-type": "application/json", ...init.headers },
    });
  }
}
`);
  writeFileSync(path.join(tempDirectory, "api-errors.mjs"), "export function getErrorMessage(error) { return error instanceof Error ? error.message : String(error); }\n");
  writeFileSync(path.join(tempDirectory, "env.mjs"), "export function readStarterEnv() { return { AI_API_KEY: undefined }; }\n");
  writeFileSync(path.join(tempDirectory, "mock-supabase.mjs"), `
let cards = [];
export function setCards(value) { cards = value; }
class Query {
  constructor(table) { this.table = table; }
  select() { return this; }
  eq() { return Promise.resolve(this.table === "tasting_cards" ? { data: cards, error: null } : { data: [], error: null }); }
}
export async function createServerSupabase() {
  return {
    auth: { getUser: () => Promise.resolve({ data: { user: { id: "user-1" } }, error: null }) },
    from: (table) => new Query(table),
  };
}
`);

  const routeSource = readFileSync(routeSourcePath, "utf8")
    .replaceAll('"next/server"', '"./next-server.mjs"')
    .replaceAll('"@/lib/supabase/server"', '"./mock-supabase.mjs"')
    .replaceAll('"@/lib/api-errors"', '"./api-errors.mjs"')
    .replaceAll('"@/lib/env"', '"./env.mjs"')
    .replaceAll('"@/lib/passport-state"', '"./passport-state.mjs"');
  writeFileSync(path.join(tempDirectory, "route.mjs"), transpile(routeSource, routeSourcePath));

  return {
    route: await import(pathToFileURL(path.join(tempDirectory, "route.mjs"))),
    supabase: await import(pathToFileURL(path.join(tempDirectory, "mock-supabase.mjs"))),
    tempDirectory,
  };
}

test("Given confirmed and draft memories, When passport analytics are requested, Then literal evidence only counts confirmed memories", async () => {
  // Given
  const loaded = await loadAnalyticsRoute();
  try {
    loaded.supabase.setCards([
      { metric1: 4, metric2: 3, metric3: 2, tags: ["복숭아", "꽃"], package_origin: "Ethiopia", package_process: "Washed", repurchase_intent: "again", confirmed_at: "2026-06-18T00:00:00Z" },
      { metric1: 3, metric2: 4, metric3: 3, tags: ["복숭아"], package_origin: "Kenya", package_process: "Natural", repurchase_intent: "maybe", confirmed_at: "2026-06-18T01:00:00Z" },
      { metric1: 5, metric2: 5, metric3: 5, tags: ["초콜릿"], package_origin: "Brazil", package_process: "Natural", repurchase_intent: "no", confirmed_at: null },
    ]);

    // When
    const response = await loaded.route.GET(new Request("http://localhost/api/v1/profile/analytics"));
    const body = await response.json();

    // Then
    assert.deepEqual(body.data.passport, {
      kind: "collage",
      sampleCount: 2,
      distinctOriginCount: 2,
      distinctProcessCount: 2,
      distinctTagCount: 2,
      coverage: "mixed",
    });
    assert.deepEqual(body.data.topNotes, [
      { note: "복숭아", count: 2 },
      { note: "꽃", count: 1 },
    ]);
    assert.deepEqual(body.data.repurchaseBreakdown, { again: 1, maybe: 1, no: 0, undecided: 0 });
    assert.equal(body.data.totalCards, 3);
  } finally {
    rmSync(loaded.tempDirectory, { recursive: true, force: true });
  }
});

test("Given narrow early evidence, When passport analytics are requested, Then the summary discloses uncertainty", async () => {
  // Given
  const loaded = await loadAnalyticsRoute();
  try {
    loaded.supabase.setCards([
      { metric1: 4, metric2: 4, metric3: 2, tags: ["감귤"], package_origin: "Ethiopia", package_process: "Washed", repurchase_intent: "undecided", confirmed_at: "2026-06-18T00:00:00Z" },
    ]);

    // When
    const response = await loaded.route.GET(new Request("http://localhost/api/v1/profile/analytics"));
    const body = await response.json();

    // Then
    assert.equal(body.data.passport.kind, "collage");
    assert.equal(body.data.passport.coverage, "narrow");
    assert.match(body.data.aiAnalysis, /1개/);
    assert.match(body.data.aiAnalysis, /아직.*확정/);
    assert.doesNotMatch(body.data.aiAnalysis, /완성|정교한 취향|취향 DNA/);
  } finally {
    rmSync(loaded.tempDirectory, { recursive: true, force: true });
  }
});

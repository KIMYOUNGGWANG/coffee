import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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
    `
export class NextResponse extends Response {
  static json(body, init = {}) {
    const headers = new Headers(init.headers);
    if (!headers.has("content-type")) {
      headers.set("content-type", "application/json");
    }
    return new NextResponse(JSON.stringify(body), { ...init, headers });
  }
}
`,
  );
}

function writeSupabaseMock(tempDirectory) {
  writeFileSync(
    path.join(tempDirectory, "mock-supabase.mjs"),
    `
let scenario = {
  auth: { data: { user: null }, error: null },
  profile: { data: null, error: null },
  cards: { data: [], error: null },
};

export function setPdfRouteScenario(nextScenario) {
  scenario = nextScenario;
}

class Query {
  constructor(tableName) {
    this.tableName = tableName;
  }

  select() {
    return this;
  }

  eq() {
    return this;
  }

  single() {
    return Promise.resolve(scenario.profile);
  }

  order() {
    return Promise.resolve(scenario.cards);
  }
}

export async function createServerSupabase() {
  return {
    auth: {
      getUser() {
        return Promise.resolve(scenario.auth);
      },
    },
    from(tableName) {
      return new Query(tableName);
    },
  };
}
`,
	  );
}

function writeMissingFontFsMock(tempDirectory) {
  writeFileSync(
    path.join(tempDirectory, "mock-fs.mjs"),
    `
export const promises = {
  access() {
    return Promise.reject(Object.assign(new Error("missing bundled font"), { code: "ENOENT" }));
  },
  readFile() {
    return Promise.reject(Object.assign(new Error("missing bundled font"), { code: "ENOENT" }));
  },
};
`,
  );
}

function writePdfGeneratorModule(tempDirectory) {
  const generatorPath = path.join(projectRoot, "lib/pdf-generator.ts");
  try {
    const pdfLibUrl = pathToFileURL(path.join(projectRoot, "node_modules/pdf-lib/cjs/index.js")).href;
    const fontkitUrl = pathToFileURL(path.join(projectRoot, "node_modules/@pdf-lib/fontkit/dist/fontkit.umd.js")).href;
    const source = readFileSync(generatorPath, "utf8")
      .replaceAll('"pdf-lib"', `"${pdfLibUrl}"`)
      .replaceAll('"@pdf-lib/fontkit"', `"${fontkitUrl}"`);
    writeFileSync(
      path.join(tempDirectory, "pdf-generator.mjs"),
      transpileTypescript(source, generatorPath),
    );
  } catch (error) {
    if (error?.code !== "ENOENT") {
      throw error;
    }
  }
}

function writeBrandModule(tempDirectory) {
  const brandPath = path.join(projectRoot, "lib/brand.ts");
  const source = readFileSync(brandPath, "utf8");
  writeFileSync(
    path.join(tempDirectory, "brand.mjs"),
    transpileTypescript(source, brandPath),
  );
}

async function loadPdfRoute(options = {}) {
  const tempDirectory = mkdtempSync(path.join(tmpdir(), "coffeedex-pdf-route-"));
  const zodModuleUrl = pathToFileURL(path.join(projectRoot, "node_modules/zod/index.js")).href;
  writeNextResponseMock(tempDirectory);
  writeSupabaseMock(tempDirectory);
  writePdfGeneratorModule(tempDirectory);
  writeBrandModule(tempDirectory);
  if (options.missingFont) {
    writeMissingFontFsMock(tempDirectory);
  }

  const routePath = path.join(projectRoot, "app/api/v1/pdf/route.ts");
  const routeSource = read("app/api/v1/pdf/route.ts")
    .replaceAll('"next/server"', '"./next-server.mjs"')
    .replaceAll('"fs"', options.missingFont ? '"./mock-fs.mjs"' : '"fs"')
    .replaceAll('"zod"', `"${zodModuleUrl}"`)
    .replaceAll('"@/lib/supabase/server"', '"./mock-supabase.mjs"')
    .replaceAll('"@/lib/brand"', '"./brand.mjs"')
    .replaceAll('"@/lib/pdf-generator"', '"./pdf-generator.mjs"');

  writeFileSync(
    path.join(tempDirectory, "route.mjs"),
    transpileTypescript(routeSource, routePath),
  );

  const routeModule = await import(pathToFileURL(path.join(tempDirectory, "route.mjs")));
  const supabaseMock = await import(pathToFileURL(path.join(tempDirectory, "mock-supabase.mjs")));

  return { routeModule, supabaseMock, tempDirectory };
}

test("GET /api/v1/pdf returns a downloadable PDF for an entitled user", async () => {
  // Given
  const { routeModule, supabaseMock, tempDirectory } = await loadPdfRoute();
  try {
    supabaseMock.setPdfRouteScenario({
      auth: {
        data: { user: { id: "user-1", email: "minji@example.com" } },
        error: null,
      },
      profile: { data: { has_pdf_access: true }, error: null },
      cards: {
        data: [
          {
            title: "Kenya AA",
            subtitle: "Seoul Roaster",
            metric1: 4,
            metric2: 5,
            metric3: 3,
            tags: ["floral", "citrus"],
            ai_description: "Bright pour-over memory.",
            created_at: "2026-06-14T12:00:00.000Z",
          },
        ],
        error: null,
      },
    });

    // When
    const response = await routeModule.GET(new Request("http://localhost/api/v1/pdf"));

    // Then
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type") ?? "", /^application\/pdf/);
    assert.match(
      response.headers.get("content-disposition") ?? "",
      /^attachment; filename="coffeedex-taste-passport-\d{4}-\d{2}-\d{2}\.pdf"$/,
    );

    const bytes = new Uint8Array(await response.arrayBuffer());
    assert.ok(bytes.byteLength > 0);
    assert.equal(new TextDecoder().decode(bytes.slice(0, 4)), "%PDF");
  } finally {
    rmSync(tempDirectory, { force: true, recursive: true });
  }
});

test("GET /api/v1/pdf returns 403 for a user without PDF access", async () => {
  // Given
  const { routeModule, supabaseMock, tempDirectory } = await loadPdfRoute();
  try {
    supabaseMock.setPdfRouteScenario({
      auth: {
        data: { user: { id: "user-2", email: "jae@example.com" } },
        error: null,
      },
      profile: { data: { has_pdf_access: false }, error: null },
      cards: { data: [], error: null },
    });

    // When
    const response = await routeModule.GET(new Request("http://localhost/api/v1/pdf"));

    // Then
    assert.equal(response.status, 403);
  } finally {
    rmSync(tempDirectory, { force: true, recursive: true });
  }
});

test("GET /api/v1/pdf returns 503 without fetching a remote font when the bundled font is unavailable", async () => {
  // Given
  const { routeModule, supabaseMock, tempDirectory } = await loadPdfRoute({ missingFont: true });
  const originalFetch = globalThis.fetch;
  let fetchCalled = false;
  globalThis.fetch = () => {
    fetchCalled = true;
    throw new Error("PDF route must not fetch fonts at runtime");
  };
  try {
    supabaseMock.setPdfRouteScenario({
      auth: {
        data: { user: { id: "user-3", email: "font@example.com" } },
        error: null,
      },
      profile: { data: { has_pdf_access: true }, error: null },
      cards: { data: [], error: null },
    });

    // When
    const response = await routeModule.GET(new Request("http://localhost/api/v1/pdf"));
    const body = JSON.parse(await response.text());

    // Then
    assert.equal(response.status, 503);
    assert.equal(fetchCalled, false);
    assert.equal(body.error.code, 503);
    assert.match(body.error.message, /PDF 글꼴 리소스/);
  } finally {
    globalThis.fetch = originalFetch;
    rmSync(tempDirectory, { force: true, recursive: true });
  }
});

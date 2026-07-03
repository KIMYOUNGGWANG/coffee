import assert from "node:assert/strict";
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";
import { analyticsRequest, loadAnalyticsRoute } from "./support/analytics-route-fixture.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

function transpileHook(source, fileName) {
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

async function loadAnalyticsHookModule() {
  const sourcePath = path.join(projectRoot, "hooks/use-analytics-events.ts");
  const analyticsClientPath = path.join(projectRoot, "lib/analytics-client.ts");
  const tempDirectory = mkdtempSync(path.join(tmpdir(), "hyangmi-analytics-hook-"));
  const analyticsClientCompiledPath = path.join(tempDirectory, "analytics-client.mjs");
  const compiledPath = path.join(tempDirectory, "use-analytics-events.mjs");
  const source = readFileSync(sourcePath, "utf8")
    .replace(
    'import { useCallback } from "react";',
    "function useCallback(callback) { return callback; }",
    )
    .replace(
      'import { trackAnalyticsEvent } from "@/lib/analytics-client";',
      `import { trackAnalyticsEvent } from ${JSON.stringify(pathToFileURL(analyticsClientCompiledPath).href)};`,
    );

  writeFileSync(analyticsClientCompiledPath, transpileHook(readFileSync(analyticsClientPath, "utf8"), analyticsClientPath));
  writeFileSync(compiledPath, transpileHook(source, sourcePath));

  try {
    return {
      module: await import(pathToFileURL(compiledPath)),
      tempDirectory,
    };
  } catch (error) {
    rmSync(tempDirectory, { force: true, recursive: true });
    throw error;
  }
}

function restoreLocation(descriptor) {
  if (descriptor === undefined) {
    Reflect.deleteProperty(globalThis, "location");
    return;
  }

  Object.defineProperty(globalThis, "location", descriptor);
}

for (const sensitiveKey of ["raw_image", "note", "email"]) {
  test(`Given a ${sensitiveKey} property, When analytics is delivered, Then raw private content is rejected`, async () => {
    const fixture = await loadAnalyticsRoute();
    fixture.store.resetAnalyticsState();

    try {
      const response = await fixture.route.POST(analyticsRequest({
        eventName: "landing_view",
        properties: { [sensitiveKey]: "private" },
      }));

      assert.equal(response.status, 400);
      assert.equal(fixture.store.getAnalyticsRows().length, 0);
    } finally {
      fixture.cleanup();
    }
  });
}

test("Given nested analytics properties, When delivered, Then non-scalar content is rejected", async () => {
  const fixture = await loadAnalyticsRoute();

  try {
    const response = await fixture.route.POST(analyticsRequest({
      eventName: "landing_view",
      properties: { scan: { result: "private" } },
    }));
    assert.equal(response.status, 400);
  } finally {
    fixture.cleanup();
  }
});

test("Given oversized analytics properties, When delivered, Then bounded content is rejected", async () => {
  const fixture = await loadAnalyticsRoute();

  try {
    const response = await fixture.route.POST(analyticsRequest({
      eventName: "landing_view",
      properties: { source: "x".repeat(257) },
    }));
    assert.equal(response.status, 400);
  } finally {
    fixture.cleanup();
  }
});

for (const unsafePath of ["/dashboard?search=private", "/dashboard#private"]) {
  test(`Given an analytics path with private URL data, When ${unsafePath} is delivered, Then it is rejected`, async () => {
    const fixture = await loadAnalyticsRoute();

    try {
      const response = await fixture.route.POST(analyticsRequest({ path: unsafePath }));
      assert.equal(response.status, 400);
      assert.equal(fixture.store.getAnalyticsRows().length, 0);
    } finally {
      fixture.cleanup();
    }
  });
}

test("Given a client-supplied user ID, When analytics is delivered, Then spoofed attribution is rejected", async () => {
  const fixture = await loadAnalyticsRoute();

  try {
    const response = await fixture.route.POST(analyticsRequest({
      userId: "c48e29ad-4b88-4fd6-aeb1-d70f07347857",
    }));
    assert.equal(response.status, 400);
    assert.equal(fixture.store.getAnalyticsRows().length, 0);
  } finally {
    fixture.cleanup();
  }
});

test("Given storage failure, When a valid event is delivered, Then the route does not acknowledge receipt", async () => {
  const fixture = await loadAnalyticsRoute();
  fixture.store.resetAnalyticsState();
  fixture.store.failNextInsert({ code: "08006", message: "connection failure" });

  try {
    const response = await fixture.route.POST(analyticsRequest({ eventName: "landing_view" }));
    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), {
      error: { code: 500, message: "Analytics event could not be stored." },
    });
  } finally {
    fixture.cleanup();
  }
});

test("Given the product events migration, When inspected, Then event IDs and privacy controls are database-enforced", () => {
  const migrationName = readdirSync(path.join(projectRoot, "supabase/migrations"))
    .find((name) => /^20260618\d{6}_create_product_events\.sql$/.test(name));

  assert.ok(migrationName, "expected a collision-free 20260618 product_events migration");
  const migration = readFileSync(path.join(projectRoot, "supabase/migrations", migrationName), "utf8");
  assert.match(migration, /create table if not exists public\.product_events/i);
  assert.match(migration, /event_id uuid primary key/i);
  assert.match(migration, /enable row level security/i);
  assert.doesNotMatch(migration, /create policy/i);
});

test("analytics hook warns when delivery returns a non-2xx response", async () => {
  const { module, tempDirectory } = await loadAnalyticsHookModule();
  const originalFetch = globalThis.fetch;
  const originalLocationDescriptor = Object.getOwnPropertyDescriptor(globalThis, "location");
  const originalWarn = console.warn;
  const warningMessages = [];

  Object.defineProperty(globalThis, "location", {
    configurable: true,
    value: { pathname: "/dashboard", search: "?source=contract" },
  });
  globalThis.fetch = () => Promise.resolve({
    ok: false,
    status: 503,
    statusText: "Service Unavailable",
  });
  console.warn = (...messages) => {
    warningMessages.push(messages.join(" "));
  };

  try {
    module.useAnalyticsEvents().trackEvent("dashboard_view");
    await new Promise((resolve) => {
      setImmediate(resolve);
    });

    assert.equal(warningMessages.length, 1);
    assert.match(warningMessages[0], /CoffeeDex analytics event dropped/);
    assert.match(warningMessages[0], /503/);
    assert.match(warningMessages[0], /Service Unavailable/);
  } finally {
    globalThis.fetch = originalFetch;
    console.warn = originalWarn;
    restoreLocation(originalLocationDescriptor);
    rmSync(tempDirectory, { force: true, recursive: true });
  }
});

import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

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
  const source = readFileSync(sourcePath, "utf8").replace(
    'import { useCallback } from "react";',
    "function useCallback(callback) { return callback; }",
  );
  const tempDirectory = mkdtempSync(path.join(tmpdir(), "hyangmi-analytics-hook-"));
  const compiledPath = path.join(tempDirectory, "use-analytics-events.mjs");

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

test("analytics hook warns when delivery returns a non-2xx response", async () => {
  // Given
  const { module, tempDirectory } = await loadAnalyticsHookModule();
  const originalFetch = globalThis.fetch;
  const originalLocationDescriptor = Object.getOwnPropertyDescriptor(globalThis, "location");
  const originalWarn = console.warn;
  const warningMessages = [];

  Object.defineProperty(globalThis, "location", {
    configurable: true,
    value: {
      pathname: "/dashboard",
      search: "?source=contract",
    },
  });
  globalThis.fetch = () =>
    Promise.resolve({
      ok: false,
      status: 503,
      statusText: "Service Unavailable",
    });
  console.warn = (...messages) => {
    warningMessages.push(messages.join(" "));
  };

  try {
    // When
    module.useAnalyticsEvents().trackEvent("dashboard_view");
    await new Promise((resolve) => {
      setImmediate(resolve);
    });

    // Then
    assert.equal(warningMessages.length, 1);
    assert.match(warningMessages[0], /Hyangmi analytics event dropped/);
    assert.match(warningMessages[0], /503/);
    assert.match(warningMessages[0], /Service Unavailable/);
  } finally {
    globalThis.fetch = originalFetch;
    console.warn = originalWarn;
    restoreLocation(originalLocationDescriptor);
    rmSync(tempDirectory, { force: true, recursive: true });
  }
});

import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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

async function loadDashboardReturnSourceModule() {
  const tempDirectory = mkdtempSync(path.join(projectRoot, ".coffeedex-dashboard-return-source-"));
  const modulePath = path.join(projectRoot, "lib/dashboard-return-source.ts");

  assert.equal(existsSync(modulePath), true);

  writeFileSync(
    path.join(tempDirectory, "dashboard-return-source.mjs"),
    transpile(readFileSync(modulePath, "utf8"), modulePath),
  );

  try {
    return {
      module: await import(pathToFileURL(path.join(tempDirectory, "dashboard-return-source.mjs"))),
      tempDirectory,
    };
  } catch (error) {
    rmSync(tempDirectory, { recursive: true, force: true });
    throw error;
  }
}

test("Given rebuy calendar source, When dashboard return source is parsed, Then it returns a calendar return", async () => {
  const loaded = await loadDashboardReturnSourceModule();
  try {
    const { readDashboardReturnSourceFromRecord } = loaded.module;

    const result = readDashboardReturnSourceFromRecord({
      source: "rebuy_calendar",
      rebuy_token: "f70cfec8-51f9-4667-a80f-ca38bfbc2b6d",
      utm_source: "qa",
    });

    assert.deepEqual(result, {
      kind: "rebuy_calendar",
      source: "rebuy_calendar",
      returnToken: "f70cfec8-51f9-4667-a80f-ca38bfbc2b6d",
    });
  } finally {
    rmSync(loaded.tempDirectory, { recursive: true, force: true });
  }
});

test("Given a calendar source without a valid opaque token, When dashboard return source is parsed, Then it keeps the generic private return cue", async () => {
  const loaded = await loadDashboardReturnSourceModule();
  try {
    const { readDashboardReturnSourceFromRecord } = loaded.module;

    const result = readDashboardReturnSourceFromRecord({
      source: "rebuy_calendar",
      rebuy_token: "shelf-private-id-123",
    });

    assert.deepEqual(result, { kind: "rebuy_calendar", source: "rebuy_calendar", returnToken: null });
  } finally {
    rmSync(loaded.tempDirectory, { recursive: true, force: true });
  }
});

test("Given non calendar source, When dashboard return source is parsed, Then it ignores non calendar dashboard sources", async () => {
  const loaded = await loadDashboardReturnSourceModule();
  try {
    const { readDashboardReturnSourceFromRecord } = loaded.module;

    const result = readDashboardReturnSourceFromRecord({ source: "public_card" });

    assert.deepEqual(result, { kind: "none" });
  } finally {
    rmSync(loaded.tempDirectory, { recursive: true, force: true });
  }
});

test("Given repeated dashboard source values, When dashboard return source is parsed, Then only the first value is trusted", async () => {
  const loaded = await loadDashboardReturnSourceModule();
  try {
    const { readDashboardReturnSourceFromRecord } = loaded.module;

    const result = readDashboardReturnSourceFromRecord({
      source: ["public_card", "rebuy_calendar"],
    });

    assert.deepEqual(result, { kind: "none" });
  } finally {
    rmSync(loaded.tempDirectory, { recursive: true, force: true });
  }
});

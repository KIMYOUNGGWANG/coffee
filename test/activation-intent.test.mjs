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

async function loadActivationIntentModule() {
  const tempDirectory = mkdtempSync(path.join(tmpdir(), "hyangmi-activation-intent-"));
  const sourcePath = path.join(projectRoot, "lib/activation-intent.ts");
  const zodModuleUrl = pathToFileURL(path.join(projectRoot, "node_modules/zod/index.js")).href;
  const source = read("lib/activation-intent.ts").replaceAll('"zod"', `"${zodModuleUrl}"`);
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.ES2022,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: sourcePath,
  }).outputText;

  writeFileSync(path.join(tempDirectory, "activation-intent.mjs"), transpiled);

  try {
    return await import(pathToFileURL(path.join(tempDirectory, "activation-intent.mjs")));
  } finally {
    rmSync(tempDirectory, { recursive: true, force: true });
  }
}

test("activation intent preserves public-card source and token", async () => {
  const { buildDashboardActivationHref, readActivationIntentFromRecord } = await loadActivationIntentModule();

  const intent = readActivationIntentFromRecord({
    intent: "first_card",
    source: "public_card",
    token: "public-token-001",
  });

  assert.deepEqual(intent, {
    kind: "first_card",
    source: "public_card",
    token: "public-token-001",
  });
  assert.equal(
    buildDashboardActivationHref(intent),
    "/dashboard?intent=first_card&source=public_card&token=public-token-001",
  );
});

test("activation intent ignores unsupported query values", async () => {
  const { buildDashboardActivationHref, readActivationIntentFromRecord } = await loadActivationIntentModule();

  const intent = readActivationIntentFromRecord({
    intent: "unknown",
    source: "public_card",
    token: "public-token-001",
  });

  assert.deepEqual(intent, { kind: "none" });
  assert.equal(buildDashboardActivationHref(intent), "/dashboard");
});

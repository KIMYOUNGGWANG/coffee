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
  const tasteProfileTranspiled = ts.transpileModule(read("lib/taste-profile.ts"), {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.ES2022,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: path.join(projectRoot, "lib/taste-profile.ts"),
  }).outputText;
  const source = read("lib/activation-intent.ts")
    .replaceAll('"zod"', `"${zodModuleUrl}"`)
    .replaceAll('"@/lib/taste-profile"', '"./taste-profile.mjs"');
  const activationIntentTranspiled = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.ES2022,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: sourcePath,
  }).outputText;

  writeFileSync(path.join(tempDirectory, "taste-profile.mjs"), tasteProfileTranspiled);
  writeFileSync(path.join(tempDirectory, "activation-intent.mjs"), activationIntentTranspiled);

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
    tasteProfile: null,
    mode: "full",
  });
  assert.equal(
    buildDashboardActivationHref(intent),
    "/dashboard?intent=first_card&source=public_card&mode=full&token=public-token-001",
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

test("activation intent carries supported taste profile values", async () => {
  const { buildDashboardActivationHref, readActivationIntentFromRecord } = await loadActivationIntentModule();

  const intent = readActivationIntentFromRecord({
    intent: "first_card",
    source: "onboarding",
    taste_profile: "sweet",
  });

  assert.deepEqual(intent, {
    kind: "first_card",
    source: "onboarding",
    token: null,
    tasteProfile: "sweet",
    mode: "full",
  });
  assert.equal(
    buildDashboardActivationHref(intent),
    "/dashboard?intent=first_card&source=onboarding&mode=full&taste_profile=sweet",
  );
});

test("first-card activation builder routes onboarding into quick add", async () => {
  const { buildDashboardActivationHref, buildFirstCardActivationIntent } = await loadActivationIntentModule();

  const intent = buildFirstCardActivationIntent({ kind: "default" });

  assert.deepEqual(intent, {
    kind: "first_card",
    source: "onboarding",
    token: null,
    tasteProfile: null,
    mode: "quick",
  });
  assert.equal(buildDashboardActivationHref(intent), "/dashboard?intent=first_card&source=onboarding&mode=quick");
});

test("activation intent ignores malformed taste profile values", async () => {
  const { buildDashboardActivationHref, readActivationIntentFromRecord } = await loadActivationIntentModule();

  const intent = readActivationIntentFromRecord({
    intent: "first_card",
    source: "onboarding",
    taste_profile: "espresso-script",
  });

  assert.deepEqual(intent, {
    kind: "first_card",
    source: "onboarding",
    token: null,
    tasteProfile: null,
    mode: "full",
  });
  assert.equal(buildDashboardActivationHref(intent), "/dashboard?intent=first_card&source=onboarding&mode=full");
});

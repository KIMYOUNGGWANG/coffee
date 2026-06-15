import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const currentFilePath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(currentFilePath), "..");

async function loadAuthRedirectModule() {
  const tempDirectory = mkdtempSync(path.join(tmpdir(), "hyangmi-checkout-intent-"));
  const sourcePath = path.join(projectRoot, "lib/auth-redirect.ts");
  const source = readFileSync(sourcePath, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.ES2022,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: sourcePath,
  }).outputText;

  writeFileSync(path.join(tempDirectory, "auth-redirect.mjs"), transpiled);

  try {
    return await import(pathToFileURL(path.join(tempDirectory, "auth-redirect.mjs")));
  } finally {
    rmSync(tempDirectory, { recursive: true, force: true });
  }
}

async function loadCheckoutReturnModule() {
  const tempDirectory = mkdtempSync(path.join(tmpdir(), "hyangmi-checkout-return-"));
  const sourcePath = path.join(projectRoot, "lib/checkout-return.ts");
  const zodModuleUrl = pathToFileURL(path.join(projectRoot, "node_modules/zod/index.js")).href;
  const source = readFileSync(sourcePath, "utf8").replaceAll('"zod"', `"${zodModuleUrl}"`);
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.ES2022,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: sourcePath,
  }).outputText;

  writeFileSync(path.join(tempDirectory, "checkout-return.mjs"), transpiled);

  try {
    return await import(pathToFileURL(path.join(tempDirectory, "checkout-return.mjs")));
  } finally {
    rmSync(tempDirectory, { recursive: true, force: true });
  }
}

test("Given checkout intent query, When reading intent, Then valid products resume through dashboard", async () => {
  // Given
  const {
    buildDashboardCheckoutIntentHref,
    readCheckoutIntentFromRecord,
    readCheckoutIntentFromSearch,
  } = await loadCheckoutReturnModule();

  // When
  const recordIntent = readCheckoutIntentFromRecord({ checkout_intent: "premium_subscription" });
  const searchIntent = readCheckoutIntentFromSearch("?checkout_intent=credits_10");

  // Then
  assert.deepEqual(recordIntent, { kind: "checkout", itemType: "premium_subscription" });
  assert.deepEqual(searchIntent, { kind: "checkout", itemType: "credits_10" });
  assert.equal(
    buildDashboardCheckoutIntentHref("premium_subscription"),
    "/dashboard?checkout_intent=premium_subscription",
  );
});

test("Given malformed checkout intent query, When reading intent, Then it is ignored", async () => {
  // Given
  const { readCheckoutIntentFromRecord, readCheckoutIntentFromSearch } = await loadCheckoutReturnModule();

  // When
  const unsupportedIntent = readCheckoutIntentFromRecord({ checkout_intent: "theme_pack" });
  const emptyIntent = readCheckoutIntentFromSearch("?checkout_intent=");

  // Then
  assert.deepEqual(unsupportedIntent, { kind: "none" });
  assert.deepEqual(emptyIntent, { kind: "none" });
});

test("Given allowed checkout intents, When building an auth gate href, Then the dashboard redirect preserves them", async () => {
  // Given
  const { buildAuthGateHref, sanitizeAuthRedirect } = await loadAuthRedirectModule();
  const allowedIntents = ["premium_subscription", "credits_10", "pdf_book"];

  for (const intent of allowedIntents) {
    // When
    const redirect = `/dashboard?checkout_intent=${intent}`;
    const authHref = buildAuthGateHref(redirect);

    // Then
    assert.equal(sanitizeAuthRedirect(redirect), redirect);
    assert.equal(authHref, `/auth?redirect=${encodeURIComponent(redirect)}`);
  }
});

test("Given malformed checkout intents, When sanitizing auth redirects, Then they fall back to dashboard", async () => {
  // Given
  const { buildAuthGateHref, sanitizeAuthRedirect } = await loadAuthRedirectModule();
  const malformedRedirects = [
    "/dashboard?checkout_intent=enterprise",
    "/dashboard?checkout_intent=",
    "/dashboard?checkout_intent=https://evil.example",
    "/dashboard?checkout_intent=premium_subscription&checkout_intent=credits_10",
  ];

  for (const redirect of malformedRedirects) {
    // When / Then
    assert.equal(sanitizeAuthRedirect(redirect), "/dashboard");
    assert.equal(buildAuthGateHref(redirect), "/auth?redirect=%2Fdashboard");
  }
});

test("Given external checkout-intent redirects, When sanitizing auth redirects, Then they fall back to dashboard", async () => {
  // Given
  const { buildAuthGateHref, sanitizeAuthRedirect } = await loadAuthRedirectModule();
  const externalRedirects = [
    "https://evil.example/dashboard?checkout_intent=premium_subscription",
    "//evil.example/dashboard?checkout_intent=premium_subscription",
    "/dashboard.evil.example?checkout_intent=premium_subscription",
  ];

  for (const redirect of externalRedirects) {
    // When / Then
    assert.equal(sanitizeAuthRedirect(redirect), "/dashboard");
    assert.equal(buildAuthGateHref(redirect), "/auth?redirect=%2Fdashboard");
  }
});

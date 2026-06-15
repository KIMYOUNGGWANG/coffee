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
  const tempDirectory = mkdtempSync(path.join(tmpdir(), "hyangmi-auth-redirect-"));
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

test("Given a dashboard redirect, When sanitizing auth redirect, Then dashboard query is preserved", async () => {
  // Given
  const { sanitizeAuthRedirect } = await loadAuthRedirectModule();

  // When
  const redirect = sanitizeAuthRedirect(
    "/dashboard?intent=first_card&source=public_card&token=public-token-001",
  );

  // Then
  assert.equal(
    redirect,
    "/dashboard?intent=first_card&source=public_card&token=public-token-001",
  );
});

test("Given unsafe redirect values, When sanitizing auth redirect, Then they fall back to dashboard", async () => {
  // Given
  const { sanitizeAuthRedirect } = await loadAuthRedirectModule();
  const unsafeValues = [
    null,
    "",
    "https://evil.example",
    "//evil.example",
    "/onboarding?source=public_card",
  ];

  // When
  const redirects = unsafeValues.map((value) => sanitizeAuthRedirect(value));

  // Then
  assert.deepEqual(redirects, [
    "/dashboard",
    "/dashboard",
    "/dashboard",
    "/dashboard",
    "/dashboard",
  ]);
});

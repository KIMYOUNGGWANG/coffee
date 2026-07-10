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

test("Given an opaque calendar return, When authentication interrupts the visit, Then the private return context survives the auth redirect", async () => {
  const { buildAuthGateHref, sanitizeAuthRedirect } = await loadAuthRedirectModule();
  const redirect = "/dashboard?source=rebuy_calendar&rebuy_token=f70cfec8-51f9-4667-a80f-ca38bfbc2b6d";

  assert.equal(sanitizeAuthRedirect(redirect), redirect);
  assert.equal(buildAuthGateHref(redirect), `/auth?redirect=${encodeURIComponent(redirect)}`);
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
    "/capture",
    "/capture?resume=0",
    "/capture?resume=1&next=https://evil.example",
    "/capture?resume=1#fragment",
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
    "/dashboard",
    "/dashboard",
    "/dashboard",
    "/dashboard",
  ]);
});

test("Given the guest draft resume redirect, When sanitizing auth redirect, Then the exact capture token is preserved", async () => {
  // Given
  const { sanitizeAuthRedirect } = await loadAuthRedirectModule();

  // When
  const redirect = sanitizeAuthRedirect("/capture?resume=1");

  // Then
  assert.equal(redirect, "/capture?resume=1");
});

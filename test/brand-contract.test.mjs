import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

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

async function loadBrandModule() {
  const brandPath = path.join(projectRoot, "lib/brand.ts");
  const tempDirectory = mkdtempSync(path.join(tmpdir(), "coffeedex-brand-"));
  const compiledPath = path.join(tempDirectory, "brand.mjs");

  try {
    writeFileSync(compiledPath, transpileTypescript(readFileSync(brandPath, "utf8"), brandPath));

    return {
      brandModule: await import(pathToFileURL(compiledPath)),
      tempDirectory,
    };
  } catch (error) {
    rmSync(tempDirectory, { force: true, recursive: true });
    throw error;
  }
}

test("CoffeeDex brand constants expose the recall and repurchase contract when loaded by Node", async () => {
  // Given
  const approvedBrand = {
    name: "CoffeeDex",
    koreanDisplay: "커피덱스",
    category: "Coffee Memory & Repurchase",
    tagline: "좋았던 원두를 잊지 않고, 다시 찾는 가장 빠른 방법",
    englishTagline: "Remember coffee worth buying again.",
    artifacts: {
      free: "Taste Card",
      paid: "Taste Passport",
    },
    analytics: "Taste Snapshot",
    dashboard: "Memory Shelf",
    filenameSlug: "coffeedex",
  };

  // When
  const { brandModule, tempDirectory } = await loadBrandModule();

  // Then
  try {
    assert.equal("default" in brandModule, false);
    assert.deepEqual(brandModule.coffeeDexBrand, approvedBrand);
    assert.equal(brandModule.hyangmiBrand, brandModule.coffeeDexBrand);
  } finally {
    rmSync(tempDirectory, { force: true, recursive: true });
  }
});

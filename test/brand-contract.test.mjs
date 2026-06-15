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
  const tempDirectory = mkdtempSync(path.join(tmpdir(), "hyangmi-brand-"));
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

test("Hyangmi brand constants expose approved tokens when loaded by Node", async () => {
  // Given
  const approvedBrand = {
    name: "Hyangmi",
    koreanDisplay: "향미",
    category: "Coffee Taste Archive",
    tagline: "마신 원두가 취향의 기록이 되는 곳",
    englishTagline: "Your coffee taste, beautifully remembered.",
    artifacts: {
      free: "Taste Card",
      paid: "Taste Passport",
    },
    analytics: "Taste Map",
    dashboard: "Archive",
    filenameSlug: "hyangmi",
  };

  // When
  const { brandModule, tempDirectory } = await loadBrandModule();

  // Then
  try {
    assert.equal("default" in brandModule, false);
    assert.deepEqual(brandModule.hyangmiBrand, approvedBrand);
  } finally {
    rmSync(tempDirectory, { force: true, recursive: true });
  }
});

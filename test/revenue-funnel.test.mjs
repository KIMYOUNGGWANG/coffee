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

async function loadRevenueFunnelModule() {
  const modulePath = path.join(projectRoot, "lib/revenue-funnel.ts");
  const tempDirectory = mkdtempSync(path.join(tmpdir(), "hyangmi-revenue-funnel-"));
  const compiledPath = path.join(tempDirectory, "revenue-funnel.mjs");

  try {
    writeFileSync(compiledPath, transpileTypescript(readFileSync(modulePath, "utf8"), modulePath));
    return {
      module: await import(pathToFileURL(compiledPath)),
      tempDirectory,
    };
  } catch (error) {
    rmSync(tempDirectory, { force: true, recursive: true });
    throw error;
  }
}

test("revenue funnel starts free users on the first Taste Card", async () => {
  // Given
  const { module, tempDirectory } = await loadRevenueFunnelModule();

  try {
    // When
    const state = module.getRevenueFunnelState({
      cardCount: 0,
      hasPublicCard: false,
      profile: {
        credits: 1,
        has_pdf_access: false,
        is_premium: false,
        monthly_scan_limit: 5,
        scans_used: 0,
      },
    });

    // Then
    assert.equal(state.stage, "capture");
    assert.equal(state.primaryAction, "create_card");
    assert.equal(state.primaryLabel, "첫 Taste Card 만들기");
    assert.equal(state.progressLabel, "0 / 4");
    assert.deepEqual(
      module.revenueOffers.map((offer) => offer.label),
      ["무료 Taste Card", "Hyangmi Premium", "테이스팅 10팩", "Taste Passport"],
    );
  } finally {
    rmSync(tempDirectory, { force: true, recursive: true });
  }
});

test("revenue funnel moves saved cards toward sharing and paid artifacts", async () => {
  // Given
  const { module, tempDirectory } = await loadRevenueFunnelModule();

  try {
    // When
    const shareState = module.getRevenueFunnelState({
      cardCount: 2,
      hasPublicCard: false,
      profile: {
        credits: 0,
        has_pdf_access: false,
        is_premium: false,
        monthly_scan_limit: 5,
        scans_used: 5,
      },
    });
    const passportState = module.getRevenueFunnelState({
      cardCount: 2,
      hasPublicCard: true,
      profile: {
        credits: 0,
        has_pdf_access: false,
        is_premium: false,
        monthly_scan_limit: 5,
        scans_used: 5,
      },
    });

    // Then
    assert.equal(shareState.stage, "share");
    assert.equal(shareState.primaryAction, "share_latest");
    assert.equal(passportState.stage, "passport");
    assert.equal(passportState.primaryAction, "open_payment");
    assert.match(passportState.monetizationHint, /Taste Passport/);
  } finally {
    rmSync(tempDirectory, { force: true, recursive: true });
  }
});

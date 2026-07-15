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

test("revenue funnel starts free users on the first quick private record", async () => {
  // Given
  const { module, tempDirectory } = await loadRevenueFunnelModule();

  try {
    // When
    const state = module.getRevenueFunnelState({
      cardCount: 0,
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
    assert.equal(state.primaryLabel, "첫 20초 기록 만들기");
    assert.equal(state.progressLabel, "0 / 3");
    assert.deepEqual(
      state.steps.map((step) => [step.id, step.status]),
      [
        ["capture", "active"],
        ["rebuy", "locked"],
        ["premium", "locked"],
      ],
    );
    assert.deepEqual(
      module.revenueOffers.map((offer) => offer.label),
      ["무료 20초 기록", "CoffeeDex Premium", "테이스팅 10팩", "Rebuy Memory"],
    );
    assert.ok(module.revenueOffers.every((offer) => !/Taste Passport/i.test(offer.label)));
  } finally {
    rmSync(tempDirectory, { force: true, recursive: true });
  }
});

test("revenue funnel advances card owners through paid Rebuy Memory before Premium", async () => {
  // Given
  const { module, tempDirectory } = await loadRevenueFunnelModule();

  try {
    // When
    const rebuyState = module.getRevenueFunnelState({
      cardCount: 2,
      profile: {
        credits: 0,
        has_pdf_access: false,
        is_premium: false,
        monthly_scan_limit: 5,
        scans_used: 5,
      },
    });
    const paidRebuyState = module.getRevenueFunnelState({
      cardCount: 2,
      profile: {
        credits: 0,
        has_pdf_access: true,
        is_premium: false,
        monthly_scan_limit: 5,
        scans_used: 5,
      },
    });

    // Then
    assert.equal(rebuyState.stage, "rebuy");
    assert.equal(rebuyState.primaryAction, "open_payment");
    assert.match(rebuyState.primaryLabel, /Rebuy Memory|다시 살 기억|재구매 기억/);
    assert.equal(rebuyState.progressLabel, "1 / 3");
    assert.deepEqual(
      rebuyState.steps.map((step) => [step.id, step.status]),
      [
        ["capture", "complete"],
        ["rebuy", "active"],
        ["premium", "locked"],
      ],
    );
    assert.ok(rebuyState.steps.every((step) => step.id !== "ownership"));
    assert.equal(paidRebuyState.stage, "premium");
    assert.equal(paidRebuyState.primaryAction, "open_payment");
    assert.equal(paidRebuyState.progressLabel, "2 / 3");
    assert.deepEqual(
      paidRebuyState.steps.map((step) => [step.id, step.status]),
      [
        ["capture", "complete"],
        ["rebuy", "complete"],
        ["premium", "active"],
      ],
    );
    assert.ok(paidRebuyState.steps.every((step) => step.id !== "ownership"));
  } finally {
    rmSync(tempDirectory, { force: true, recursive: true });
  }
});

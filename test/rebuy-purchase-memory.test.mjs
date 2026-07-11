import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
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

async function loadRebuyPurchaseMemoryModule() {
  const tempDirectory = mkdtempSync(path.join(tmpdir(), "coffeedex-rebuy-purchase-memory-"));
  const sourcePath = path.join(projectRoot, "lib/rebuy-purchase-memory.ts");

  assert.equal(existsSync(sourcePath), true);
  writeFileSync(
    path.join(tempDirectory, "rebuy-purchase-memory.mjs"),
    transpile(readFileSync(sourcePath, "utf8"), sourcePath),
  );

  try {
    return {
      module: await import(pathToFileURL(path.join(tempDirectory, "rebuy-purchase-memory.mjs"))),
      tempDirectory,
    };
  } catch (error) {
    rmSync(tempDirectory, { recursive: true, force: true });
    throw error;
  }
}

test("Given a purchase note with place price and bag size, When memory is built, Then it returns scan-ready labels", async () => {
  const loaded = await loadRebuyPurchaseMemoryModule();
  try {
    const { buildRebuyPurchaseMemory, readPurchaseBagWeight } = loaded.module;
    const memory = buildRebuyPurchaseMemory("프릳츠 공식몰 250g 23,000원 옵션");

    assert.equal(memory.placeLabel, "프릳츠 공식몰");
    assert.equal(memory.priceLabel, "23,000원");
    assert.equal(memory.bagSizeLabel, "250g");
    assert.deepEqual(memory.summaryLabels, ["구매처 프릳츠 공식몰", "가격 23,000원", "용량 250g"]);
    assert.equal(memory.hasStructuredMemory, true);
    assert.equal(readPurchaseBagWeight("프릳츠 공식몰 250g 23,000원 옵션"), 250);
  } finally {
    rmSync(loaded.tempDirectory, { recursive: true, force: true });
  }
});

test("Given Korean shorthand price and kg bag, When memory is built, Then it normalizes labels", async () => {
  const loaded = await loadRebuyPurchaseMemoryModule();
  try {
    const { buildRebuyPurchaseMemory, readPurchaseBagWeight } = loaded.module;
    const memory = buildRebuyPurchaseMemory("공동구매 1kg 6.5만원");

    assert.equal(memory.placeLabel, "공동구매");
    assert.equal(memory.priceLabel, "65,000원");
    assert.equal(memory.bagSizeLabel, "1kg");
    assert.equal(readPurchaseBagWeight("공동구매 1kg 6.5만원"), 1000);
  } finally {
    rmSync(loaded.tempDirectory, { recursive: true, force: true });
  }
});

test("Given a blank purchase note, When memory is built, Then it returns no structured memory", async () => {
  const loaded = await loadRebuyPurchaseMemoryModule();
  try {
    const { buildRebuyPurchaseMemory, readPurchaseBagWeight } = loaded.module;
    const memory = buildRebuyPurchaseMemory("   ");

    assert.equal(memory.hasStructuredMemory, false);
    assert.deepEqual(memory.summaryLabels, []);
    assert.equal(readPurchaseBagWeight("   "), null);
  } finally {
    rmSync(loaded.tempDirectory, { recursive: true, force: true });
  }
});

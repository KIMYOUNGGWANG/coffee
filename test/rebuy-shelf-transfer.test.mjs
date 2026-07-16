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

async function loadRebuyShelfTransferModule() {
  const tempDirectory = mkdtempSync(path.join(tmpdir(), "coffeedex-rebuy-shelf-transfer-"));
  const sourcePath = path.join(projectRoot, "lib/rebuy-shelf-transfer.ts");
  const purchaseMemorySourcePath = path.join(projectRoot, "lib/rebuy-purchase-memory.ts");

  assert.equal(existsSync(sourcePath), true);
  assert.equal(existsSync(purchaseMemorySourcePath), true);
  writeFileSync(
    path.join(tempDirectory, "rebuy-purchase-memory.mjs"),
    transpile(readFileSync(purchaseMemorySourcePath, "utf8"), purchaseMemorySourcePath),
  );
  writeFileSync(
    path.join(tempDirectory, "rebuy-shelf-transfer.mjs"),
    transpile(readFileSync(sourcePath, "utf8"), sourcePath)
      .replace('from "./rebuy-purchase-memory";', 'from "./rebuy-purchase-memory.mjs";'),
  );

  try {
    return {
      module: await import(pathToFileURL(path.join(tempDirectory, "rebuy-shelf-transfer.mjs"))),
      tempDirectory,
    };
  } catch (error) {
    rmSync(tempDirectory, { recursive: true, force: true });
    throw error;
  }
}

function card(overrides = {}) {
  return {
    id: "550e8400-e29b-41d4-a716-446655440000",
    title: "Colombia El Paraiso",
    subtitle: "Anthracite",
    package_origin: "Colombia",
    purchase_url: "https://example.com/colombia",
    purchase_note: "공식몰 250g 옵션",
    repurchase_intent: "again",
    footer_meta: { origin: "Colombia" },
    ...overrides,
  };
}

test("Given a rebuy card, When shelf transfer payload is built, Then it starts an active shelf memory for the new bag", async () => {
  const loaded = await loadRebuyShelfTransferModule();
  try {
    const { buildRebuyShelfTransferPayload } = loaded.module;
    const payload = buildRebuyShelfTransferPayload(card());

    assert.equal(payload.roasterName, "Anthracite");
    assert.equal(payload.beanName, "Colombia El Paraiso");
    assert.equal(payload.origin, "Colombia");
    assert.equal(payload.totalWeight, 250);
    assert.equal(payload.tastingCardId, "550e8400-e29b-41d4-a716-446655440000");
    assert.equal(payload.purchaseUrl, "https://example.com/colombia");
    assert.equal(payload.purchaseNote, "공식몰 250g 옵션");
    assert.equal(payload.rebuyAction, "none");
    assert.equal(payload.rebuySourceShelfItemId, null);
    assert.equal(payload.wantAgain, true);
    assert.equal(payload.rating, 5);
  } finally {
    rmSync(loaded.tempDirectory, { recursive: true, force: true });
  }
});

test("Given a non-uuid demo card, When shelf transfer payload is built, Then it avoids invalid card linking", async () => {
  const loaded = await loadRebuyShelfTransferModule();
  try {
    const { buildRebuyShelfTransferPayload } = loaded.module;
    const payload = buildRebuyShelfTransferPayload(card({
      id: "card-demo",
      package_origin: null,
      purchase_url: null,
      purchase_note: "드립백 말고 1kg 벌크",
      repurchase_intent: "maybe",
      footer_meta: { origin: "Ethiopia" },
    }));

    assert.equal(payload.tastingCardId, null);
    assert.equal(payload.origin, "Ethiopia");
    assert.equal(payload.totalWeight, 1000);
    assert.equal(payload.purchaseUrl, null);
    assert.equal(payload.rating, null);
  } finally {
    rmSync(loaded.tempDirectory, { recursive: true, force: true });
  }
});

test("Given an owned shelf memory after a confirmed rebuy, When a new bag payload is built, Then it starts the new bag without copying a completed rebuy state", async () => {
  const loaded = await loadRebuyShelfTransferModule();
  try {
    const { buildRebuyShelfReplenishPayload } = loaded.module;
    const payload = buildRebuyShelfReplenishPayload({
      id: "93493987-4800-4b7c-836f-c0a35f39244e",
      roasterName: "프릳츠 커피",
      beanName: "에티오피아 시다마",
      origin: "Ethiopia Sidama Washed",
      totalWeight: 200,
      tastingCardId: null,
      purchaseUrl: "https://fritz.example/sidama",
      purchaseNote: "프릳츠 공식몰 200g 18,000원",
    });

    assert.deepEqual(payload, {
      roasterName: "프릳츠 커피",
      beanName: "에티오피아 시다마",
      origin: "Ethiopia Sidama Washed",
      roastDate: null,
      openedDate: null,
      totalWeight: 200,
      fillLevel: 100,
      tastingCardId: null,
      purchaseUrl: "https://fritz.example/sidama",
      purchaseNote: "프릳츠 공식몰 200g 18,000원",
      rebuyPriority: "normal",
      rebuyAction: "none",
      rebuySourceShelfItemId: "93493987-4800-4b7c-836f-c0a35f39244e",
      rating: 5,
      wantAgain: true,
    });
  } finally {
    rmSync(loaded.tempDirectory, { recursive: true, force: true });
  }
});

test("Given a confirmed rebuy with this purchase's clue, When a new bag payload is built, Then the current clue replaces the older purchase memory", async () => {
  const loaded = await loadRebuyShelfTransferModule();
  try {
    const { buildRebuyShelfReplenishPayload } = loaded.module;
    const payload = buildRebuyShelfReplenishPayload({
      id: "93493987-4800-4b7c-836f-c0a35f39244e",
      roasterName: "프릳츠 커피",
      beanName: "에티오피아 시다마",
      origin: "Ethiopia Sidama Washed",
      totalWeight: 200,
      tastingCardId: null,
      purchaseUrl: "https://fritz.example/old-sidama",
      purchaseNote: "프릳츠 공식몰 200g 18,000원",
    }, {
      purchaseNote: "프릳츠 합정 쇼룸 200g 21,000원",
      purchaseUrl: "https://fritz.example/current-sidama",
      roastDate: "2026-07-14",
    });

    assert.equal(payload.purchaseNote, "프릳츠 합정 쇼룸 200g 21,000원");
    assert.equal(payload.purchaseUrl, "https://fritz.example/current-sidama");
    assert.equal(payload.roastDate, "2026-07-14");
    assert.equal(payload.rebuySourceShelfItemId, "93493987-4800-4b7c-836f-c0a35f39244e");
  } finally {
    rmSync(loaded.tempDirectory, { recursive: true, force: true });
  }
});

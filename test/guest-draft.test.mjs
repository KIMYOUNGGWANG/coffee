import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const modulePath = path.join(projectRoot, "lib", "guest-draft.ts");

async function loadGuestDraftModule() {
  const tempDirectory = mkdtempSync(path.join(tmpdir(), "coffeedex-guest-draft-"));
  const zodUrl = pathToFileURL(path.join(projectRoot, "node_modules/zod/index.js")).href;
  const source = readFileSync(modulePath, "utf8").replaceAll('"zod"', `"${zodUrl}"`);
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: modulePath,
  }).outputText;
  const outputPath = path.join(tempDirectory, "guest-draft.mjs");
  writeFileSync(outputPath, output);

  try {
    return await import(pathToFileURL(outputPath));
  } finally {
    rmSync(tempDirectory, { recursive: true, force: true });
  }
}

function createMemoryStorage(initialValue = null) {
  let value = initialValue;
  let removals = 0;

  return {
    getItem() {
      return value;
    },
    setItem(_key, nextValue) {
      value = nextValue;
    },
    removeItem() {
      value = null;
      removals += 1;
    },
    readValue() {
      return value;
    },
    removalCount() {
      return removals;
    },
  };
}

const draftInput = {
  extracted: {
    title: "Ethiopia Sidama",
    subtitle: "Coffee Libre",
    package_origin: "Ethiopia",
    package_process: "Washed",
    tags: ["floral", "citrus"],
    scan_source: "gemini",
    scan_confidence: 0.87,
  },
  corrections: {
    title: "Ethiopia Sidama Bombe",
    subtitle: "Coffee Libre",
    package_origin: "Ethiopia Sidama",
    package_process: "Washed",
    tags: ["floral", "citrus"],
    raw_note: "tea-like finish",
    acidity: 4,
    sweetness: 4,
    body: 2,
    repurchase_intent: "again",
    repurchase_reasons: ["clean finish"],
    corrected_fields: ["title", "package_origin"],
  },
};

test("Given a valid guest draft, When saving and loading it, Then the typed fields round trip", async () => {
  // Given
  const { createGuestDraft, loadGuestDraft, saveGuestDraft } = await loadGuestDraftModule();
  const storage = createMemoryStorage();
  const now = new Date("2026-06-18T10:00:00.000Z");
  const draft = createGuestDraft(draftInput, now);

  // When
  const saved = saveGuestDraft(storage, draft);
  const loaded = loadGuestDraft(storage, now);

  // Then
  assert.equal(saved, true);
  assert.deepEqual(loaded, draft);
  assert.equal(storage.readValue().includes("base64"), false);
});

test("Given an expired guest draft, When loading it, Then it is cleared and ignored", async () => {
  // Given
  const { createGuestDraft, loadGuestDraft, saveGuestDraft } = await loadGuestDraftModule();
  const storage = createMemoryStorage();
  const createdAt = new Date("2026-06-18T10:00:00.000Z");
  saveGuestDraft(storage, createGuestDraft(draftInput, createdAt));

  // When
  const loaded = loadGuestDraft(storage, new Date("2026-06-19T10:00:00.000Z"));

  // Then
  assert.equal(loaded, null);
  assert.equal(storage.readValue(), null);
  assert.equal(storage.removalCount(), 1);
});

test("Given corrupt or image-bearing storage, When loading it, Then it clears and fails safely", async () => {
  // Given
  const { GUEST_DRAFT_STORAGE_KEY, loadGuestDraft } = await loadGuestDraftModule();
  const corruptStorage = createMemoryStorage("{not-json");
  const imageStorage = createMemoryStorage(JSON.stringify({
    version: 1,
    created_at: "2026-06-18T10:00:00.000Z",
    ...draftInput,
    image: "data:image/png;base64,iVBORw0KGgo=",
  }));

  // When
  const corruptResult = loadGuestDraft(corruptStorage, new Date("2026-06-18T11:00:00.000Z"));
  const imageResult = loadGuestDraft(imageStorage, new Date("2026-06-18T11:00:00.000Z"));

  // Then
  assert.equal(GUEST_DRAFT_STORAGE_KEY, "coffeedex.guest-draft");
  assert.equal(corruptResult, null);
  assert.equal(imageResult, null);
  assert.equal(corruptStorage.readValue(), null);
  assert.equal(imageStorage.readValue(), null);
});

test("Given a stored draft, When clearing it, Then no resumable value remains", async () => {
  // Given
  const { clearGuestDraft } = await loadGuestDraftModule();
  const storage = createMemoryStorage("stored");

  // When
  const cleared = clearGuestDraft(storage);

  // Then
  assert.equal(cleared, true);
  assert.equal(storage.readValue(), null);
});

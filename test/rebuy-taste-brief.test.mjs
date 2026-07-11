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

async function loadRebuyTasteBriefModule() {
  const tempDirectory = mkdtempSync(path.join(tmpdir(), "coffeedex-rebuy-taste-brief-"));
  const sourcePath = path.join(projectRoot, "lib/rebuy-taste-brief.ts");

  assert.equal(existsSync(sourcePath), true);
  writeFileSync(
    path.join(tempDirectory, "rebuy-taste-brief.mjs"),
    transpile(readFileSync(sourcePath, "utf8"), sourcePath),
  );

  try {
    return {
      module: await import(pathToFileURL(path.join(tempDirectory, "rebuy-taste-brief.mjs"))),
      tempDirectory,
    };
  } catch (error) {
    rmSync(tempDirectory, { recursive: true, force: true });
    throw error;
  }
}

function card(overrides = {}) {
  return {
    id: "card-fritz",
    title: "Ethiopia Sidama",
    subtitle: "Fritz",
    tags: ["floral", "honey"],
    metric1: 4,
    metric2: 5,
    metric3: 3,
    package_origin: "Ethiopia",
    package_process: "Washed",
    repurchase_intent: "again",
    repurchase_reasons: ["꽃향과 꿀 같은 단맛이 좋아 다시 사고 싶었음"],
    ai_description: "Florals and honey sweetness.",
    footer_meta: { date: "2026-06-01", origin: "Ethiopia" },
    confirmed_at: "2026-06-01T00:00:00.000Z",
    created_at: "2026-06-01T00:00:00.000Z",
    updated_at: "2026-06-01T00:00:00.000Z",
    ...overrides,
  };
}

test("Given liked coffee memories, When taste brief is built, Then it explains the user's rebuy preference", async () => {
  const loaded = await loadRebuyTasteBriefModule();
  try {
    const { buildRebuyTasteBrief } = loaded.module;
    const brief = buildRebuyTasteBrief([
      card(),
      card({
        id: "card-anthracite",
        title: "Colombia El Paraiso",
        subtitle: "Anthracite",
        tags: ["floral", "peach"],
        package_origin: "Colombia",
        package_process: "Anaerobic",
        footer_meta: { date: "2026-06-12", origin: "Colombia" },
      }),
      card({
        id: "card-no",
        title: "Dark Blend",
        subtitle: "Cafe",
        tags: ["smoky"],
        repurchase_intent: "no",
        repurchase_reasons: [],
      }),
    ]);

    assert.ok(brief);
    assert.equal(brief.totalSourceCards, 2);
    assert.deepEqual(brief.flavorTags.slice(0, 3), ["floral", "honey", "peach"]);
    assert.match(brief.preferenceLine, /floral, honey, peach/);
    assert.match(brief.orderPhrase, /밝은 산미/);
    assert.match(brief.orderPhrase, /Anthracite · Colombia El Paraiso/);
    assert.doesNotMatch(brief.orderPhrase, /Dark Blend/);
  } finally {
    rmSync(loaded.tempDirectory, { recursive: true, force: true });
  }
});

test("Given no rebuy memories, When taste brief is built, Then no brief is shown", async () => {
  const loaded = await loadRebuyTasteBriefModule();
  try {
    const { buildRebuyTasteBrief } = loaded.module;
    const brief = buildRebuyTasteBrief([
      card({
        repurchase_intent: "undecided",
        repurchase_reasons: [],
      }),
    ]);

    assert.equal(brief, null);
  } finally {
    rmSync(loaded.tempDirectory, { recursive: true, force: true });
  }
});

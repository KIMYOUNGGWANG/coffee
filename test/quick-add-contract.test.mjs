import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadQuickAddModule() {
  const modulePath = path.join(projectRoot, "components/quick-add-memory-form.tsx");
  const source = readFileSync(modulePath, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: modulePath,
  });
  const module = { exports: {} };
  const requireStub = (specifier) => {
    switch (specifier) {
      case "lucide-react":
        return {
          AlertCircle: () => null,
          Coffee: () => null,
          Loader2: () => null,
        };
      case "@/hooks/use-analytics-events":
        return { useAnalyticsEvents: () => ({ trackEvent: () => undefined }) };
      case "@/hooks/useTastingCards":
        return { useCreateTastingCard: () => ({ isPending: false, mutateAsync: async () => ({}) }) };
      case "@/stores/tastingStore":
        return { useTastingStore: () => ({}) };
      case "./card-creator-errors":
        return { getErrorMessage: (_error, fallback) => fallback };
      case "react/jsx-runtime":
        return { Fragment: Symbol.for("react.fragment"), jsx: () => null, jsxs: () => null };
      default:
        throw new Error(`Unexpected quick-add test import: ${specifier}`);
    }
  };

  vm.runInNewContext(compiled.outputText, {
    exports: module.exports,
    module,
    require: requireStub,
  });
  return module.exports;
}

function loadBrewRecallModule() {
  const modulePath = path.join(projectRoot, "lib/brew-recall.ts");
  const source = readFileSync(modulePath, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: modulePath,
  });
  const module = { exports: {} };
  vm.runInNewContext(compiled.outputText, {
    exports: module.exports,
    module,
    require: (specifier) => {
      throw new Error(`Unexpected brew recall test import: ${specifier}`);
    },
  });
  return module.exports;
}

function sampleForm(overrides = {}) {
  return {
    title: "  Ethiopia Guji  ",
    subtitle: "  Fritz Coffee  ",
    imageUrl: null,
    metric1: 4,
    metric2: 5,
    metric3: 3,
    metric4: 2,
    metric5: 4,
    metric6: 5,
    tags: ["복숭아", "꿀"],
    rawNote: "  복숭아 단맛  ",
    origin: "Ethiopia",
    date: "2026-06-26",
    extraInfo: "Washed",
    ...overrides,
  };
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

test("Given quick add fields, When the user confirms again, Then the compact memory payload is executable contract data", () => {
  // Given
  const { buildQuickAddMemoryPayload } = loadQuickAddModule();

  // When
  const payload = buildQuickAddMemoryPayload({
    confirmed: true,
    form: sampleForm(),
    repurchaseIntent: "again",
  });

  // Then
  assert.equal(payload.title, "Ethiopia Guji");
  assert.equal(payload.subtitle, "Fritz Coffee");
  assert.equal(payload.confirmed, true);
  assert.equal(payload.repurchaseIntent, "again");
  assert.deepEqual(plain(payload.repurchaseReasons), ["복숭아 단맛"]);
  assert.deepEqual(plain(payload.tags), ["복숭아", "꿀"]);
  assert.equal(payload.scanSource, "manual");
  assert.deepEqual(plain(payload.correctedFields), []);
});

test("Given blank quick add note, When the user confirms again, Then no fallback recall fields are fabricated", () => {
  // Given
  const { buildQuickAddMemoryPayload } = loadQuickAddModule();

  // When
  const payload = buildQuickAddMemoryPayload({
    confirmed: true,
    form: sampleForm({ rawNote: "   " }),
    repurchaseIntent: "again",
  });

  // Then
  assert.equal(payload.aiDescription, "Ethiopia Guji 빠른 기록");
  assert.deepEqual(plain(payload.repurchaseReasons), []);
  assert.equal(Object.hasOwn(payload.footerMeta, "extraInfo"), false);
});

test("Given empty quick add title, When validation runs, Then it blocks submission with the Korean inline error", () => {
  // Given
  const { getQuickAddValidationError } = loadQuickAddModule();

  // When
  const message = getQuickAddValidationError({ title: "   " });

  // Then
  assert.equal(message, "원두 이름을 입력해야 빠른 기록을 저장할 수 있어요.");
  assert.equal(getQuickAddValidationError({ title: "Ethiopia Guji" }), null);
});

test("Given card footer metadata, When brew recall provenance is checked, Then only compound brew metadata is accepted", () => {
  // Given
  const { hasBrewRecallMetadata } = loadBrewRecallModule();

  // When / Then
  assert.equal(hasBrewRecallMetadata("V60 · 15g:250g · 92C"), true);
  assert.equal(hasBrewRecallMetadata("Kalita / 1:16 / 2:35"), true);

  assert.equal(hasBrewRecallMetadata("92°C"), false);
  assert.equal(hasBrewRecallMetadata("Brew Method"), false);
  assert.equal(hasBrewRecallMetadata("Memory"), false);
  assert.equal(hasBrewRecallMetadata("복숭아 단맛"), false);
  assert.equal(hasBrewRecallMetadata("빠른 기록"), false);
  assert.equal(hasBrewRecallMetadata(undefined), false);
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const helperPath = path.join(projectRoot, "lib/shelf-consumption.ts");
const helperSource = readFileSync(helperPath, "utf8");

const compiled = ts.transpileModule(helperSource, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
  fileName: helperPath,
}).outputText;

const moduleExports = {};
new Function("exports", compiled)(moduleExports);
const { calculateShelfConsumption } = moduleExports;

test("Given a shelf item with remaining beans, When a brew dose is logged, Then fill level decreases by consumed grams", () => {
  assert.deepEqual(
    calculateShelfConsumption({
      totalWeight: 200,
      fillLevel: 50,
      coffeeAmount: 15,
    }),
    {
      consumedGrams: 15,
      consumedPercent: 8,
      previousFillLevel: 50,
      nextFillLevel: 43,
      remainingGrams: 85,
      isFinished: false,
    },
  );
});

test("Given the brew dose is larger than the remaining shelf grams, When consumption is calculated, Then the shelf is finished", () => {
  assert.deepEqual(
    calculateShelfConsumption({
      totalWeight: 200,
      fillLevel: 5,
      coffeeAmount: 20,
    }),
    {
      consumedGrams: 20,
      consumedPercent: 10,
      previousFillLevel: 5,
      nextFillLevel: 0,
      remainingGrams: 0,
      isFinished: true,
    },
  );
});

test("Given missing weight data, When consumption is calculated, Then the shelf is left unchanged", () => {
  assert.equal(
    calculateShelfConsumption({
      totalWeight: 0,
      fillLevel: 50,
      coffeeAmount: 15,
    }),
    null,
  );
});

import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const scannedRoots = ["app", "components", "docs", "hooks", "lib", "test", "package.json"];
const forbiddenTerms = [
  "Coffee" + "Dex",
  "coffee" + "dex",
  "Coffee " + "Dex",
  "Coffee" + "Dex.app",
];
const ignoredDirectories = new Set([".next", "node_modules", "test-results", "playwright-report"]);
const ignoredFiles = new Set(["test/brand-leak.test.mjs"]);

function toProjectPath(absolutePath) {
  return path.relative(projectRoot, absolutePath).split(path.sep).join("/");
}

function collectFiles(entryPath, accumulator) {
  const projectPath = toProjectPath(entryPath);
  if (ignoredFiles.has(projectPath)) {
    return accumulator;
  }

  const stats = statSync(entryPath);
  if (stats.isDirectory()) {
    if (ignoredDirectories.has(path.basename(entryPath))) {
      return accumulator;
    }
    for (const child of readdirSync(entryPath)) {
      collectFiles(path.join(entryPath, child), accumulator);
    }
    return accumulator;
  }

  if (stats.isFile() && /\.(?:json|md|mjs|ts|tsx)$/.test(entryPath)) {
    accumulator.push(entryPath);
  }
  return accumulator;
}

function collectScannedFiles() {
  return scannedRoots.flatMap((root) => collectFiles(path.join(projectRoot, root), []));
}

test("user-facing source surfaces do not leak the retired brand", () => {
  const leaks = [];

  for (const filePath of collectScannedFiles()) {
    const text = readFileSync(filePath, "utf8");
    for (const term of forbiddenTerms) {
      if (text.includes(term)) {
        leaks.push(`${toProjectPath(filePath)} contains ${term}`);
      }
    }
  }

  assert.deepEqual(leaks, []);
});

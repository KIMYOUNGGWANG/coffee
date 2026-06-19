import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const scannedRoots = ["app", "components", "docs", "hooks", "lib", "package.json"];
const forbiddenTerms = ["Hy" + "angmi"];
const ignoredDirectories = new Set([".next", "node_modules", "test-results", "playwright-report"]);
const ignoredFiles = new Set([
  "app/api/AGENTS.md",
  "app/api/v1/analytics/route.ts",
  "app/api/v1/support/route.ts",
  "app/api/v1/webhooks/stripe/route.ts",
  "docs/office-hours.md",
  "docs/plans/designs/taste-passport-viral.md",
  "hooks/useTastingCards.ts",
  "lib/auth-redirect.ts",
  "lib/stripe-fulfillment.ts",
]);

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

test("active user-facing source surfaces do not leak the retired Hyangmi brand", () => {
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

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

function read(relativePath) {
  return readFileSync(path.join(projectRoot, relativePath), "utf8");
}

test("Given analytics delivery, When the API returns non-2xx, Then the hook logs a dropped event warning", () => {
  const hookSource = read("hooks/use-analytics-events.ts");

  assert.match(hookSource, /fetch\("\/api\/v1\/analytics"/);
  assert.match(hookSource, /\.then\(\(response\) =>/);
  assert.match(hookSource, /if \(!response\.ok\)/);
  assert.match(hookSource, /Hyangmi analytics event dropped/);
});

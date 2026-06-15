import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath) {
  return readFileSync(path.join(projectRoot, relativePath), "utf8");
}

test("public card sharing has a privacy-safe database and route contract", () => {
  const migrationPath = "supabase/migrations/20260614000005_add_public_card_sharing.sql";
  assert.equal(existsSync(path.join(projectRoot, migrationPath)), true, "expected public sharing migration");

  const migration = read(migrationPath);
  const publicRoute = read("app/api/v1/public/cards/[token]/route.ts");
  const shareRoute = read("app/api/v1/cards/[id]/share/route.ts");
  const publicPage = read("app/cards/[token]/page.tsx");

  assert.match(migration, /is_public BOOLEAN NOT NULL DEFAULT false/);
  assert.match(migration, /public_share_token UUID NOT NULL DEFAULT gen_random_uuid\(\)/);
  assert.match(migration, /Public users can view published tasting cards/);
  assert.match(publicRoute, /public_share_token/);
  assert.match(publicRoute, /is_public/);
  assert.doesNotMatch(publicRoute, /select\("\*"\)/);
  assert.doesNotMatch(publicRoute, /user_id/);
  assert.match(shareRoute, /\.eq\("user_id", user\.id\)/);
  assert.match(shareRoute, /is_public: true/);
  assert.match(publicPage, /PublicCardPage/);
});

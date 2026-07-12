import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("Given a private taste line, When its contract is inspected, Then storage and updates remain owner scoped", () => {
  // Given
  const route = readFileSync(path.join(projectRoot, "app/api/v1/profile/route.ts"), "utf8");
  const migration = readFileSync(path.join(projectRoot, "supabase/migrations/20260712000000_add_personal_taste_line.sql"), "utf8");
  const hardeningMigration = readFileSync(path.join(projectRoot, "supabase/migrations/20260712001000_harden_personal_taste_line.sql"), "utf8");

  // When / Then
  assert.match(route, /personalTasteLine: z\.string\(\)\.trim\(\)\.min\(1\)\.max\(160\)\.nullable\(\)/);
  assert.match(route, /"update_personal_taste_line"/);
  assert.match(migration, /personal_taste_line text/);
  assert.match(migration, /char_length\(btrim\(personal_taste_line\)\) between 1 and 160/);
  assert.match(migration, /where profile\.id = auth\.uid\(\)/);
  assert.match(migration, /revoke all on function public\.update_personal_taste_line\(text\) from public/);
  assert.match(migration, /grant execute on function public\.update_personal_taste_line\(text\) to authenticated/);
  assert.match(migration, /'taste_preference_saved', 'taste_preference_copied'/);
  assert.match(hardeningMigration, /drop policy if exists "Users can update their own profile"/);
  const blankCleanupIndex = hardeningMigration.indexOf("update public.profiles");
  const trimmedConstraintIndex = hardeningMigration.indexOf("add constraint profiles_personal_taste_line_length_check");
  assert.ok(blankCleanupIndex >= 0 && blankCleanupIndex < trimmedConstraintIndex);
  assert.match(hardeningMigration, /btrim\(personal_taste_line\) = ''/);
  assert.match(hardeningMigration, /where profile\.id = auth\.uid\(\)/);
  assert.match(hardeningMigration, /char_length\(btrim\(personal_taste_line\)\) between 1 and 160/);
  assert.match(hardeningMigration, /revoke all on function public\.update_personal_taste_line\(text\) from public/);
  assert.match(hardeningMigration, /grant execute on function public\.update_personal_taste_line\(text\) to authenticated/);
});

import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const modulePath = path.join(projectRoot, "lib", "account-deletion.ts");

async function loadAccountDeletionModule() {
  const tempDirectory = mkdtempSync(path.join(tmpdir(), "coffeedex-account-deletion-"));
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
  const outputPath = path.join(tempDirectory, "account-deletion.mjs");
  writeFileSync(outputPath, output);

  try {
    return await import(pathToFileURL(outputPath));
  } finally {
    rmSync(tempDirectory, { recursive: true, force: true });
  }
}

function createAdminFixture(failureOperation) {
  const operations = [];

  class QueryFixture {
    constructor(table) {
      this.table = table;
      this.action = "";
    }

    update() {
      this.action = "update";
      return this;
    }

    delete() {
      this.action = "delete";
      return this;
    }

    eq(column, value) {
      const operation = `${this.action}:${this.table}:${column}:${value}`;
      operations.push(operation);
      const error = operation === failureOperation ? { message: "fixture database failure" } : null;
      return Promise.resolve({ data: null, error });
    }
  }

  return {
    operations,
    client: {
      from(table) {
        return new QueryFixture(table);
      },
      auth: {
        admin: {
          async deleteUser(userId) {
            operations.push(`auth:delete:${userId}`);
            return { data: { user: null }, error: null };
          },
        },
      },
    },
  };
}

test("Given anything but the exact Korean phrase and explicit acknowledgement, When parsing confirmation, Then deletion is rejected", async () => {
  // Given
  const { accountDeletionRequestSchema, ACCOUNT_DELETION_CONFIRMATION } = await loadAccountDeletionModule();

  // When
  const wrongPhrase = accountDeletionRequestSchema.safeParse({
    confirmation: `${ACCOUNT_DELETION_CONFIRMATION} `,
    acknowledgePermanentDeletion: true,
  });
  const missingAcknowledgement = accountDeletionRequestSchema.safeParse({
    confirmation: ACCOUNT_DELETION_CONFIRMATION,
    acknowledgePermanentDeletion: false,
  });

  // Then
  assert.equal(wrongPhrase.success, false);
  assert.equal(missingAcknowledgement.success, false);
});

test("Given a confirmed account, When deletion succeeds, Then public access is revoked first and Auth is deleted last", async () => {
  // Given
  const { deleteCoffeeDexAccount } = await loadAccountDeletionModule();
  const fixture = createAdminFixture();

  // When
  const result = await deleteCoffeeDexAccount(fixture.client, "user-1");

  // Then
  assert.deepEqual(result, { kind: "deleted" });
  assert.equal(fixture.operations[0], "update:tasting_cards:user_id:user-1");
  assert.equal(fixture.operations.at(-1), "auth:delete:user-1");
  assert.ok(fixture.operations.indexOf("update:stripe_events:user_id:user-1") > 0);
  assert.ok(fixture.operations.indexOf("delete:profiles:id:user-1") > 0);
});

test("Given a database failure after privatization, When deletion is retried later, Then completion is not reported and Auth remains", async () => {
  // Given
  const { deleteCoffeeDexAccount } = await loadAccountDeletionModule();
  const failure = "delete:brewing_logs:user_id:user-1";
  const fixture = createAdminFixture(failure);

  // When
  const result = await deleteCoffeeDexAccount(fixture.client, "user-1");

  // Then
  assert.deepEqual(result, {
    kind: "failed",
    operation: "delete_brewing_logs",
    message: "fixture database failure",
  });
  assert.equal(fixture.operations.includes("auth:delete:user-1"), false);
  assert.equal(fixture.operations.includes("delete:profiles:id:user-1"), false);
});

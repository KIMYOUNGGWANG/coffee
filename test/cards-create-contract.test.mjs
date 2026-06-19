import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

function read(relativePath) {
  return readFileSync(path.join(projectRoot, relativePath), "utf8");
}

function extractCreateCardPayload(source) {
  const start = source.indexOf("await createCardMutation.mutateAsync({");
  assert.notEqual(start, -1, "CardCreatorWizard must call createCardMutation.mutateAsync");

  const end = source.indexOf("\n      });", start);
  assert.notEqual(end, -1, "CardCreatorWizard create payload must close predictably");

  return source.slice(start, end);
}

test("create-card client sends camelCase fields when image, AI, and footer metadata are present", () => {
  // Given
  const wizardSource = read("components/CardCreatorWizard.tsx");

  // When
  const payloadSource = extractCreateCardPayload(wizardSource);

  // Then
  assert.match(payloadSource, /imageUrl:\s*form\.imageUrl/);
  assert.match(payloadSource, /aiDescription:\s*form\.aiDescription/);
  assert.match(payloadSource, /footerMeta:\s*\{/);
  assert.doesNotMatch(payloadSource, /image_url|ai_description|footer_meta/);
});

test("create-card hook accepts the camelCase client contract", () => {
  // Given
  const hookSource = read("hooks/useTastingCards.ts");

  // When / Then
  assert.match(hookSource, /export type CreateTastingCardInput = \{/);
  assert.match(hookSource, /readonly imageUrl:\s*string \| null/);
  assert.match(hookSource, /readonly aiDescription:\s*string/);
  assert.match(hookSource, /readonly footerMeta:\s*TastingCardData\["footer_meta"\]/);
  assert.match(hookSource, /readonly packageOrigin\?:\s*string \| null/);
  assert.match(hookSource, /readonly repurchaseIntent\?:\s*RepurchaseIntent/);
  assert.match(hookSource, /readonly confirmed\?:\s*true/);
  assert.match(hookSource, /mutationFn:\s*async \(newCard: CreateTastingCardInput\)/);
});

test("create-card API validates camelCase request fields and maps them to database columns", () => {
  // Given
  const routeSource = read("app/api/v1/cards/route.ts");

  // When / Then
  assert.match(routeSource, /imageUrl:\s*z\.string\(\)\.url\(\)\.nullable\(\)\.optional\(\)/);
  assert.match(routeSource, /aiDescription:\s*z\.string\(\)\.default\(""\)/);
  assert.match(routeSource, /footerMeta:\s*z\.object\(\{/);
  assert.match(routeSource, /image_url:\s*validatedData\.imageUrl\s*\|\|\s*null/);
  assert.match(routeSource, /ai_description:\s*validatedData\.aiDescription/);
  assert.match(routeSource, /footer_meta:\s*validatedData\.footerMeta/);
  assert.match(routeSource, /package_origin:\s*validatedData\.packageOrigin/);
  assert.match(routeSource, /repurchase_intent:\s*validatedData\.repurchaseIntent/);
  assert.match(routeSource, /confirmed_at:\s*validatedData\.confirmed\s*\?\s*new Date\(\)\.toISOString\(\)\s*:\s*null/);
});

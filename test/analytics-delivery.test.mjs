import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { analyticsRequest, loadAnalyticsRoute } from "./support/analytics-route-fixture.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

function read(relativePath) {
  return readFileSync(path.join(projectRoot, relativePath), "utf8");
}

const isDirectTestFile = path.resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url);

if (isDirectTestFile) test("Given a valid memory event, When it is delivered, Then the service-role route persists bounded scalar data", async () => {
  const fixture = await loadAnalyticsRoute();
  fixture.store.resetAnalyticsState();
  fixture.session.setAnalyticsUser({ id: "user-analytics" });

  try {
    const response = await fixture.route.POST(analyticsRequest());
    const rows = fixture.store.getAnalyticsRows();

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { received: true });
    assert.equal(rows.length, 1);
    assert.deepEqual(rows[0], {
      event_id: "b7254c0c-2262-4ea4-95e6-91d6f9b84d29",
      event_name: "card_saved",
      occurred_at: "2026-06-18T12:00:00.000Z",
      path: "/dashboard",
      user_id: "user-analytics",
      anonymous_id: "guest-session-7",
      properties: { capture_method: "scan", corrected_field_count: 2, confirmed: true },
    });
  } finally {
    fixture.cleanup();
  }
});

if (isDirectTestFile) test("Given an already persisted event ID, When it is delivered again, Then persistence is idempotent", async () => {
  const fixture = await loadAnalyticsRoute();
  fixture.store.resetAnalyticsState();

  try {
    const firstResponse = await fixture.route.POST(analyticsRequest());
    const duplicateResponse = await fixture.route.POST(analyticsRequest());

    assert.equal(firstResponse.status, 200);
    assert.equal(duplicateResponse.status, 200);
    assert.deepEqual(await duplicateResponse.json(), { received: true, idempotent: true });
    assert.equal(fixture.store.getAnalyticsRows().length, 1);
  } finally {
    fixture.cleanup();
  }
});

if (isDirectTestFile) test("Given a legacy event without identifiers, When delivered, Then it persists with a server event ID", async () => {
  const fixture = await loadAnalyticsRoute();
  fixture.store.resetAnalyticsState();
  fixture.session.setAnalyticsUser(null);

  try {
    const response = await fixture.route.POST(analyticsRequest({
      eventId: undefined,
      eventName: "landing_view",
      userId: undefined,
      anonymousId: undefined,
    }));
    const rows = fixture.store.getAnalyticsRows();

    assert.equal(response.status, 200);
    assert.equal(rows.length, 1);
    assert.match(rows[0].event_id, /^[0-9a-f-]{36}$/);
    assert.equal(rows[0].user_id, null);
    assert.equal(rows[0].anonymous_id, null);
  } finally {
    fixture.cleanup();
  }
});

if (isDirectTestFile) test("Given analytics delivery, When the API returns non-2xx, Then the hook logs a dropped event warning", () => {
  const hookSource = read("hooks/use-analytics-events.ts");

  assert.match(hookSource, /return globalThis\.location\.pathname/);
  assert.doesNotMatch(hookSource, /location\.search/);
  assert.match(hookSource, /fetch\("\/api\/v1\/analytics"/);
  assert.match(hookSource, /\.then\(\(response\) =>/);
  assert.match(hookSource, /if \(!response\.ok\)/);
  assert.match(hookSource, /CoffeeDex analytics event dropped/);
});

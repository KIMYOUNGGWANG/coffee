import assert from "node:assert/strict";
import test from "node:test";
import { analyticsRequest, loadAnalyticsRoute } from "./support/analytics-route-fixture.mjs";

test("Given an authenticated dashboard user, When a calendar event is delivered, Then only the server session supplies the persisted owner", async () => {
  const fixture = await loadAnalyticsRoute();
  fixture.store.resetAnalyticsState();
  fixture.session.setAnalyticsUser({ id: "user-calendar-owner" });

  try {
    const response = await fixture.route.POST(analyticsRequest({
      eventName: "rebuy_calendar_returned",
      anonymousId: "browser-session-only",
      properties: { source: "rebuy_calendar" },
    }));

    assert.equal(response.status, 200);
    assert.deepEqual(fixture.store.getAnalyticsRows()[0], {
      event_id: "b7254c0c-2262-4ea4-95e6-91d6f9b84d29",
      event_name: "rebuy_calendar_returned",
      occurred_at: "2026-06-18T12:00:00.000Z",
      path: "/dashboard",
      user_id: "user-calendar-owner",
      anonymous_id: "browser-session-only",
      properties: { source: "rebuy_calendar" },
    });
  } finally {
    fixture.cleanup();
  }
});

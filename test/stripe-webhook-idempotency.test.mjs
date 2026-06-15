import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

function read(relativePath) {
  return readFileSync(path.join(projectRoot, relativePath), "utf8");
}

function transpileTypescript(source, fileName) {
  return ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.ES2022,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      target: ts.ScriptTarget.ES2022,
    },
    fileName,
  }).outputText;
}

function writeNextResponseMock(tempDirectory) {
  writeFileSync(
    path.join(tempDirectory, "next-server.mjs"),
    `export class NextResponse extends Response {
  static json(body, init = {}) {
    const headers = new Headers(init.headers);
    if (!headers.has("content-type")) headers.set("content-type", "application/json");
    return new NextResponse(JSON.stringify(body), { ...init, headers });
  }
}`,
  );
}

function writeEnvMock(tempDirectory) {
  writeFileSync(
    path.join(tempDirectory, "mock-env.mjs"),
    `export function readStarterEnv() {
  return {
    NEXT_PUBLIC_SUPABASE_URL: "https://fixture.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "service-role",
    STRIPE_SECRET_KEY: "sk_test_fixture",
    STRIPE_WEBHOOK_SECRET: "whsec_fixture",
  };
}`,
  );
}

function writeStripeMock(tempDirectory) {
  writeFileSync(
    path.join(tempDirectory, "mock-stripe.mjs"),
    `let nextEvent = null;

export function setStripeFixtureEvent(event) {
  nextEvent = event;
}

export default class Stripe {
  constructor() {
    this.webhooks = {
      constructEvent() {
        if (!nextEvent) throw new Error("missing fixture event");
        return nextEvent;
      },
    };
  }
}`,
  );
}

function writeSupabaseMock(tempDirectory) {
  writeFileSync(
    path.join(tempDirectory, "mock-supabase.mjs"),
    `const state = { profiles: new Map(), stripeEvents: [], entitlementAudit: [] };

export function resetSupabaseState(profile) {
  state.profiles = new Map([[profile.id, { ...profile }]]);
  state.stripeEvents = [];
  state.entitlementAudit = [];
}

export function getSupabaseState() {
  return {
    profiles: Array.from(state.profiles.values()).map((profile) => ({ ...profile })),
    stripeEvents: state.stripeEvents.map((event) => ({ ...event })),
    entitlementAudit: state.entitlementAudit.map((audit) => ({ ...audit })),
  };
}

function matches(row, filters) {
  return filters.every((filter) => filter.operator === "neq"
    ? row[filter.column] !== filter.value
    : row[filter.column] === filter.value);
}

class Query {
  constructor(tableName) {
    this.tableName = tableName;
    this.filters = [];
    this.pendingUpdate = null;
    this.limitCount = null;
  }

  select() { return this; }
  eq(column, value) {
    this.filters.push({ column, value, operator: "eq" });
    return this;
  }
  neq(column, value) {
    this.filters.push({ column, value, operator: "neq" });
    return this;
  }
  limit(count) { this.limitCount = count; return this; }

  insert(payload) {
    if (this.tableName === "stripe_events") return Promise.resolve(insertStripeEvent(payload));
    if (this.tableName === "entitlement_audit") {
      state.entitlementAudit.push({ ...payload });
      return Promise.resolve({ data: null, error: null });
    }
    return Promise.resolve({ data: null, error: null });
  }

  upsert(payload) {
    const current = state.profiles.get(payload.id) ?? { id: payload.id };
    state.profiles.set(payload.id, { ...current, ...payload });
    return Promise.resolve({ data: null, error: null });
  }

  update(payload) { this.pendingUpdate = payload; return this; }

  single() {
    const rows = this.rows();
    return Promise.resolve({ data: rows[0] ?? null, error: rows[0] ? null : { code: "PGRST116" } });
  }

  then(resolve, reject) { return this.execute().then(resolve, reject); }

  execute() {
    if (this.pendingUpdate) {
      for (const row of this.rows()) Object.assign(row, this.pendingUpdate);
      return Promise.resolve({ data: null, error: null });
    }
    return Promise.resolve({ data: this.rows(), error: null });
  }

  rows() {
    const source = this.tableName === "profiles"
      ? Array.from(state.profiles.values())
      : state.stripeEvents;
    const rows = source.filter((row) => matches(row, this.filters));
    return this.limitCount ? rows.slice(0, this.limitCount) : rows;
  }
}

function insertStripeEvent(payload) {
  if (state.stripeEvents.some((event) => event.event_id === payload.event_id)) {
    return { data: null, error: { code: "23505", message: "duplicate key value violates unique constraint" } };
  }
  state.stripeEvents.push({ ...payload });
  return { data: null, error: null };
}

export function createClient() {
  return {
    from(tableName) { return new Query(tableName); },
  };
}`,
  );
}

function writeStripeFulfillmentModule(tempDirectory) {
  const helperPath = path.join(projectRoot, "lib/stripe-fulfillment.ts");
  writeFileSync(
    path.join(tempDirectory, "stripe-fulfillment.mjs"),
    transpileTypescript(read("lib/stripe-fulfillment.ts"), helperPath),
  );
}

async function loadStripeRoute() {
  const tempDirectory = mkdtempSync(path.join(tmpdir(), "hyangmi-stripe-webhook-"));
  writeNextResponseMock(tempDirectory);
  writeEnvMock(tempDirectory);
  writeStripeMock(tempDirectory);
  writeSupabaseMock(tempDirectory);
  writeStripeFulfillmentModule(tempDirectory);

  const routePath = path.join(projectRoot, "app/api/v1/webhooks/stripe/route.ts");
  const routeSource = read("app/api/v1/webhooks/stripe/route.ts")
    .replaceAll('"next/server"', '"./next-server.mjs"')
    .replaceAll('"@/lib/env"', '"./mock-env.mjs"')
    .replaceAll('"@/lib/stripe-fulfillment"', '"./stripe-fulfillment.mjs"')
    .replaceAll('"@supabase/supabase-js"', '"./mock-supabase.mjs"')
    .replaceAll('"stripe"', '"./mock-stripe.mjs"');

  writeFileSync(path.join(tempDirectory, "route.mjs"), transpileTypescript(routeSource, routePath));

  return {
    routeModule: await import(pathToFileURL(path.join(tempDirectory, "route.mjs"))),
    stripeMock: await import(pathToFileURL(path.join(tempDirectory, "mock-stripe.mjs"))),
    supabaseMock: await import(pathToFileURL(path.join(tempDirectory, "mock-supabase.mjs"))),
  };
}

function checkoutCompletedFixture(itemType, eventId) {
  return {
    id: eventId,
    object: "event",
    api_version: "2026-05-27.dahlia",
    created: 1781467200,
    livemode: false,
    type: "checkout.session.completed",
    data: {
      object: {
        id: `cs_test_${itemType}`,
        object: "checkout.session",
        amount_total: itemType === "premium_subscription" ? 399 : itemType === "pdf_book" ? 999 : 499,
        currency: "usd",
        customer: "cus_fixture",
        metadata: { user_id: "user-1", item_type: itemType },
        mode: itemType === "premium_subscription" ? "subscription" : "payment",
        payment_intent: itemType === "premium_subscription" ? null : `pi_test_${itemType}`,
        subscription: itemType === "premium_subscription" ? "sub_fixture" : null,
      },
    },
  };
}

async function postFixture(routeModule, stripeMock, event) {
  stripeMock.setStripeFixtureEvent(event);
  return routeModule.POST(new Request("http://localhost/api/v1/webhooks/stripe", {
    method: "POST",
    headers: { "stripe-signature": "fixture-signature" },
    body: JSON.stringify(event),
  }));
}

test("Given a duplicate credits checkout event, When Stripe retries delivery, Then credits are granted once", async () => {
  const { routeModule, stripeMock, supabaseMock } = await loadStripeRoute();
  supabaseMock.resetSupabaseState({ id: "user-1", credits: 0, has_pdf_access: false, is_premium: false });
  const event = checkoutCompletedFixture("credits_10", "evt_credits_once");

  const firstResponse = await postFixture(routeModule, stripeMock, event);
  const secondResponse = await postFixture(routeModule, stripeMock, event);

  const state = supabaseMock.getSupabaseState();
  assert.equal(firstResponse.status, 200);
  assert.equal(secondResponse.status, 200);
  assert.equal(state.profiles[0].credits, 10);
  assert.equal(state.entitlementAudit.filter((audit) => audit.entitlement_kind === "credits").length, 1);
});

test("Given a duplicate PDF checkout event, When Stripe retries delivery, Then one PDF entitlement is recorded", async () => {
  const { routeModule, stripeMock, supabaseMock } = await loadStripeRoute();
  supabaseMock.resetSupabaseState({ id: "user-1", credits: 0, has_pdf_access: false, is_premium: false });
  const event = checkoutCompletedFixture("pdf_book", "evt_pdf_once");

  await postFixture(routeModule, stripeMock, event);
  const secondResponse = await postFixture(routeModule, stripeMock, event);

  const state = supabaseMock.getSupabaseState();
  assert.equal(secondResponse.status, 200);
  assert.equal(state.profiles[0].has_pdf_access, true);
  assert.equal(state.entitlementAudit.filter((audit) => audit.entitlement_kind === "pdf_access").length, 1);
});

test("Given a duplicate premium checkout event, When Stripe retries delivery, Then one subscription activation is recorded", async () => {
  const { routeModule, stripeMock, supabaseMock } = await loadStripeRoute();
  supabaseMock.resetSupabaseState({ id: "user-1", credits: 0, has_pdf_access: false, is_premium: false });
  const event = checkoutCompletedFixture("premium_subscription", "evt_premium_once");

  await postFixture(routeModule, stripeMock, event);
  const secondResponse = await postFixture(routeModule, stripeMock, event);

  const state = supabaseMock.getSupabaseState();
  assert.equal(secondResponse.status, 200);
  assert.equal(state.profiles[0].is_premium, true);
  assert.equal(state.entitlementAudit.filter((audit) => audit.entitlement_kind === "subscription").length, 1);
});

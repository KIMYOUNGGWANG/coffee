import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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

function writeBrandMock(tempDirectory) {
  writeFileSync(
    path.join(tempDirectory, "brand.mjs"),
    `export const hyangmiBrand = {
  filenameSlug: "hyangmi",
};`,
  );
}

function writeStateMock(tempDirectory) {
  writeFileSync(
    path.join(tempDirectory, "mock-state.mjs"),
    `export const state = {
  authUser: { id: "user-1", email: "minji@example.com" },
  profiles: new Map(),
  stripeEvents: [],
  entitlementAudit: [],
};

export function resetState(profile) {
  state.profiles = new Map([[profile.id, { ...profile }]]);
  state.stripeEvents = [];
  state.entitlementAudit = [];
}

export function snapshotState() {
  return {
    profiles: Array.from(state.profiles.values()).map((profile) => ({ ...profile })),
    stripeEvents: state.stripeEvents.map((event) => ({ ...event })),
    entitlementAudit: state.entitlementAudit.map((audit) => ({ ...audit })),
  };
}`,
  );
}

function writeSupabaseMocks(tempDirectory) {
  writeFileSync(
    path.join(tempDirectory, "mock-admin-supabase.mjs"),
    `import { state } from "./mock-state.mjs";

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
  eq(column, value) { this.filters.push({ column, value, operator: "eq" }); return this; }
  neq(column, value) { this.filters.push({ column, value, operator: "neq" }); return this; }
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
    return Promise.resolve({ data: rows[0] ?? null, error: rows[0] ? null : { code: "PGRST116", message: "No rows" } });
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
  return { from(tableName) { return new Query(tableName); } };
}`,
  );

  writeFileSync(
    path.join(tempDirectory, "mock-server-supabase.mjs"),
    `import { state } from "./mock-state.mjs";
import { createClient } from "./mock-admin-supabase.mjs";

export async function createServerSupabase() {
  return {
    auth: {
      getUser() {
        return Promise.resolve({ data: { user: state.authUser }, error: null });
      },
    },
    from: createClient().from,
  };
}`,
  );
}

function writeTranspiledProjectModule(tempDirectory, sourcePath, outputName) {
  const absolutePath = path.join(projectRoot, sourcePath);
  const source = sourcePath === "lib/contracts.ts"
    ? read(sourcePath).replaceAll('"@/lib/brand"', '"./brand.mjs"')
    : read(sourcePath);
  writeFileSync(
    path.join(tempDirectory, outputName),
    transpileTypescript(source, absolutePath),
  );
}

async function loadModules() {
  const tempDirectory = mkdtempSync(path.join(tmpdir(), "hyangmi-subscription-"));
  const zodModuleUrl = pathToFileURL(path.join(projectRoot, "node_modules/zod/index.js")).href;
  writeNextResponseMock(tempDirectory);
  writeEnvMock(tempDirectory);
  writeStripeMock(tempDirectory);
  writeBrandMock(tempDirectory);
  writeStateMock(tempDirectory);
  writeSupabaseMocks(tempDirectory);
  writeTranspiledProjectModule(tempDirectory, "lib/stripe-fulfillment.ts", "stripe-fulfillment.mjs");
  writeTranspiledProjectModule(tempDirectory, "lib/contracts.ts", "contracts.mjs");

  const webhookPath = path.join(projectRoot, "app/api/v1/webhooks/stripe/route.ts");
  const webhookSource = read("app/api/v1/webhooks/stripe/route.ts")
    .replaceAll('"next/server"', '"./next-server.mjs"')
    .replaceAll('"@/lib/env"', '"./mock-env.mjs"')
    .replaceAll('"@/lib/stripe-fulfillment"', '"./stripe-fulfillment.mjs"')
    .replaceAll('"@supabase/supabase-js"', '"./mock-admin-supabase.mjs"')
    .replaceAll('"stripe"', '"./mock-stripe.mjs"');
  writeFileSync(path.join(tempDirectory, "webhook-route.mjs"), transpileTypescript(webhookSource, webhookPath));

  const subscriptionPath = path.join(projectRoot, "app/api/v1/subscription/route.ts");
  const subscriptionSource = read("app/api/v1/subscription/route.ts")
    .replaceAll('"next/server"', '"./next-server.mjs"')
    .replaceAll('"@/lib/contracts"', '"./contracts.mjs"')
    .replaceAll('"@/lib/supabase/server"', '"./mock-server-supabase.mjs"')
    .replaceAll('"zod"', `"${zodModuleUrl}"`);
  writeFileSync(
    path.join(tempDirectory, "subscription-route.mjs"),
    transpileTypescript(subscriptionSource, subscriptionPath),
  );

  return {
    tempDirectory,
    webhookRoute: await import(pathToFileURL(path.join(tempDirectory, "webhook-route.mjs"))),
    subscriptionRoute: await import(pathToFileURL(path.join(tempDirectory, "subscription-route.mjs"))),
    stripeMock: await import(pathToFileURL(path.join(tempDirectory, "mock-stripe.mjs"))),
    stateMock: await import(pathToFileURL(path.join(tempDirectory, "mock-state.mjs"))),
  };
}

function cleanupModules(modules) {
  rmSync(modules.tempDirectory, { recursive: true, force: true });
}

async function postFixture(webhookRoute, stripeMock, event) {
  stripeMock.setStripeFixtureEvent(event);
  return webhookRoute.POST(new Request("http://localhost/api/v1/webhooks/stripe", {
    method: "POST",
    headers: { "stripe-signature": "fixture-signature" },
    body: JSON.stringify(event),
  }));
}

function baseProfile(overrides = {}) {
  return {
    id: "user-1",
    is_premium: false,
    stripe_customer_id: null,
    stripe_subscription_id: null,
    subscription_status: "inactive",
    subscription_current_period_end: null,
    subscription_cancel_at_period_end: false,
    subscription_last_invoice_id: null,
    subscription_last_invoice_status: null,
    subscription_updated_at: null,
    ...overrides,
  };
}

function subscriptionEvent(type, status, eventId) {
  return {
    id: eventId,
    object: "event",
    api_version: "2026-05-27.dahlia",
    created: 1781467200,
    livemode: false,
    type,
    data: {
      object: {
        id: "sub_fixture",
        object: "subscription",
        customer: "cus_fixture",
        metadata: { user_id: "user-1", item_type: "premium_subscription" },
        status,
        cancel_at_period_end: type === "customer.subscription.updated",
        latest_invoice: "in_latest",
        items: { data: [{ current_period_end: 1784059200 }] },
      },
    },
  };
}

function invoiceEvent(type, eventId) {
  return {
    id: eventId,
    object: "event",
    api_version: "2026-05-27.dahlia",
    created: 1781467200,
    livemode: false,
    type,
    data: {
      object: {
        id: type === "invoice.paid" ? "in_paid" : "in_failed",
        object: "invoice",
        customer: "cus_fixture",
        metadata: null,
        parent: {
          type: "subscription_details",
          subscription_details: {
            metadata: null,
            subscription: "sub_fixture",
          },
        },
        period_end: 1784059200,
        status: type === "invoice.paid" ? "paid" : "open",
      },
    },
  };
}

test("subscription update fixture activates premium and GET returns live state", async () => {
  const modules = await loadModules();
  const { webhookRoute, subscriptionRoute, stripeMock, stateMock } = modules;

  try {
    stateMock.resetState(baseProfile());

    const response = await postFixture(
      webhookRoute,
      stripeMock,
      subscriptionEvent("customer.subscription.updated", "active", "evt_sub_active"),
    );
    const subscriptionResponse = await subscriptionRoute.GET();
    const subscriptionJson = await subscriptionResponse.json();
    const state = stateMock.snapshotState();

    assert.equal(response.status, 200);
    assert.equal(state.profiles[0].is_premium, true);
    assert.equal(state.profiles[0].subscription_status, "active");
    assert.equal(state.profiles[0].stripe_subscription_id, "sub_fixture");
    assert.equal(subscriptionJson.data.plan, "premium");
    assert.equal(subscriptionJson.data.status, "active");
    assert.equal(subscriptionJson.data.isPremium, true);
  } finally {
    cleanupModules(modules);
  }
});

test("invoice payment failure fixture marks subscription past_due and degrades premium", async () => {
  const modules = await loadModules();
  const { webhookRoute, subscriptionRoute, stripeMock, stateMock } = modules;

  try {
    stateMock.resetState(baseProfile({
      is_premium: true,
      stripe_customer_id: "cus_fixture",
      stripe_subscription_id: "sub_fixture",
      subscription_status: "active",
    }));

    const response = await postFixture(webhookRoute, stripeMock, invoiceEvent("invoice.payment_failed", "evt_invoice_failed"));
    const subscriptionResponse = await subscriptionRoute.GET();
    const subscriptionJson = await subscriptionResponse.json();
    const state = stateMock.snapshotState();

    assert.equal(response.status, 200);
    assert.equal(state.profiles[0].is_premium, false);
    assert.equal(state.profiles[0].subscription_status, "past_due");
    assert.equal(state.profiles[0].subscription_last_invoice_status, "payment_failed");
    assert.equal(subscriptionJson.data.plan, "free");
    assert.equal(subscriptionJson.data.status, "past_due");
  } finally {
    cleanupModules(modules);
  }
});

test("invoice paid fixture restores active premium state", async () => {
  const modules = await loadModules();
  const { webhookRoute, stripeMock, stateMock } = modules;

  try {
    stateMock.resetState(baseProfile({
      is_premium: false,
      stripe_customer_id: "cus_fixture",
      stripe_subscription_id: "sub_fixture",
      subscription_status: "past_due",
    }));

    const response = await postFixture(webhookRoute, stripeMock, invoiceEvent("invoice.paid", "evt_invoice_paid"));
    const state = stateMock.snapshotState();

    assert.equal(response.status, 200);
    assert.equal(state.profiles[0].is_premium, true);
    assert.equal(state.profiles[0].subscription_status, "active");
    assert.equal(state.profiles[0].subscription_last_invoice_id, "in_paid");
    assert.equal(state.profiles[0].subscription_last_invoice_status, "paid");
  } finally {
    cleanupModules(modules);
  }
});

test("subscription deleted fixture cancels premium state", async () => {
  const modules = await loadModules();
  const { webhookRoute, subscriptionRoute, stripeMock, stateMock } = modules;

  try {
    stateMock.resetState(baseProfile({
      is_premium: true,
      stripe_customer_id: "cus_fixture",
      stripe_subscription_id: "sub_fixture",
      subscription_status: "active",
    }));

    const response = await postFixture(
      webhookRoute,
      stripeMock,
      subscriptionEvent("customer.subscription.deleted", "canceled", "evt_sub_deleted"),
    );
    const subscriptionResponse = await subscriptionRoute.GET();
    const subscriptionJson = await subscriptionResponse.json();
    const state = stateMock.snapshotState();

    assert.equal(response.status, 200);
    assert.equal(state.profiles[0].is_premium, false);
    assert.equal(state.profiles[0].subscription_status, "canceled");
    assert.equal(subscriptionJson.data.plan, "free");
    assert.equal(subscriptionJson.data.status, "canceled");
    assert.equal(state.entitlementAudit.filter((audit) => audit.entitlement_change === "revoke").length, 1);
  } finally {
    cleanupModules(modules);
  }
});

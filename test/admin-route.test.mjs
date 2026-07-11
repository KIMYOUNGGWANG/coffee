import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function transpile(source, fileName) {
  return ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      target: ts.ScriptTarget.ES2022,
    },
    fileName,
  }).outputText;
}

async function loadAdminRoutes() {
  const tempDirectory = mkdtempSync(path.join(tmpdir(), "coffeedex-admin-route-"));

  writeFileSync(path.join(tempDirectory, "next-server.mjs"), `
export class NextResponse extends Response {
  static json(body, init = {}) {
    const headers = new Headers(init.headers);
    headers.set("content-type", "application/json");
    return new NextResponse(JSON.stringify(body), { ...init, headers });
  }
}
`);
  writeFileSync(path.join(tempDirectory, "api-errors.mjs"), `
export function getErrorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}
`);
  writeFileSync(path.join(tempDirectory, "zod.mjs"), `
function parseObject(shape, value) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return { success: false };
  for (const key of Object.keys(shape)) {
    const expected = shape[key];
    if (expected.kind === "literal" && value[key] !== expected.value) return { success: false };
  }
  return { success: true, data: value };
}

export const z = {
  literal: (value) => ({ kind: "literal", value }),
  object: (shape) => ({
    strict() {
      return this;
    },
    safeParse(value) {
      return parseObject(shape, value);
    }
  })
};
`);
  writeFileSync(path.join(tempDirectory, "supabase-server.mjs"), `
const state = {
  authUser: null,
  profileIsAdmin: false,
  calls: []
};

export function configure(next) {
  state.authUser = next.authUser ?? null;
  state.profileIsAdmin = next.profileIsAdmin ?? false;
  state.calls = [];
}

export function readServerCalls() {
  return [...state.calls];
}

class SessionQuery {
  constructor(table) {
    this.table = table;
  }

  select(columns) {
    state.calls.push({ method: "select", table: this.table, columns });
    return this;
  }

  eq(column, value) {
    state.calls.push({ method: "eq", table: this.table, column, value });
    return this;
  }

  single() {
    state.calls.push({ method: "single", table: this.table });
    return Promise.resolve({
      data: { is_admin: state.profileIsAdmin },
      error: null
    });
  }
}

export async function createServerSupabase() {
  return {
    auth: {
      getUser: () => Promise.resolve(state.authUser
        ? { data: { user: state.authUser }, error: null }
        : { data: { user: null }, error: { message: "anonymous" } })
    },
    from: (table) => new SessionQuery(table)
  };
}
`);
  writeFileSync(path.join(tempDirectory, "supabase-admin.mjs"), `
export class AdminSupabaseConfigurationError extends Error {}

const state = {
  created: 0,
  rows: {
    profiles: [],
    tasting_cards: [],
    coffee_shelf_items: [],
    brewing_logs: [],
    product_events: [],
    stripe_events: []
  },
  deleteCalls: []
};

export function configureAdmin(next) {
  state.created = 0;
  state.rows = {
    profiles: next.rows?.profiles ?? [],
    tasting_cards: next.rows?.tasting_cards ?? [],
    coffee_shelf_items: next.rows?.coffee_shelf_items ?? [],
    brewing_logs: next.rows?.brewing_logs ?? [],
    product_events: next.rows?.product_events ?? [],
    stripe_events: next.rows?.stripe_events ?? []
  };
  state.deleteCalls = [];
}

export function readAdminState() {
  return {
    created: state.created,
    deleteCalls: [...state.deleteCalls]
  };
}

class AdminQuery {
  constructor(table) {
    this.table = table;
    this.isDelete = false;
    this.deleteColumn = "id";
    this.deleteIds = [];
  }

  select() {
    if (this.isDelete) {
      state.deleteCalls.push({ table: this.table, column: this.deleteColumn, ids: [...this.deleteIds] });
      return Promise.resolve({ data: this.deleteIds.map((id) => ({ id })), error: null });
    }
    return this;
  }

  order() {
    return this;
  }

  limit() {
    return Promise.resolve({ data: state.rows[this.table] ?? [], error: null });
  }

  delete() {
    this.isDelete = true;
    return this;
  }

  in(column, ids) {
    this.deleteColumn = column;
    this.deleteIds = [...ids];
    return this;
  }
}

export function createAdminSupabase() {
  state.created += 1;
  return {
    from: (table) => new AdminQuery(table)
  };
}
`);

  const adminSourcePath = path.join(projectRoot, "lib/admin.ts");
  const adminSource = readFileSync(adminSourcePath, "utf8")
    .replaceAll('"@/lib/supabase/admin"', '"./supabase-admin.mjs"')
    .replaceAll('"@/lib/supabase/server"', '"./supabase-server.mjs"');
  writeFileSync(path.join(tempDirectory, "admin.mjs"), transpile(adminSource, adminSourcePath));

  const launchHealthSourcePath = path.join(projectRoot, "lib/admin-launch-health.ts");
  writeFileSync(
    path.join(tempDirectory, "admin-launch-health.mjs"),
    transpile(readFileSync(launchHealthSourcePath, "utf8"), launchHealthSourcePath),
  );
  const calendarFunnelSourcePath = path.join(projectRoot, "lib/rebuy-calendar-funnel.ts");
  writeFileSync(
    path.join(tempDirectory, "rebuy-calendar-funnel.mjs"),
    transpile(readFileSync(calendarFunnelSourcePath, "utf8"), calendarFunnelSourcePath),
  );

  for (const [fileName, routePath] of [
    ["overview.mjs", "app/api/v1/admin/overview/route.ts"],
    ["cleanup.mjs", "app/api/v1/admin/qa-cleanup/route.ts"],
  ]) {
    const absolutePath = path.join(projectRoot, routePath);
    const source = readFileSync(absolutePath, "utf8")
      .replaceAll('"next/server"', '"./next-server.mjs"')
      .replaceAll('"@/lib/api-errors"', '"./api-errors.mjs"')
      .replaceAll('"@/lib/admin-launch-health"', '"./admin-launch-health.mjs"')
      .replaceAll('"@/lib/rebuy-calendar-funnel"', '"./rebuy-calendar-funnel.mjs"')
      .replaceAll('"@/lib/admin"', '"./admin.mjs"')
      .replaceAll('"@/lib/supabase/admin"', '"./supabase-admin.mjs"')
      .replaceAll('"zod"', '"./zod.mjs"');
    writeFileSync(path.join(tempDirectory, fileName), transpile(source, absolutePath));
  }

  return {
    overview: await import(pathToFileURL(path.join(tempDirectory, "overview.mjs"))),
    cleanup: await import(pathToFileURL(path.join(tempDirectory, "cleanup.mjs"))),
    session: await import(pathToFileURL(path.join(tempDirectory, "supabase-server.mjs"))),
    admin: await import(pathToFileURL(path.join(tempDirectory, "supabase-admin.mjs"))),
    tempDirectory,
  };
}

function isoMinutesAgo(minutes) {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString();
}

const adminRows = {
  profiles: [
    {
      id: "user-1",
      email: "member@example.com",
      created_at: isoMinutesAgo(600),
      updated_at: isoMinutesAgo(590),
      is_premium: true,
      scans_used: 2,
      monthly_scan_limit: 5,
      is_admin: false,
    },
  ],
  tasting_cards: [
    {
      id: "card-qa",
      user_id: "user-1",
      title: "QA Ethiopia",
      subtitle: "Fritz",
      created_at: isoMinutesAgo(580),
      confirmed_at: isoMinutesAgo(570),
      purchase_url: "https://example.com",
      purchase_note: null,
      repurchase_intent: "again",
      scan_source: "manual",
    },
    {
      id: "card-real",
      user_id: "user-1",
      title: "Ethiopia Guji",
      subtitle: "Momos",
      created_at: isoMinutesAgo(560),
      confirmed_at: null,
      purchase_url: null,
      purchase_note: null,
      repurchase_intent: "undecided",
      scan_source: null,
    },
  ],
  coffee_shelf_items: [
    {
      id: "shelf-qa",
      user_id: "user-1",
      roaster_name: "Test Roaster",
      bean_name: "Colombia",
      created_at: isoMinutesAgo(540),
      fill_level: 30,
      is_finished: false,
      purchase_url: null,
      purchase_note: "official 200g",
      rebuy_action: "will_rebuy",
      rebuy_priority: "pinned",
      rebuy_reminder_date: "2026-07-04",
      rebuy_action_at: isoMinutesAgo(380),
    },
  ],
  brewing_logs: [
    {
      id: "brew-1",
      user_id: "user-1",
      shelf_item_id: "shelf-qa",
      brewed_at: isoMinutesAgo(520),
      method: "V60",
      rating: 3,
      coach_source: "dial_in_coach",
      coach_feedback: "too_sour",
    },
  ],
  product_events: [
    {
      event_id: "event-1",
      event_name: "dashboard_view",
      occurred_at: isoMinutesAgo(500),
      path: "/dashboard",
      user_id: "user-1",
      anonymous_id: null,
      properties: {},
    },
    {
      event_id: "event-2",
      event_name: "scan_failed",
      occurred_at: isoMinutesAgo(480),
      path: "/dashboard",
      user_id: "user-1",
      anonymous_id: null,
      properties: {},
    },
    {
      event_id: "event-3",
      event_name: "card_save_failed",
      occurred_at: isoMinutesAgo(460),
      path: "/dashboard",
      user_id: "user-1",
      anonymous_id: null,
      properties: {},
    },
    {
      event_id: "event-4",
      event_name: "shelf_save_failed",
      occurred_at: isoMinutesAgo(440),
      path: "/dashboard",
      user_id: "user-1",
      anonymous_id: "qa-session",
      properties: { qa: true },
    },
    {
      event_id: "event-5",
      event_name: "rebuy_calendar_export_clicked",
      occurred_at: isoMinutesAgo(420),
      path: "/dashboard",
      user_id: "user-1",
      anonymous_id: null,
      properties: { source: "shelf_reminder" },
    },
    {
      event_id: "event-6",
      event_name: "rebuy_calendar_returned",
      occurred_at: isoMinutesAgo(400),
      path: "/dashboard",
      user_id: "user-1",
      anonymous_id: null,
      properties: { source: "rebuy_calendar" },
    },
  ],
  stripe_events: [
    {
      event_id: "stripe-event-1",
      event_type: "checkout.session.completed",
      processing_status: "failed",
      created_at: isoMinutesAgo(420),
      updated_at: isoMinutesAgo(415),
      error_message: "fixture failure",
    },
  ],
};

test("Given no signed-in admin, When overview is requested, Then the service-role client is not opened", async () => {
  const loaded = await loadAdminRoutes();
  const previousAllowlist = process.env.ADMIN_EMAIL_ALLOWLIST;
  try {
    process.env.ADMIN_EMAIL_ALLOWLIST = "";
    loaded.session.configure({ authUser: null });
    loaded.admin.configureAdmin({ rows: adminRows });

    const response = await loaded.overview.GET();

    assert.equal(response.status, 401);
    assert.equal(loaded.admin.readAdminState().created, 0);
  } finally {
    process.env.ADMIN_EMAIL_ALLOWLIST = previousAllowlist;
    rmSync(loaded.tempDirectory, { recursive: true, force: true });
  }
});

test("Given an allowlisted admin, When overview is requested, Then operating KPIs are returned without profile role lookup", async () => {
  const loaded = await loadAdminRoutes();
  const previousAllowlist = process.env.ADMIN_EMAIL_ALLOWLIST;
  try {
    process.env.ADMIN_EMAIL_ALLOWLIST = "founder@example.com";
    loaded.session.configure({ authUser: { id: "admin-1", email: "Founder@example.com" } });
    loaded.admin.configureAdmin({ rows: adminRows });

    const response = await loaded.overview.GET();
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.data.kpis.find((kpi) => kpi.label === "전체 유저").value, 1);
    assert.equal(body.data.memory.purchaseMemories, 2);
    assert.equal(body.data.rebuyDialIn.coachFeedbackLogs, 1);
    assert.deepEqual({
      exportedUsers: body.data.rebuyCalendarFunnel.exportedUsers,
      returnedUsers: body.data.rebuyCalendarFunnel.returnedUsers,
      purchaseClueUsers: body.data.rebuyCalendarFunnel.purchaseClueUsers,
      decidedUsers: body.data.rebuyCalendarFunnel.decidedUsers,
      unattributedEvents: body.data.rebuyCalendarFunnel.unattributedEvents,
    }, {
      exportedUsers: 1,
      returnedUsers: 1,
      purchaseClueUsers: 0,
      decidedUsers: 1,
      unattributedEvents: 0,
    });
    assert.equal(body.data.rebuyCalendarFunnel.windowDays, 14);
    assert.match(body.data.rebuyCalendarFunnel.windowStart, /^\d{4}-\d{2}-\d{2}T/);
    assert.equal(body.data.operations.recentFailures[0].eventName, "scan_failed");
    assert.equal(body.data.launchHealth.status, "p0");
    assert.equal(body.data.launchHealth.summary.qaExcludedEvents, 1);
    assert.equal(body.data.launchHealth.metrics.find((metric) => metric.key === "webhook").failures7d, 1);
    assert.equal(body.data.launchHealth.metrics.find((metric) => metric.key === "shelf_save").failures7d, 0);
    assert.deepEqual(loaded.session.readServerCalls(), []);
    assert.equal(loaded.admin.readAdminState().created, 1);
  } finally {
    process.env.ADMIN_EMAIL_ALLOWLIST = previousAllowlist;
    rmSync(loaded.tempDirectory, { recursive: true, force: true });
  }
});

test("Given QA cleanup, When confirm is missing or present, Then only marked rows are deleted", async () => {
  const loaded = await loadAdminRoutes();
  const previousAllowlist = process.env.ADMIN_EMAIL_ALLOWLIST;
  try {
    process.env.ADMIN_EMAIL_ALLOWLIST = "founder@example.com";
    loaded.session.configure({ authUser: { id: "admin-1", email: "founder@example.com" } });
    loaded.admin.configureAdmin({ rows: adminRows });

    const rejected = await loaded.cleanup.POST(new Request("http://localhost/api/v1/admin/qa-cleanup", {
      method: "POST",
      body: JSON.stringify({ confirm: false }),
    }));

    assert.equal(rejected.status, 400);
    assert.deepEqual(loaded.admin.readAdminState().deleteCalls, []);

    const accepted = await loaded.cleanup.POST(new Request("http://localhost/api/v1/admin/qa-cleanup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ confirm: true }),
    }));

    assert.equal(accepted.status, 200);
    assert.deepEqual(loaded.admin.readAdminState().deleteCalls, [
      { table: "brewing_logs", column: "shelf_item_id", ids: ["shelf-qa"] },
      { table: "brewing_notes", column: "card_id", ids: ["card-qa"] },
      { table: "coffee_shelf_items", column: "id", ids: ["shelf-qa"] },
      { table: "tasting_cards", column: "id", ids: ["card-qa"] },
    ]);
  } finally {
    process.env.ADMIN_EMAIL_ALLOWLIST = previousAllowlist;
    rmSync(loaded.tempDirectory, { recursive: true, force: true });
  }
});

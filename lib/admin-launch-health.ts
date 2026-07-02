export type AdminProductEventRow = {
  readonly event_id: string;
  readonly event_name: string;
  readonly occurred_at: string;
  readonly path: string;
  readonly user_id: string | null;
  readonly anonymous_id: string | null;
  readonly properties: Record<string, unknown> | null;
};

export type AdminStripeEventRow = {
  readonly event_id: string;
  readonly event_type: string;
  readonly processing_status: string;
  readonly created_at: string;
  readonly updated_at: string | null;
  readonly error_message: string | null;
};

export type LaunchHealthStatus = "ok" | "p1" | "p0";

export type LaunchHealthMetric = {
  readonly key: string;
  readonly label: string;
  readonly status: LaunchHealthStatus;
  readonly failures24h: number;
  readonly failures7d: number;
  readonly lastFailureAt: string | null;
  readonly helper: string;
};

export type LaunchHealthIncident = {
  readonly id: string;
  readonly category: string;
  readonly source: "product_event" | "stripe_event";
  readonly occurredAt: string;
  readonly path: string | null;
  readonly label: string;
};

export type LaunchHealth = {
  readonly status: LaunchHealthStatus;
  readonly label: string;
  readonly generatedAt: string;
  readonly windows: {
    readonly last24hStart: string;
    readonly last7dStart: string;
  };
  readonly summary: {
    readonly failures24h: number;
    readonly failures7d: number;
    readonly p0Count: number;
    readonly p1Count: number;
    readonly qaExcludedEvents: number;
  };
  readonly metrics: readonly LaunchHealthMetric[];
  readonly incidents: readonly LaunchHealthIncident[];
};

const DAY_MS = 24 * 60 * 60 * 1000;

const categoryConfigs = [
  {
    key: "google_oauth",
    label: "Google OAuth",
    eventNames: ["oauth_failed"],
    helper: "로그인 callback 실패 또는 auth-code-error 도착",
  },
  {
    key: "card_save",
    label: "카드 저장",
    eventNames: ["card_save_failed"],
    helper: "첫 원두/카드 생성 실패",
  },
  {
    key: "shelf_save",
    label: "선반 저장",
    eventNames: ["shelf_save_failed"],
    helper: "원두 선반 생성 실패",
  },
  {
    key: "brewing_log_save",
    label: "추출 로그",
    eventNames: ["brewing_log_save_failed"],
    helper: "Dial-in/기록 탭 추출 로그 저장 실패",
  },
  {
    key: "scan",
    label: "스캔",
    eventNames: ["scan_failed"],
    helper: "패키지/원두 스캔 실패",
  },
  {
    key: "checkout",
    label: "Checkout",
    eventNames: ["checkout_failed"],
    helper: "Checkout 세션 생성 또는 네트워크 실패",
  },
  {
    key: "webhook",
    label: "Stripe Webhook",
    eventNames: ["checkout_webhook_failed"],
    helper: "stripe_events failed 또는 webhook 실패 이벤트",
  },
] as const;

function timeOf(value: string | null | undefined): number {
  if (!value) return Number.NaN;
  return new Date(value).getTime();
}

function isAfter(value: string | null | undefined, threshold: Date): boolean {
  const time = timeOf(value);
  return Number.isFinite(time) && time >= threshold.getTime();
}

export function includesQaMarker(...values: readonly (string | null | undefined)[]): boolean {
  return values.some((value) => /(^|[^a-z0-9])(qa|test)([^a-z0-9]|$)|테스트|테스트용|mock/i.test(value ?? ""));
}

function propertyValueHasQaMarker(value: unknown): boolean {
  if (typeof value === "string") return includesQaMarker(value);
  if (typeof value === "boolean") return value === true;
  return false;
}

export function isQaProductEvent(event: AdminProductEventRow): boolean {
  const properties = event.properties ?? {};
  const qaKeys = ["qa", "is_qa", "test", "is_test", "mock", "mock_test_mode", "surface", "source", "mode"];
  return includesQaMarker(event.path, event.anonymous_id)
    || qaKeys.some((key) => propertyValueHasQaMarker(properties[key]));
}

function latestDate(values: readonly string[]): string | null {
  const latest = values
    .map((value) => timeOf(value))
    .filter((time) => Number.isFinite(time))
    .sort((first, second) => second - first)[0];

  return latest === undefined ? null : new Date(latest).toISOString();
}

function metricStatus(key: string, failures24h: number, failures7d: number): LaunchHealthStatus {
  if (key === "webhook" && failures24h > 0) return "p0";
  if (failures24h >= 5) return "p0";
  if (failures24h > 0 || failures7d > 0) return "p1";
  return "ok";
}

function labelForStatus(status: LaunchHealthStatus): string {
  switch (status) {
    case "p0":
      return "P0 확인 필요";
    case "p1":
      return "P1 주시";
    case "ok":
      return "정상";
  }
}

function eventMatches(eventName: string, names: readonly string[]): boolean {
  return names.some((name) => name === eventName);
}

export function filterRealProductEvents(events: readonly AdminProductEventRow[]): readonly AdminProductEventRow[] {
  return events.filter((event) => !isQaProductEvent(event));
}

export function buildLaunchHealth(input: {
  readonly events: readonly AdminProductEventRow[];
  readonly stripeEvents: readonly AdminStripeEventRow[];
  readonly now: Date;
}): LaunchHealth {
  const last24hStart = new Date(input.now.getTime() - DAY_MS);
  const last7dStart = new Date(input.now.getTime() - 7 * DAY_MS);
  const realEvents = filterRealProductEvents(input.events);
  const failedStripeEvents = input.stripeEvents.filter((event) => event.processing_status === "failed");

  const metrics = categoryConfigs.map((config): LaunchHealthMetric => {
    const productFailures = realEvents.filter((event) => eventMatches(event.event_name, config.eventNames));
    const stripeFailures = config.key === "webhook" ? failedStripeEvents : [];
    const productTimes = productFailures.map((event) => event.occurred_at);
    const stripeTimes = stripeFailures.map((event) => event.updated_at ?? event.created_at);
    const allTimes = [...productTimes, ...stripeTimes];
    const failures24h = allTimes.filter((value) => isAfter(value, last24hStart)).length;
    const failures7d = allTimes.filter((value) => isAfter(value, last7dStart)).length;
    const status = metricStatus(config.key, failures24h, failures7d);

    return {
      key: config.key,
      label: config.label,
      status,
      failures24h,
      failures7d,
      lastFailureAt: latestDate(allTimes),
      helper: config.helper,
    };
  });

  const p0Count = metrics.filter((metric) => metric.status === "p0").length;
  const p1Count = metrics.filter((metric) => metric.status === "p1").length;
  const status: LaunchHealthStatus = p0Count > 0 ? "p0" : p1Count > 0 ? "p1" : "ok";
  const incidents = [
    ...realEvents
      .filter((event) => categoryConfigs.some((config) => eventMatches(event.event_name, config.eventNames)))
      .map((event): LaunchHealthIncident => ({
        id: event.event_id,
        category: categoryConfigs.find((config) => eventMatches(event.event_name, config.eventNames))?.label ?? event.event_name,
        source: "product_event",
        occurredAt: event.occurred_at,
        path: event.path,
        label: event.event_name,
      })),
    ...failedStripeEvents.map((event): LaunchHealthIncident => ({
      id: event.event_id,
      category: "Stripe Webhook",
      source: "stripe_event",
      occurredAt: event.updated_at ?? event.created_at,
      path: null,
      label: event.event_type,
    })),
  ]
    .sort((first, second) => timeOf(second.occurredAt) - timeOf(first.occurredAt))
    .slice(0, 20);

  return {
    status,
    label: labelForStatus(status),
    generatedAt: input.now.toISOString(),
    windows: {
      last24hStart: last24hStart.toISOString(),
      last7dStart: last7dStart.toISOString(),
    },
    summary: {
      failures24h: metrics.reduce((sum, metric) => sum + metric.failures24h, 0),
      failures7d: metrics.reduce((sum, metric) => sum + metric.failures7d, 0),
      p0Count,
      p1Count,
      qaExcludedEvents: input.events.length - realEvents.length,
    },
    metrics,
    incidents,
  };
}

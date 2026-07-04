import type { AnalyticsEventName } from "@/lib/analytics-events";

type AnalyticsProperties = Record<string, string | number | boolean | null>;

function currentPath(): string {
  if (typeof globalThis.location === "undefined") return "/";
  return globalThis.location.pathname;
}

function shouldDeliverAnalytics(): boolean {
  if (process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === "false") return false;
  if (typeof globalThis.location === "undefined") return true;

  const hostname = globalThis.location.hostname;
  const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  return (
    !isLocalhost ||
    process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === "true" ||
    isAnalyticsTestModeEnabled() ||
    isAutomatedBrowser()
  );
}

function isAnalyticsTestModeEnabled(): boolean {
  if (typeof globalThis.localStorage === "undefined") return false;

  try {
    return globalThis.localStorage.getItem("coffeedex_analytics_test") === "true";
  } catch (error: unknown) {
    if (error instanceof Error) return false;
    throw error;
  }
}

function isAutomatedBrowser(): boolean {
  return typeof globalThis.navigator !== "undefined" && globalThis.navigator.webdriver === true;
}

export function trackAnalyticsEvent(eventName: AnalyticsEventName, properties: AnalyticsProperties = {}) {
  if (!shouldDeliverAnalytics()) return;

  const payload = {
    eventName,
    occurredAt: new Date().toISOString(),
    path: currentPath(),
    properties,
  };

  void fetch("/api/v1/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  })
    .then((response) => {
      if (!response.ok) {
        console.warn("CoffeeDex analytics event dropped:", `${response.status} ${response.statusText}`.trim());
      }
    })
    .catch((error: unknown) => {
      if (error instanceof Error) {
        console.warn("CoffeeDex analytics event dropped:", error.message);
        return;
      }
      throw error;
    });
}

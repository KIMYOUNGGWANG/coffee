"use client";

import { useCallback } from "react";
import type { AnalyticsEventName } from "@/lib/analytics-events";

type AnalyticsProperties = Record<string, string | number | boolean | null>;

type AnalyticsTracker = {
  readonly trackEvent: (eventName: AnalyticsEventName, properties?: AnalyticsProperties) => void;
};

function currentPath(): string {
  return globalThis.location.pathname;
}

export function useAnalyticsEvents(): AnalyticsTracker {
  const trackEvent = useCallback((eventName: AnalyticsEventName, properties: AnalyticsProperties = {}) => {
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
  }, []);

  return { trackEvent };
}

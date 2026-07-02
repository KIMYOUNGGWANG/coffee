"use client";

import { useCallback } from "react";
import type { AnalyticsEventName } from "@/lib/analytics-events";
import { trackAnalyticsEvent } from "@/lib/analytics-client";

type AnalyticsProperties = Record<string, string | number | boolean | null>;

type AnalyticsTracker = {
  readonly trackEvent: (eventName: AnalyticsEventName, properties?: AnalyticsProperties) => void;
};

export function useAnalyticsEvents(): AnalyticsTracker {
  const trackEvent = useCallback((eventName: AnalyticsEventName, properties: AnalyticsProperties = {}) => {
    trackAnalyticsEvent(eventName, properties);
  }, []);

  return { trackEvent };
}

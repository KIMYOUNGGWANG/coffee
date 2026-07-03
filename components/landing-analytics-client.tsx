"use client";

import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";
import type { AnalyticsEventName } from "@/lib/analytics-events";
import { useAnalyticsEvents } from "@/hooks/use-analytics-events";

type AnalyticsProperties = Record<string, string | number | boolean | null>;

type LandingSectionViewTrackerProps = {
  readonly eventName: AnalyticsEventName;
  readonly properties?: AnalyticsProperties;
};

type TrackedLandingLinkProps = {
  readonly children: ReactNode;
  readonly className?: string;
  readonly eventName: AnalyticsEventName;
  readonly href: string;
  readonly properties?: AnalyticsProperties;
};

const emptyAnalyticsProperties: AnalyticsProperties = {};

export function LandingSectionViewTracker({ eventName, properties = emptyAnalyticsProperties }: LandingSectionViewTrackerProps) {
  const elementRef = useRef<HTMLSpanElement | null>(null);
  const hasTrackedRef = useRef(false);
  const { trackEvent } = useAnalyticsEvents();

  useEffect(() => {
    const element = elementRef.current;
    if (!element || hasTrackedRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || hasTrackedRef.current) return;
        hasTrackedRef.current = true;
        trackEvent(eventName, properties);
        observer.disconnect();
      },
      { rootMargin: "160px 0px", threshold: 0.01 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [eventName, properties, trackEvent]);

  return <span ref={elementRef} aria-hidden="true" className="sr-only" />;
}

export function TrackedLandingLink({ children, className, eventName, href, properties = emptyAnalyticsProperties }: TrackedLandingLinkProps) {
  const { trackEvent } = useAnalyticsEvents();

  return (
    <Link
      className={className}
      href={href}
      onClick={() => trackEvent(eventName, properties)}
    >
      {children}
    </Link>
  );
}

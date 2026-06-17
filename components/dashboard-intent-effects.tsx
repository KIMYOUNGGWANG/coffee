"use client";

import { useEffect, useState } from "react";
import type { AnalyticsEventName } from "@/lib/analytics-events";
import type { DashboardActivationIntent } from "@/lib/activation-intent";
import type { CheckoutIntent, CheckoutItemType } from "@/lib/checkout-return";
import type { TasteProfileKey } from "@/lib/taste-profile";

type AnalyticsProperties = Record<string, string | number | boolean | null>;
type TrackEvent = (eventName: AnalyticsEventName, properties?: AnalyticsProperties) => void;

type DashboardIntentEffectsProps = {
  readonly initialActivationIntent: DashboardActivationIntent;
  readonly initialCheckoutIntent: CheckoutIntent;
  readonly isCardsLoading: boolean;
  readonly cardsError: unknown;
  readonly cardsFailureReason: unknown;
  readonly onOpenWizard: (tasteProfile: TasteProfileKey | null) => void;
  readonly onOpenPayment: (itemType: CheckoutItemType) => void;
  readonly trackEvent: TrackEvent;
};

function removeDashboardSearchParams(paramNames: readonly string[]): void {
  const searchParams = new URLSearchParams(globalThis.location.search);
  for (const paramName of paramNames) {
    searchParams.delete(paramName);
  }

  const nextSearch = searchParams.toString();
  globalThis.history.replaceState(null, "", nextSearch ? `/dashboard?${nextSearch}` : "/dashboard");
}

export default function DashboardIntentEffects({
  initialActivationIntent,
  initialCheckoutIntent,
  isCardsLoading,
  cardsError,
  cardsFailureReason,
  onOpenWizard,
  onOpenPayment,
  trackEvent,
}: DashboardIntentEffectsProps) {
  const [hasHandledActivationIntent, setHasHandledActivationIntent] = useState(false);
  const [hasHandledCheckoutIntent, setHasHandledCheckoutIntent] = useState(false);
  const isCardsBlocked = isCardsLoading || !!cardsError || !!cardsFailureReason;

  useEffect(() => {
    if (
      hasHandledActivationIntent
      || initialActivationIntent.kind !== "first_card"
      || isCardsBlocked
    ) return;

    trackEvent("first_card_cta_clicked", {
      source: initialActivationIntent.source,
      token: initialActivationIntent.token,
      tasteProfile: initialActivationIntent.tasteProfile,
    });
    onOpenWizard(initialActivationIntent.tasteProfile);
    setHasHandledActivationIntent(true);
    removeDashboardSearchParams(["intent", "source", "token", "taste_profile"]);
  }, [hasHandledActivationIntent, initialActivationIntent, isCardsBlocked, onOpenWizard, trackEvent]);

  useEffect(() => {
    if (
      hasHandledCheckoutIntent
      || initialCheckoutIntent.kind !== "checkout"
      || isCardsBlocked
    ) return;

    trackEvent("paywall_opened", {
      source: "checkout_intent",
      itemType: initialCheckoutIntent.itemType,
    });
    onOpenPayment(initialCheckoutIntent.itemType);
    setHasHandledCheckoutIntent(true);
    removeDashboardSearchParams(["checkout_intent"]);
  }, [hasHandledCheckoutIntent, initialCheckoutIntent, isCardsBlocked, onOpenPayment, trackEvent]);

  return null;
}

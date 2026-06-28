"use client";

import DashboardBillingStatusPanel from "@/components/dashboard-billing-status-panel";
import { DashboardOperationsSnapshot } from "@/components/dashboard-operations-snapshot";
import DashboardUsagePanel from "@/components/dashboard-usage-panel";
import type { TasteAnalyticsData, TastingCardData, UserProfileData } from "@/hooks/useTastingCards";

type DashboardSettingsViewProps = {
  readonly profile: UserProfileData | undefined;
  readonly cards: readonly TastingCardData[] | undefined;
  readonly analytics: TasteAnalyticsData | undefined;
  readonly onOpenPayment: () => void;
};

export function DashboardSettingsView({ profile, cards, analytics, onOpenPayment }: DashboardSettingsViewProps) {
  return (
    <div className="space-y-6">
      <DashboardOperationsSnapshot cards={cards} analytics={analytics} profile={profile} />
      <div className="mx-auto grid max-w-4xl gap-4 sm:gap-5 lg:grid-cols-2">
        <DashboardUsagePanel profile={profile} onOpenPayment={onOpenPayment} />
        <DashboardBillingStatusPanel onOpenPayment={onOpenPayment} />
      </div>
    </div>
  );
}

"use client";

import DashboardBillingStatusPanel from "@/components/dashboard-billing-status-panel";
import DashboardUsagePanel from "@/components/dashboard-usage-panel";
import type { UserProfileData } from "@/hooks/useTastingCards";

type DashboardSettingsViewProps = {
  readonly profile: UserProfileData | undefined;
  readonly onOpenPayment: () => void;
};

export function DashboardSettingsView({ profile, onOpenPayment }: DashboardSettingsViewProps) {
  return (
    <div className="mx-auto grid max-w-3xl gap-4 md:grid-cols-2">
      <DashboardUsagePanel profile={profile} onOpenPayment={onOpenPayment} />
      <DashboardBillingStatusPanel onOpenPayment={onOpenPayment} />
    </div>
  );
}

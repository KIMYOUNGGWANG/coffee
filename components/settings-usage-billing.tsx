"use client";

import { useState } from "react";
import { useUserProfile } from "@/hooks/useTastingCards";
import DashboardUsagePanel from "@/components/dashboard-usage-panel";
import DashboardBillingStatusPanel from "@/components/dashboard-billing-status-panel";
import { DashboardModals } from "@/components/dashboard-modals";

export function SettingsUsageBilling() {
  const { data: profile } = useUserProfile();
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
        <DashboardUsagePanel profile={profile} onOpenPayment={() => setIsPaymentOpen(true)} />
        <DashboardBillingStatusPanel onOpenPayment={() => setIsPaymentOpen(true)} />
      </div>
      <DashboardModals
        isWizardOpen={false}
        wizardTasteProfile={null}
        onCloseWizard={() => {}}
        isPaymentOpen={isPaymentOpen}
        resumedCheckoutItemType={null}
        onClosePayment={() => setIsPaymentOpen(false)}
        selectedDetailCard={null}
        onCloseDetail={() => {}}
        selectedShareCard={null}
        onCloseShare={() => {}}
      />
    </div>
  );
}

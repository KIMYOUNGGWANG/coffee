"use client";

import DashboardIntentEffects from "@/components/dashboard-intent-effects";
import { DashboardModals } from "@/components/dashboard-modals";
import { DashboardMobileNavigation, type DashboardTab } from "@/components/dashboard-navigation";
import { DashboardScanAction } from "@/components/dashboard-scan-action";
import type { DashboardActivationIntent, DashboardActivationMode } from "@/lib/activation-intent";
import type { CheckoutIntent, CheckoutItemType } from "@/lib/checkout-return";
import type { TasteProfileKey } from "@/lib/taste-profile";
import type { TastingCardData } from "@/hooks/useTastingCards";
import type { useAnalyticsEvents } from "@/hooks/use-analytics-events";
import type { CardCreatorWizardMode } from "@/components/CardCreatorWizard";

type DashboardRuntimeOverlaysProps = {
  readonly activeTab: DashboardTab;
  readonly initialActivationIntent: DashboardActivationIntent;
  readonly initialCheckoutIntent: CheckoutIntent;
  readonly isCardsLoading: boolean;
  readonly cardsError: unknown;
  readonly cardsFailureReason: unknown;
  readonly showScanAction: boolean;
  readonly isWizardOpen: boolean;
  readonly wizardTasteProfile: TasteProfileKey | null;
  readonly wizardInitialMode: CardCreatorWizardMode;
  readonly isPaymentOpen: boolean;
  readonly resumedCheckoutItemType: CheckoutItemType | null;
  readonly selectedDetailCard: TastingCardData | null;
  readonly selectedShareCard: TastingCardData | null;
  readonly onTabChange: (tab: DashboardTab) => void;
  readonly onScan: () => void;
  readonly onOpenWizard: (tasteProfile: TasteProfileKey | null, mode: DashboardActivationMode) => void;
  readonly onOpenPayment: (itemType: CheckoutItemType) => void;
  readonly onCloseWizard: () => void;
  readonly onClosePayment: () => void;
  readonly onCloseDetail: () => void;
  readonly onCloseShare: () => void;
  readonly trackEvent: ReturnType<typeof useAnalyticsEvents>["trackEvent"];
};

export function DashboardRuntimeOverlays({
  activeTab,
  initialActivationIntent,
  initialCheckoutIntent,
  isCardsLoading,
  cardsError,
  cardsFailureReason,
  showScanAction,
  isWizardOpen,
  wizardTasteProfile,
  wizardInitialMode,
  isPaymentOpen,
  resumedCheckoutItemType,
  selectedDetailCard,
  selectedShareCard,
  onTabChange,
  onScan,
  onOpenWizard,
  onOpenPayment,
  onCloseWizard,
  onClosePayment,
  onCloseDetail,
  onCloseShare,
  trackEvent,
}: DashboardRuntimeOverlaysProps) {
  return (
    <>
      <DashboardMobileNavigation activeTab={activeTab} onTabChange={onTabChange} />
      {activeTab === "shelf" && showScanAction && <DashboardScanAction onScan={onScan} />}
      <DashboardIntentEffects
        initialActivationIntent={initialActivationIntent}
        initialCheckoutIntent={initialCheckoutIntent}
        isCardsLoading={isCardsLoading}
        cardsError={cardsError}
        cardsFailureReason={cardsFailureReason}
        onOpenWizard={onOpenWizard}
        onOpenPayment={onOpenPayment}
        trackEvent={trackEvent}
      />
      <DashboardModals
        isWizardOpen={isWizardOpen}
        wizardTasteProfile={wizardTasteProfile}
        wizardInitialMode={wizardInitialMode}
        onCloseWizard={onCloseWizard}
        isPaymentOpen={isPaymentOpen}
        resumedCheckoutItemType={resumedCheckoutItemType}
        onClosePayment={onClosePayment}
        selectedDetailCard={selectedDetailCard}
        onCloseDetail={onCloseDetail}
        selectedShareCard={selectedShareCard}
        onCloseShare={onCloseShare}
      />
    </>
  );
}

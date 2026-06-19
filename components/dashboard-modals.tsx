"use client";

import CardCreatorWizard from "@/components/CardCreatorWizard";
import CardDetailModal from "@/components/CardDetailModal";
import PaymentDialog from "@/components/PaymentDialog";
import StoryExportModal from "@/components/StoryExportModal";
import type { TastingCardData } from "@/hooks/useTastingCards";
import type { CheckoutItemType } from "@/lib/checkout-return";
import type { TasteProfileKey } from "@/lib/taste-profile";

type DashboardModalsProps = {
  readonly isWizardOpen: boolean;
  readonly wizardTasteProfile: TasteProfileKey | null;
  readonly onCloseWizard: () => void;
  readonly isPaymentOpen: boolean;
  readonly resumedCheckoutItemType: CheckoutItemType | null;
  readonly onClosePayment: () => void;
  readonly selectedDetailCard: TastingCardData | null;
  readonly onCloseDetail: () => void;
  readonly selectedShareCard: TastingCardData | null;
  readonly onCloseShare: () => void;
};

export function DashboardModals({
  isWizardOpen,
  wizardTasteProfile,
  onCloseWizard,
  isPaymentOpen,
  resumedCheckoutItemType,
  onClosePayment,
  selectedDetailCard,
  onCloseDetail,
  selectedShareCard,
  onCloseShare,
}: DashboardModalsProps) {
  return (
    <>
      <CardCreatorWizard isOpen={isWizardOpen} onClose={onCloseWizard} initialTasteProfile={wizardTasteProfile} />
      <PaymentDialog isOpen={isPaymentOpen} onClose={onClosePayment} resumeItemType={resumedCheckoutItemType} />
      {selectedDetailCard && <CardDetailModal card={selectedDetailCard} isOpen onClose={onCloseDetail} />}
      {selectedShareCard && <StoryExportModal card={selectedShareCard} isOpen onClose={onCloseShare} />}
    </>
  );
}

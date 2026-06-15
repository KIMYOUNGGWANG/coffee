"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Sparkles } from "lucide-react";
import CardCreatorWizard from "@/components/CardCreatorWizard";
import CardDetailModal from "@/components/CardDetailModal";
import DashboardAnalyticsPanel from "@/components/dashboard-analytics-panel";
import DashboardBillingStatusPanel from "@/components/dashboard-billing-status-panel";
import DashboardCardsSection from "@/components/dashboard-cards-section";
import DashboardCheckoutNotice from "@/components/dashboard-checkout-notice";
import DashboardFiltersPanel from "@/components/dashboard-filters-panel";
import DashboardIntentEffects from "@/components/dashboard-intent-effects";
import DashboardRoasterMemoryPanel from "@/components/dashboard-roaster-memory-panel";
import DashboardUsagePanel from "@/components/dashboard-usage-panel";
import PaymentDialog from "@/components/PaymentDialog";
import RevenueFunnelPanel from "@/components/revenue-funnel-panel";
import StoryExportModal from "@/components/StoryExportModal";
import { Button } from "@/components/ui/button";
import { useAnalyticsEvents } from "@/hooks/use-analytics-events";
import { useDeleteTastingCard, useTasteAnalytics, useTastingCards, useUserProfile } from "@/hooks/useTastingCards";
import type { DashboardActivationIntent } from "@/lib/activation-intent";
import { buildAuthGateHref, isAuthRequiredError } from "@/lib/auth-redirect";
import { readCheckoutNoticeFromSearch, type CheckoutIntent, type CheckoutItemType, type CheckoutNotice } from "@/lib/checkout-return";
import type { TastingCardData } from "@/hooks/useTastingCards";

type DashboardClientProps = {
  readonly initialActivationIntent: DashboardActivationIntent;
  readonly initialCheckoutIntent: CheckoutIntent;
  readonly initialCheckoutNotice: CheckoutNotice | null;
};

function filterCards(
  cards: readonly TastingCardData[] | undefined,
  searchQuery: string,
  selectedMethod: string,
  selectedRoast: string,
): readonly TastingCardData[] {
  if (!cards) return [];
  const query = searchQuery.toLowerCase();
  return cards.filter((card) => {
    const titleMatch = card.title.toLowerCase().includes(query) || card.subtitle.toLowerCase().includes(query);
    const badgesText = card.badges.join(" ").toLowerCase();
    const methodMatch = selectedMethod === "" || badgesText.includes(selectedMethod.toLowerCase());
    const roastMatch = selectedRoast === ""
      || card.tags.join(" ").toLowerCase().includes(selectedRoast.toLowerCase())
      || badgesText.includes(selectedRoast.toLowerCase());
    return titleMatch && methodMatch && roastMatch;
  });
}

export default function DashboardClient({
  initialActivationIntent,
  initialCheckoutIntent,
  initialCheckoutNotice,
}: DashboardClientProps) {
  const queryClient = useQueryClient();
  const { trackEvent } = useAnalyticsEvents();
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [resumedCheckoutItemType, setResumedCheckoutItemType] = useState<CheckoutItemType | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("");
  const [selectedRoast, setSelectedRoast] = useState("");
  const [checkoutNotice, setCheckoutNotice] = useState<CheckoutNotice | null>(initialCheckoutNotice);
  const [isDashboardReady, setIsDashboardReady] = useState(false);
  const [selectedDetailCard, setSelectedDetailCard] = useState<TastingCardData | null>(null);
  const [selectedShareCard, setSelectedShareCard] = useState<TastingCardData | null>(null);

  const { data: cards, isLoading, error, failureReason: cardsFailureReason } = useTastingCards();
  const { data: profile, error: profileError, failureReason: profileFailureReason } = useUserProfile();
  const {
    data: analytics,
    isLoading: isAnalyticsLoading,
    error: analyticsError,
    failureReason: analyticsFailureReason,
  } = useTasteAnalytics();
  const deleteCardMutation = useDeleteTastingCard();
  const filteredCards = useMemo(
    () => filterCards(cards, searchQuery, selectedMethod, selectedRoast),
    [cards, searchQuery, selectedMethod, selectedRoast],
  );
  const latestCard = useMemo(() => cards?.[0] ?? null, [cards]);
  const isDashboardAuthRequired = [
    error,
    cardsFailureReason,
    profileError,
    profileFailureReason,
    analyticsError,
    analyticsFailureReason,
  ].some(isAuthRequiredError);

  useEffect(() => {
    setIsDashboardReady(true);
    trackEvent("dashboard_view");
  }, [trackEvent]);

  useEffect(() => {
    if (!isDashboardAuthRequired) return;

    const currentPath = `${globalThis.location.pathname}${globalThis.location.search}`;
    globalThis.location.assign(buildAuthGateHref(currentPath));
  }, [isDashboardAuthRequired]);

  useEffect(() => {
    const notice = initialCheckoutNotice ?? readCheckoutNoticeFromSearch(globalThis.location.search);
    if (!notice) return;

    setCheckoutNotice(notice);
    if (notice.status === "success") {
      void queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      void queryClient.invalidateQueries({ queryKey: ["tasting-cards"] });
      void queryClient.invalidateQueries({ queryKey: ["taste-analytics"] });
    }
    window.setTimeout(() => {
      globalThis.history.replaceState(null, "", "/dashboard");
    }, 50);
  }, [initialCheckoutNotice, queryClient]);

  const openWizard = (source: string) => {
    trackEvent("first_card_cta_clicked", { source });
    setIsWizardOpen(true);
  };

  const openPayment = (source = "dashboard_usage") => {
    setResumedCheckoutItemType(null);
    trackEvent("paywall_opened", { source });
    setIsPaymentOpen(true);
  };

  const resumePayment = (itemType: CheckoutItemType) => {
    setResumedCheckoutItemType(itemType);
    setIsPaymentOpen(true);
  };

  const closePayment = () => {
    setIsPaymentOpen(false);
    setResumedCheckoutItemType(null);
  };

  const shareLatestCard = () => {
    if (!latestCard) {
      openWizard("revenue_funnel_share_empty");
      return;
    }
    trackEvent("story_share_started", { source: "revenue_funnel", cardId: latestCard.id });
    setSelectedShareCard(latestCard);
  };

  const handleDeleteCard = async (id: string) => {
    if (!window.confirm("정말로 이 테이스팅 카드를 삭제하시겠습니까?")) return;
    try {
      await deleteCardMutation.mutateAsync(id);
    } catch (error: unknown) {
      window.alert(error instanceof Error ? error.message : "카드 삭제에 실패했습니다.");
    }
  };

  return (
    <main
      data-testid={isDashboardReady ? "dashboard-ready" : undefined}
      className="starter-shell min-h-screen text-espresso bg-[#f7f7f4]"
    >
      <section className="surface-panel p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-warm-gray rounded-3xl bg-white/70 backdrop-blur-md shadow-sm">
        <div>
          <span className="hero-kicker flex items-center gap-1.5 text-caramel font-bold">
            <Sparkles size={13} />
            한국 스페셜티 커피 아카이브
          </span>
          <h1 className="text-3xl font-serif font-bold text-espresso mt-1">Hyangmi Taste Archive</h1>
          <p className="hero-copy mt-1.5 text-espresso/60 text-sm">
            서울과 부산의 로스터리부터 집에서 내린 한 잔까지, 내가 확인한 원두 기록과 AI 보조 노트를 보관합니다.
          </p>
        </div>
        <Button
          onClick={() => openWizard("header")}
          className="bg-espresso hover:bg-espresso/90 text-white font-bold py-2.5 px-5 rounded-2xl flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
        >
          <Plus size={16} />
          새로운 카드 기록하기
        </Button>
      </section>

      {checkoutNotice && <DashboardCheckoutNotice notice={checkoutNotice} onDismiss={() => setCheckoutNotice(null)} />}

      <RevenueFunnelPanel
        cards={cards}
        profile={profile}
        onCreateCard={() => openWizard("revenue_funnel")}
        onOpenPayment={() => openPayment("revenue_funnel")}
        onShareLatestCard={shareLatestCard}
      />

      <div className="grid grid-cols-12 gap-6 items-start mt-2">
        <aside className="col-span-12 lg:col-span-3 space-y-6">
          <DashboardFiltersPanel
            searchQuery={searchQuery}
            selectedMethod={selectedMethod}
            selectedRoast={selectedRoast}
            onSearchQueryChange={setSearchQuery}
            onSelectedMethodChange={setSelectedMethod}
            onSelectedRoastChange={setSelectedRoast}
            onReset={() => {
              setSearchQuery("");
              setSelectedMethod("");
              setSelectedRoast("");
            }}
          />
          <DashboardAnalyticsPanel analytics={analytics} isLoading={isAnalyticsLoading} />
          <DashboardRoasterMemoryPanel cards={cards} />
          <DashboardUsagePanel profile={profile} onOpenPayment={() => openPayment("dashboard_usage")} />
          <DashboardBillingStatusPanel onOpenPayment={() => openPayment("billing_status")} />
        </aside>

        <section className="col-span-12 lg:col-span-9">
          <DashboardCardsSection
            cards={filteredCards}
            isLoading={isLoading}
            error={error}
            deletingCardId={deleteCardMutation.variables}
            isDeleting={deleteCardMutation.isPending}
            onCreateCard={() => openWizard("empty_state")}
            onDeleteCard={handleDeleteCard}
            onSelectCard={setSelectedDetailCard}
            onShareCard={setSelectedShareCard}
          />
        </section>
      </div>

      <CardCreatorWizard isOpen={isWizardOpen} onClose={() => setIsWizardOpen(false)} />
      <PaymentDialog isOpen={isPaymentOpen} onClose={closePayment} resumeItemType={resumedCheckoutItemType} />
      <DashboardIntentEffects
        initialActivationIntent={initialActivationIntent}
        initialCheckoutIntent={initialCheckoutIntent}
        isCardsLoading={isLoading}
        cardsError={error}
        cardsFailureReason={cardsFailureReason}
        onOpenWizard={() => setIsWizardOpen(true)}
        onOpenPayment={resumePayment}
        trackEvent={trackEvent}
      />

      {selectedDetailCard && (
        <CardDetailModal
          card={selectedDetailCard}
          isOpen={!!selectedDetailCard}
          onClose={() => setSelectedDetailCard(null)}
        />
      )}

      {selectedShareCard && (
        <StoryExportModal
          card={selectedShareCard}
          isOpen={!!selectedShareCard}
          onClose={() => setSelectedShareCard(null)}
        />
      )}
    </main>
  );
}

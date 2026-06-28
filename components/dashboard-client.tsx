"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardCheckoutNotice from "@/components/dashboard-checkout-notice";
import { DashboardHeader } from "@/components/dashboard-header";
import type { DashboardTab } from "@/components/dashboard-navigation";
import { DashboardPassportView } from "@/components/dashboard-passport-view";
import { DashboardRuntimeOverlays } from "@/components/dashboard-runtime-overlays";
import { DashboardSettingsView } from "@/components/dashboard-settings-view";
import { DashboardShelfView } from "@/components/dashboard-shelf-view";
import DailyBrewingCalendar from "@/components/daily-brewing-calendar";
import { useAnalyticsEvents } from "@/hooks/use-analytics-events";
import { useDashboardCheckoutReturn } from "@/hooks/use-dashboard-checkout-return";
import { useDeleteTastingCard, useTasteAnalytics, useTastingCards, useUserProfile } from "@/hooks/useTastingCards";
import type { CardCreatorWizardMode } from "@/components/CardCreatorWizard";
import type { DashboardActivationIntent, DashboardActivationMode } from "@/lib/activation-intent";
import { buildAuthGateHref, isAuthRequiredError } from "@/lib/auth-redirect";
import type { CheckoutIntent, CheckoutItemType, CheckoutNotice } from "@/lib/checkout-return";
import { filterDashboardCards, type RepurchaseFilter } from "@/lib/dashboard-card-filter";
import type { TasteProfileKey } from "@/lib/taste-profile";
import type { TastingCardData } from "@/hooks/useTastingCards";

type DashboardClientProps = {
  readonly initialActivationIntent: DashboardActivationIntent;
  readonly initialCheckoutIntent: CheckoutIntent;
  readonly initialCheckoutNotice: CheckoutNotice | null;
};

export default function DashboardClient({
  initialActivationIntent,
  initialCheckoutIntent,
  initialCheckoutNotice,
}: DashboardClientProps) {
  const { trackEvent } = useAnalyticsEvents();
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardTasteProfile, setWizardTasteProfile] = useState<TasteProfileKey | null>(null);
  const [wizardInitialMode, setWizardInitialMode] = useState<CardCreatorWizardMode>("full");
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [resumedCheckoutItemType, setResumedCheckoutItemType] = useState<CheckoutItemType | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("");
  const [selectedRoast, setSelectedRoast] = useState("");
  const [selectedRepurchaseIntent, setSelectedRepurchaseIntent] = useState<RepurchaseFilter>("");
  const [minAcidity, setMinAcidity] = useState(1);
  const [minSweetness, setMinSweetness] = useState(1);
  const [minBody, setMinBody] = useState(1);
  const [sortBy, setSortBy] = useState("newest");
  const [isDashboardReady, setIsDashboardReady] = useState(false);
  const [selectedDetailCard, setSelectedDetailCard] = useState<TastingCardData | null>(null);
  const [selectedShareCard, setSelectedShareCard] = useState<TastingCardData | null>(null);

  const [activeTab, setActiveTab] = useState<DashboardTab>("shelf");
  const [shelfRefreshTrigger, setShelfRefreshTrigger] = useState(0);
  const { checkoutNotice, dismissCheckoutNotice } = useDashboardCheckoutReturn(initialCheckoutNotice);

  const triggerShelfRefresh = () => setShelfRefreshTrigger(prev => prev + 1);

  const { data: cards, isLoading, error, failureReason: cardsFailureReason } = useTastingCards();
  const { data: profile, error: profileError, failureReason: profileFailureReason } = useUserProfile();
  const {
    data: analytics,
    isLoading: isAnalyticsLoading,
    error: analyticsError,
    failureReason: analyticsFailureReason,
  } = useTasteAnalytics();
  const deleteCardMutation = useDeleteTastingCard();
  const filteredCards = useMemo(() => filterDashboardCards(cards, {
    searchQuery,
    selectedMethod,
    selectedRoast,
    selectedRepurchaseIntent,
    minAcidity,
    minSweetness,
    minBody,
    sortBy,
  }), [cards, searchQuery, selectedMethod, selectedRoast, selectedRepurchaseIntent, minAcidity, minSweetness, minBody, sortBy]);
  const hasCards = (cards?.length ?? 0) > 0;
  const hasActiveFilters = Boolean(
    searchQuery || selectedMethod || selectedRoast || selectedRepurchaseIntent
    || minAcidity > 1 || minSweetness > 1 || minBody > 1 || sortBy !== "newest",
  );
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
    trackEvent("archive_viewed");
  }, [trackEvent]);

  useEffect(() => {
    if (!isDashboardAuthRequired) return;

    const currentPath = `${globalThis.location.pathname}${globalThis.location.search}`;
    globalThis.location.assign(buildAuthGateHref(currentPath));
  }, [isDashboardAuthRequired]);

  const openWizard = (source: string, mode: CardCreatorWizardMode = "full") => {
    trackEvent("first_card_cta_clicked", { source, mode });
    setWizardTasteProfile(null);
    setWizardInitialMode(mode);
    setIsWizardOpen(true);
  };

  const openActivationWizard = (tasteProfile: TasteProfileKey | null, mode: DashboardActivationMode = "full") => {
    setWizardTasteProfile(tasteProfile);
    setWizardInitialMode(mode);
    setIsWizardOpen(true);
  };

  const closeWizard = () => { setIsWizardOpen(false); setWizardTasteProfile(null); setWizardInitialMode("full"); };

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

  const trackFilterChange = (filterName: string, active: boolean) => {
    trackEvent("archive_searched", {
      interaction: "filter",
      filter_name: filterName,
      active,
    });
  };

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedMethod("");
    setSelectedRoast("");
    setSelectedRepurchaseIntent("");
    setMinAcidity(1);
    setMinSweetness(1);
    setMinBody(1);
    setSortBy("newest");
    trackFilterChange("all", false);
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
    <main className="coffee-app-shell min-h-screen bg-background-dark text-foreground" data-testid={isDashboardReady ? "dashboard-ready" : undefined}>
      <DashboardHeader
        activeTab={activeTab}
        cardCount={cards?.length ?? 0}
        sortBy={sortBy}
        onCreateCard={() => openWizard("header")}
        onSortChange={setSortBy}
        onTabChange={setActiveTab}
      />

      {checkoutNotice && <DashboardCheckoutNotice notice={checkoutNotice} onDismiss={dismissCheckoutNotice} />}

      <section className="coffee-workspace min-w-0">
        {activeTab === "shelf" && (
          <DashboardShelfView
            cards={filteredCards}
            totalCardCount={cards?.length ?? 0}
            hasCards={hasCards}
            hasActiveFilters={hasActiveFilters}
            isLoading={isLoading}
            error={error}
            deletingCardId={deleteCardMutation.variables}
            isDeleting={deleteCardMutation.isPending}
            searchQuery={searchQuery}
            selectedMethod={selectedMethod}
            selectedRoast={selectedRoast}
            selectedRepurchaseIntent={selectedRepurchaseIntent}
            minAcidity={minAcidity}
            minSweetness={minSweetness}
            minBody={minBody}
            sortBy={sortBy}
            onSearchQueryChange={setSearchQuery}
            onSearchSubmit={() => trackEvent("archive_searched", {
              interaction: "search",
              query_length: searchQuery.trim().length,
              result_count: filteredCards.length,
            })}
            onSelectedMethodChange={(value) => { setSelectedMethod(value); trackFilterChange("method", value !== ""); }}
            onSelectedRoastChange={(value) => { setSelectedRoast(value); trackFilterChange("roast", value !== ""); }}
            onSelectedRepurchaseIntentChange={(value) => { setSelectedRepurchaseIntent(value); trackFilterChange("repurchase_intent", value !== ""); }}
            onMinAcidityChange={(value) => { setMinAcidity(value); trackFilterChange("acidity", value > 1); }}
            onMinSweetnessChange={(value) => { setMinSweetness(value); trackFilterChange("sweetness", value > 1); }}
            onMinBodyChange={(value) => { setMinBody(value); trackFilterChange("body", value > 1); }}
            onSortByChange={(value) => { setSortBy(value); trackFilterChange("sort", value !== "newest"); }}
            onResetFilters={resetFilters}
            onCreateCard={() => openWizard("empty_state")}
            onQuickAdd={() => openWizard("empty_state_quick_add", "quick")}
            onDeleteCard={handleDeleteCard}
            onSelectCard={setSelectedDetailCard}
            onShareCard={setSelectedShareCard}
            analytics={analytics}
            onOpenPassport={() => setActiveTab("passport")}
            dnaData={null}
            isDnaLoading={false}
            onShareDNA={() => {}}
            onShelfDataChange={() => {}}
          />
        )}

        {activeTab === "log" && (
          <DailyBrewingCalendar refreshTrigger={shelfRefreshTrigger} onLogAdded={triggerShelfRefresh} />
        )}

        {activeTab === "passport" && <DashboardPassportView analytics={analytics} cards={cards} isLoading={isAnalyticsLoading} refreshTrigger={shelfRefreshTrigger} />}

        {activeTab === "settings" && (
          <DashboardSettingsView
            profile={profile}
            cards={cards}
            analytics={analytics}
            onOpenPayment={() => openPayment("dashboard_settings")}
          />
        )}
      </section>

      <DashboardRuntimeOverlays
        activeTab={activeTab}
        initialActivationIntent={initialActivationIntent}
        initialCheckoutIntent={initialCheckoutIntent}
        isCardsLoading={isLoading}
        cardsError={error}
        cardsFailureReason={cardsFailureReason}
        isWizardOpen={isWizardOpen}
        wizardTasteProfile={wizardTasteProfile}
        wizardInitialMode={wizardInitialMode}
        isPaymentOpen={isPaymentOpen}
        resumedCheckoutItemType={resumedCheckoutItemType}
        selectedDetailCard={selectedDetailCard}
        selectedShareCard={selectedShareCard}
        showScanAction={true}
        onTabChange={setActiveTab}
        onScan={() => openWizard("mobile_scan_action")}
        onOpenWizard={openActivationWizard}
        onOpenPayment={resumePayment}
        onCloseWizard={closeWizard}
        onClosePayment={closePayment}
        onCloseDetail={() => setSelectedDetailCard(null)}
        onCloseShare={() => setSelectedShareCard(null)}
        trackEvent={trackEvent}
      />
    </main>
  );
}

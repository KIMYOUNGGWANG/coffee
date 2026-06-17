"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Sparkles, Coffee, Calendar, Archive } from "lucide-react";
import confetti from "canvas-confetti";
import { motion } from "motion/react";
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
import CoffeeShelfGrid from "@/components/coffee-shelf-grid";
import DailyBrewingCalendar from "@/components/daily-brewing-calendar";
import AIBaristaPanel from "@/components/ai-barista-panel";
import { Button } from "@/components/ui/button";
import { useAnalyticsEvents } from "@/hooks/use-analytics-events";
import { useDeleteTastingCard, useTasteAnalytics, useTastingCards, useUserProfile } from "@/hooks/useTastingCards";
import type { DashboardActivationIntent } from "@/lib/activation-intent";
import { buildAuthGateHref, isAuthRequiredError } from "@/lib/auth-redirect";
import { readCheckoutNoticeFromSearch, type CheckoutIntent, type CheckoutItemType, type CheckoutNotice } from "@/lib/checkout-return";
import type { TasteProfileKey } from "@/lib/taste-profile";
import type { TastingCardData } from "@/hooks/useTastingCards";
import { cn } from "@/lib/utils";

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
  minAcidity: number,
  minSweetness: number,
  minBody: number,
  sortBy: string,
): readonly TastingCardData[] {
  if (!cards) return [];
  const query = searchQuery.toLowerCase();
  
  const filtered = cards.filter((card) => {
    const titleMatch = card.title.toLowerCase().includes(query) || card.subtitle.toLowerCase().includes(query);
    const badgesText = card.badges.join(" ").toLowerCase();
    const methodMatch = selectedMethod === "" || badgesText.includes(selectedMethod.toLowerCase());
    const roastMatch = selectedRoast === ""
      || card.tags.join(" ").toLowerCase().includes(selectedRoast.toLowerCase())
      || badgesText.includes(selectedRoast.toLowerCase());
    
    const acidityMatch = card.metric1 >= minAcidity;
    const sweetnessMatch = card.metric2 >= minSweetness;
    const bodyMatch = card.metric3 >= minBody;

    return titleMatch && methodMatch && roastMatch && acidityMatch && sweetnessMatch && bodyMatch;
  });

  return [...filtered].sort((a, b) => {
    switch (sortBy) {
      case "acidity_desc":
        return b.metric1 - a.metric1;
      case "sweetness_desc":
        return b.metric2 - a.metric2;
      case "body_desc":
        return b.metric3 - a.metric3;
      case "title_asc":
        return (a.title || "").localeCompare(b.title || "", "ko-KR");
      case "newest":
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
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
  const [wizardTasteProfile, setWizardTasteProfile] = useState<TasteProfileKey | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [resumedCheckoutItemType, setResumedCheckoutItemType] = useState<CheckoutItemType | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("");
  const [selectedRoast, setSelectedRoast] = useState("");
  const [minAcidity, setMinAcidity] = useState(1);
  const [minSweetness, setMinSweetness] = useState(1);
  const [minBody, setMinBody] = useState(1);
  const [sortBy, setSortBy] = useState("newest");
  const [checkoutNotice, setCheckoutNotice] = useState<CheckoutNotice | null>(initialCheckoutNotice);
  const [isDashboardReady, setIsDashboardReady] = useState(false);
  const [selectedDetailCard, setSelectedDetailCard] = useState<TastingCardData | null>(null);
  const [selectedShareCard, setSelectedShareCard] = useState<TastingCardData | null>(null);

  // Tabs and shelf integration state
  const [activeTab, setActiveTab] = useState<"passport" | "shelf" | "calendar" | "barista">("passport");
  const [shelfRefreshTrigger, setShelfRefreshTrigger] = useState(0);

  const triggerShelfRefresh = () => {
    setShelfRefreshTrigger(prev => prev + 1);
  };

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
    () => filterCards(cards, searchQuery, selectedMethod, selectedRoast, minAcidity, minSweetness, minBody, sortBy),
    [cards, searchQuery, selectedMethod, selectedRoast, minAcidity, minSweetness, minBody, sortBy],
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

      try {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#8B5A2B", "#CD853F", "#F5F5DC", "#D2B48C", "#4A3B32"]
        });
      } catch (confettiError) {
        console.error("Confetti launch failed:", confettiError);
      }
    }
    window.setTimeout(() => {
      globalThis.history.replaceState(null, "", "/dashboard");
    }, 50);
  }, [initialCheckoutNotice, queryClient]);

  const openWizard = (source: string) => {
    trackEvent("first_card_cta_clicked", { source });
    setWizardTasteProfile(null);
    setIsWizardOpen(true);
  };

  const openActivationWizard = (tasteProfile: TasteProfileKey | null) => {
    setWizardTasteProfile(tasteProfile);
    setIsWizardOpen(true);
  };

  const closeWizard = () => {
    setIsWizardOpen(false);
    setWizardTasteProfile(null);
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
        <div className="flex gap-2">
          {activeTab === "shelf" && (
            <Button
              onClick={() => {
                // Find and trigger the hidden dialog open button inside CoffeeShelfGrid
                const addButton = document.querySelector('[role="dialog"] button, button[aria-haspopup="dialog"]');
                if (addButton instanceof HTMLButtonElement) addButton.click();
              }}
              className="bg-espresso hover:bg-caramel text-white font-bold py-2.5 px-5 rounded-2xl flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Plus size={16} />
              새 원두 등록
            </Button>
          )}
          {activeTab === "calendar" && (
            <Button
              onClick={() => {
                // Find first day of current month or today to click and trigger log form
                const todayCell = document.querySelector('.border-caramel\\/40');
                if (todayCell instanceof HTMLDivElement) {
                  todayCell.click();
                } else {
                  const firstCell = document.querySelector('.bg-white.hover\\:bg-canvas\\/50');
                  if (firstCell instanceof HTMLDivElement) firstCell.click();
                }
              }}
              className="bg-espresso hover:bg-caramel text-white font-bold py-2.5 px-5 rounded-2xl flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Plus size={16} />
              브루잉 기록하기
            </Button>
          )}
          {activeTab === "passport" && (
            <Button
              onClick={() => openWizard("header")}
              className="bg-espresso hover:bg-espresso/90 text-white font-bold py-2.5 px-5 rounded-2xl flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Plus size={16} />
              새로운 카드 기록하기
            </Button>
          )}
        </div>
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
          {activeTab === "passport" ? (
            <DashboardFiltersPanel
              searchQuery={searchQuery}
              selectedMethod={selectedMethod}
              selectedRoast={selectedRoast}
              minAcidity={minAcidity}
              minSweetness={minSweetness}
              minBody={minBody}
              sortBy={sortBy}
              onSearchQueryChange={setSearchQuery}
              onSelectedMethodChange={setSelectedMethod}
              onSelectedRoastChange={setSelectedRoast}
              onMinAcidityChange={setMinAcidity}
              onMinSweetnessChange={setMinSweetness}
              onMinBodyChange={setMinBody}
              onSortByChange={setSortBy}
              onReset={() => {
                setSearchQuery("");
                setSelectedMethod("");
                setSelectedRoast("");
                setMinAcidity(1);
                setMinSweetness(1);
                setMinBody(1);
                setSortBy("newest");
              }}
            />
          ) : (
            <div className="space-y-6">
              <DashboardAnalyticsPanel analytics={analytics} isLoading={isAnalyticsLoading} />
              <DashboardUsagePanel profile={profile} onOpenPayment={() => openPayment("dashboard_usage")} />
              <DashboardBillingStatusPanel onOpenPayment={() => openPayment("billing_status")} />
            </div>
          )}
          {activeTab === "passport" && (
            <>
              <DashboardAnalyticsPanel analytics={analytics} isLoading={isAnalyticsLoading} />
              <DashboardRoasterMemoryPanel cards={cards} />
              <DashboardUsagePanel profile={profile} onOpenPayment={() => openPayment("dashboard_usage")} />
              <DashboardBillingStatusPanel onOpenPayment={() => openPayment("billing_status")} />
            </>
          )}
        </aside>

        <section className="col-span-12 lg:col-span-9 bg-white border border-sand rounded-3xl p-6 shadow-sm">
          {/* Tabs Navigation Bar */}
          <div className="flex border-b border-sand pb-px mb-6 overflow-x-auto scrollbar-none gap-4 relative">
            {[
              { id: "passport", label: "Taste Passport (맛 여권)", icon: Archive },
              { id: "shelf", label: "원두 보관함 (Shelf)", icon: Coffee },
              { id: "calendar", label: "드링킹 다이어리 (Log)", icon: Calendar },
              { id: "barista", label: "AI 바리스타 추천", icon: Sparkles },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "pb-3 pt-1 text-xs sm:text-sm font-bold tracking-tight transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 relative z-10 px-3 py-1 rounded-xl border-none bg-transparent",
                    isActive
                      ? "text-espresso font-extrabold"
                      : "text-cocoa/60 hover:text-espresso"
                  )}
                >
                  <Icon size={14} className={cn("transition-colors", isActive ? "text-caramel" : "text-cocoa/60")} />
                  {tab.label}
                  
                  {isActive && (
                    <motion.div
                      layoutId="activeTabBackground"
                      className="absolute inset-0 bg-caramel/8 rounded-xl -z-10"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  {isActive && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-caramel rounded-full"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab Contents */}
          {activeTab === "passport" && (
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
          )}

          {activeTab === "shelf" && (
            <CoffeeShelfGrid
              refreshTrigger={shelfRefreshTrigger}
            />
          )}

          {activeTab === "calendar" && (
            <DailyBrewingCalendar
              refreshTrigger={shelfRefreshTrigger}
              onLogAdded={triggerShelfRefresh}
            />
          )}

          {activeTab === "barista" && (
            <AIBaristaPanel
              refreshTrigger={shelfRefreshTrigger}
            />
          )}
        </section>
      </div>

      <CardCreatorWizard isOpen={isWizardOpen} onClose={closeWizard} initialTasteProfile={wizardTasteProfile} />
      <PaymentDialog isOpen={isPaymentOpen} onClose={closePayment} resumeItemType={resumedCheckoutItemType} />
      <DashboardIntentEffects
        initialActivationIntent={initialActivationIntent}
        initialCheckoutIntent={initialCheckoutIntent}
        isCardsLoading={isLoading}
        cardsError={error}
        cardsFailureReason={cardsFailureReason}
        onOpenWizard={openActivationWizard}
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

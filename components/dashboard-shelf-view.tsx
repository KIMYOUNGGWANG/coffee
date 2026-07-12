"use client";

import DashboardCardsSection from "@/components/dashboard-cards-section";
import { DashboardFeaturedArchiveCard } from "@/components/dashboard-featured-archive-card";
import { DashboardPassportSidebar } from "@/components/dashboard-passport-sidebar";
import { DashboardRebuyClueRescuePanel } from "@/components/dashboard-rebuy-clue-rescue-panel";
import { DashboardRebuyIntelligencePanel } from "@/components/dashboard-rebuy-intelligence-panel";
import { DashboardRebuyTimingMemoryPanel } from "@/components/dashboard-rebuy-timing-memory-panel";
import { DashboardRetentionLoop } from "@/components/dashboard-retention-loop";
import { DashboardShelfFilters } from "@/components/dashboard-shelf-filters";
import CoffeeShelfGrid from "@/components/coffee-shelf-grid";
import type { RebuyIntelligenceData, TasteAnalyticsData, TastingCardData } from "@/hooks/useTastingCards";
import type { RepurchaseFilter } from "@/lib/dashboard-card-filter";
import CoffeeDNACard, { type CoffeeDNAData } from "@/components/coffee-dna/CoffeeDNACard";

type DashboardShelfViewProps = {
  readonly cards: readonly TastingCardData[];
  readonly totalCardCount: number;
  readonly hasCards: boolean;
  readonly hasActiveFilters: boolean;
  readonly isLoading: boolean;
  readonly error: unknown;
  readonly deletingCardId: string | undefined;
  readonly isDeleting: boolean;
  readonly searchQuery: string;
  readonly selectedMethod: string;
  readonly selectedRoast: string;
  readonly selectedRepurchaseIntent: RepurchaseFilter;
  readonly minAcidity: number;
  readonly minSweetness: number;
  readonly minBody: number;
  readonly sortBy: string;
  readonly onSearchQueryChange: (value: string) => void;
  readonly onSearchSubmit: () => void;
  readonly onSelectedMethodChange: (value: string) => void;
  readonly onSelectedRoastChange: (value: string) => void;
  readonly onSelectedRepurchaseIntentChange: (value: RepurchaseFilter) => void;
  readonly onMinAcidityChange: (value: number) => void;
  readonly onMinSweetnessChange: (value: number) => void;
  readonly onMinBodyChange: (value: number) => void;
  readonly onSortByChange: (value: string) => void;
  readonly onResetFilters: () => void;
  readonly onCreateCard: () => void;
  readonly onQuickAdd: () => void;
  readonly onOpenLog: () => void;
  readonly onDeleteCard: (id: string) => void;
  readonly onSelectCard: (card: TastingCardData) => void;
  readonly onShareCard: (card: TastingCardData) => void;
  readonly analytics: TasteAnalyticsData | undefined;
  readonly rebuyIntelligence: RebuyIntelligenceData | undefined;
  readonly isRebuyIntelligenceLoading: boolean;
  readonly rebuyIntelligenceError: unknown;
  readonly onOpenPassport: () => void;
  readonly dnaData: CoffeeDNAData | null;
  readonly isDnaLoading: boolean;
  readonly shelfRefreshTrigger: number;
  readonly onShareDNA: () => void;
  readonly onShelfDataChange: () => void;
  readonly onShelfMemoryStarted: () => void;
};

function buildCoffeeSearchUrl(card: TastingCardData): string {
  const query = [card.subtitle, card.title, ...card.tags.slice(0, 2)].filter(Boolean).join(" ");
  return `https://www.google.com/search?q=${encodeURIComponent(query || "coffee beans")}`;
}

function buildCoffeeSearchPhrase(card: TastingCardData): string {
  const query = [card.subtitle, card.title, ...card.tags.slice(0, 2)].filter(Boolean).join(" ");
  return query || "원두 이름 로스터리";
}

function getRepurchaseSaveLabel(card: TastingCardData): string {
  switch (card.repurchase_intent) {
    case "again":
      return "다시 살 후보에 저장됨";
    case "maybe":
      return "고민할 원두로 저장됨";
    case "no":
      return "이번만 마신 기록으로 저장됨";
    case "undecided":
      return "비공개 기억으로 저장됨";
  }
}

function DashboardFirstSaveReward({
  cards,
  onQuickAdd,
}: {
  readonly cards: readonly TastingCardData[];
  readonly onQuickAdd: () => void;
}) {
  const firstCard = cards[0];
  if (!firstCard) return null;

  const keywordParts = [firstCard.title, firstCard.subtitle, ...firstCard.tags.slice(0, 2)].filter(Boolean);
  const keywords = keywordParts.length > 0 ? keywordParts.join(" · ") : "원두 이름과 로스터리";
  const searchPhrase = buildCoffeeSearchPhrase(firstCard);
  const rebuyReason = firstCard.repurchase_reasons.at(0) ?? firstCard.ai_description ?? "좋았던 이유를 한 줄 메모로 다시 열어볼 수 있어요.";
  const searchUrl = firstCard.purchase_url ?? buildCoffeeSearchUrl(firstCard);

  return (
    <section className="premium-shell mb-5" aria-label="저장 후 다음 구매 단서">
      <div className="premium-card grid gap-4 p-4 md:grid-cols-[1.05fr_0.95fr_1fr] md:p-5">
        <article className="rounded-2xl border border-primary-amber/20 bg-primary-amber/10 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary-amber">저장 완료</p>
          <p className="mt-2 break-keep text-xl font-black leading-tight text-background-dark">{firstCard.title}</p>
          <p className="mt-2 inline-flex min-h-8 items-center rounded-full bg-background-dark px-3 text-xs font-black text-[#fff8ec]">
            {getRepurchaseSaveLabel(firstCard)}
          </p>
          <p className="mt-2 break-keep text-sm font-bold leading-6 text-muted-foreground">{rebuyReason}</p>
        </article>
        <article className="rounded-2xl border border-background-dark/10 bg-[#fffaf2] p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary-amber">다음에 이렇게 검색하세요</p>
          <p className="mt-2 break-keep text-sm font-black leading-6 text-background-dark">{keywords}</p>
          <p className="mt-2 rounded-xl border border-background-dark/10 bg-white px-3 py-2 font-mono text-xs font-black text-background-dark">
            {searchPhrase}
          </p>
        </article>
        <article className="rounded-2xl border border-background-dark/10 bg-white p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary-amber">지금 할 일</p>
          <p className="mt-2 break-keep text-sm font-black leading-6 text-background-dark">좋았던 원두는 바로 검색하고, 다음 원두도 20초 기록으로 비교하세요.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              className="inline-flex min-h-9 items-center rounded-full bg-background-dark px-3 text-xs font-black text-[#fff8ec] transition hover:-translate-y-0.5"
              href={searchUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              원두 검색 열기
            </a>
            <button
              type="button"
              onClick={onQuickAdd}
              className="inline-flex min-h-9 items-center rounded-full border border-[#8C5E35]/20 px-3 text-xs font-black text-background-dark transition hover:-translate-y-0.5"
            >
              20초 기록 더 남기기
            </button>
          </div>
          <p className="mt-2 text-xs font-semibold text-muted-foreground">CoffeeDex는 원두 이름을 외우는 대신, 다시 찾을 단서를 남깁니다.</p>
        </article>
      </div>
    </section>
  );
}

export function DashboardShelfView({
  cards,
  totalCardCount,
  hasCards,
  hasActiveFilters,
  isLoading,
  error,
  deletingCardId,
  isDeleting,
  searchQuery,
  selectedMethod,
  selectedRoast,
  selectedRepurchaseIntent,
  minAcidity,
  minSweetness,
  minBody,
  sortBy,
  onSearchQueryChange,
  onSearchSubmit,
  onSelectedMethodChange,
  onSelectedRoastChange,
  onSelectedRepurchaseIntentChange,
  onMinAcidityChange,
  onMinSweetnessChange,
  onMinBodyChange,
  onSortByChange,
  onResetFilters,
  onCreateCard,
  onQuickAdd,
  onOpenLog,
  onDeleteCard,
  onSelectCard,
  onShareCard,
  analytics,
  rebuyIntelligence,
  isRebuyIntelligenceLoading,
  rebuyIntelligenceError,
  onOpenPassport,
  dnaData,
  isDnaLoading,
  shelfRefreshTrigger,
  onShareDNA,
  onShelfDataChange,
  onShelfMemoryStarted,
}: DashboardShelfViewProps) {
  return (
    <>
      <DashboardFirstSaveReward cards={cards} onQuickAdd={onQuickAdd} />
      <DashboardRebuyTimingMemoryPanel cards={cards} onQuickAdd={onQuickAdd} onSelectCard={onSelectCard} />
      <DashboardRebuyClueRescuePanel cards={cards} onQuickAdd={onQuickAdd} onSelectCard={onSelectCard} />
      {(cards.length > 0 || rebuyIntelligence) && (
        <DashboardRebuyIntelligencePanel
          data={rebuyIntelligence}
          cards={cards}
          isLoading={isRebuyIntelligenceLoading}
          error={rebuyIntelligenceError}
          onQuickAdd={onQuickAdd}
          onOpenLog={onOpenLog}
          onShelfMemoryStarted={onShelfMemoryStarted}
          onSelectCard={onSelectCard}
        />
      )}
      {hasCards && (
        <DashboardShelfFilters
          searchQuery={searchQuery}
          selectedMethod={selectedMethod}
          selectedRoast={selectedRoast}
          selectedRepurchaseIntent={selectedRepurchaseIntent}
          minAcidity={minAcidity}
          minSweetness={minSweetness}
          minBody={minBody}
          sortBy={sortBy}
          onSearchQueryChange={onSearchQueryChange}
          onSearchSubmit={onSearchSubmit}
          onSelectedMethodChange={onSelectedMethodChange}
          onSelectedRoastChange={onSelectedRoastChange}
          onSelectedRepurchaseIntentChange={onSelectedRepurchaseIntentChange}
          onMinAcidityChange={onMinAcidityChange}
          onMinSweetnessChange={onMinSweetnessChange}
          onMinBodyChange={onMinBodyChange}
          onSortByChange={onSortByChange}
          onReset={onResetFilters}
        />
      )}
      <CoffeeShelfGrid refreshTrigger={shelfRefreshTrigger} onDataChange={onShelfDataChange} />
      {cards.length > 0 && (
        <>
          <DashboardRetentionLoop cards={cards} onQuickAdd={onQuickAdd} onSelectCard={onSelectCard} />
        </>
      )}
      <div className="coffee-archive-layout">
        <aside className="coffee-passport-sidebar space-y-6 flex flex-col">
          {isDnaLoading ? (
            <div className="rounded-2xl border border-white/10 bg-[#111] p-6 h-[340px] animate-pulse flex flex-col justify-between">
              <div className="h-4 bg-white/10 rounded w-1/3" />
              <div className="size-36 rounded-full bg-white/5 mx-auto" />
              <div className="h-10 bg-white/10 rounded w-full" />
            </div>
          ) : (
            dnaData && (
              <CoffeeDNACard
                dna={dnaData}
                onShareClick={onShareDNA}
              />
            )
          )}
          <DashboardPassportSidebar analytics={analytics} cards={cards} onOpenPassport={onOpenPassport} />
        </aside>
        <div className="coffee-archive-cabinet">
          <DashboardCardsSection
            cards={cards}
            totalCardCount={totalCardCount}
            hasActiveFilters={hasActiveFilters}
            isLoading={isLoading}
            error={error}
            deletingCardId={deletingCardId}
            isDeleting={isDeleting}
            onCreateCard={onCreateCard}
            onQuickAdd={onQuickAdd}
            onDeleteCard={onDeleteCard}
            onSelectCard={onSelectCard}
            onShareCard={onShareCard}
            onResetFilters={onResetFilters}
          />
        </div>
      </div>
      {cards.length > 0 && (
        <DashboardFeaturedArchiveCard card={cards[0]} onCreateCard={onCreateCard} onSelectCard={onSelectCard} />
      )}
    </>
  );
}

"use client";

import DashboardCardsSection from "@/components/dashboard-cards-section";
import { DashboardFeaturedArchiveCard } from "@/components/dashboard-featured-archive-card";
import { DashboardPassportSidebar } from "@/components/dashboard-passport-sidebar";
import { DashboardShelfFilters } from "@/components/dashboard-shelf-filters";
import type { TasteAnalyticsData, TastingCardData } from "@/hooks/useTastingCards";
import type { RepurchaseFilter } from "@/lib/dashboard-card-filter";

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
  readonly onDeleteCard: (id: string) => void;
  readonly onSelectCard: (card: TastingCardData) => void;
  readonly onShareCard: (card: TastingCardData) => void;
  readonly analytics: TasteAnalyticsData | undefined;
  readonly onOpenPassport: () => void;
};

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
  onDeleteCard,
  onSelectCard,
  onShareCard,
  analytics,
  onOpenPassport,
}: DashboardShelfViewProps) {
  return (
    <>
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
      <div className="coffee-archive-layout">
        <DashboardPassportSidebar analytics={analytics} cards={cards} onOpenPassport={onOpenPassport} />
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

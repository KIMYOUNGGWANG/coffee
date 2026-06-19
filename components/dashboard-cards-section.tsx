"use client";

import { AlertCircle, SearchX } from "lucide-react";
import DashboardEmptyState from "@/components/dashboard-empty-state";
import TastingCard from "@/components/TastingCard";
import type { TastingCardData } from "@/hooks/useTastingCards";

type DashboardCardsSectionProps = {
  readonly cards: readonly TastingCardData[];
  readonly totalCardCount: number;
  readonly hasActiveFilters: boolean;
  readonly isLoading: boolean;
  readonly error: unknown;
  readonly deletingCardId: string | undefined;
  readonly isDeleting: boolean;
  readonly onCreateCard: () => void;
  readonly onDeleteCard: (id: string) => void;
  readonly onSelectCard: (card: TastingCardData) => void;
  readonly onShareCard: (card: TastingCardData) => void;
  readonly onResetFilters: () => void;
};

const loadingItems = ["first", "second", "third", "fourth"] as const;

function LoadingCards() {
  return (
    <div className="coffee-shelf-grid" aria-label="원두 선반 불러오는 중">
      {loadingItems.map((item) => (
        <div key={item} className="animate-pulse">
          <div className="aspect-[3/4] rounded-2xl bg-white/5" />
          <div className="mt-3 h-3 w-1/3 rounded bg-white/10" />
          <div className="mt-2 h-5 w-4/5 rounded bg-white/10" />
          <div className="mt-2 h-3 w-1/2 rounded bg-white/5" />
        </div>
      ))}
    </div>
  );
}

function ErrorPanel() {
  return (
    <div className="mx-auto mt-8 max-w-md rounded-3xl border border-red-400/20 bg-red-500/5 p-7 text-center">
      <AlertCircle aria-hidden="true" size={30} className="mx-auto text-red-400" />
      <h2 className="mt-3 font-serif text-lg font-bold text-foreground">선반을 불러오지 못했어요</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">잠시 후 다시 시도해주세요.</p>
    </div>
  );
}

export default function DashboardCardsSection({
  cards,
  totalCardCount,
  hasActiveFilters,
  isLoading,
  error,
  deletingCardId,
  isDeleting,
  onCreateCard,
  onDeleteCard,
  onSelectCard,
  onShareCard,
  onResetFilters,
}: DashboardCardsSectionProps) {
  if (isLoading) return <LoadingCards />;
  if (error) return <ErrorPanel />;
  if (cards.length === 0) {
    if (totalCardCount > 0 && hasActiveFilters) {
      return (
        <section className="mx-auto max-w-lg rounded-3xl border border-white/10 bg-white/5 px-5 py-10 text-center" aria-labelledby="no-memory-results-title">
          <SearchX aria-hidden="true" size={32} className="mx-auto text-primary-amber" />
          <h2 id="no-memory-results-title" className="mt-4 font-serif text-xl font-bold text-foreground">검색 결과가 없어요</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">검색어를 줄이거나 재구매 생각과 맛 조건을 초기화해 보세요.</p>
          <button
            type="button"
            onClick={onResetFilters}
            className="mt-5 min-h-11 rounded-full border border-primary-amber px-5 text-sm font-black text-primary-amber transition-colors hover:bg-primary-amber/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-amber"
          >
            검색과 필터 초기화
          </button>
        </section>
      );
    }
    return <DashboardEmptyState onCreateCard={onCreateCard} />;
  }

  return (
    <div className="coffee-shelf-grid animate-in fade-in duration-300">
      {cards.map((card) => (
        <TastingCard
          key={card.id}
          card={card}
          onDelete={onDeleteCard}
          isDeleting={isDeleting && deletingCardId === card.id}
          onSelect={onSelectCard}
          onShare={onShareCard}
        />
      ))}
    </div>
  );
}

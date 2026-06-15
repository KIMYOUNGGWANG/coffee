"use client";

import { AlertCircle } from "lucide-react";
import DashboardEmptyState from "@/components/dashboard-empty-state";
import TastingCard from "@/components/TastingCard";
import type { TastingCardData } from "@/hooks/useTastingCards";

type DashboardCardsSectionProps = {
  readonly cards: readonly TastingCardData[];
  readonly isLoading: boolean;
  readonly error: unknown;
  readonly deletingCardId: string | undefined;
  readonly isDeleting: boolean;
  readonly onCreateCard: () => void;
  readonly onDeleteCard: (id: string) => void;
  readonly onSelectCard: (card: TastingCardData) => void;
  readonly onShareCard: (card: TastingCardData) => void;
};

function LoadingCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {[1, 2, 3].map((index) => (
        <div key={index} className="aspect-[4/5] bg-white border border-warm-gray/60 rounded-3xl p-6 shadow-sm flex flex-col justify-between animate-pulse">
          <div className="h-4 bg-warm-gray/40 rounded w-1/3" />
          <div className="grid grid-cols-12 gap-4 my-auto">
            <div className="col-span-5 aspect-[3/4] bg-warm-gray/30 rounded-2xl" />
            <div className="col-span-7 space-y-3 py-2">
              <div className="h-4 bg-warm-gray/40 rounded w-3/4" />
              <div className="h-3 bg-warm-gray/30 rounded w-1/2" />
              <div className="space-y-1 pt-4">
                <div className="h-1.5 bg-warm-gray/30 rounded w-full" />
                <div className="h-1.5 bg-warm-gray/30 rounded w-full" />
              </div>
            </div>
          </div>
          <div className="h-12 bg-warm-gray/30 rounded-2xl w-full" />
          <div className="h-4 bg-warm-gray/40 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}

function ErrorPanel() {
  return (
    <div className="bg-red-50/50 border border-red-200 rounded-3xl p-8 text-center space-y-3 max-w-md mx-auto mt-12">
      <AlertCircle size={32} className="text-red-500 mx-auto" />
      <h3 className="font-serif font-bold text-espresso text-base">데이터 로드 실패</h3>
      <p className="text-xs text-espresso/60 leading-relaxed">
        Supabase 연결 또는 서버 권한이 인증되지 않았습니다. API 키와 DB 테이블 스키마 세팅 상태를 다시 점검해주세요.
      </p>
    </div>
  );
}

export default function DashboardCardsSection({
  cards,
  isLoading,
  error,
  deletingCardId,
  isDeleting,
  onCreateCard,
  onDeleteCard,
  onSelectCard,
  onShareCard,
}: DashboardCardsSectionProps) {
  if (isLoading) {
    return <LoadingCards />;
  }

  if (error) {
    return <ErrorPanel />;
  }

  if (cards.length === 0) {
    return <DashboardEmptyState onCreateCard={onCreateCard} />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in duration-300">
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

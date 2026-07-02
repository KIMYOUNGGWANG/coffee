"use client";

import { AlertTriangle, Coffee, ExternalLink, RefreshCcw, Search, ShoppingBag, Sparkles } from "lucide-react";
import type { RebuyIntelligenceData, TastingCardData } from "@/hooks/useTastingCards";

type DashboardRebuyIntelligencePanelProps = {
  readonly data: RebuyIntelligenceData | undefined;
  readonly cards: readonly TastingCardData[];
  readonly isLoading: boolean;
  readonly error: unknown;
  readonly onQuickAdd: () => void;
  readonly onOpenLog: () => void;
  readonly onSelectCard: (card: TastingCardData) => void;
};

function findCard(cards: readonly TastingCardData[], id: string | null): TastingCardData | null {
  if (!id) return null;
  return cards.find((card) => card.id === id) ?? null;
}

function openExternal(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

export function DashboardRebuyIntelligencePanel({
  data,
  cards,
  isLoading,
  error,
  onQuickAdd,
  onOpenLog,
  onSelectCard,
}: DashboardRebuyIntelligencePanelProps) {
  if (isLoading) {
    return (
      <section className="espresso-panel p-5" aria-label="Rebuy Intelligence">
        <div className="h-4 w-36 animate-pulse rounded-full bg-white/10" />
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {[0, 1, 2, 3, 4].map((index) => (
            <div key={index} className="h-36 animate-pulse rounded-2xl bg-white/[0.055]" />
          ))}
        </div>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="espresso-panel p-5" aria-label="Rebuy Intelligence">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-1 text-primary-amber" size={18} />
          <div>
            <h2 className="font-serif text-xl font-black">재구매 루프를 불러오지 못했어요</h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-[#FFF8EC]/58">
              카드와 원두 서랍은 그대로 사용할 수 있어요. 잠시 후 다시 열면 다음 행동을 계산합니다.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const reminderCard = findCard(cards, data.rebuyReminder.cardId);
  const matchCard = findCard(cards, data.tasteMatch.matchCardId ?? data.tasteMatch.anchorCardId);
  const purchaseCard = findCard(cards, data.purchaseMemory.cardId);
  const topScore = data.featureScores[0];

  return (
    <section className="espresso-panel p-4 sm:p-5" aria-label="Rebuy Intelligence">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <span className="coffee-kicker">
            <RefreshCcw size={12} />
            Rebuy Intelligence
          </span>
          <h2 className="mt-3 break-keep font-serif text-2xl font-black leading-tight sm:text-3xl">
            다음에 다시 살 커피를 놓치지 않게
          </h2>
          <p className="mt-2 max-w-2xl break-keep text-sm font-semibold leading-6 text-[#FFF8EC]/62">
            {data.summary}
          </p>
        </div>
        <div className="coffee-metric-card">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary-amber/80">Top ROI</p>
          <p className="mt-1 text-sm font-black text-[#FFF8EC]">{topScore.roi}점 · {topScore.reason}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <button
          type="button"
          onClick={onOpenLog}
          className="coffee-metric-card min-w-0 text-left transition hover:-translate-y-0.5 hover:border-primary-amber/35"
        >
          <p className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-primary-amber/80">
            <Coffee size={13} />
            Next Cup
          </p>
          <p className="mt-3 break-keep text-base font-black leading-6">{data.nextCupPlan.title}</p>
          <p className="mt-1 truncate text-xs font-semibold text-[#FFF8EC]/45">
            {data.nextCupPlan.subtitle} · {data.nextCupPlan.suggestedMethod}
          </p>
          <p className="mt-3 break-keep text-sm font-semibold leading-6 text-[#FFF8EC]/62">{data.nextCupPlan.reason}</p>
          <span className="mt-4 inline-flex min-h-9 items-center rounded-full bg-primary-amber px-3 text-xs font-black text-background-dark">
            {data.nextCupPlan.actionLabel}
          </span>
        </button>

        <button
          type="button"
          onClick={() => (reminderCard ? onSelectCard(reminderCard) : onQuickAdd())}
          className="coffee-metric-card min-w-0 text-left transition hover:-translate-y-0.5 hover:border-primary-amber/35"
        >
          <p className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-primary-amber/80">
            <ShoppingBag size={13} />
            Rebuy Reminder
          </p>
          <p className="mt-3 break-keep text-base font-black leading-6">{data.rebuyReminder.title}</p>
          <p className="mt-1 truncate text-xs font-semibold text-[#FFF8EC]/45">{data.rebuyReminder.subtitle}</p>
          <p className="mt-3 break-keep text-sm font-semibold leading-6 text-[#FFF8EC]/62">{data.rebuyReminder.reason}</p>
          <span className="mt-4 inline-flex min-h-9 items-center rounded-full bg-primary-amber px-3 text-xs font-black text-background-dark">
            {data.rebuyReminder.actionLabel}
          </span>
        </button>

        <button
          type="button"
          onClick={() => (matchCard ? onSelectCard(matchCard) : onQuickAdd())}
          className="coffee-metric-card min-w-0 text-left transition hover:-translate-y-0.5 hover:border-primary-amber/35"
        >
          <p className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-primary-amber/80">
            <Sparkles size={13} />
            Taste Match
          </p>
          <p className="mt-3 break-keep text-base font-black leading-6">{data.tasteMatch.matchTitle}</p>
          <p className="mt-1 truncate text-xs font-semibold text-[#FFF8EC]/45">{data.tasteMatch.anchorTitle}</p>
          <p className="mt-3 break-keep text-sm font-semibold leading-6 text-[#FFF8EC]/62">{data.tasteMatch.reason}</p>
          <p className="mt-4 line-clamp-2 text-xs font-black text-primary-amber">{data.tasteMatch.searchPrompt}</p>
        </button>

        <button
          type="button"
          onClick={() => openExternal(data.purchaseMemory.searchUrl)}
          className="coffee-metric-card min-w-0 text-left transition hover:-translate-y-0.5 hover:border-primary-amber/35"
        >
          <p className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-primary-amber/80">
            <Search size={13} />
            Bag To Rebuy
          </p>
          <p className="mt-3 break-keep text-base font-black leading-6">{data.purchaseMemory.title}</p>
          <p className="mt-1 truncate text-xs font-semibold text-[#FFF8EC]/45">{data.purchaseMemory.subtitle}</p>
          <p className="mt-3 break-keep text-sm font-semibold leading-6 text-[#FFF8EC]/62">{data.purchaseMemory.reason}</p>
          <span className="mt-4 inline-flex min-h-9 items-center gap-1.5 rounded-full border border-primary-amber/30 px-3 text-xs font-black text-primary-amber">
            재구매 검색 열기
            <ExternalLink size={13} />
          </span>
        </button>

        <button
          type="button"
          onClick={() => (purchaseCard ? onSelectCard(purchaseCard) : onQuickAdd())}
          className="coffee-metric-card min-w-0 text-left transition hover:-translate-y-0.5 hover:border-primary-amber/35"
        >
          <p className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-primary-amber/80">
            <AlertTriangle size={13} />
            Brew Failure
          </p>
          <p className="mt-3 break-keep text-base font-black leading-6">{data.brewFailureMemory.title}</p>
          <p className="mt-1 truncate text-xs font-semibold text-[#FFF8EC]/45">{data.brewFailureMemory.subtitle}</p>
          <p className="mt-3 break-keep text-sm font-semibold leading-6 text-[#FFF8EC]/62">{data.brewFailureMemory.adjustment}</p>
          <p className="mt-4 line-clamp-2 text-xs font-semibold text-[#FFF8EC]/45">{data.brewFailureMemory.evidence}</p>
        </button>
      </div>
    </section>
  );
}

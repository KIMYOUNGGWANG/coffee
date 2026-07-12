"use client";

import { useState } from "react";
import { Clock3, RefreshCcw } from "lucide-react";
import { DashboardNextPurchaseMemoryCard } from "@/components/dashboard-next-purchase-memory-card";
import { useAnalyticsEvents } from "@/hooks/use-analytics-events";
import { useStartRebuyShelfMemory } from "@/hooks/use-rebuy-shelf-memory";
import type { TastingCardData } from "@/hooks/useTastingCards";
import { buildRebuyShelfTransferPayload } from "@/lib/rebuy-shelf-transfer";
import { buildRebuyTimingMemory, type RebuyTimingCandidate } from "@/lib/rebuy-timing-memory";

type DashboardRebuyTimingMemoryPanelProps = {
  readonly cards: readonly TastingCardData[];
  readonly onQuickAdd: () => void;
  readonly onSelectCard: (card: TastingCardData) => void;
};

function findCard(cards: readonly TastingCardData[], candidate: RebuyTimingCandidate): TastingCardData | null {
  return cards.find((card) => card.id === candidate.cardId) ?? null;
}

export function DashboardRebuyTimingMemoryPanel({ cards, onQuickAdd, onSelectCard }: DashboardRebuyTimingMemoryPanelProps) {
  const { trackEvent } = useAnalyticsEvents();
  const startShelfMemoryMutation = useStartRebuyShelfMemory();
  const memory = buildRebuyTimingMemory(cards);
  const [copiedCardId, setCopiedCardId] = useState<string | null>(null);
  const [savingShelfCardId, setSavingShelfCardId] = useState<string | null>(null);
  const [savedShelfCardIds, setSavedShelfCardIds] = useState<readonly string[]>([]);
  const savedShelfCardIdSet = new Set(savedShelfCardIds);

  async function copySearchPhrase(candidate: RebuyTimingCandidate) {
    try {
      await navigator.clipboard.writeText(candidate.searchPhrase);
      setCopiedCardId(candidate.cardId);
      window.setTimeout(() => setCopiedCardId((current) => (current === candidate.cardId ? null : current)), 1800);
    } catch (error: unknown) {
      if (error instanceof Error) {
        window.alert("검색 문장을 복사하지 못했습니다. 문장을 길게 눌러 직접 복사해주세요.");
        return;
      }
      throw error;
    }
  }

  function openCard(card: TastingCardData | null) {
    if (!card) {
      onQuickAdd();
      return;
    }
    trackEvent("next_purchase_memory_opened", { action: "memory_card", clue: "none" });
    onSelectCard(card);
  }

  function openPurchase(candidate: RebuyTimingCandidate) {
    trackEvent("next_purchase_memory_opened", {
      action: "purchase_clue",
      clue: candidate.hasDirectPurchaseClue ? "saved_link" : "search",
    });
    window.open(candidate.searchUrl, "_blank", "noopener,noreferrer");
  }

  async function startShelfMemory(card: TastingCardData | null, candidate: RebuyTimingCandidate) {
    if (!card) {
      onQuickAdd();
      return;
    }

    try {
      setSavingShelfCardId(candidate.cardId);
      const result = await startShelfMemoryMutation.mutateAsync(buildRebuyShelfTransferPayload(card));
      if (!result.reused) trackEvent("rebuy_shelf_memory_started", { source: "next_purchase_memory" });
      setSavedShelfCardIds((current) => Array.from(new Set([...current, candidate.cardId])));
    } catch (error: unknown) {
      if (error instanceof Error) {
        window.alert(error.message);
        return;
      }
      throw error;
    } finally {
      setSavingShelfCardId(null);
    }
  }

  if (cards.length === 0) return null;
  if (memory.candidates.length === 0) {
    return (
      <section className="premium-shell mb-5" aria-label="다음 원두 기억">
        <div className="premium-card flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <span className="coffee-kicker"><RefreshCcw size={12} /> 다음 원두 기억</span>
            <h2 className="mt-3 break-keep text-2xl font-black leading-tight text-background-dark">다시 찾을 원두를 하나만 표시해두세요</h2>
            <p className="mt-2 max-w-2xl break-keep text-sm font-bold leading-6 text-muted-foreground">{memory.summary}</p>
          </div>
          <button type="button" onClick={onQuickAdd} className="inline-flex min-h-11 items-center justify-center rounded-full bg-background-dark px-4 text-sm font-black text-cream">20초 기록 남기기</button>
        </div>
      </section>
    );
  }

  return (
    <section className="premium-shell mb-5" aria-label="다음 원두 기억">
      <div className="premium-card p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="coffee-kicker"><Clock3 size={12} /> 다음 원두를 고르기 전</span>
            <h2 className="mt-3 max-w-2xl break-keep text-2xl font-black leading-tight text-background-dark">좋았던 원두를 다시 보세요</h2>
            <p className="mt-2 max-w-2xl break-keep text-sm font-bold leading-6 text-muted-foreground">{memory.summary}</p>
          </div>
          <div className="rounded-2xl border border-background-dark/10 bg-cream/70 px-4 py-3">
            <p className="text-[10px] font-black tracking-[0.12em] text-background-dark/70">내 기록 근거</p>
            <p className="mt-1 text-sm font-black text-background-dark">{memory.evidenceLabel}</p>
          </div>
        </div>

        {memory.choiceConditions.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2" aria-label="다음 원두 선택 조건">
            <span className="mr-1 text-xs font-black text-muted-foreground">다음에도 찾아볼 맛</span>
            {memory.choiceConditions.map((condition) => (
              <span key={condition} className="inline-flex min-h-9 items-center rounded-full border border-primary-amber/25 bg-primary-amber/10 px-3 text-xs font-black text-background-dark">{condition}</span>
            ))}
          </div>
        )}

        <div className={`mt-5 grid gap-3 md:grid-cols-2 ${memory.candidates.length >= 3 ? "xl:grid-cols-3" : ""}`}>
          {memory.candidates.map((candidate) => {
            const card = findCard(cards, candidate);
            return (
              <DashboardNextPurchaseMemoryCard
                key={candidate.cardId}
                candidate={candidate}
                card={card}
                isCopied={copiedCardId === candidate.cardId}
                isSavingShelf={savingShelfCardId === candidate.cardId}
                isSavedShelf={savedShelfCardIdSet.has(candidate.cardId)}
                onCopy={(value) => void copySearchPhrase(value)}
                onOpenCard={openCard}
                onOpenPurchase={openPurchase}
                onStartShelf={(value, timingCandidate) => void startShelfMemory(value, timingCandidate)}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

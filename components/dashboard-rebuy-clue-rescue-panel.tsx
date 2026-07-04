"use client";

import { AlertCircle, BookOpenText, PencilLine } from "lucide-react";
import type { TastingCardData } from "@/hooks/useTastingCards";
import { buildRebuyClueRescue, type RebuyClueRescueCandidate } from "@/lib/rebuy-clue-rescue";

type DashboardRebuyClueRescuePanelProps = {
  readonly cards: readonly TastingCardData[];
  readonly onQuickAdd: () => void;
  readonly onSelectCard: (card: TastingCardData) => void;
};

function priorityClassName(candidate: RebuyClueRescueCandidate): string {
  switch (candidate.priority) {
    case "high":
      return "border-[#B45309]/25 bg-[#B45309]/12 text-[#5A2B0B]";
    case "medium":
      return "border-primary-amber/25 bg-primary-amber/12 text-background-dark";
    case "low":
      return "border-emerald-700/15 bg-emerald-700/8 text-emerald-950";
  }
}

function findCard(cards: readonly TastingCardData[], candidate: RebuyClueRescueCandidate): TastingCardData | null {
  return cards.find((card) => card.id === candidate.cardId) ?? null;
}

export function DashboardRebuyClueRescuePanel({
  cards,
  onQuickAdd,
  onSelectCard,
}: DashboardRebuyClueRescuePanelProps) {
  const rescue = buildRebuyClueRescue(cards);

  if (cards.length === 0 || rescue.candidates.length === 0) return null;

  return (
    <section className="premium-shell mb-5" aria-label="재구매 단서 보강">
      <div className="premium-card p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="coffee-kicker">
              <AlertCircle size={12} />
              단서 보강 큐
            </span>
            <h2 className="mt-3 break-keep font-serif text-2xl font-black leading-tight text-background-dark">
              다시 사고 싶은데 나중에 못 찾을 기록을 먼저 보강하세요
            </h2>
            <p className="mt-2 max-w-2xl break-keep text-sm font-bold leading-6 text-muted-foreground">
              {rescue.summary} 구매처, 가격, 구매 링크, 다시 살 이유를 기준으로 봅니다.
            </p>
          </div>
          <div className="rounded-2xl border border-background-dark/10 bg-[#fffaf2] px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary-amber">
              Memory Rescue
            </p>
            <p className="mt-1 text-sm font-black text-background-dark">
              {rescue.totalCandidates}개 보강 필요
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {rescue.candidates.map((candidate) => {
            const card = findCard(cards, candidate);
            return (
              <article
                key={candidate.cardId}
                className="flex min-h-[230px] flex-col rounded-2xl border border-background-dark/10 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className={`inline-flex min-h-7 items-center rounded-full border px-2.5 text-[11px] font-black ${priorityClassName(candidate)}`}>
                    {candidate.priority === "high" ? "먼저 보강" : candidate.priority === "medium" ? "보강 추천" : "가볍게 확인"}
                  </span>
                  <span className="shrink-0 text-xs font-black text-muted-foreground">
                    {candidate.daysSince}일 전
                  </span>
                </div>
                <p className="mt-4 break-keep text-lg font-black leading-6 text-background-dark">
                  {candidate.title}
                </p>
                <p className="mt-1 truncate text-xs font-black uppercase tracking-[0.12em] text-primary-amber">
                  {candidate.subtitle || "CoffeeDex"}
                </p>
                <div className="mt-4 rounded-2xl border border-primary-amber/20 bg-[#fff8ec] p-3">
                  <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-primary-amber">
                    <BookOpenText size={12} />
                    지금 남은 단서
                  </p>
                  <p className="mt-1 line-clamp-2 break-keep text-xs font-bold leading-5 text-background-dark">
                    {candidate.savedClue}
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {candidate.missingLabels.map((label) => (
                    <span key={label} className="rounded-full border border-background-dark/10 bg-[#fffaf2] px-2 py-1 text-[10px] font-black text-background-dark/75">
                      {label} 없음
                    </span>
                  ))}
                </div>
                <p className="mt-3 break-keep text-sm font-bold leading-6 text-muted-foreground">
                  {candidate.rescuePrompt}
                </p>
                <div className="mt-auto grid gap-2 pt-4 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => (card ? onSelectCard(card) : onQuickAdd())}
                    className="inline-flex min-h-10 items-center justify-center rounded-full border border-[#8C5E35]/20 px-3 text-xs font-black text-background-dark transition hover:-translate-y-0.5"
                  >
                    카드 열기
                  </button>
                  <button
                    type="button"
                    onClick={onQuickAdd}
                    className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full bg-background-dark px-3 text-xs font-black text-[#fff8ec] transition hover:-translate-y-0.5"
                  >
                    <PencilLine size={13} />
                    다음 기록에 단서 남기기
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

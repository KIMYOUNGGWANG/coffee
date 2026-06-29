"use client";

import { Clock3, RotateCcw, Sparkles } from "lucide-react";
import type { TastingCardData } from "@/hooks/useTastingCards";
import { getBrewRecallSummary } from "@/lib/brew-recall";

type DashboardRetentionLoopProps = {
  readonly cards: readonly TastingCardData[];
  readonly onQuickAdd: () => void;
  readonly onSelectCard: (card: TastingCardData) => void;
};

function getPrivateRebuyReason(card: TastingCardData | undefined): string | null {
  if (!card || card.repurchase_intent !== "again") return null;
  return card.repurchase_reasons.find((reason) => reason.trim().length > 0)?.trim() ?? null;
}

export function DashboardRetentionLoop({ cards, onQuickAdd, onSelectCard }: DashboardRetentionLoopProps) {
  const rebuyCard = cards.find((card) => getPrivateRebuyReason(card));
  const brewCard = cards.find((card) => getBrewRecallSummary(card.footer_meta.extraInfo));
  const anchorCard = rebuyCard ?? brewCard ?? cards[0];
  const rebuyReason = getPrivateRebuyReason(rebuyCard ?? anchorCard);
  const brewSummary = getBrewRecallSummary((brewCard ?? anchorCard)?.footer_meta.extraInfo);

  if (!anchorCard) return null;

  return (
    <section className="rounded-[1.75rem] border border-primary-amber/18 bg-[#2A1A12] p-4 text-[#FFF8EC] shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-5" aria-label="오늘 다시 찾을 기억">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-amber/28 bg-primary-amber/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-primary-amber">
              <RotateCcw size={12} />
              Retention
            </span>
            <span className="text-xs font-black text-[#FFF8EC]/44">{cards.length}개 기억 중</span>
          </div>
          <h2 className="mt-3 break-keep font-serif text-2xl font-black leading-tight sm:text-3xl">오늘 다시 찾을 기억</h2>
          <p className="mt-2 break-keep text-sm font-semibold leading-6 text-[#FFF8EC]/62">
            좋았던 이유와 마지막 추출 힌트를 바로 이어서 남겨요.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onSelectCard(anchorCard)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-4 text-sm font-black text-[#FFF8EC] transition hover:-translate-y-0.5 hover:border-primary-amber/35 hover:text-primary-amber"
          >
            <Sparkles size={16} />
            기억 열기
          </button>
          <button
            type="button"
            onClick={onQuickAdd}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-primary-amber bg-primary-amber px-4 text-sm font-black text-background-dark transition hover:-translate-y-0.5"
          >
            빠른 기록 남기기
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <button
          type="button"
          onClick={() => onSelectCard(rebuyCard ?? anchorCard)}
          className="min-w-0 rounded-2xl border border-white/12 bg-white/[0.035] p-4 text-left transition hover:border-primary-amber/30"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary-amber/80">다시 살 이유</p>
          <p className="mt-2 break-keep text-base font-black leading-6 text-[#FFF8EC]">
            {rebuyReason ?? "아직 다시 살 이유를 남긴 원두가 없어요."}
          </p>
          <p className="mt-1 truncate text-xs font-semibold text-[#FFF8EC]/45">{(rebuyCard ?? anchorCard).title}</p>
        </button>

        <button
          type="button"
          onClick={() => onSelectCard(brewCard ?? anchorCard)}
          className="min-w-0 rounded-2xl border border-white/12 bg-white/[0.035] p-4 text-left transition hover:border-primary-amber/30"
        >
          <p className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-primary-amber/80">
            <Clock3 size={12} />
            마지막 좋았던 추출
          </p>
          <p className="mt-2 break-keep text-base font-black leading-6 text-[#FFF8EC]">
            {brewSummary ?? "추출 힌트를 남기면 다음 컵에서 바로 이어집니다."}
          </p>
          <p className="mt-1 truncate text-xs font-semibold text-[#FFF8EC]/45">{(brewCard ?? anchorCard).title}</p>
        </button>
      </div>
    </section>
  );
}

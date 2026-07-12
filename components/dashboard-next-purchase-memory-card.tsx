"use client";

import { Check, Clock3, Copy, ExternalLink, Search, ShoppingBag } from "lucide-react";
import type { TastingCardData } from "@/hooks/useTastingCards";
import { buildRebuyPaceMemory } from "@/lib/rebuy-pace-memory";
import { buildRebuyPurchaseMemory } from "@/lib/rebuy-purchase-memory";
import type { RebuyTimingCandidate } from "@/lib/rebuy-timing-memory";

type DashboardNextPurchaseMemoryCardProps = {
  readonly candidate: RebuyTimingCandidate;
  readonly card: TastingCardData | null;
  readonly isCopied: boolean;
  readonly isSavingShelf: boolean;
  readonly isSavedShelf: boolean;
  readonly onCopy: (candidate: RebuyTimingCandidate) => void;
  readonly onOpenCard: (card: TastingCardData | null) => void;
  readonly onOpenPurchase: (candidate: RebuyTimingCandidate) => void;
  readonly onStartShelf: (card: TastingCardData | null, candidate: RebuyTimingCandidate) => void;
};

function stageClassName(candidate: RebuyTimingCandidate): string {
  switch (candidate.stage) {
    case "fresh":
      return "border-primary-amber/15 bg-primary-amber/8 text-background-dark";
    case "check":
      return "border-primary-amber/25 bg-primary-amber/12 text-background-dark";
    case "overdue":
      return "border-background-dark/20 bg-warm-gray/40 text-background-dark";
  }
}

export function DashboardNextPurchaseMemoryCard({
  candidate,
  card,
  isCopied,
  isSavingShelf,
  isSavedShelf,
  onCopy,
  onOpenCard,
  onOpenPurchase,
  onStartShelf,
}: DashboardNextPurchaseMemoryCardProps) {
  const purchaseMemory = buildRebuyPurchaseMemory(card?.purchase_note ?? null);
  const paceMemory = buildRebuyPaceMemory(card?.purchase_note ?? null, candidate.daysSince);

  return (
    <article className="flex min-h-[280px] flex-col overflow-hidden rounded-[26px] border border-background-dark/10 bg-white shadow-sm">
      {candidate.imageUrl && (
        <div className="aspect-[4/3] overflow-hidden bg-background-dark/5">
          <img
            src={candidate.imageUrl}
            alt={`${candidate.subtitle} ${candidate.title} 원두 기억`}
            width={720}
            height={540}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </div>
      )}

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <span className={`inline-flex min-h-7 items-center rounded-full border px-2.5 text-[11px] font-black ${stageClassName(candidate)}`}>
            {candidate.stageLabel}
          </span>
          <span className="shrink-0 text-xs font-black text-muted-foreground">{candidate.daysSince}일 전</span>
        </div>
        <p className="mt-3 break-keep text-lg font-black leading-6 text-background-dark">{candidate.title}</p>
        <p className="mt-1 truncate text-xs font-black tracking-[0.08em] text-background-dark/75">{candidate.subtitle || "CoffeeDex"}</p>
        <p className="mt-3 line-clamp-2 break-keep text-sm font-bold leading-6 text-muted-foreground">{candidate.reason}</p>

        <div className="mt-3 rounded-2xl border border-background-dark/10 bg-cream/70 p-3">
          <p className="flex items-center gap-1.5 text-[10px] font-black tracking-[0.12em] text-background-dark/70">
            <ShoppingBag size={12} /> 구매 단서
          </p>
          <p className="mt-1 line-clamp-2 break-keep text-xs font-bold leading-5 text-background-dark">{candidate.purchaseCue}</p>
          {purchaseMemory.hasStructuredMemory && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {purchaseMemory.summaryLabels.map((label) => (
                <span key={label} className="rounded-full border border-background-dark/10 bg-white px-2 py-1 text-[10px] font-black text-background-dark/75">{label}</span>
              ))}
            </div>
          )}
          {paceMemory.hasCue && (
            <p className="mt-2 flex items-center gap-1.5 break-keep text-[11px] font-black text-background-dark">
              <Clock3 size={12} /> {paceMemory.cupsLabel} · {paceMemory.timingLabel}
            </p>
          )}
        </div>

        <div className="mt-3 flex items-start justify-between gap-3 rounded-2xl border border-primary-amber/20 bg-primary-amber/10 p-3">
          <div className="min-w-0">
            <p className="text-[10px] font-black tracking-[0.12em] text-background-dark/70">다음 검색 문장</p>
            <p className="mt-1 line-clamp-2 break-keep text-xs font-bold leading-5 text-background-dark">{candidate.searchPhrase}</p>
          </div>
          <button type="button" onClick={() => onCopy(candidate)} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1 rounded-full border border-background-dark/10 bg-white px-3 text-[11px] font-black text-background-dark">
            {isCopied ? <Check size={12} /> : <Copy size={12} />} {isCopied ? "복사됨" : "복사"}
          </button>
        </div>

        <div className="mt-auto grid gap-2 pt-4 sm:grid-cols-2">
          <button type="button" onClick={() => onOpenCard(card)} className="inline-flex min-h-11 items-center justify-center rounded-full border border-background-dark/15 px-3 text-xs font-black text-background-dark">기억 열기</button>
          <button type="button" onClick={() => onOpenPurchase(candidate)} className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full bg-background-dark px-3 text-xs font-black text-cream">
            {candidate.hasDirectPurchaseClue ? <ExternalLink size={13} /> : <Search size={13} />} {candidate.actionLabel}
          </button>
        </div>
        <button type="button" disabled={isSavingShelf || isSavedShelf} onClick={() => onStartShelf(card, candidate)} className="mt-2 inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-primary-amber/30 bg-primary-amber/10 px-3 text-xs font-black text-background-dark disabled:cursor-not-allowed disabled:opacity-70">
          <ShoppingBag size={13} /> {isSavedShelf ? "선반 기억 시작됨" : isSavingShelf ? "선반에 저장 중" : "다시 샀음, 선반 시작"}
        </button>
      </div>
    </article>
  );
}

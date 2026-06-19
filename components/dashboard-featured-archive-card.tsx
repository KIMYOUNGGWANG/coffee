"use client";

import { Camera, ChevronRight, ImageOff, Star } from "lucide-react";
import type { TastingCardData } from "@/hooks/useTastingCards";

type DashboardFeaturedArchiveCardProps = {
  readonly card: TastingCardData | undefined;
  readonly onCreateCard: () => void;
  readonly onSelectCard: (card: TastingCardData) => void;
};

function roastLabel(card: TastingCardData): string {
  return card.badges.find((badge) => /light|medium|dark/i.test(badge)) ?? "Light Roast";
}

export function DashboardFeaturedArchiveCard({
  card,
  onCreateCard,
  onSelectCard,
}: DashboardFeaturedArchiveCardProps) {
  if (!card) return null;

  return (
    <section className="coffee-archive-detail-card" aria-label="최근 원두 상세 요약">
      <button
        type="button"
        onClick={() => onSelectCard(card)}
        className="grid min-w-0 grid-cols-[5rem_1fr] gap-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-amber sm:grid-cols-[7rem_1fr_auto]"
      >
        <span className="grid aspect-[3/4] place-items-center overflow-hidden rounded-2xl border border-paper-border bg-paper-surface text-paper-muted-foreground shadow-sm">
          {card.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={card.image_url} alt={`${card.title} 원두 패키지`} className="h-full w-full object-contain" />
          ) : (
            <ImageOff aria-hidden="true" size={24} />
          )}
        </span>
        <span className="min-w-0">
          <span className="rounded-full bg-[#6f5434]/10 px-2.5 py-1 text-[10px] font-black text-[#7a4b1f]">최근 기록</span>
          <span className="mt-3 block break-keep font-serif text-xl font-black leading-tight text-paper-foreground sm:text-2xl">
            {card.title}
          </span>
          <span className="mt-1 block text-xs font-bold text-paper-muted-foreground">
            {card.footer_meta.origin ?? card.package_origin ?? "원산지 미기록"} · {roastLabel(card)}
          </span>
          <span className="mt-3 grid grid-cols-3 gap-2 text-xs text-paper-muted-foreground">
            <span><b className="block text-paper-foreground">가공</b>{card.package_process ?? "미기록"}</span>
            <span><b className="block text-paper-foreground">향미</b>{card.tags[0] ?? "미기록"}</span>
            <span><b className="block text-paper-foreground">평점</b><Star aria-hidden="true" size={11} className="inline fill-current text-[#b97832]" /> {((card.metric1 + card.metric2 + card.metric3) / 3).toFixed(1)}</span>
          </span>
        </span>
        <span className="hidden self-center rounded-full border border-paper-border px-4 py-3 text-xs font-black text-[#7a4b1f] sm:inline-flex">
          상세 보기 <ChevronRight aria-hidden="true" size={14} />
        </span>
      </button>
      <button
        type="button"
        onClick={onCreateCard}
        className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary-amber px-4 text-sm font-black text-background-dark shadow-[0_14px_30px_rgba(217,160,91,0.22)] transition-transform active:scale-[0.98] sm:w-auto sm:px-7"
      >
        <Camera aria-hidden="true" size={16} />
        새 원두 스캔
      </button>
    </section>
  );
}

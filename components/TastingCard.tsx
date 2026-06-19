"use client";

import { ImageOff, Share2, Star, Trash2 } from "lucide-react";
import type { TastingCardData } from "@/hooks/useTastingCards";
import type { RepurchaseIntent } from "@/lib/coffee-memory";

type TastingCardProps = {
  readonly card: TastingCardData;
  readonly onDelete?: (id: string) => void;
  readonly isDeleting?: boolean;
  readonly onSelect?: (card: TastingCardData) => void;
  readonly onShare?: (card: TastingCardData) => void;
};

function cardRating(card: TastingCardData): string {
  return ((card.metric1 + card.metric2 + card.metric3) / 3).toFixed(1);
}

const repurchaseLabels: Readonly<Record<RepurchaseIntent, string>> = {
  again: "다시 살래요",
  maybe: "재구매 고민 중",
  no: "다시 안 사요",
  undecided: "재구매 미정",
};

export default function TastingCard({
  card,
  onDelete,
  isDeleting = false,
  onSelect,
  onShare,
}: TastingCardProps) {
  const origin = card.package_origin || card.footer_meta?.origin || "원산지 미기록";
  const tastingNotes = card.tags.slice(0, 3);

  return (
    <article className="coffee-shelf-item group min-w-0">
      <button
        type="button"
        onClick={() => onSelect?.(card)}
        className="block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-amber focus-visible:ring-offset-4 focus-visible:ring-offset-background-dark"
        aria-label={`${card.title} 상세 보기`}
      >
        <div className="coffee-package-stage">
          {card.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={card.image_url}
              alt={`${card.title} 원두 패키지`}
              className="coffee-package-image"
              loading="lazy"
            />
          ) : (
            <span className="coffee-package-missing">
              <ImageOff aria-hidden="true" size={28} />
              <span>패키지 사진 없음</span>
            </span>
          )}
        </div>

        <div className="mt-3 min-w-0">
          <p className="truncate text-[11px] font-bold text-primary-amber">{origin}</p>
          <h2 className="mt-1 line-clamp-2 break-keep font-serif text-lg font-black leading-tight tracking-[-0.03em] text-foreground sm:text-xl">
            {card.title}
          </h2>
          <p className="mt-1 truncate text-xs font-semibold text-muted-foreground">{card.subtitle}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="rounded-full border border-primary-amber/40 bg-primary-amber/10 px-2 py-1 text-[10px] font-black text-primary-amber">
              {repurchaseLabels[card.repurchase_intent]}
            </span>
            {card.package_process && (
              <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] font-bold text-muted-foreground">
                {card.package_process}
              </span>
            )}
          </div>
          {tastingNotes.length > 0 && (
            <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">
              {tastingNotes.join(" · ")}
            </p>
          )}
        </div>
      </button>

      <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2.5">
        <span className="inline-flex items-center gap-1 text-xs font-bold text-primary-amber">
          <Star aria-hidden="true" size={13} fill="currentColor" />
          {cardRating(card)}
        </span>
        <div className="flex items-center gap-1">
          {onShare && (
            <button
              type="button"
              onClick={() => onShare(card)}
              className="grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-white/5 hover:text-primary-amber focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-amber"
              aria-label={`${card.title} 공유`}
            >
              <Share2 aria-hidden="true" size={15} />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(card.id)}
              disabled={isDeleting}
              className="grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:opacity-40"
              aria-label={`${card.title} 삭제`}
            >
              <Trash2 aria-hidden="true" size={15} />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

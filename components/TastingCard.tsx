"use client";

import { useState } from "react";
import { ImageOff, Share2, Star, Trash2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import type { TastingCardData } from "@/hooks/useTastingCards";
import type { RepurchaseIntent } from "@/lib/coffee-memory";
import BrewingGuide from "@/components/BrewingGuide";

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
  const [isFlipped, setIsFlipped] = useState(false);
  
  const origin = card.package_origin || card.footer_meta?.origin || "원산지 미기록";
  const tastingNotes = card.tags.slice(0, 3);
  const privateRebuyReason = card.repurchase_intent === "again"
    ? card.repurchase_reasons.find((reason) => reason.trim().length > 0)?.trim()
    : undefined;

  return (
    <div className="coffee-shelf-item perspective-1000 w-full h-full min-h-[380px] group">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0, rotateY: isFlipped ? 180 : 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        whileHover={{ y: -8, scale: 1.02 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full h-full relative preserve-3d"
      >
        {/* FRONT FACE */}
        <article 
          className={`absolute inset-0 backface-hidden min-w-0 rounded-[1.35rem] border border-background-dark/10 bg-[#FFF8EC]/88 p-5 shadow-[0_18px_42px_rgba(73,48,36,0.14)] flex flex-col cursor-pointer transition-[background-color,transform,box-shadow] hover:bg-[#FFF8EC] ${isFlipped ? "pointer-events-none" : "pointer-events-auto"}`}
          aria-hidden={isFlipped}
          onClick={() => setIsFlipped(true)}
        >
      <button
        type="button"
        onClick={() => onSelect?.(card)}
        className="block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-amber focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--background)]"
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
              <span className="font-light">패키지 사진 없음</span>
            </span>
          )}
        </div>

        <div className="mt-5 min-w-0">
          <p className="mb-2 truncate text-[10px] font-black uppercase tracking-[0.16em] text-primary-amber">{origin}</p>
          <h2 className="mt-1 line-clamp-2 break-keep font-serif text-2xl font-black leading-tight tracking-tight text-background-dark sm:text-3xl">
            {card.title}
          </h2>
          <p className="mt-2 truncate text-xs font-light text-muted-foreground">{card.subtitle}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-lg border border-primary-amber/30 bg-primary-amber/10 px-2 py-1.5 text-[10px] font-black tracking-wide text-primary-amber">
              {repurchaseLabels[card.repurchase_intent]}
            </span>
            {card.package_process && (
              <span className="rounded-lg border border-background-dark/10 bg-white/45 px-2 py-1.5 text-[10px] font-semibold tracking-wide text-muted-foreground">
                {card.package_process}
              </span>
            )}
          </div>
          {tastingNotes.length > 0 && (
            <p className="mt-3 line-clamp-2 text-xs font-semibold leading-relaxed text-muted-foreground">
              {tastingNotes.join(" · ")}
            </p>
          )}
          {privateRebuyReason && (
            <div className="mt-3 min-w-0 border-l border-primary-amber/50 pl-3">
              <p className="text-[10px] font-black tracking-wider text-primary-amber">다시 살 이유</p>
              <p className="mt-0.5 truncate text-xs font-semibold text-background-dark/80">{privateRebuyReason}</p>
            </div>
          )}
        </div>
      </button>

          <div className="mt-auto flex items-center justify-between border-t border-background-dark/10 pt-5">
            <span className="inline-flex items-center gap-1.5 text-xs font-black text-primary-amber">
              <Star aria-hidden="true" size={14} fill="currentColor" />
              {cardRating(card)}
            </span>
            <div className="flex items-center gap-2">
              {onShare && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onShare(card); }}
                  className="grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-primary-amber/10 hover:text-primary-amber focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-amber"
                  aria-label={`${card.title} 공유`}
                >
                  <Share2 aria-hidden="true" size={15} />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onDelete(card.id); }}
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

        {/* BACK FACE */}
        <article 
          className={`absolute inset-0 backface-hidden min-w-0 rounded-[1.35rem] border border-white/12 bg-[#2A1A12] p-6 shadow-[0_30px_60px_rgba(73,48,36,0.32)] flex flex-col rotate-y-180 ${isFlipped ? "pointer-events-auto" : "pointer-events-none"}`}
          aria-hidden={!isFlipped}
        >
          <div className="flex justify-between items-start mb-5 border-b border-white/10 pb-4">
            <h3 className="font-serif text-2xl font-black text-[#FFF8EC] tracking-tight">Brewing Guide</h3>
            <button 
              onClick={() => setIsFlipped(false)}
              className="cursor-pointer border-none bg-transparent text-[10px] font-black uppercase tracking-widest text-[#FFF8EC]/54 transition-colors hover:text-white"
            >
              Back
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-4">
            <BrewingGuide card={card} />

            {/* AI Analysis Excerpt */}
            <div>
              <h4 className="text-[10px] font-medium text-[#FFF8EC]/56 uppercase tracking-widest mb-1.5">Tasting Profile</h4>
              <p className="text-[11px] leading-relaxed text-[#FFF8EC]/80 line-clamp-4">
                {card.ai_description || "조화로운 향미 밸런스가 돋보이는 커피입니다."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSelect?.(card)}
            className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-primary-amber text-background-dark py-3 text-xs font-black transition-transform hover:scale-[1.02]"
          >
            상세 기록 보기 <ArrowRight size={14} />
          </button>
        </article>
      </motion.div>
    </div>
  );
}

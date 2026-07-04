"use client";

import { useState } from "react";
import { Check, Copy, MessageCircle, Sparkles } from "lucide-react";
import type { TastingCardData } from "@/hooks/useTastingCards";
import { buildRebuyTasteBrief } from "@/lib/rebuy-taste-brief";

type DashboardRebuyTasteBriefPanelProps = {
  readonly cards: readonly TastingCardData[];
};

export function DashboardRebuyTasteBriefPanel({ cards }: DashboardRebuyTasteBriefPanelProps) {
  const brief = buildRebuyTasteBrief(cards);
  const [isCopied, setIsCopied] = useState(false);

  if (!brief) return null;

  async function copyOrderPhrase() {
    if (!brief) return;

    try {
      await navigator.clipboard.writeText(brief.orderPhrase);
      setIsCopied(true);
      window.setTimeout(() => setIsCopied(false), 1800);
    } catch {
      window.alert("취향 문장을 복사하지 못했습니다. 문장을 길게 눌러 직접 복사해주세요.");
    }
  }

  return (
    <section className="premium-shell mb-5" aria-label="재구매 취향 문장">
      <div className="premium-card grid gap-4 p-4 sm:p-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <span className="coffee-kicker">
            <MessageCircle size={12} />
            취향 주문 문장
          </span>
          <h2 className="mt-3 break-keep font-serif text-2xl font-black leading-tight text-background-dark">
            다시 살 때 내 취향을 한 문장으로 꺼내세요
          </h2>
          <p className="mt-2 break-keep text-sm font-bold leading-6 text-muted-foreground">
            많이 모으는 보상이 아니라, 내가 다시 찾는 향과 질감이 선명해지는 보상입니다.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {brief.flavorTags.length > 0 ? (
              brief.flavorTags.map((tag) => (
                <span key={tag} className="rounded-full border border-primary-amber/20 bg-primary-amber/10 px-3 py-1 text-xs font-black text-background-dark">
                  #{tag}
                </span>
              ))
            ) : (
              <span className="rounded-full border border-primary-amber/20 bg-primary-amber/10 px-3 py-1 text-xs font-black text-background-dark">
                다시 살 후보 {brief.totalSourceCards}개
              </span>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-background-dark/10 bg-[#fff8ec] p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-primary-amber">
                <Sparkles size={12} />
                Barista Brief
              </p>
              <p className="mt-2 break-keep text-sm font-black leading-6 text-background-dark">
                {brief.preferenceLine}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void copyOrderPhrase()}
              className="inline-flex min-h-9 shrink-0 items-center justify-center gap-1 rounded-full border border-[#8C5E35]/20 bg-white px-3 text-xs font-black text-background-dark transition hover:-translate-y-0.5"
              aria-label="취향 주문 문장 복사"
            >
              {isCopied ? <Check size={13} /> : <Copy size={13} />}
              {isCopied ? "복사됨" : "복사"}
            </button>
          </div>

          <p className="mt-3 rounded-2xl border border-background-dark/10 bg-white px-3 py-3 text-xs font-bold leading-5 text-background-dark">
            {brief.orderPhrase}
          </p>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {brief.sampleCards.map((sample) => (
              <div key={sample} className="rounded-2xl border border-background-dark/10 bg-white/60 px-3 py-2">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary-amber">좋았던 예시</p>
                <p className="mt-1 truncate text-xs font-black text-background-dark">{sample}</p>
              </div>
            ))}
          </div>

          <p className="mt-3 break-keep text-[11px] font-bold leading-5 text-muted-foreground">
            {brief.evidence.join(" · ")}
          </p>
        </div>
      </div>
    </section>
  );
}

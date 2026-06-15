"use client";

import { BookOpen, Check, ChevronRight, Circle, Share2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TastingCardData, UserProfileData } from "@/hooks/useTastingCards";
import {
  getRevenueFunnelState,
  revenueOffers,
  type RevenueFunnelAction,
  type RevenueFunnelStep,
} from "@/lib/revenue-funnel";

type RevenueFunnelPanelProps = {
  readonly cards: readonly TastingCardData[] | undefined;
  readonly profile: UserProfileData | undefined;
  readonly onCreateCard: () => void;
  readonly onOpenPayment: () => void;
  readonly onShareLatestCard: () => void;
};

function hasPublishedCard(cards: readonly TastingCardData[] | undefined): boolean {
  return cards?.some((card) => card.is_public === true || !!card.public_share_token) ?? false;
}

function stepIcon(step: RevenueFunnelStep) {
  if (step.status === "complete") {
    return <Check size={12} strokeWidth={3} />;
  }
  if (step.status === "active") {
    return <Sparkles size={12} />;
  }
  return <Circle size={10} />;
}

function actionHandler(
  action: RevenueFunnelAction,
  onCreateCard: () => void,
  onOpenPayment: () => void,
  onShareLatestCard: () => void,
) {
  switch (action) {
    case "create_card":
      return onCreateCard;
    case "open_payment":
      return onOpenPayment;
    case "share_latest":
      return onShareLatestCard;
  }
}

export default function RevenueFunnelPanel({
  cards,
  profile,
  onCreateCard,
  onOpenPayment,
  onShareLatestCard,
}: RevenueFunnelPanelProps) {
  const state = getRevenueFunnelState({
    cardCount: cards?.length ?? 0,
    hasPublicCard: hasPublishedCard(cards),
    profile,
  });
  const handlePrimaryAction = actionHandler(state.primaryAction, onCreateCard, onOpenPayment, onShareLatestCard);

  return (
    <section className="surface-panel border border-warm-gray rounded-3xl bg-white p-5 shadow-sm space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1.5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-caramel/20 bg-caramel/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-caramel">
            <Sparkles size={11} />
            오늘의 다음 행동
          </span>
          <h2 className="font-serif text-xl font-bold text-espresso">{state.headline}</h2>
          <p className="max-w-2xl text-xs leading-relaxed text-espresso/60">{state.monetizationHint}</p>
        </div>
        <div className="rounded-2xl border border-warm-gray bg-cream px-3 py-2 text-right">
          <p className="text-[10px] font-bold uppercase tracking-widest text-espresso/45">Funnel</p>
          <p className="font-serif text-lg font-extrabold text-espresso">{state.progressLabel}</p>
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-4">
        {state.steps.map((step) => (
          <div
            key={step.id}
            className={`rounded-2xl border px-3 py-2.5 text-xs font-bold ${
              step.status === "complete"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : step.status === "active"
                  ? "border-caramel/35 bg-caramel/10 text-caramel"
                  : "border-warm-gray bg-[#f7f7f4] text-espresso/45"
            }`}
          >
            <span className="flex items-center gap-1.5">
              {stepIcon(step)}
              {step.label}
            </span>
          </div>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {revenueOffers.map((offer) => (
            <div key={offer.id} className="rounded-2xl border border-warm-gray bg-[#f7f7f4] p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-extrabold text-espresso">{offer.label}</p>
                <p className="rounded-full bg-white px-2 py-0.5 text-[10px] font-extrabold text-caramel">{offer.price}</p>
              </div>
              <p className="mt-1.5 text-[10px] leading-relaxed text-espresso/55">{offer.description}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          <Button
            onClick={handlePrimaryAction}
            className="bg-espresso hover:bg-espresso/90 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-sm active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            {state.primaryAction === "share_latest" ? <Share2 size={13} /> : <BookOpen size={13} />}
            {state.primaryLabel}
            <ChevronRight size={13} />
          </Button>
          <Button
            variant="outline"
            onClick={onOpenPayment}
            className="border-warm-gray bg-white text-espresso/70 hover:text-espresso font-bold py-2.5 px-4 rounded-xl text-xs cursor-pointer"
          >
            가격 보기
          </Button>
        </div>
      </div>
    </section>
  );
}

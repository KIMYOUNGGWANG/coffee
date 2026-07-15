"use client";

import { BookOpen, Check, ChevronRight, Circle, Sparkles } from "lucide-react";
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
};

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
) {
  switch (action) {
    case "create_card":
      return onCreateCard;
    case "open_payment":
      return onOpenPayment;
  }
}

export default function RevenueFunnelPanel({
  cards,
  profile,
  onCreateCard,
  onOpenPayment,
}: RevenueFunnelPanelProps) {
  const state = getRevenueFunnelState({
    cardCount: cards?.length ?? 0,
    profile,
  });
  const handlePrimaryAction = actionHandler(state.primaryAction, onCreateCard, onOpenPayment);

  return (
    <section className="surface-panel border border-white/10 rounded-3xl glass-card p-5 shadow-sm space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1.5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-amber/20 bg-primary-amber/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-primary-amber">
            <Sparkles size={11} />
            오늘의 다음 행동
          </span>
          <h2 className="font-serif text-xl font-bold text-foreground">{state.headline}</h2>
          <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">{state.monetizationHint}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-right">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Funnel</p>
          <p className="font-serif text-lg font-extrabold text-foreground">{state.progressLabel}</p>
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
                  ? "border-primary-amber/35 bg-primary-amber/10 text-primary-amber"
                  : "border-white/10 bg-[#0D0A07] text-muted-foreground/60"
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
            <div key={offer.id} className="rounded-2xl border border-white/10 bg-[#0D0A07] p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-extrabold text-foreground">{offer.label}</p>
                <p className="rounded-full bg-white px-2 py-0.5 text-[10px] font-extrabold text-primary-amber">{offer.price}</p>
              </div>
              <p className="mt-1.5 text-[10px] leading-relaxed text-muted-foreground/80">{offer.description}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          <Button
            onClick={handlePrimaryAction}
            className="glass-card border border-white/10 hover:glass-card border border-white/10/90 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-sm active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <BookOpen size={13} />
            {state.primaryLabel}
            <ChevronRight size={13} />
          </Button>
          <Button
            variant="outline"
            onClick={onOpenPayment}
            className="border-white/10 bg-white text-muted-foreground hover:text-foreground font-bold py-2.5 px-4 rounded-xl text-xs cursor-pointer"
          >
            가격 보기
          </Button>
        </div>
      </div>
    </section>
  );
}

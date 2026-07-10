"use client";

import { CalendarCheck2, Check, RotateCcw, X } from "lucide-react";
import type { RebuyCalendarReturnItem } from "@/hooks/use-rebuy-calendar-return";
import type { ShelfRebuyAction } from "@/hooks/use-shelf-rebuy-state";

type DashboardRebuyCalendarReturnCueProps = {
  readonly onDismiss: () => void;
  readonly onOpenDecision: () => void;
  readonly item: RebuyCalendarReturnItem | undefined;
  readonly isLoadingItem: boolean;
  readonly isSaving: boolean;
  readonly onSaveDecision: (action: Extract<ShelfRebuyAction, "will_rebuy" | "rebought">) => void;
};

function itemLabel(item: RebuyCalendarReturnItem): string {
  return [item.roasterName, item.beanName].filter((part): part is string => Boolean(part?.trim())).join(" · ") || "이 원두";
}

export function DashboardRebuyCalendarReturnCue({
  onDismiss,
  onOpenDecision,
  item,
  isLoadingItem,
  isSaving,
  onSaveDecision,
}: DashboardRebuyCalendarReturnCueProps) {
  const isExactReturn = item !== undefined;

  return (
    <section className="premium-shell mb-4" data-testid="rebuy-calendar-return-cue" aria-label="캘린더 재구매 복귀">
      <div className="premium-card flex items-start gap-3 p-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary-amber text-[#FFF8EC]">
          <CalendarCheck2 aria-hidden="true" size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary-amber">Rebuy return</p>
          <h2 className="mt-1 break-keep text-base font-black text-background-dark">
            {isLoadingItem ? "캘린더의 원두 기억을 꺼내는 중이에요." : isExactReturn ? `${itemLabel(item)} 기억났어요. 이번에 어떻게 할까요?` : "캘린더에서 돌아왔어요. 이번 원두, 다시 살까요?"}
          </h2>
          <p className="mt-1 break-keep text-xs font-semibold leading-5 text-muted-foreground">
            {isExactReturn ? "지금의 결정을 남기면 다음 재구매 판단에 이 기억을 바로 꺼낼 수 있어요." : "내 원두 서랍에서 다시 살래요 또는 다시 샀음을 남겨 다음 기억을 이어가세요."}
          </p>
          {isExactReturn ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => onSaveDecision("will_rebuy")} disabled={isSaving} className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-background-dark px-4 text-xs font-black text-[#FFF8EC] transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60">
                <RotateCcw aria-hidden="true" size={14} />
                다시 살래요
              </button>
              <button type="button" onClick={() => onSaveDecision("rebought")} disabled={isSaving} className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-primary-amber/40 px-4 text-xs font-black text-background-dark transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60">
                <Check aria-hidden="true" size={14} />
                다시 샀음
              </button>
            </div>
          ) : !isLoadingItem ? (
            <button type="button" onClick={onOpenDecision} className="mt-3 inline-flex min-h-11 items-center gap-1.5 rounded-full bg-background-dark px-4 text-xs font-black text-[#FFF8EC] transition hover:-translate-y-0.5">
              재구매 결정 열기
              <RotateCcw aria-hidden="true" size={14} />
            </button>
          ) : null}
        </div>
        <button type="button" onClick={onDismiss} className="grid size-11 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-black/5 hover:text-background-dark" aria-label="캘린더 복귀 안내 닫기">
          <X aria-hidden="true" size={17} />
        </button>
      </div>
    </section>
  );
}

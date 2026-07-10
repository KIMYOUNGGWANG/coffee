"use client";

import { CalendarCheck2, ChevronDown, X } from "lucide-react";

type DashboardRebuyCalendarReturnCueProps = {
  readonly onDismiss: () => void;
  readonly onOpenDecision: () => void;
};

export function DashboardRebuyCalendarReturnCue({ onDismiss, onOpenDecision }: DashboardRebuyCalendarReturnCueProps) {
  return (
    <section className="premium-shell mb-4" data-testid="rebuy-calendar-return-cue" aria-label="캘린더 재구매 복귀">
      <div className="premium-card flex items-start gap-3 p-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary-amber text-[#FFF8EC]">
          <CalendarCheck2 aria-hidden="true" size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary-amber">Rebuy return</p>
          <h2 className="mt-1 break-keep text-base font-black text-background-dark">캘린더에서 돌아왔어요. 이번 원두, 다시 살까요?</h2>
          <p className="mt-1 break-keep text-xs font-semibold leading-5 text-muted-foreground">내 원두 서랍에서 다시 살래요 또는 다시 샀음을 남겨 다음 기억을 이어가세요.</p>
          <button type="button" onClick={onOpenDecision} className="mt-3 inline-flex min-h-11 items-center gap-1.5 rounded-full bg-background-dark px-4 text-xs font-black text-[#FFF8EC] transition hover:-translate-y-0.5">
            재구매 결정 열기
            <ChevronDown aria-hidden="true" size={14} />
          </button>
        </div>
        <button type="button" onClick={onDismiss} className="grid size-11 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-black/5 hover:text-background-dark" aria-label="캘린더 복귀 안내 닫기">
          <X aria-hidden="true" size={17} />
        </button>
      </div>
    </section>
  );
}

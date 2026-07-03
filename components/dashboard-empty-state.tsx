"use client";

import { Camera, Sparkles } from "lucide-react";

type DashboardEmptyStateProps = {
  readonly onCreateCard: () => void;
  readonly onQuickAdd: () => void;
};

export default function DashboardEmptyState({ onCreateCard, onQuickAdd }: DashboardEmptyStateProps) {
  return (
    <section className="mx-auto max-w-xl rounded-[1.75rem] border border-background-dark/10 bg-[#FFF8EC]/76 px-5 py-12 text-center shadow-[0_18px_42px_rgba(73,48,36,0.12)]" aria-labelledby="first-coffee-title">
      <span className="mx-auto grid size-16 place-items-center rounded-[1.25rem] border border-primary-amber/30 bg-primary-amber/10 text-primary-amber">
        <Camera aria-hidden="true" size={27} />
      </span>
      <span className="mt-5 inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-primary-amber">
        <Sparkles aria-hidden="true" size={13} />
        다시 살 원두만 먼저
      </span>
      <h2 id="first-coffee-title" className="mt-3 break-keep font-serif text-3xl font-black leading-tight text-background-dark sm:text-4xl">
        이름, 로스터리, 다시 살지만 남기세요.
      </h2>
      <p className="mx-auto mt-4 max-w-md break-keep text-sm leading-7 text-muted-foreground">
        첫 기록은 20초면 충분합니다. 저장하면 다음에 검색할 문장과 다시 살 단서를 바로 보여드려요.
      </p>
      <div className="mt-7 flex flex-col items-center justify-center gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onQuickAdd}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-background-dark px-6 text-sm font-black text-[#FFF8EC] shadow-[0_12px_28px_rgba(73,48,36,0.18)] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-amber active:scale-95"
        >
          <Sparkles aria-hidden="true" size={18} />
          20초 기록 시작
        </button>
        <button
          type="button"
          onClick={onCreateCard}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-primary-amber/45 bg-white/40 px-6 text-sm font-black text-primary-amber transition-colors hover:bg-primary-amber/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-amber active:scale-95"
        >
          <Camera aria-hidden="true" size={18} />
          라벨 스캔으로 채우기
        </button>
      </div>
      <div className="mx-auto mt-7 grid max-w-md gap-2 text-left text-xs font-bold leading-5 text-muted-foreground sm:grid-cols-3">
        <span className="rounded-2xl border border-background-dark/10 bg-white/50 px-3 py-2">1. 원두 이름</span>
        <span className="rounded-2xl border border-background-dark/10 bg-white/50 px-3 py-2">2. 로스터리</span>
        <span className="rounded-2xl border border-background-dark/10 bg-white/50 px-3 py-2">3. 다시 살지</span>
      </div>
      <div className="mx-auto mt-10 h-2 w-full max-w-sm rounded-sm bg-[var(--shelf-wood)] shadow-[0_8px_16px_rgba(0,0,0,0.4)]" aria-hidden="true" />
    </section>
  );
}

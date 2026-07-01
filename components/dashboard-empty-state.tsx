"use client";

import { Camera, Sparkles } from "lucide-react";

type DashboardEmptyStateProps = {
  readonly onCreateCard: () => void;
  readonly onQuickAdd: () => void;
};

export default function DashboardEmptyState({ onCreateCard, onQuickAdd }: DashboardEmptyStateProps) {
  return (
    <section className="mx-auto max-w-xl rounded-[1.75rem] border border-white/12 bg-white/[0.06] px-5 py-12 text-center shadow-[0_22px_60px_rgba(0,0,0,0.32)]" aria-labelledby="first-coffee-title">
      <span className="mx-auto grid size-16 place-items-center rounded-[1.25rem] border border-primary-amber/30 bg-primary-amber/10 text-primary-amber">
        <Camera aria-hidden="true" size={27} />
      </span>
      <span className="mt-5 inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-primary-amber">
        <Sparkles aria-hidden="true" size={13} />
        20초 안에 첫 기록
      </span>
      <h2 id="first-coffee-title" className="mt-3 break-keep font-serif text-3xl font-black leading-tight text-[#FFF8EC] sm:text-4xl">
        첫 원두를 선반에 올려보세요.
      </h2>
      <p className="mx-auto mt-4 max-w-md break-keep text-sm leading-7 text-muted-foreground">
        패키지 사진을 찍으면 로스터리, 원산지, 가공 방식과 향미를 읽어 편집 가능한 기록 초안을 만듭니다.
      </p>
      <div className="mt-7 flex flex-col items-center justify-center gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onQuickAdd}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary-amber px-6 text-sm font-black text-[#120B07] shadow-[0_12px_28px_rgba(209,138,92,0.22)] transition-transform hover:bg-[#F0B978] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-amber active:scale-95"
        >
          <Sparkles aria-hidden="true" size={18} />
          빠른 기록
        </button>
        <button
          type="button"
          onClick={onCreateCard}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-primary-amber/45 bg-primary-amber/12 px-6 text-sm font-black text-primary-amber transition-colors hover:bg-primary-amber/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-amber active:scale-95"
        >
          <Camera aria-hidden="true" size={18} />
          원두 패키지 스캔하기
        </button>
        <button
          type="button"
          onClick={onCreateCard}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/14 bg-white/[0.07] px-6 text-sm font-black text-[#FFF8EC]/76 transition-colors hover:border-primary-amber/45 hover:text-primary-amber focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-amber active:scale-95"
        >
          새로운 카드 기록하기
        </button>
      </div>
      <div className="mx-auto mt-10 h-2 w-full max-w-sm rounded-sm bg-[var(--shelf-wood)] shadow-[0_8px_16px_rgba(0,0,0,0.4)]" aria-hidden="true" />
    </section>
  );
}

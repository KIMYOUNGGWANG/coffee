"use client";

import { BookOpen, Coffee, RefreshCcw, Sparkles } from "lucide-react";
import type { TasteAnalyticsData } from "@/hooks/useTastingCards";
import type { PassportCoverage, PassportState } from "@/lib/passport-state";
import FluidRadarChart from "@/components/FluidRadarChart";

type TopNote = {
  readonly note: string;
  readonly count: number;
};

type PassportAnalytics = TasteAnalyticsData & {
  readonly passport?: PassportState;
  readonly topNotes?: readonly TopNote[];
  readonly repurchaseBreakdown?: {
    readonly again: number;
    readonly maybe: number;
    readonly no: number;
    readonly undecided: number;
  };
};

type DashboardAnalyticsPanelProps = {
  readonly analytics: PassportAnalytics | undefined;
  readonly isLoading: boolean;
};

const stateLabels: Readonly<Record<PassportState["kind"], string>> = {
  empty: "기록 시작 전",
  collage: "커피 기억 콜라주",
  first_signals: "취향의 첫 신호",
  early_snapshot: "초기 취향 스냅샷",
  current_snapshot: "현재 취향 스냅샷",
};

const coverageLabels: Readonly<Record<PassportCoverage, string>> = {
  narrow: "좁은 범위",
  mixed: "혼합 범위",
  broad: "넓은 범위",
};

function AnalyticsSkeleton() {
  return (
    <div className="space-y-3 py-3 animate-pulse" aria-label="기록 분석 불러오는 중">
      <div className="h-64 rounded-2xl bg-white/10" />
      <div className="grid grid-cols-3 gap-2">
        <div className="h-16 rounded-xl bg-white/10" />
        <div className="h-16 rounded-xl bg-white/10" />
        <div className="h-16 rounded-xl bg-white/10" />
      </div>
    </div>
  );
}

export default function DashboardAnalyticsPanel({ analytics, isLoading }: DashboardAnalyticsPanelProps) {
  const passport = analytics?.passport;

  return (
    <section className="glass-card space-y-4 rounded-3xl p-5 shadow-sm" aria-labelledby="rebuy-intelligence-heading">
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        <BookOpen aria-hidden="true" size={15} className="text-primary-amber" />
        <div>
          <p className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-primary-amber">Rebuy Intelligence</p>
          <h2 id="rebuy-intelligence-heading" className="font-serif text-sm font-bold text-foreground">기록으로 갱신되는 구매 단서</h2>
        </div>
      </div>

      {isLoading ? <AnalyticsSkeleton /> : passport ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-primary-amber/20 bg-primary-amber/5 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold text-primary-amber">확정 기록 {passport.sampleCount}개</p>
                <h3 className="mt-1 font-serif text-xl font-black text-foreground">{stateLabels[passport.kind]}</h3>
              </div>
              <span className="shrink-0 rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[10px] font-bold text-muted-foreground">
                {coverageLabels[passport.coverage]}
              </span>
            </div>
            
            {passport.sampleCount >= 5 ? (
              <>
                {/* Visual Radar Chart Spotlight */}
                <div className="flex flex-col items-center">
                  <div className="flex justify-center py-6 relative w-full">
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-[200px] h-[200px] bg-primary-amber/10 blur-[60px] rounded-full" />
                    </div>
                    <FluidRadarChart 
                      acidity={analytics.averageAcidity ?? 5} 
                      sweetness={analytics.averageSweetness ?? 5} 
                      body={analytics.averageBody ?? 5} 
                      size={260} 
                    />
                  </div>
                  
                  {/* Top 3 Notes Spotlight */}
                  {(analytics.topNotes?.length ?? 0) > 0 && (
                    <div className="flex flex-col items-center mt-2 mb-6 w-full relative z-10">
                      <div className="flex flex-wrap justify-center gap-2">
                        {analytics.topNotes?.slice(0, 3).map(({ note, count }) => (
                          <span key={note} className="rounded-full border border-primary-amber/40 bg-primary-amber/10 px-4 py-1.5 text-xs font-black tracking-wide text-primary-amber shadow-[0_4px_24px_rgba(217,160,91,0.2)] backdrop-blur-md">
                            {note} <span className="opacity-60 text-[10px] ml-1 font-semibold">{count}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 border-t border-white/10 pt-4">
                  <p className="break-keep text-[11px] leading-relaxed text-muted-foreground/90 italic font-serif text-center">“{analytics.aiAnalysis}”</p>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Coffee className="mb-3 h-8 w-8 text-white/20" aria-hidden="true" />
                <p className="text-sm font-bold text-foreground">취향 분석을 위한 데이터가 부족합니다</p>
                <p className="mt-1.5 break-keep text-[11px] leading-5 text-muted-foreground">
                  방사형 차트와 취향 요약을 보려면 최소 5개의 확정된 기록이 필요합니다.<br/>
                  (현재 {passport.sampleCount}개 / 5개)
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2" aria-label="기록 범위">
            {[
              ["원산지", passport.distinctOriginCount],
              ["가공 방식", passport.distinctProcessCount],
              ["향미 노트", passport.distinctTagCount],
            ].map(([label, count]) => (
              <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-center">
                <p className="text-lg font-black text-foreground">{count}</p>
                <p className="mt-0.5 text-[9px] font-bold text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>



          {analytics.repurchaseBreakdown && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5">
              <div className="mb-2.5 flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
                <RefreshCcw aria-hidden="true" size={12} className="text-primary-amber" />
                다시 마실 의향
              </div>
              <div className="grid grid-cols-4 gap-1 text-center text-[10px]">
                <span>또 마셔요 <b className="block text-sm text-foreground">{analytics.repurchaseBreakdown.again}</b></span>
                <span>고민 중 <b className="block text-sm text-foreground">{analytics.repurchaseBreakdown.maybe}</b></span>
                <span>아니요 <b className="block text-sm text-foreground">{analytics.repurchaseBreakdown.no}</b></span>
                <span>미정 <b className="block text-sm text-foreground">{analytics.repurchaseBreakdown.undecided}</b></span>
              </div>
            </div>
          )}

          <p className="flex items-center justify-between border-t border-white/10 pt-3 text-[10px] font-semibold text-muted-foreground">
            <span className="flex items-center gap-1.5"><Coffee aria-hidden="true" size={12} />전체 저장 기록</span>
            <span className="font-bold text-primary-amber">{analytics.totalCards}개</span>
          </p>
        </div>
      ) : (
        <div className="py-7 text-center text-xs leading-5 text-muted-foreground">
          첫 커피 기억을 확정하면 구매 단서가 콜라주부터 시작됩니다.
        </div>
      )}
    </section>
  );
}

"use client";

import { Sparkles } from "lucide-react";
import RadarChart from "@/components/RadarChart";
import type { TasteAnalyticsData } from "@/hooks/useTastingCards";

type DashboardAnalyticsPanelProps = {
  readonly analytics: TasteAnalyticsData | undefined;
  readonly isLoading: boolean;
};

export default function DashboardAnalyticsPanel({ analytics, isLoading }: DashboardAnalyticsPanelProps) {
  return (
    <div className="bg-white border border-warm-gray rounded-3xl p-5 shadow-sm space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-warm-gray">
        <Sparkles size={14} className="text-caramel" />
        <h3 className="font-serif font-bold text-sm">취향 지도와 리캡</h3>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-8 space-y-3 animate-pulse">
          <div className="w-24 h-24 rounded-full bg-warm-gray/30" />
          <div className="h-3 bg-warm-gray/30 rounded w-2/3" />
          <div className="h-3 bg-warm-gray/20 rounded w-full" />
        </div>
      ) : analytics && analytics.totalCards > 0 ? (
        <div className="space-y-4">
          <div className="py-2">
            <RadarChart
              acidity={analytics.averageAcidity}
              sweetness={analytics.averageSweetness}
              body={analytics.averageBody}
              size={160}
            />
          </div>
          <div className="bg-cream/40 border border-warm-gray/55 rounded-2xl p-3 text-xs leading-relaxed text-espresso/85 font-serif italic relative">
            <span className="absolute -top-2 left-3 bg-[#f7f7f4] px-1.5 text-[8px] uppercase tracking-wider font-extrabold text-caramel">
              AI 한줄평
            </span>
            “{analytics.aiAnalysis}”
          </div>
          <div className="flex justify-between items-center text-[10px] text-espresso/45 font-semibold pt-1 border-t border-warm-gray/50">
            <span>아카이빙 완료 원두</span>
            <span className="text-caramel font-bold">{analytics.totalCards}개</span>
          </div>
        </div>
      ) : (
        <div className="py-8 text-center text-xs text-espresso/50 leading-relaxed">
          카드를 1개 이상 작성하시면 저장된 기록 기반의 맛 성향 요약과 AI 보조 리캡이 여기에 제공됩니다.
        </div>
      )}
    </div>
  );
}

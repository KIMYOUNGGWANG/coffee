"use client";

import { Coffee, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

type DashboardEmptyStateProps = {
  readonly onCreateCard: () => void;
};

export default function DashboardEmptyState({ onCreateCard }: DashboardEmptyStateProps) {
  return (
    <div className="bg-white border border-warm-gray rounded-3xl p-6 md:p-8 max-w-3xl mx-auto mt-6 shadow-sm">
      <div className="grid gap-6 md:grid-cols-[1.05fr_0.95fr] items-center">
        <div className="space-y-4 text-left">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-caramel/20 bg-caramel/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-caramel">
            <Sparkles size={11} />
            60초 안에 첫 원두 기록
          </span>
          <div>
            <h3 className="font-serif font-bold text-xl text-espresso">봉투 사진 하나로 Hyangmi 첫 카드를 시작하세요</h3>
            <p className="text-xs text-espresso/55 mt-2 leading-relaxed">
              원두명과 로스터리만 확인해도 됩니다. AI 스캔 초안을 고치고 저장하면 취향 지도, 공유 카드, PDF 기록북의 재료가 쌓입니다.
            </p>
          </div>
          <Button
            onClick={onCreateCard}
            className="bg-espresso hover:bg-espresso/90 text-white font-bold py-2.5 px-5 rounded-xl text-xs transition-all shadow-sm cursor-pointer"
          >
            봉투 사진으로 첫 카드 만들기
          </Button>
        </div>

        <div className="rounded-3xl border border-warm-gray bg-cream p-5 shadow-inner">
          <div className="flex items-center justify-between border-b border-warm-gray pb-3">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-caramel">샘플 테이스팅 카드</span>
            <Coffee size={16} className="text-caramel" />
          </div>
          <div className="pt-4 space-y-3">
            <div>
              <p className="font-serif text-lg font-bold text-espresso">Fritz Ethiopia Sidama</p>
              <p className="text-xs text-espresso/55">프릳츠 커피 · Natural</p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-bold">
              <span className="rounded-xl bg-white px-2 py-2 text-espresso/70">산미 4</span>
              <span className="rounded-xl bg-white px-2 py-2 text-espresso/70">단맛 5</span>
              <span className="rounded-xl bg-white px-2 py-2 text-espresso/70">바디 3</span>
            </div>
            <p className="rounded-2xl border border-warm-gray bg-white/70 p-3 text-[11px] leading-relaxed text-espresso/70 font-serif italic">
              “복숭아와 꿀의 단맛, 은은한 재스민 향이 이어지는 밝은 컵.”
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

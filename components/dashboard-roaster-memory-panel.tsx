"use client";

import { Store } from "lucide-react";
import type { TastingCardData } from "@/hooks/useTastingCards";

type DashboardRoasterMemoryPanelProps = {
  readonly cards: readonly TastingCardData[] | undefined;
};

type RoasterCount = {
  readonly name: string;
  readonly count: number;
};

function countRoasters(cards: readonly TastingCardData[] | undefined): readonly RoasterCount[] {
  const counts = new Map<string, number>();
  for (const card of cards ?? []) {
    const roasterName = card.subtitle.trim();
    if (roasterName.length > 0) {
      counts.set(roasterName, (counts.get(roasterName) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 3);
}

export default function DashboardRoasterMemoryPanel({ cards }: DashboardRoasterMemoryPanelProps) {
  const roasters = countRoasters(cards);

  return (
    <div className="glass-card border border-white/10 rounded-3xl p-5 shadow-sm space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-white/10">
        <Store size={14} className="text-primary-amber" />
        <h3 className="font-serif font-bold text-sm">로스터 메모리</h3>
      </div>

      {roasters.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[11px] text-muted-foreground/80 leading-relaxed">자주 마신 로스터를 작은 재구매 단서로 남깁니다.</p>
          {roasters.map((roaster) => (
            <div key={roaster.name} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5/40 px-3 py-2 text-xs">
              <span className="font-bold text-foreground">{roaster.name}</span>
              <span className="text-primary-amber font-extrabold">{roaster.count}회</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-4 text-xs text-muted-foreground/80 leading-relaxed">
          아직 로스터 기록 없음. 첫 카드를 저장하면 자주 마신 로스터와 재구매 후보가 이곳에 쌓입니다.
        </div>
      )}
    </div>
  );
}

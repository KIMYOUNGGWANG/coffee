"use client";

import { ChevronRight, CircleCheck, Coffee, Store } from "lucide-react";
import type { TasteAnalyticsData, TastingCardData } from "@/hooks/useTastingCards";

type DashboardPassportSidebarProps = {
  readonly analytics: TasteAnalyticsData | undefined;
  readonly cards: readonly TastingCardData[];
  readonly onOpenPassport: () => void;
};

const radarPoints = [
  { label: "산미", angle: -90, key: "averageAcidity" },
  { label: "단맛", angle: -18, key: "averageSweetness" },
  { label: "바디감", angle: 54, key: "averageBody" },
  { label: "쓴맛", angle: 126, key: "averageBody" },
  { label: "향미 복합성", angle: 198, key: "averageSweetness" },
] as const;

function point(angle: number, value: number, radius = 42): string {
  const radians = (angle * Math.PI) / 180;
  const bounded = Math.max(0.18, Math.min(1, value / 5));
  return `${50 + Math.cos(radians) * radius * bounded},${50 + Math.sin(radians) * radius * bounded}`;
}

function radarPolygon(analytics: TasteAnalyticsData | undefined): string {
  return radarPoints.map(({ angle, key }) => point(angle, analytics?.[key] ?? 2.5)).join(" ");
}

function visitedCafeCount(cards: readonly TastingCardData[]): number {
  return new Set(cards.map((card) => card.subtitle.trim()).filter(Boolean)).size;
}

export function DashboardPassportSidebar({
  analytics,
  cards,
  onOpenPassport,
}: DashboardPassportSidebarProps) {
  const stampCount = Math.min(5, Math.max(0, analytics?.totalCards ?? cards.length));
  const remainingStamps = Math.max(0, 5 - stampCount);
  const totalTastings = analytics?.brewingStats?.totalNotes ?? cards.length;
  const cafeCount = visitedCafeCount(cards);

  return (
    <aside className="coffee-passport-sidebar" aria-label="나의 Taste Passport 요약">
      <section className="coffee-passport-title space-y-1">
        <p className="text-[10px] font-extrabold text-primary-amber">나의 Taste Passport</p>
        <h2 className="break-keep font-serif text-2xl font-black leading-tight text-foreground">프로필 탐험가</h2>
        <button
          type="button"
          onClick={onOpenPassport}
          className="inline-flex min-h-8 items-center gap-1 rounded-full bg-primary-amber/10 px-3 text-[11px] font-black text-primary-amber"
        >
          등급 안내 <ChevronRight aria-hidden="true" size={13} />
        </button>
      </section>

      <section className="coffee-stamp-ring" aria-label={`${stampCount}/5 스탬프`}>
        <div className="coffee-stamp-beans" aria-hidden="true">
          {Array.from({ length: 5 }, (_, index) => (
            <span key={index} className={index < stampCount ? "is-filled" : ""} />
          ))}
        </div>
        <strong>{stampCount} / 5</strong>
        <span>스탬프</span>
      </section>

      <div className="coffee-passport-progress-copy space-y-2 border-b border-white/10 pb-4 text-xs text-muted-foreground">
        <p>다음 등급까지 {remainingStamps}개 남았어요.</p>
        <button
          type="button"
          onClick={onOpenPassport}
          className="inline-flex min-h-9 items-center gap-1 text-xs font-black text-primary-amber"
        >
          스탬프 혜택 보기 <ChevronRight aria-hidden="true" size={13} />
        </button>
      </div>

      <section className="coffee-passport-radar border-b border-white/10 pb-4" aria-label="취향 미리보기">
        <h3 className="text-sm font-bold text-foreground">취향 미리보기</h3>
        <div className="mt-3 grid grid-cols-[3.25rem_1fr_3.25rem] items-center gap-1 text-[10px] text-muted-foreground">
          <span>향미<br />복합성</span>
          <svg viewBox="0 0 100 100" className="mx-auto size-36 max-w-full text-primary-amber">
            <polygon points="50,8 90,37 75,84 25,84 10,37" fill="rgba(217,160,91,0.08)" stroke="rgba(217,160,91,0.25)" />
            <polygon points="50,22 76,41 66,72 34,72 24,41" fill="none" stroke="rgba(217,160,91,0.2)" />
            <polygon points={radarPolygon(analytics)} fill="rgba(217,160,91,0.36)" stroke="currentColor" strokeWidth="1.4" />
            {radarPoints.map(({ angle, key }) => {
              const [x, y] = point(angle, analytics?.[key] ?? 2.5).split(",");
              return <circle key={`${angle}-${key}`} cx={x} cy={y} r="2" fill="currentColor" />;
            })}
          </svg>
          <span className="text-right">단맛<br /><br />바디감</span>
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
          <span>쓴맛</span>
          <span>산미</span>
        </div>
      </section>

      <section className="coffee-passport-summary space-y-3">
        <h3 className="text-sm font-bold text-foreground">최근 기록 요약</h3>
        {[
          { icon: Coffee, label: "기록한 원두", value: `${cards.length}개` },
          { icon: Store, label: "방문한 카페", value: `${cafeCount}곳` },
          { icon: CircleCheck, label: "완료한 테이스팅", value: `${totalTastings}회` },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <p key={item.label} className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-2"><Icon aria-hidden="true" size={14} />{item.label}</span>
              <b className="font-serif text-base text-foreground">{item.value}</b>
            </p>
          );
        })}
        <button
          type="button"
          onClick={onOpenPassport}
          className="mt-2 inline-flex min-h-11 w-full items-center justify-center gap-1 rounded-xl border border-primary-amber/40 text-xs font-black text-primary-amber"
        >
          내 기록 전체 보기 <ChevronRight aria-hidden="true" size={13} />
        </button>
      </section>
    </aside>
  );
}

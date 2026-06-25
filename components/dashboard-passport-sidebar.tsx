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
  const tasteScore = Math.round(
    (((analytics?.averageAcidity ?? 2.5) +
      (analytics?.averageSweetness ?? 2.5) +
      (analytics?.averageBody ?? 2.5)) /
      15) *
      100,
  );
  const metricRows = [
    { label: "산미", value: analytics?.averageAcidity ?? 2.5 },
    { label: "단맛", value: analytics?.averageSweetness ?? 2.5 },
    { label: "바디감", value: analytics?.averageBody ?? 2.5 },
  ];

  return (
    <aside className="coffee-passport-sidebar" aria-label="나의 Taste Passport 요약">
      <section className="coffee-passport-title space-y-2">
        <p className="text-[10px] font-black uppercase text-primary-amber">Taste Passport</p>
        <h2 className="break-keep font-serif text-2xl font-black leading-tight text-foreground">오늘의 향미 프로필</h2>
        <button
          type="button"
          onClick={onOpenPassport}
          className="inline-flex min-h-8 items-center gap-1 rounded-full border border-primary-amber/25 bg-primary-amber/10 px-3 text-[11px] font-black text-primary-amber"
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

      <section className="coffee-passport-radar rounded-[1.25rem] border border-[#d7c2a9] bg-[#f6efe3] p-4 text-[#2f251f] shadow-[0_18px_38px_rgba(0,0,0,0.26)]" aria-label="취향 미리보기">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase text-[#9b6943]">Flavor Map</p>
            <h3 className="mt-1 font-serif text-xl font-black leading-none">취향 지도</h3>
          </div>
          <div className="grid size-14 place-items-center rounded-full bg-[#3b281b] text-center text-[#f4c879] shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]">
            <span className="font-serif text-xl font-black leading-none">{tasteScore}</span>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-[1fr_6rem] items-center gap-4">
          <div className="relative mx-auto size-40 text-[#b47744]">
            <svg viewBox="0 0 100 100" className="size-full">
              <polygon points="50,7 91,37 75,85 25,85 9,37" fill="rgba(59,40,27,0.04)" stroke="rgba(59,40,27,0.22)" strokeWidth="0.9" />
              <polygon points="50,20 78,40 67,73 33,73 22,40" fill="none" stroke="rgba(59,40,27,0.14)" strokeWidth="0.9" />
              <polygon points="50,32 66,44 60,62 40,62 34,44" fill="none" stroke="rgba(59,40,27,0.1)" strokeWidth="0.9" />
              <polygon points={radarPolygon(analytics)} fill="rgba(180,119,68,0.34)" stroke="currentColor" strokeWidth="1.8" />
              {radarPoints.map(({ angle, key }) => {
                const [x, y] = point(angle, analytics?.[key] ?? 2.5).split(",");
                return <circle key={`${angle}-${key}`} cx={x} cy={y} r="2.4" fill="currentColor" />;
              })}
            </svg>
            <span className="absolute left-1/2 top-0 -translate-x-1/2 text-[10px] font-black">산미</span>
            <span className="absolute right-0 top-[37%] text-[10px] font-black">단맛</span>
            <span className="absolute bottom-2 right-5 text-[10px] font-black">바디</span>
            <span className="absolute bottom-2 left-5 text-[10px] font-black">쓴맛</span>
            <span className="absolute left-0 top-[37%] text-[10px] font-black">향미</span>
          </div>
          <div className="space-y-2.5">
            {metricRows.map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-[10px] font-black text-[#5d4b3e]">
                  <span>{item.label}</span>
                  <span>{item.value.toFixed(1)}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#e2d2bf]">
                  <div
                    className="h-full rounded-full bg-[#9b6943]"
                    style={{ width: `${Math.max(12, Math.min(100, (item.value / 5) * 100))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
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
